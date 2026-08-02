import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildBody, buildGlow, buildOrgans } from "./anatomy";
import {
  createVelocityTracker,
  prefersReducedMotion,
  project,
} from "../motion/physics";

const ZONE_KEYS = [
  "neuro",
  "cardio",
  "endocrine",
  "hepatic",
  "renal",
  "hematology",
  "pulmonary",
  "immune",
  "oncology",
  "nutrition",
];
/** Cancer is the only system drawn as the whole figure. */
const SHELL_KEYS = new Set(["oncology"]);

/** Level 0/1/2 → the colour the organ glows. Clear stays cool and quiet. */
const LEVEL_COLOR = [0x5f9440, 0xd39525, 0xc9553a];

/**
 * Three.js anatomy viewer.
 *
 * The scene is imperative rather than react-three-fiber: every frame is driven
 * by one rAF loop that eases organ intensity, camera focus and rotation
 * towards their targets, so a selection change mid-animation is picked up
 * from the current value instead of restarting.
 */
/**
 * How the figure carries itself, from 0 (spent) to 1 (well).
 *
 * A pose is a better carrier for this than any bar: people read posture before
 * they read numbers, and they read it without being taught the scale. The two
 * ends are not the same animation at different speeds — a slump is a different
 * SHAPE, with the head forward and the shoulders rolled in, which is why the
 * droop terms are offsets rather than a lower amplitude.
 */
function pose(rig, root, t, v, reduced) {
  const droop = 1 - v;
  // Tempo, not just size: a tired body is slower as well as smaller.
  const w = Math.PI * 2 * (0.28 + 0.62 * v);
  const a = reduced ? 0 : v;
  const swing = Math.sin(w * t);
  const bounce = Math.sin(w * t * 2);

  // Weight shifts side to side; the bounce is at double time, as in a step.
  root.position.y = bounce * 0.013 * a - 0.012 * droop;
  root.rotation.z = swing * 0.035 * a;
  // Slumping folds the whole figure forward a little.
  root.rotation.x = 0.07 * droop;

  rig.head.rotation.x = -0.22 * droop + bounce * 0.09 * a;
  rig.head.rotation.z = swing * 0.09 * a;

  // Arms in antiphase — the thing that makes a walk or a dance read at all.
  // Droop rolls them forward and lets them hang closer to the body.
  rig.armL.rotation.x = swing * 0.5 * a - 0.3 * droop;
  rig.armR.rotation.x = -swing * 0.5 * a - 0.3 * droop;
  rig.armL.rotation.z = -bounce * 0.14 * a + 0.05 * droop;
  rig.armR.rotation.z = bounce * 0.14 * a - 0.05 * droop;

  // Legs counter the arms, at a third of the travel: this is a dance on the
  // spot, not a walk across the card.
  rig.legL.rotation.x = -swing * 0.17 * a;
  rig.legR.rotation.x = swing * 0.17 * a;
}

export default function BodyScene({
  zones,
  activeZone,
  onPickZone,
  vitality = 1,
  height = 340,
}) {
  const mountRef = useRef(null);
  const apiRef = useRef(null);

  // Build once. Zone state is pushed in through the imperative api below.
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
    const camera = new THREE.PerspectiveCamera(30, width / height, 0.1, 100);
    camera.position.set(0, 0.235, 3.35);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfb6a6, 1.5));
    const key = new THREE.DirectionalLight(0xffffff, 1.5);
    key.position.set(1.4, 2, 2.4);
    scene.add(key);
    const rim = new THREE.DirectionalLight(0xd8e6ff, 0.9);
    rim.position.set(-1.8, 0.8, -1.6);
    scene.add(rim);

    const root = new THREE.Group();
    scene.add(root);

    const body = buildBody();
    root.add(body.group);

    const organs = buildOrgans(body.group);
    ZONE_KEYS.forEach((k) => root.add(organs[k].group));

    const glow = buildGlow(0xffffff);
    root.add(glow.sprite);

    // ---- animation state -------------------------------------------------
    const state = {
      // rotation
      yaw: 0,
      yawTarget: 0,
      yawVelocity: 0,
      dragging: false,
      // per-zone intensity, eased towards its target every frame
      intensity: Object.fromEntries(ZONE_KEYS.map((k) => [k, 0])),
      target: Object.fromEntries(ZONE_KEYS.map((k) => [k, 0])),
      color: Object.fromEntries(
        ZONE_KEYS.map((k) => [k, new THREE.Color(LEVEL_COLOR[0])]),
      ),
      glowAt: new THREE.Vector3(0, 0.3, 0),
      glowTargetAt: new THREE.Vector3(0, 0.3, 0),
      glowIntensity: 0,
      glowTarget: 0,
      glowColor: new THREE.Color(0xffffff),
      bodyOpacity: 0.5,
      bodyOpacityTarget: 0.5,
      // Eased, so a round change or a new plate re-poses the figure over a
      // second rather than snapping it into a different mood.
      vitality: 1,
      vitalityTarget: 1,
    };

    // ---- pointer: 1:1 rotation with momentum -----------------------------
    const tracker = createVelocityTracker();
    const el = renderer.domElement;
    el.style.touchAction = "pan-y";
    el.style.cursor = "grab";

    let pointerId = null;
    let lastX = 0;
    let moved = 0;
    let downAt = 0;

    const onPointerDown = (e) => {
      pointerId = e.pointerId;
      el.setPointerCapture(pointerId);
      state.dragging = true;
      // Grabbing mid-spin must stop it dead — that is what "interruptible" means.
      state.yawVelocity = 0;
      state.yawTarget = state.yaw;
      lastX = e.clientX;
      moved = 0;
      downAt = performance.now();
      tracker.reset();
      tracker.add(state.yaw);
      el.style.cursor = "grabbing";
    };

    const onPointerMove = (e) => {
      if (!state.dragging || e.pointerId !== pointerId) return;
      const dx = e.clientX - lastX;
      lastX = e.clientX;
      moved += Math.abs(dx);
      // Track the finger 1:1 — 300px of travel is half a turn.
      state.yaw += (dx / 300) * Math.PI;
      state.yawTarget = state.yaw;
      tracker.add(state.yaw);
    };

    const onPointerUp = (e) => {
      if (!state.dragging) return;
      state.dragging = false;
      el.style.cursor = "grab";
      if (pointerId !== null && el.hasPointerCapture?.(pointerId)) {
        el.releasePointerCapture(pointerId);
      }
      const v = tracker.velocity();
      // A flick throws the figure to where the gesture was heading.
      state.yawTarget = state.yaw + project(v, 0.992);
      state.yawVelocity = v;
      pointerId = null;

      // Under the drag threshold and quick: treat it as a tap on an organ.
      if (moved < 10 && performance.now() - downAt < 400) {
        handleTap(e);
      }
    };

    // ---- tap → organ pick -------------------------------------------------
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();

    function handleTap(e) {
      const rect = el.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);

      // Test the visible organ systems first, then fall back to the body.
      for (const k of ZONE_KEYS) {
        if (SHELL_KEYS.has(k)) continue;
        const hits = raycaster.intersectObject(organs[k].group, true);
        if (hits.length) {
          apiRef.current?.onPick?.(k);
          return;
        }
      }
      const bodyHit = raycaster.intersectObject(body.group, true);
      if (bodyHit.length) {
        // Pick the zone whose anchor is nearest the hit point, vertically.
        const y = bodyHit[0].point.y;
        let best = null;
        let bestD = Infinity;
        for (const k of ZONE_KEYS) {
          if (SHELL_KEYS.has(k)) continue;
          const d = Math.abs(organs[k].focus.y - y);
          if (d < bestD) {
            bestD = d;
            best = k;
          }
        }
        apiRef.current?.onPick?.(bestD < 0.22 ? best : "oncology");
      }
    }

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);

    // ---- frame loop -------------------------------------------------------
    const clock = new THREE.Clock();
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.elapsedTime;

      if (!state.dragging) {
        // Critically damped approach — no wobble at rest.
        state.yaw += (state.yawTarget - state.yaw) * Math.min(1, dt * 6);
      }
      root.rotation.y = state.yaw;

      state.vitality +=
        (state.vitalityTarget - state.vitality) * Math.min(1, dt * 1.6);
      pose(body.rig, body.group, t, state.vitality, reduced);
      // The cancer view is a shell OF this figure, so it wears the same pose.
      const shell = organs.oncology;
      shell.group.position.copy(body.group.position);
      shell.group.rotation.copy(body.group.rotation);
      Object.entries(shell.rig).forEach(([n, node]) => {
        node.rotation.copy(body.rig[n].rotation);
      });

      ZONE_KEYS.forEach((k) => {
        const s = state;
        s.intensity[k] += (s.target[k] - s.intensity[k]) * Math.min(1, dt * 7);
        const organ = organs[k];
        // A slow breath, only on organs that are actually flagged.
        const pulse = reduced ? 1 : 0.86 + Math.sin(t * 1.9 + k.length) * 0.14;
        const lit = s.intensity[k];
        organ.materials.forEach((m) => {
          m.opacity = lit * (SHELL_KEYS.has(k) ? 0.2 : 0.92);
          // The organs are solids now rather than single blobs, so a lit one
          // has to occlude its own back faces: without this a rib cage reads
          // as a scribble and the gut as a knot. Only once it is opaque
          // enough to be worth it — writing depth while still faint would
          // punch holes in whatever is behind.
          m.depthWrite = !SHELL_KEYS.has(k) && m.opacity > 0.55;
          m.emissiveIntensity = lit * 1.5 * pulse;
          m.color.copy(s.color[k]);
          m.emissive.copy(s.color[k]);
        });
      });

      // Body fades back when an organ is lit, so the organ reads through it.
      state.bodyOpacity +=
        (state.bodyOpacityTarget - state.bodyOpacity) * Math.min(1, dt * 7);
      body.material.opacity = state.bodyOpacity;

      state.glowIntensity +=
        (state.glowTarget - state.glowIntensity) * Math.min(1, dt * 6);
      state.glowAt.lerp(state.glowTargetAt, Math.min(1, dt * 6));
      glow.sprite.position.copy(state.glowAt);
      glow.material.opacity =
        state.glowIntensity * (reduced ? 0.5 : 0.42 + Math.sin(t * 1.9) * 0.1);
      glow.material.color.copy(state.glowColor);
      const scale = 0.42 + state.glowIntensity * 0.34;
      glow.sprite.scale.set(scale, scale, 1);

      renderer.render(scene, camera);
    };
    tick();

    // ---- resize -----------------------------------------------------------
    const ro = new ResizeObserver(() => {
      const w = mount.clientWidth || width;
      renderer.setSize(w, height);
      camera.aspect = w / height;
      camera.updateProjectionMatrix();
    });
    ro.observe(mount);

    apiRef.current = {
      onPick: null,
      apply(nextZones, active) {
        let glowTarget = 0;
        const glowAt = new THREE.Vector3(0, 0.3, 0);
        let glowColor = new THREE.Color(0xffffff);
        let anyLit = false;

        nextZones.forEach(({ zone, level }) => {
          const k = zone.key;
          const isActive = active === k;
          // Flagged organs are always visible; a tap brings any organ forward.
          // With ten systems, lighting every clear one at once is soup:
          // only a flagged system shows unprompted.
          const base = level > 0 ? 0.5 + level * 0.22 : 0;
          state.target[k] = isActive ? 1 : active ? 0 : base;
          state.color[k].setHex(LEVEL_COLOR[level]);
          if (state.target[k] > 0.05) anyLit = true;

          if (
            isActive ||
            (!active && level > 0 && state.target[k] >= glowTarget)
          ) {
            glowTarget = Math.max(glowTarget, state.target[k]);
            glowAt.copy(organs[k].focus);
            glowColor = new THREE.Color(LEVEL_COLOR[level]);
          }
        });

        state.glowTarget = glowTarget;
        state.glowTargetAt.copy(glowAt);
        state.glowColor = glowColor;
        state.bodyOpacityTarget = anyLit ? 0.3 : 0.5;
      },
      setVitality(v) {
        state.vitalityTarget = Math.max(0, Math.min(1, v));
      },
      reset() {
        state.yawTarget = 0;
      },
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
      renderer.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          const mats = Array.isArray(o.material) ? o.material : [o.material];
          mats.forEach((m) => m.dispose());
        }
      });
      if (renderer.domElement.parentNode === mount)
        mount.removeChild(renderer.domElement);
      apiRef.current = null;
    };
  }, [height]);

  // Push selection changes into the running scene without rebuilding it.
  useEffect(() => {
    apiRef.current?.apply(zones, activeZone);
  }, [zones, activeZone]);

  useEffect(() => {
    apiRef.current?.setVitality(vitality);
  }, [vitality]);

  useEffect(() => {
    if (apiRef.current) apiRef.current.onPick = onPickZone;
  }, [onPickZone]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height, touchAction: "pan-y" }}
    />
  );
}
