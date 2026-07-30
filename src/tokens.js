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
 * Wanted Sans: Latin and Hangul in one variable family. Pretendard was the
 * right structural call — one face for both scripts — but it is drawn to be
 * maximally neutral, and neutral across an entire product reads as characterless.
 * Wanted Sans keeps the same discipline (even colour, wide language coverage,
 * numerals that behave) while carrying an actual voice: slightly more open
 * counters, softer terminals, a touch more warmth in the Hangul finals. It has
 * personality at a headline and disappears in a paragraph, which is the only
 * kind of personality a reading face should have.
 *
 * JetBrains Mono: measured values only. Slashed zero, unambiguous 1/l/I, true
 * tabular metrics, identical on every machine.
 */
export const FONT_SANS =
  '"Wanted Sans Variable", "Wanted Sans", Pretendard, -apple-system, BlinkMacSystemFont, system-ui, sans-serif';
export const FONT_MONO =
  '"JetBrains Mono Variable", "JetBrains Mono", "Wanted Sans Variable", ui-monospace, SFMono-Regular, Menlo, monospace';

/**
 * COLOUR.
 *
 * The old triad was olive, ochre and brick: three desaturated earth tones that
 * sat at almost the same chroma as the warm-grey ground, so nothing on the
 * screen ever looked switched on. The replacement follows the way Apple's
 * system colours are actually used — a neutral ground, and saturated colour
 * reserved for the small number of things that carry state.
 *
 * Each status has TWO values, and the distinction matters:
 *
 *   `lamp`  the vivid one. Dots, bars, fills, rings — shapes, where chroma
 *           reads as an indicator being lit and contrast is not a text problem.
 *   `ink`   the dark one. Text and anything a reader has to actually read,
 *           where the vivid value would fail contrast against white.
 *
 * Using the vivid value for text (or the dark value for a 6px dot) is the
 * mistake that makes a palette look either washed out or illegible.
 */
export const C = {
  // Warm neutral ink — pure #000 on a warm ground reads as a rendering error.
  ink: "#16171A",
  ink2: "#2F3236",
  body: "#4A4E55",
  muted: "#6B7078",
  faint: "#8A8F98",
  faintest: "#A8ADB5",
  disabled: "#C7CBD1",

  hairline: "rgba(22,23,26,.08)",
  hairlineStrong: "rgba(22,23,26,.15)",

  canvas: "#DCDCD6",
  // Grouped-list grammar: white cards on a slightly deeper ground, the way
  // iOS settings works. The value step does the separating, so cards need
  // neither a border nor a shadow.
  bg: "#EDEDEA",
  surface: "#FFFFFF",
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#EAEAE6",
  surfaceHover: "#F6F6F3",
  chipIdle: "#E7E7E3",

  optimal: "#0B7A55",
  optimalLamp: "#12B981",
  optimalTint: "#DFF3EA",
  inRange: "#8A8F98",
  inRangeLamp: "#B3B8BF",
  inRangeTint: "#E9E9E5",
  watch: "#A15C00",
  watchLamp: "#F5A524",
  watchTint: "#FDEFD6",
  alert: "#B3261E",
  alertLamp: "#E5484D",
  alertTint: "#FBE3E1",

  // The brand tint is deliberately not one of the status hues: interactive and
  // "this is your result" must never be the same colour.
  accent: "#4338CA",
  accentLamp: "#6366F1",
  accentSoft: "#E8E7FB",
  onAccent: "#FFFFFF",

  night: "#17181B",
  scanBg: "#0F1012",

  peer: "#C4C7CC",
  peerStroke: "#9AA0A8",
};

export const STATUS_COLOR = { good: C.optimal, watch: C.watch, alert: C.alert };
export const STATUS_LAMP = {
  good: C.optimalLamp,
  watch: C.watchLamp,
  alert: C.alertLamp,
};
export const STATUS_TINT = {
  good: C.optimalTint,
  watch: C.watchTint,
  alert: C.alertTint,
};
/** Readable on white. */
export const LEVEL_COLOR = [C.optimal, C.watch, C.alert];
/** Vivid, for shapes only. */
export const LEVEL_LAMP = [C.optimalLamp, C.watchLamp, C.alertLamp];
export const LEVEL_TINT = [C.optimalTint, C.watchTint, C.alertTint];

/** Stepped radii — a card, a row inside it, a control inside that. */
export const R = { card: 14, inner: 10, control: 8, pill: 999 };

/**
 * DEPTH — and the decision not to fake it.
 *
 * A previous pass gave every surface a specular top edge, a vertical gradient
 * and an ambient cast. Applied to one element that is genuinely floating, that
 * is convincing. Applied to all of them it is worse than flat: every card
 * announces itself equally, the bevels stack into visual noise, and the whole
 * screen looks embossed. Overdone lighting is its own kind of cheap.
 *
 * So depth now comes from the same place iOS gets it — a value step between a
 * white card and a slightly deeper ground — and real shadow is spent only on
 * things that actually float above the content: the sheet and the tab bar.
 */
export const HAIRLINE = `inset 0 0 0 1px ${C.hairline}`;
/** A card is white on grey. That is the whole treatment. */
export const CARD = "none";
/** Genuinely floating chrome: sheets, the glass bar, a picked-up row. */
export const CARD_FLOAT =
  "0 1px 2px rgba(22,23,26,.06), 0 14px 34px -16px rgba(22,23,26,.28)";
/** Separators are inset from the leading edge, as in a grouped list. */
export const DIVIDER = `inset 0 -1px 0 ${C.hairline}`;
export const DIVIDER_TOP = `inset 0 1px 0 ${C.hairline}`;

export const SURFACE = C.surface;
export const SURFACE_SUNKEN = C.surfaceSunken;
/** Track wells only — a bar has to look like it contains something. */
export const INSET = "none";

/** rgba from a hex, so a status colour can become its own light. */
export function tint(hex, alpha) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}

/** A coloured cast under a coloured element — never a grey shadow. */
export function backlight(color, strength = 1) {
  return `0 6px 18px -8px ${tint(color, 0.42 * strength)}`;
}

/**
 * A soft halo. Kept for the ONE thing on a screen that needs to pulse for
 * attention; using it on every status dot is what made them look like stickers.
 */
export function halo(color, radius = 5) {
  return `0 0 0 ${radius}px ${tint(color, 0.16)}`;
}

/**
 * OPTICAL COMPENSATION.
 *
 * Two corrections earn their place, because both fix something a reader can
 * actually see. The rest of the pass — surface bevels, digit overhang, cap
 * rescaling on every label — was correction applied where nothing was wrong,
 * and the cumulative fussiness read as clumsiness rather than care.
 *
 *  · A circle of diameter d covers π/4 ≈ 79% of the area of a d×d square, so a
 *    dot beside square-set text reads smaller at matched size. 8% back.
 *  · A chevron carries its mass toward the tip, so mathematical centring parks
 *    it left of where it looks centred.
 */
export function dot(size = 6, color, lit = false) {
  const d = size * 1.08;
  return {
    width: d,
    height: d,
    borderRadius: "50%",
    background: color,
    flex: "none",
    boxShadow: lit && color ? halo(color, size * 0.66) : undefined,
  };
}

export const CARET = { display: "inline-block", transform: "translateX(.6px)" };

/**
 * Type ramp.
 *
 * The correction from the previous pass: monospace was carrying descriptions,
 * notes and state words as well as measurements. Setting running prose in
 * 11px mono is the single most dated thing a UI can do — it reads as a
 * terminal emulator, not a product. Mono is now strictly for values, units and
 * section labels, exactly as SF Mono is used in Apple's own apps, and text is
 * text.
 *
 * Weight does the hierarchy work instead. Titles run heavy (680) against a
 * light body (420), which is the contrast Instagram gets its clarity from —
 * far more legible at a glance than a ramp of similar mid-weights separated
 * only by a point or two of size.
 */
export const T = {
  display: {
    fontFamily: FONT_SANS,
    fontSize: 52,
    fontWeight: 700,
    lineHeight: 1,
    letterSpacing: "-0.04em",
    fontVariantNumeric: "tabular-nums",
  },
  title1: {
    fontFamily: FONT_SANS,
    fontSize: 27,
    fontWeight: 700,
    lineHeight: 1.18,
    letterSpacing: "-0.028em",
  },
  title2: {
    fontFamily: FONT_SANS,
    fontSize: 19,
    fontWeight: 680,
    lineHeight: 1.28,
    letterSpacing: "-0.02em",
  },
  title3: {
    fontFamily: FONT_SANS,
    fontSize: 15.5,
    fontWeight: 680,
    lineHeight: 1.32,
    letterSpacing: "-0.014em",
  },
  bodyText: {
    fontFamily: FONT_SANS,
    fontSize: 14,
    fontWeight: 420,
    lineHeight: 1.58,
    letterSpacing: "-0.006em",
  },
  label: {
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: "-0.01em",
  },

  /** Secondary prose: notes, mechanisms, sub-labels. Text, not readout. */
  readout: {
    fontFamily: FONT_SANS,
    fontSize: 13.5,
    fontWeight: 420,
    lineHeight: 1.55,
    letterSpacing: "-0.006em",
  },
  caption: {
    fontFamily: FONT_SANS,
    fontSize: 12.5,
    fontWeight: 440,
    lineHeight: 1.5,
    letterSpacing: "-0.004em",
  },
  /**
   * Uppercase section label. Wide tracking is what keeps it legible this
   * small — and the size is 9.5 rather than 10 as cap-height compensation:
   * all-caps has no descenders and no x-height dip, so it measures visually
   * larger than sentence case set at the same nominal size.
   */
  micro: {
    fontFamily: FONT_MONO,
    fontSize: 10,
    fontWeight: 550,
    lineHeight: 1.45,
    letterSpacing: "0.07em",
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
