import { C, T, tint } from "../tokens";

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
 * ACHROMATIC ON PURPOSE. Colour in this product means a value is outside its
 * range; a highlighter in amber would claim a result that is not there. This
 * is ink at seven percent, which reads as a mark made by a person rather than
 * as a status.
 *
 * Text goes through `render` so a dictionary string can carry its own emphasis
 * with *asterisks*, keeping the editorial decision next to the sentence rather
 * than in the component that happens to display it.
 */
export default function Emphasis({ children, tone = C.ink }) {
  return (
    <span
      style={{
        background: tint(C.ink, 0.07),
        color: tone,
        borderRadius: 3,
        padding: "1px 4px",
        margin: "0 -1px",
        boxDecorationBreak: "clone",
        WebkitBoxDecorationBreak: "clone",
      }}
    >
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
