import { useEffect, useRef } from "react";
import * as THREE from "three";
import { buildBody } from "./figure";
import { buildGlow } from "./anatomy";
import { AXIS_HUE, buildCircuits } from "./brain";
import { useThreeScene } from "./useThreeScene";

/**
 * The mind panel as the circuits it is actually measuring.
 *
 * SAME MACHINERY AS THE BODY SCENE, DIFFERENT GRAMMAR. Body is a map of places:
 * one organ, one location, and "where is my liver" has a picture answer. Not
 * one of the five mind axes is an object. Stress recovery is the loop from the
 * paraventricular nucleus down to the adrenal cortex and back — `scales.js`
 * defines it as "whether the axis still switches off", which is a property of
 * the loop and of nothing in it. So an axis here lights a PATH, and the stress
 * path is the only closed one because the closing is the measurement.
 *
 * THE FRAMING IS A BUST, not a head. Two of the five circuits leave the skull —
 * stress runs to the adrenals at y 0.47, and neural substrate starts in the gut
 * — so a head-only camera would cut the two most interesting paths in half. The
 * figure is the one `buildBody` already makes, held further back than usual and
 * faded almost out, because here it is a room rather than a subject.
 */
const AXIS_KEYS = [
  "recovery",
  "inflammation",
  "substrate",
  "circadian",
  "metabolic",
];

/** Level 0/1/2 → the colour an axis glows when it is asking for something. */
const STATUS_COLOR = { good: 0x5f9440, watch: 0xd39525, alert: 0xc9553a };

export default function MindScene({
  scores,
  statuses,
  active,
  onPick,
  height = 340,
}) {
  // Held in a ref rather than closed over, so a parent re-render with a new
  // handler does not rebuild the scene — and so the tap callback below is not
  // reaching forward into a binding that does not exist yet when it is written.
  const pickRef = useRef(onPick);
  pickRef.current = onPick;

  const { mountRef, apiRef } = useThreeScene({
    height,
    camera: {
      fov: 26,
      // Crown is y 1.045, the adrenals y 0.47, the gut y 0.36 — so the frame
      // has to run from the top of the head to about L2. Centred at 0.68 and
      // pulled back to 2.5, with a `lookAt` the body scene never needed.
      position: [0, 0.72, 2.05],
      lookAt: [0, 0.72, 0],
      key: [1.2, 1.6, 2.2],
    },
    build({ root }) {
      const body = buildBody();
      // Far more transparent than on the body screen. There it is a container
      // you are meant to read organs through; here it is scaffolding, and at
      // the body screen's 0.5 it competes with circuits 3 mm across.
      body.material.opacity = 0.16;
      body.material.transmission = 0.72;
      root.add(body.group);

      const circuits = buildCircuits();
      Object.values(circuits).forEach((c) => root.add(c.group));

      const glow = buildGlow(0xffffff);
      root.add(glow.sprite);

      return {
        body,
        circuits,
        glow,
        state: {
          intensity: Object.fromEntries(
            Object.keys(circuits).map((k) => [k, 0]),
          ),
          target: Object.fromEntries(Object.keys(circuits).map((k) => [k, 0])),
          color: Object.fromEntries(
            Object.keys(circuits).map((k) => [k, new THREE.Color(0x5f9440)]),
          ),
          glowAt: new THREE.Vector3(0, 0.94, 0),
          glowTargetAt: new THREE.Vector3(0, 0.94, 0),
          glowIntensity: 0,
          glowTarget: 0,
          glowColor: new THREE.Color(0xffffff),
        },
      };
    },
    onFrame({ circuits, state, glow }, dt, t, reduced) {
      Object.keys(circuits).forEach((k, ki) => {
        state.intensity[k] +=
          (state.target[k] - state.intensity[k]) * Math.min(1, dt * 7);
        const lit = state.intensity[k];
        const pulse = reduced ? 1 : 0.86 + Math.sin(t * 1.9 + ki * 0.9) * 0.14;
        circuits[k].materials.forEach((m) => {
          m.opacity = lit * 0.94;
          // A lit tube has to occlude its own back faces or a circuit that
          // doubles back reads as a scribble — the same lesson the rib cage
          // taught on the body screen.
          m.depthWrite = m.opacity > 0.55;
          m.emissiveIntensity = lit * 1.5 * pulse;
          m.color.copy(state.color[k]);
          m.emissive.copy(state.color[k]);
        });
      });

      state.glowIntensity +=
        (state.glowTarget - state.glowIntensity) * Math.min(1, dt * 6);
      state.glowAt.lerp(state.glowTargetAt, Math.min(1, dt * 6));
      glow.sprite.position.copy(state.glowAt);
      glow.material.opacity =
        state.glowIntensity * (reduced ? 0.5 : 0.42 + Math.sin(t * 1.9) * 0.1);
      glow.material.color.copy(state.glowColor);
      const s = 0.3 + state.glowIntensity * 0.24;
      glow.sprite.scale.set(s, s, 1);
    },
    onPick(raycaster, { circuits }) {
      // Depth-sorted rather than declaration-ordered. Inside a skull every
      // structure is within 9 cm of every other, so "first key that hits"
      // would just return whichever axis happens to be listed first.
      let best = null;
      let bestD = Infinity;
      AXIS_KEYS.forEach((k) => {
        const hits = raycaster.intersectObject(circuits[k].group, true);
        if (hits.length && hits[0].distance < bestD) {
          bestD = hits[0].distance;
          best = k;
        }
      });
      if (best) pickRef.current?.(best);
    },
  });

  useEffect(() => {
    const api = apiRef.current;
    if (!api?.ctx) return;
    const { state, circuits } = api.ctx;
    let glowTarget = 0;
    const glowAt = new THREE.Vector3(0, 0.94, 0);
    let glowColor = new THREE.Color(0xffffff);

    AXIS_KEYS.forEach((k, i) => {
      const status = statuses[i];
      const isActive = active === k;
      // Same rule as the body figure: a flagged axis glows unprompted, a tap
      // brings any axis forward and everything else goes dark.
      // A FLOOR, unlike the body figure. There, an unflagged organ going dark
      // is fine because the body itself is still the picture. Here the
      // circuits ARE the picture, and every scale is in range on most rounds —
      // so with the body's rule the mind tab would open on an empty room. A
      // clear circuit is drawn, quietly; a flagged one is drawn brightly.
      const base = status === "good" ? 0.34 : status === "alert" ? 0.94 : 0.72;
      state.target[k] = isActive ? 1 : active ? 0.1 : base;
      // Identity by hue; a flagged axis takes the status colour instead.
      state.color[k].setHex(
        status === "good" ? AXIS_HUE[k] : STATUS_COLOR[status],
      );
      if (
        isActive ||
        (!active && status !== "good" && state.target[k] >= glowTarget)
      ) {
        glowTarget = Math.max(glowTarget, state.target[k]);
        glowAt.copy(circuits[k].focus);
        glowColor = new THREE.Color(
          status === "good" ? AXIS_HUE[k] : STATUS_COLOR[status],
        );
      }
    });

    // The measured-but-unwired structures sit at a constant faint presence.
    // They are never the answer to a selection, and they never go away — that
    // is the point of drawing them.
    state.target.unwired = active ? 0.12 : 0.22;
    state.color.unwired.setHex(0x8d8b96);

    state.glowTarget = glowTarget;
    state.glowTargetAt.copy(glowAt);
    state.glowColor = glowColor;
  }, [scores, statuses, active, apiRef]);

  return (
    <div
      ref={mountRef}
      style={{ width: "100%", height, touchAction: "pan-y" }}
    />
  );
}
