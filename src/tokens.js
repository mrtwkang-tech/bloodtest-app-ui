/**
 * Design tokens.
 *
 * The palette moved from the warm paper look to a near-white clinical surface:
 * a report about tumour markers and stroke risk should read as instrument
 * output, not stationery. Colour is now reserved almost entirely for status,
 * which makes an out-of-range marker impossible to miss.
 */

export const EASE = "cubic-bezier(.23,1,.32,1)";
/** Slight overshoot for momentum-driven motion only. */
export const EASE_SPRING = "cubic-bezier(.16,1.2,.3,1)";

export const C = {
  ink: "#0B0B0C",
  ink2: "#1C1D1F",
  body: "#42454A",
  muted: "#6B6F76",
  faint: "#8E939B",
  faintest: "#AEB3BA",
  disabled: "#C2C6CC",
  hairline: "rgba(11,11,12,.08)",
  hairlineStrong: "rgba(11,11,12,.14)",

  canvas: "#EFEFF1",
  bg: "#F7F7F8",
  surface: "#FFFFFF",
  surfaceSunken: "#F2F3F5",
  surfaceHover: "#FAFAFB",
  chipIdle: "#F1F2F4",

  // Status — one hue per state, used everywhere from bars to organ glow.
  optimal: "#12B76A",
  optimalTint: "#E7F8F0",
  inRange: "#8B94A0",
  inRangeTint: "#F0F1F3",
  watch: "#E8A317",
  watchTint: "#FDF4E3",
  alert: "#EF5B41",
  alertTint: "#FDECE8",

  accent: "#0B0B0C",
  onAccent: "#FFFFFF",

  night: "#111214",
  scanBg: "#0A0B0C",

  peer: "#D5D8DD",
  peerStroke: "#B6BBC3",
};

export const STATUS_KEYS = ["good", "watch", "alert"];
export const STATUS_COLOR = { good: C.optimal, watch: C.watch, alert: C.alert };
export const STATUS_TINT = {
  good: C.optimalTint,
  watch: C.watchTint,
  alert: C.alertTint,
};

/** Body zone level (0/1/2) shares the same three hues. */
export const LEVEL_COLOR = [C.optimal, C.watch, C.alert];
export const LEVEL_TINT = [C.optimalTint, C.watchTint, C.alertTint];

/** Cards sit on a hairline ring plus a whisper of shadow, never a 1px border. */
export const CARD =
  "0 0 0 1px rgba(11,11,12,.06), 0 1px 2px rgba(11,11,12,.04)";
export const CARD_RAISED =
  "0 0 0 1px rgba(11,11,12,.06), 0 6px 20px -8px rgba(11,11,12,.16)";
export const DIVIDER = "inset 0 -1px 0 rgba(11,11,12,.06)";
export const DIVIDER_TOP = "inset 0 1px 0 rgba(11,11,12,.06)";

/** Translucent chrome — content scrolls underneath rather than being clipped. */
export const MATERIAL_CHROME = {
  background: "rgba(255,255,255,.72)",
  backdropFilter: "blur(24px) saturate(180%)",
  WebkitBackdropFilter: "blur(24px) saturate(180%)",
};

/**
 * Type ramp. Tracking is size-specific: large text needs negative tracking to
 * stop looking loose, body text sits near zero. A single letter-spacing value
 * across a ramp is wrong at one end or the other.
 */
export const T = {
  display: {
    fontSize: 56,
    fontWeight: 600,
    lineHeight: 1.0,
    letterSpacing: "-0.035em",
  },
  title1: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: 1.15,
    letterSpacing: "-0.025em",
  },
  title2: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: 1.25,
    letterSpacing: "-0.02em",
  },
  title3: {
    fontSize: 16,
    fontWeight: 700,
    lineHeight: 1.3,
    letterSpacing: "-0.015em",
  },
  body: {
    fontSize: 14,
    fontWeight: 500,
    lineHeight: 1.55,
    letterSpacing: "-0.005em",
  },
  callout: {
    fontSize: 13,
    fontWeight: 600,
    lineHeight: 1.4,
    letterSpacing: "-0.005em",
  },
  caption: {
    fontSize: 12,
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacing: "0",
  },
  micro: {
    fontSize: 10.5,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "0.01em",
  },
  mono: { fontVariantNumeric: "tabular-nums" },
};

export const fadeUp = (delayMs = 0) => ({
  animation: `fadeUp 420ms ${EASE} both`,
  animationDelay: `${delayMs}ms`,
});
