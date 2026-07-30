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
 * Fraunces — the display face. The rule for it is now a sentence rather than a
 * count: THE SERIF IS THE PRODUCT SPEAKING. It gets the wordmark, where the
 * product says its own name, and the health score, where it gives the one
 * answer everything resolves to. Nothing else. Tab titles stay in the
 * grotesque, so the two uses stay distinguishable from the interface around
 * them and from each other.
 *
 * A health score set in the same grotesque as the tab labels is a number you
 * read and forget. It is also the one figure the whole product resolves to, and
 * it should look like it. Fraunces is a variable old-style serif with real
 * stroke contrast and a genuine optical-size axis, which matters here: at 58px
 * `opsz` pulls the serifs fine and the contrast high, the way display cuts of
 * metal faces were actually drawn, so the numeral gets editorial weight rather
 * than just being big.
 *
 * `SOFT` rounds the terminals a little so it does not read as a newspaper
 * masthead, and `WONK` stays off — its swashed alternates are charming in a
 * word and distracting in a number.
 */
export const FONT_DISPLAY =
  '"Fraunces Variable", "Fraunces", "Wanted Sans Variable", Georgia, serif';

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
 *   `lamp`  the vivid one. Glows, bars, rings — shapes, where chroma reads as
 *           an indicator being lit and contrast is not a text problem.
 *   `ink`   the dark one. Text and anything a reader has to actually read,
 *           where the vivid value would fail contrast against white.
 *
 * HOW LITTLE COLOUR IS USED.
 *
 * The ground is white and the type is black. Everything in range is neutral —
 * a normal result gets no colour at all, because painting two thirds of the
 * screen green is both noisy and slightly dishonest about how much there is to
 * look at. Colour appears on the two states that are asking for something
 * (amber, red), the ambient glow behind an organ's glyph, and the single
 * indigo that means "you can press this". Four hues, most screens showing one.
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

  hairline: "rgba(22,23,26,.07)",
  hairlineStrong: "rgba(22,23,26,.14)",

  canvas: "#E8E8E6",
  // White page, faintly tinted cards. The earlier arrangement — grey page,
  // white cards — is the iOS settings grammar, and it made a screen mostly
  // grey. Inverting it puts the brightest value on the largest area.
  bg: "#FFFFFF",
  surface: "#F7F7F5",
  surfaceRaised: "#FFFFFF",
  surfaceSunken: "#EDEDEA",
  surfaceHover: "#F1F1EE",
  chipIdle: "#EFEFEC",

  optimal: "#0B7A55",
  optimalLamp: "#12B981",
  optimalTint: "#E4F3EC",
  inRange: "#8A8F98",
  inRangeLamp: "#C2C6CC",
  inRangeTint: "#EFEFEC",
  watch: "#A15C00",
  watchLamp: "#F5A524",
  watchTint: "#FCEFD9",
  alert: "#B3261E",
  alertLamp: "#E5484D",
  alertTint: "#FBE6E4",

  // The brand tint is deliberately not one of the status hues: interactive and
  // "this is your result" must never be the same colour. The actual values live
  // in theme/accents.js and are painted onto :root, so the accent can be
  // switched at runtime without a re-render. See that file for why the choice
  // of hue is as constrained as it is.
  accent: "var(--accent)",
  accentLamp: "var(--accent-lamp)",
  accentSoft: "var(--accent-soft)",
  onAccent: "var(--on-accent)",

  night: "#17181B",
  scanBg: "#0F1012",

  peer: "#C4C7CC",
  peerStroke: "#9AA0A8",
};

export const STATUS_COLOR = { good: C.ink, watch: C.watch, alert: C.alert };
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
/**
 * Readable on white — and level 0 is deliberately NOT green.
 *
 * A number that is fine should look like a number, not like an achievement.
 * Reserving colour for the two states that want something is what keeps a
 * screen of sixty-nine markers from looking like a christmas tree, and it
 * makes the amber and the red actually mean something when they appear.
 */
export const LEVEL_COLOR = [C.ink, C.watch, C.alert];
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

/**
 * rgba from a hex, so a status colour can become its own light.
 *
 * The accent arrives as a CSS variable rather than a hex, and cannot be picked
 * apart here — `color-mix` does the same job in the browser, where the variable
 * has a value.
 */
export function tint(color, alpha) {
  if (!color.startsWith("#")) {
    return `color-mix(in srgb, ${color} ${Math.round(alpha * 100)}%, transparent)`;
  }
  const n = parseInt(color.slice(1), 16);
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
  /** The hero numeral. Serif, high contrast, optically sized for display. */
  display: {
    fontFamily: FONT_DISPLAY,
    fontSize: 52,
    fontWeight: 620,
    lineHeight: 0.94,
    // Serifs already do the work of binding the figures together, so the tight
    // tracking the grotesque needed would jam them.
    letterSpacing: "-0.012em",
    fontVariantNumeric: "lining-nums tabular-nums",
    fontVariationSettings: "'opsz' 144, 'SOFT' 30, 'WONK' 0",
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
