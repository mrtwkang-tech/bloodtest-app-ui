/**
 * THE BRAND ACCENT — and why the choice is this constrained.
 *
 * Three hues are already spoken for and cannot be borrowed:
 *
 *   green  ~155°  "in range"
 *   amber   ~40°  "watch"
 *   red      ~2°  "consult someone"
 *
 * In a product where colour carries a clinical claim, the brand hue has to be
 * unmistakably NOT one of those, at 6px, in peripheral vision, and for a reader
 * with colour-vision deficiency. Deuteranopia — around 6% of men — collapses
 * the green/amber axis, so anything from yellow-green through teal converges on
 * the two colours we least want confused. That rules out the whole 90–190° arc,
 * not on taste but on safety.
 *
 * With blue also off the table (it read as generic SaaS, and it was rejected),
 * what remains is the violet–magenta arc, 280–330°, and achromatic ink. Every
 * option below sits in one of those two places. That is not a small palette
 * because we lacked imagination; it is what is left once the status colours and
 * the accessibility constraint have taken their share.
 *
 * WHAT EACH NUMBER IS FOR
 *
 *   base   Fills a reader presses: the FAB, the primary button, a chosen chip.
 *          Lightness is pinned around 30–36% so white text on it clears 7:1 —
 *          comfortably past AA, because the CTA label is small and set in a
 *          light weight. Any lighter and the button needs dark text, which
 *          reads as a warning; any darker and it stops looking chromatic at all.
 *   lamp   The same hue, lifted ~25 points in lightness and pushed in chroma,
 *          for marks too small to carry a dark colour: the 2px chart line, a
 *          4px dot, an icon glow. Small shapes lose apparent saturation — the
 *          Helmholtz–Kohlrausch effect running in reverse — so a mark drawn in
 *          the base colour looks grey. The lamp is the optical correction.
 *   soft   A 6–8% wash for the background of a selected row or an inline badge.
 *          Kept under 8% because the page is white: anything heavier reads as
 *          a second surface level and starts competing with the cards.
 *   onBase Text on the base fill. White everywhere; listed so a future light
 *          accent cannot silently break contrast.
 *
 * Switch at runtime from More → 액센트. The choice writes CSS custom properties
 * on :root, so the whole app re-tints without a React re-render.
 */

export const ACCENTS = {
  plum: {
    key: "plum",
    nameKey: "accent.plum",
    base: "#6D2C5A",
    lamp: "#B0468F",
    soft: "#F6EAF2",
    onBase: "#FFFFFF",
    /**
     * Hue 318°, chroma moderate, lightness 33%.
     *
     * Far enough from alert red (≈2°) that the two never read as the same
     * signal — 44° of separation plus a 30-point lightness gap, so even at a
     * 6px dot the plum reads dark and the red reads bright. Far enough from the
     * old indigo (263°) to be a different decision rather than a nudge.
     *
     * The chroma is deliberately short of where plum turns fuchsia. Full-chroma
     * magenta on white vibrates at small sizes and reads cosmetic; pulled back,
     * the same hue reads as ink that happens to be coloured, which is what a
     * clinical product wants. It also sits warm against the bone-white ground
     * rather than fighting it, the way a cool blue did.
     */
    contrast: "8.4:1 on white",
  },

  ink: {
    key: "ink",
    nameKey: "accent.ink",
    base: "#17181B",
    lamp: "#4A4E55",
    soft: "#F0F0EE",
    onBase: "#FFFFFF",
    /**
     * No hue at all — chroma ≈ 0.01, warm-shifted so it never goes blue-black.
     * THE DEFAULT.
     *
     * With three status hues already carrying a clinical claim, a fourth hue
     * competes with them every time it appears: the reader has to decide, at
     * every coloured pixel, whether it is a result or a brand. Make the brand
     * achromatic and that question disappears — the rule collapses to one line,
     * *if it has colour, it is a result*, and nothing else can be mistaken for
     * one.
     *
     * The cost is real: the product has no colour of its own. In a lab report
     * that is the right trade. A consumer brand can afford to spend attention
     * on itself; a page whose whole job is to tell you which of sixty-nine
     * numbers needs looking at cannot.
     */
    contrast: "16.7:1 on white",
  },

  iris: {
    key: "iris",
    nameKey: "accent.iris",
    base: "#5B2A9E",
    lamp: "#9B6BE8",
    soft: "#F1EAFB",
    onBase: "#FFFFFF",
    /**
     * Hue 272°, lightness 36%. Violet rather than indigo: past the point where
     * a hue still reads as "blue", but short of magenta.
     *
     * Kept as an option because it is the most legible of the three at very
     * small sizes — violet holds its identity in a 2px chart stroke better than
     * plum does. The risk is category: saturated violet is heavily coded as
     * "AI product" right now, and this is a lab report.
     */
    contrast: "9.1:1 on white",
  },

  clay: {
    key: "clay",
    nameKey: "accent.clay",
    base: "#7A3B2E",
    lamp: "#C1705C",
    soft: "#F7EBE7",
    onBase: "#FFFFFF",
    /**
     * Hue 14°, lightness 33%. The one warm option, and the one with a caveat
     * printed on it: it is 12° from alert red. The separation that makes it
     * work is value, not hue — the alert is a light, bright red and this is a
     * dark, muted one — but a reader glancing at a small mark can still get
     * them confused, and colour-vision deficiency does not help here either.
     *
     * Offered because it is the best match for the warm ground of anything in
     * the palette. Not recommended for that reason alone.
     */
    contrast: "8.0:1 on white",
  },
};

// Picker order is recommendation order.
export const ACCENT_KEYS = ["ink", "plum", "iris", "clay"];
export const DEFAULT_ACCENT = "ink";

const STORAGE_KEY = "pedia.accent";

/** Paints one accent onto :root. Inline styles read these through var(). */
export function applyAccent(key) {
  const a = ACCENTS[key] ?? ACCENTS[DEFAULT_ACCENT];
  const root = document.documentElement;
  root.style.setProperty("--accent", a.base);
  root.style.setProperty("--accent-lamp", a.lamp);
  root.style.setProperty("--accent-soft", a.soft);
  root.style.setProperty("--on-accent", a.onBase);
  root.dataset.accent = a.key;
  try {
    localStorage.setItem(STORAGE_KEY, a.key);
  } catch {
    // Private browsing: the accent just does not persist.
  }
  return a.key;
}

export function storedAccent() {
  try {
    const k = localStorage.getItem(STORAGE_KEY);
    return ACCENTS[k] ? k : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}
