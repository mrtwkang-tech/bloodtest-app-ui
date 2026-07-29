/**
 * Motion physics, following Apple's "Designing Fluid Interfaces".
 *
 * Two ideas do most of the work: a gesture's release velocity must flow into
 * the animation that follows it, and a flick should land where the gesture was
 * *going*, not where the finger happened to lift.
 */

/** Critically damped: reaches the target without overshoot. The default. */
export const SPRING_UI = { type: "spring", bounce: 0, duration: 0.4 };

/** Slight overshoot — only earned when the gesture itself carried momentum. */
export const SPRING_MOMENTUM = { type: "spring", bounce: 0.2, duration: 0.4 };

/** Sheets: a touch of bounce, faster response. */
export const SPRING_SHEET = { type: "spring", bounce: 0.18, duration: 0.34 };

/**
 * Where a flick would come to rest.
 *
 * This is the exponential-decay form Apple ships, not the textbook
 * v²/(2·decel) — the two disagree noticeably at the velocities a thumb
 * produces, and this one is what scroll deceleration actually feels like.
 */
export function project(velocity, decelerationRate = 0.998) {
  return ((velocity / 1000) * decelerationRate) / (1 - decelerationRate);
}

/**
 * Progressive resistance past a boundary. A hard stop reads as frozen; this
 * reads as "still listening, but there is nothing more here".
 */
export function rubberband(overshoot, dimension, constant = 0.55) {
  return (
    (overshoot * dimension * constant) /
    (dimension + constant * Math.abs(overshoot))
  );
}

/** Keeps a short position history so release velocity is measured, not guessed. */
export function createVelocityTracker(sampleWindowMs = 100) {
  let samples = [];
  return {
    add(value) {
      const now = performance.now();
      samples.push({ value, time: now });
      samples = samples.filter((s) => now - s.time <= sampleWindowMs);
    },
    /** px per second, from the oldest sample still inside the window. */
    velocity() {
      if (samples.length < 2) return 0;
      const first = samples[0];
      const last = samples[samples.length - 1];
      const dt = (last.time - first.time) / 1000;
      if (dt <= 0) return 0;
      return (last.value - first.value) / dt;
    },
    reset() {
      samples = [];
    },
  };
}

/** Honour the OS setting rather than deciding for the user. */
export function prefersReducedMotion() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
