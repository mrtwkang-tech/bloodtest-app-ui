import { useEffect, useRef } from "react";
import * as THREE from "three";
import {
  createVelocityTracker,
  prefersReducedMotion,
  project,
} from "../motion/physics";

/**
 * Everything two 3D views need and neither of them is about.
 *
 * WHY THIS WAS EXTRACTED. `BodyScene` was 432 lines, of which about 130 said
 * nothing about a body: construct a renderer, light it, track a finger at 1:1
 * with momentum, turn a tap into a ray, watch for resize, and tear all of it
 * down again. Adding a second scene meant either importing a body module to get
 * a renderer, or copying those 130 lines and maintaining two of them — and the
 * copy would have inherited two bugs that were already in the original.
 *
 * BOTH BUGS ARE FIXED HERE. The glow sprite's `CanvasTexture` was never
 * disposed, because the cleanup traverse disposes materials and a texture hangs
 * off `material.map`; and there was no `forceContextLoss()`, so a WebGL context
 * was released only when the garbage collector got round to it. One scene that
 * mounts once could live with both. Two scenes that swap every time the reader
 * changes tab cannot: browsers cap live contexts at roughly eight to sixteen.
 *
 * WHAT STAYS OUT. The camera, the contents, the pose, the pick STRATEGY and the
 * per-frame easing are the caller's, because they are the parts that differ:
 * body framing is a 1.6-unit figure and mind framing is a bust, and picking an
 * organ by nearest anchor height is meaningless inside a skull.
 *
 * `build` runs once and returns whatever the caller wants back on every frame.
 * `onFrame(ctx, dt, t)` runs each rAF tick. `onPick(raycaster, ctx)` runs on a
 * tap that was not a drag.
 */
export function useThreeScene({
  height,
  camera: cameraSpec,
  build,
  onFrame,
  onPick,
  spin = true,
}) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);
  // Callbacks are read through a ref so a caller re-rendering with a new
  // closure does not tear the WebGL context down and rebuild the geometry.
  const cbRef = useRef({ build, onFrame, onPick });
  cbRef.current = { build, onFrame, onPick };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return undefined;

    const width = mount.clientWidth || 320;
    const reduced = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.08;
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      cameraSpec.fov ?? 30,
      width / height,
      0.1,
      100,
    );
    camera.position.set(...cameraSpec.position);
    if (cameraSpec.lookAt) camera.lookAt(...cameraSpec.lookAt);

    // Three-point studio rig. No shadows, no environment map — at this size
    // they cost frames and change nothing a reader can see.
    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfb6a6, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(...(cameraSpec.key ?? [1.4, 2, 2.4]));
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd8e6ff, 0.9);
    rim.position.set(-1.8, 0.8, -1.6);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    const ctx = cbRef.current.build({ scene, camera, root, renderer }) ?? {};

    // ---- rotation state ---------------------------------------------------
    const state = { yaw: 0, yawTarget: 0, yawVelocity: 0, dragging: false };

    const tracker = createVelocityTracker();
    const el = renderer.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = spin ? "grab" : "pointer";

    let pointerId = null;
    let lastX = 0;
    let moved = 0;
    let downAt = 0;

    const onPointerDown = (e) => {
      pointerId = e.pointerId;
      el.setPointerCapture(pointerId);
      state.dragging = true;
      // Grabbing mid-spin must stop it dead — that is what "interruptible"
      // means.
      state.yawVelocity = 0;
      state.yawTarget = state.yaw;
      lastX = e.clientX;
      moved = 0;
      downAt = performance.now();
      tracker.reset();
      tracker.add(state.yaw);
      if (spin) el.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (!state.dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      if (!spin) return;
      // Track the finger 1:1 — 300px of travel is half a turn.
      state.yaw += (dx / 300) * Math.PI;
      state.yawTarget = state.yaw;
      tracker.add(state.yaw);
    };

    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    const onPointerUp = (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      el.style.cursor = spin ? "grab" : "pointer";
      if (pointerId !== null && el.hasPointerCapture?.(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
      if (spin) {
        // A flick throws the object to where the gesture was heading.
        const v = tracker.velocity();
        state.yawTarget = state.yaw + project(v, 0.992);
        state.yawVelocity = v;
      }
      pointerId = null;

      // Under the drag threshold and quick: treat it as a tap.
      if (moved < 10 && performance.now() - downAt < 400) {
        const rect = el.getBoundingClientRect();
        ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        raycaster.setFromCamera(ndc, camera);
        cbRef.current.onPick?.(raycaster, ctx);
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    // ---- frame loop -------------------------------------------------------
    const clock = new THREE.Clock();
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      // Clamped so a backgrounded tab does not resume with a one-second step
      // and fling everything to its target in a single frame.
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (spin) {
        if (!state.dragging) {
          // Critically damped approach — no wobble at rest.
          state.yaw += (state.yawTarget - state.yaw) * Math.min(1, dt * 6);
        }
        root.rotation.y = state.yaw;
      }

      cbRef.current.onFrame?.(ctx, dt, t, reduced);
      renderer.render(scene, camera);
    };
    tick();

    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || width;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    apiRef.current = { ctx, reduced, reset: () => (state.yawTarget = 0) };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => {
            // The texture hangs off the material rather than off the object,
            // so disposing materials alone leaks every canvas texture.
            if (m.map) m.map.dispose();
            m.dispose();
          });
        }
      });
      renderer.dispose();
      // Without this the context is reclaimed whenever GC gets to it, and two
      // scenes swapping on every tab change will exhaust the browser's cap.
      renderer.forceContextLoss?.();
      if (renderer.domElement.parentNode === mount) {
        mount.removeChild(renderer.domElement);
      }
      apiRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [height]);

  return { mountRef, apiRef };
}
