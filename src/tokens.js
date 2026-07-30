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

/**
 * TWO families, chosen so nothing changes face between platforms or languages.
 *
 * Pretendard Variable: its Latin is drawn on Inter's skeleton and its Hangul is
 * designed against that Latin, so a sentence mixing 한글 and Latin keeps one
 * x-height, one weight curve and one optical centre. The old stack led with
 * -apple-system, which meant Latin came from SF and Hangul fell through to
 * Apple SD Gothic Neo — two faces per sentence, and a different pair on
 * Windows. Variable weight also lets the ramp use 560/640 rather than snapping
 * to 500/700.
 *
 * JetBrains Mono: every measured value. Slashed zero, unambiguous 1/l/I, and
 * true tabular metrics, identical on every machine — which is the whole point
 * of setting readouts in mono to begin with.
 */
export const FONT_SANS =
  '"Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
export const FONT_MONO =
  '"JetBrains Mono Variable", "JetBrains Mono", "Pretendard Variable", ui-monospace, SFMono-Regular, Menlo, monospace';

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

/**
 * LIGHT.
 *
 * A flat fill inside a hairline is what makes a layout read as generated: every
 * surface sits at exactly the same depth, so nothing has a top or a bottom and
 * the eye has nothing to hold. The fix is not decoration, it is committing to a
 * light source. One lamp, high and slightly front-left, applied consistently:
 *
 *   · SPECULAR — a 1px near-white line on the top edge only, where the lamp
 *     catches the rounded corner of the surface. This single line does more for
 *     perceived depth than any shadow.
 *   · SURFACE   — a shallow vertical gradient, lit at the top and settling into
 *     shade at the bottom, so the panel has an orientation.
 *   · AMBIENT   — a wide, very soft cast underneath rather than a hard drop
 *     shadow. Contact shadow tight, ambient shadow wide; that pairing is what
 *     real light does.
 *   · backlight() — for coloured elements, a shadow tinted with the element's
 *     own hue instead of grey. Light bounces off a green button as green.
 */
export const HAIRLINE = `inset 0 0 0 1px ${C.hairline}`;
export const SPECULAR = "inset 0 1px 0 rgba(255,255,255,.92)";
export const AMBIENT =
  "0 1px 1.5px -1px rgba(23,24,26,.14), 0 8px 22px -16px rgba(23,24,26,.30)";
export const CARD = `${HAIRLINE}, ${SPECULAR}, ${AMBIENT}`;
export const CARD_FLOAT = `${HAIRLINE}, ${SPECULAR}, 0 2px 4px -2px rgba(23,24,26,.18), 0 18px 40px -20px rgba(23,24,26,.36)`;
export const DIVIDER = `inset 0 -1px 0 ${C.hairline}`;
export const DIVIDER_TOP = `inset 0 1px 0 ${C.hairline}`;

/** The lit surface fill. Paired with SPECULAR it gives the panel a top edge. */
export const SURFACE =
  "linear-gradient(178deg, #FFFFFF 0%, #FCFCFB 38%, #F7F7F4 100%)";
export const SURFACE_SUNKEN =
  "linear-gradient(180deg, #E4E4E0 0%, #ECECE8 62%, #EEEEEA 100%)";
/** Recessed things are lit from below-inside: the bevel inverts. */
export const INSET = `inset 0 1px 2px rgba(23,24,26,.09), inset 0 -1px 0 rgba(255,255,255,.7)`;

/** rgba from a hex, so a status colour can become its own light. */
export function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** A coloured cast under a coloured element — never a grey shadow. */
export function backlight(color, strength = 1) {
  return (
    `0 1px 2px -1px ${tint(color, 0.28 * strength)}, ` +
    `0 10px 26px -12px ${tint(color, 0.5 * strength)}`
  );
}

/** A soft halo behind a small coloured mark, so status reads as emitted light. */
export function halo(color, radius = 5) {
  return `0 0 ${radius * 2}px ${tint(color, 0.42)}, 0 0 ${radius}px ${tint(color, 0.3)}`;
}

/** Ambient wash for a large area, keyed to a status hue. */
export function wash(color, alpha = 0.1) {
  return `radial-gradient(120% 90% at 78% 6%, ${tint(color, alpha)} 0%, transparent 62%)`;
}

/**
 * OPTICAL COMPENSATION.
 *
 * Geometry that measures equal does not look equal.
 *
 *  · A circle of diameter d covers π/4 ≈ 79% of the area of a d×d square, so a
 *    status dot next to a square swatch reads smaller at matched size. `dot()`
 *    scales the diameter by 1.08 to put the two back in visual balance.
 *  · A triangular glyph — the chevron, the play arrow — carries its mass toward
 *    the tip, so mathematical centring parks it left of where it looks centred.
 *    `CARET` nudges it back by half a pixel-and-a-bit.
 *  · Round shapes and quotation marks must overhang a guideline slightly to
 *    look aligned with the straight edges above and below them: `overhang()`.
 *  · Capitals measure taller than lowercase at the same size, so an uppercase
 *    label set beside sentence-case text is visually louder. Micro labels drop
 *    ~5% to compensate — this is already baked into T.micro.
 */
export function dot(size = 6, color, lit = true) {
  const d = size * 1.08;
  return {
    width: d,
    height: d,
    borderRadius: "50%",
    background: color,
    flex: "none",
    boxShadow: lit && color ? halo(color, size * 0.75) : undefined,
  };
}

export const CARET = { display: "inline-block", transform: "translateX(.6px)" };

export const overhang = (px = 1) => ({ marginLeft: -px, marginRight: -px });

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
  /**
   * Uppercase section label. Wide tracking is what keeps it legible this
   * small — and the size is 9.5 rather than 10 as cap-height compensation:
   * all-caps has no descenders and no x-height dip, so it measures visually
   * larger than sentence case set at the same nominal size.
   */
  micro: {
    fontFamily: FONT_MONO,
    fontSize: 9.5,
    fontWeight: 500,
    lineHeight: 1.45,
    letterSpacing: "0.075em",
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

  /** Numerals that must align in a column. `zero` is the slashed nought. */
  num: {
    fontFamily: FONT_MONO,
    fontVariantNumeric: "tabular-nums slashed-zero",
    fontFeatureSettings: '"tnum" 1, "zero" 1',
    letterSpacing: "-0.01em",
  },
};

export const fadeUp = (delayMs = 0) => ({
  animation: `fadeUp 400ms ${EASE} both`,
  animationDelay: `${delayMs}ms`,
});
