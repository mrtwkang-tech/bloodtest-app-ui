/**
 * Design tokens.
 *
 * The reference for this pass is an instrument panel, not a consumer card
 * feed. Three rules carry most of the character:
 *
 *  1. Monospace does the talking for anything that describes or measures —
 *     descriptions, units, counts, ranks, state labels. Proportional type is
 *     reserved for names and headings. This is what makes a readout read as a
 *     readout instead of a marketing page.
 *  2. Radii stay small and stepped (14 / 10 / 8). Fully-round pills are for
 *     genuine status badges only. Wrapping every value in a tinted capsule is
 *     the tell of a generated layout.
 *  3. Boundaries are hairlines, not shadows. Elevation is reserved for things
 *     that genuinely float.
 */

export const EASE = "cubic-bezier(.23,1,.32,1)";

export const FONT_SANS =
  '-apple-system, BlinkMacSystemFont, "SF Pro Text", Pretendard, system-ui, "Segoe UI", Roboto, sans-serif';
export const FONT_MONO =
  'ui-monospace, "SF Mono", SFMono-Regular, "JetBrains Mono", Menlo, Consolas, monospace';

export const C = {
  // Warm neutral ink — pure #000 on a warm ground reads as a rendering error.
  ink: "#17181A",
  ink2: "#33363B",
  body: "#4E525A",
  muted: "#6E737C",
  faint: "#8C919A",
  faintest: "#A9AEB6",
  disabled: "#C4C8CE",

  hairline: "rgba(23,24,26,.09)",
  hairlineStrong: "rgba(23,24,26,.16)",

  canvas: "#DEDED8",
  bg: "#F1F1EE",
  surface: "#FBFBFA",
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#EAEAE6",
  surfaceHover: "#F5F5F2",
  chipIdle: "#E8E8E4",

  // Status. One hue per state, from bars to organ glow to tab dots.
  optimal: "#4C7A33",
  optimalSoft: "#7FA860",
  optimalTint: "#E8F0E0",
  inRange: "#8C919A",
  inRangeTint: "#E9E9E5",
  watch: "#B8801F",
  watchTint: "#F7EEDA",
  alert: "#B4462F",
  alertTint: "#F6E4DF",

  accent: "#3F6329",
  accentSoft: "#E6EEDE",
  onAccent: "#FFFFFF",

  night: "#1B1D1C",
  scanBg: "#111312",

  peer: "#BFC3BA",
  peerStroke: "#9BA096",
};

export const STATUS_COLOR = { good: C.optimal, watch: C.watch, alert: C.alert };
export const STATUS_TINT = {
  good: C.optimalTint,
  watch: C.watchTint,
  alert: C.alertTint,
};
export const LEVEL_COLOR = [C.optimal, C.watch, C.alert];
export const LEVEL_TINT = [C.optimalTint, C.watchTint, C.alertTint];

/** Stepped radii — a card, a row inside it, a control inside that. */
export const R = { card: 14, inner: 10, control: 8, pill: 999 };

/** Hairline ring. Shadow only where something actually floats. */
export const HAIRLINE = `inset 0 0 0 1px ${C.hairline}`;
export const CARD = `inset 0 0 0 1px ${C.hairline}`;
export const CARD_FLOAT = `inset 0 0 0 1px ${C.hairline}, 0 8px 24px -12px rgba(23,24,26,.22)`;
export const DIVIDER = `inset 0 -1px 0 ${C.hairline}`;
export const DIVIDER_TOP = `inset 0 1px 0 ${C.hairline}`;

/**
 * Type ramp.
 *
 * Tracking is size-specific: display sizes need negative tracking to stop
 * looking loose, and the uppercase micro label needs strong positive tracking
 * to stay readable at 10px. One letter-spacing value across a ramp is always
 * wrong at one end.
 */
export const T = {
  display: {
    fontFamily: FONT_SANS,
    fontSize: 52,
    fontWeight: 600,
    lineHeight: 1,
    letterSpacing: "-0.035em",
    fontVariantNumeric: "tabular-nums",
  },
  title1: {
    fontFamily: FONT_SANS,
    fontSize: 26,
    fontWeight: 640,
    lineHeight: 1.15,
    letterSpacing: "-0.024em",
  },
  title2: {
    fontFamily: FONT_SANS,
    fontSize: 19,
    fontWeight: 640,
    lineHeight: 1.25,
    letterSpacing: "-0.018em",
  },
  title3: {
    fontFamily: FONT_SANS,
    fontSize: 15,
    fontWeight: 640,
    lineHeight: 1.3,
    letterSpacing: "-0.012em",
  },
  bodyText: {
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    fontWeight: 450,
    lineHeight: 1.55,
    letterSpacing: "-0.004em",
  },
  label: {
    fontFamily: FONT_SANS,
    fontSize: 13,
    fontWeight: 560,
    lineHeight: 1.35,
    letterSpacing: "-0.006em",
  },

  /** Monospace family — descriptions, units, states, anything measured. */
  mono: {
    fontFamily: FONT_MONO,
    fontSize: 12,
    fontWeight: 450,
    lineHeight: 1.6,
    letterSpacing: "-0.01em",
  },
  monoSm: {
    fontFamily: FONT_MONO,
    fontSize: 11,
    fontWeight: 450,
    lineHeight: 1.5,
    letterSpacing: "-0.01em",
  },
  /** Uppercase section label. Wide tracking is what keeps 10px legible. */
  micro: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: "0.09em",
    textTransform: "uppercase",
  },
  /**
   * Units are never uppercased: `textTransform` would turn μg into MG and
   * mg/dL into MG/DL, which are different quantities.
   */
  unit: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 500,
    lineHeight: 1.4,
    letterSpacing: "0.01em",
  },

  /** Numerals that must align in a column. */
  num: {
    fontFamily: FONT_MONO,
    fontVariantNumeric: "tabular-nums",
    letterSpacing: "-0.01em",
  },
};

export const fadeUp = (delayMs = 0) => ({
  animation: `fadeUp 400ms ${EASE} both`,
  animationDelay: `${delayMs}ms`,
});
