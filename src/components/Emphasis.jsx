import { C, T } from "../tokens";

/**
 * Marks the phrase in a sentence that carries it.
 *
 * A paragraph of even grey is a paragraph the eye has to read in full before
 * it knows whether it needed to. Bolding is the usual reach, but bold Hangul
 * at body size thickens the counters and the line goes muddy rather than
 * emphatic. A pale wash behind the words does the same job by a different
 * channel — the phrase is found before it is read — and leaves the letterforms
 * alone.
 *
 * GOLD, AND WHY IT DOES NOT BREAK THE COLOUR RULE. The rule so far has been
 * that colour means a value is outside its range — so a flat amber highlighter
 * would claim a result that is not there. Foil is not a flat colour. It is a
 * MATERIAL: a highlight that moves independently of the thing it is on, which
 * no status swatch in this product does and no printed page can do at all.
 * That difference is the whole reason it can carry a second meaning — "this is
 * the sentence worth reading" — without being mistaken for 주의 amber.
 *
 * The words stay ink. The foil is the ground they sit on, held at low opacity,
 * because a highlight travelling under a glyph is what destroys legibility
 * rather than what makes it shine. Foil as ink is reserved for display sizes
 * where the stroke is thick enough to survive it.
 *
 * Text goes through `render` so a dictionary string can carry its own emphasis
 * with *asterisks*, keeping the editorial decision next to the sentence rather
 * than in the component that happens to display it.
 */
export default function Emphasis({ children, tone = C.ink }) {
  return (
    <span style={{ position: "relative", color: tone }}>
      {/* The foil is a sibling rather than this span's own background: a
          background cannot be given its own opacity without taking the text
          down with it, and the text has to stay at full strength. */}
      <span className="foil foil-wash" aria-hidden="true" style={FOIL_BEHIND} />
      <span style={{ position: "relative" }}>{children}</span>
    </span>
  );
}

const FOIL_BEHIND = {
  position: "absolute",
  inset: "-1px -4px",
  zIndex: 0,
  pointerEvents: "none",
};

/**
 * Foil as ink — the glyphs are the metal.
 *
 * Only for display sizes. Below about 18px the sweep passes through a stroke
 * thinner than the highlight and the word blinks out as it goes.
 */
export function FoilText({ children, style }) {
  return (
    <span className="foil foil-ink" style={style}>
      {children}
    </span>
  );
}

/**
 * Splits `*marked*` spans out of a string and wraps them.
 *
 * Returns the string untouched when there is nothing marked, so passing every
 * sentence through this costs nothing and no call site has to know whether a
 * particular string uses it.
 */
export function withEmphasis(text) {
  if (typeof text !== "string" || !text.includes("*")) return text;
  return text
    .split(/\*([^*]+)\*/g)
    .map((part, i) =>
      i % 2 === 1 ? <Emphasis key={i}>{part}</Emphasis> : part,
    );
}

/** A measured value worth finding at a glance. */
export function Figure({ children, tone = C.ink }) {
  return (
    <span style={{ ...T.num, fontWeight: 600, color: tone }}>{children}</span>
  );
}
