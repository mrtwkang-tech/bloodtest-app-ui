import { C, T } from "../tokens";

/**
 * Marks the phrase in a sentence that carries it.
 *
 * WHAT THIS REPLACES. The first version left the letterforms alone and put a
 * pale gold wash BEHIND them, on the reasoning that bold Hangul at body size
 * thickens the counters and the line goes muddy. The reasoning was sound and
 * the result was still wrong: a 30%-opacity band sitting behind one clause of
 * a grey paragraph does not read as a material, it reads as a highlighter
 * stroke — which is to say as an underline. Underlining is the weakest
 * emphasis in typography. It adds a line and changes nothing about the words.
 *
 * So the words change instead, on all three channels at once:
 *
 *   WEIGHT   420 → 680, which is the weight of `title2`. The marked phrase is
 *            not "the same text, bolder"; it is set in the product's HEADING
 *            register and dropped into running prose. That is a step a reader
 *            registers before reading, which is the whole job.
 *   SIZE     14 → 15. Small enough not to disturb the column, large enough
 *            that the weight has somewhere to go.
 *   COLOUR   the glyphs become the metal, at the reading-size gradient — see
 *            `.foil-sm` for why the display gradient could not be reused.
 *
 * The muddy-counters objection was real, and the answer to it is the size
 * bump: 15px at 680 has more counter than 14px at 680, and the gold is dark
 * enough at every phase of the sweep to hold its shape against white.
 *
 * WHY GOLD DOES NOT BREAK THE COLOUR RULE. Colour in this product means a
 * value is outside its range, so a flat amber would claim a result that is not
 * there. Foil is not a flat colour. It is a MATERIAL — a highlight that moves
 * independently of the thing it is on, which no status swatch does and no
 * printed page can do at all. That is what lets it carry a second meaning
 * without being mistaken for 주의 amber.
 *
 * Text goes through `withEmphasis` so a dictionary string can carry its own
 * emphasis with *asterisks*, keeping the editorial decision next to the
 * sentence rather than in the component that happens to display it.
 */
export default function Emphasis({ children }) {
  return (
    <strong className="foil foil-sm foil-ink" style={EMPH}>
      {children}
    </strong>
  );
}

const EMPH = {
  ...T.bodyText,
  fontSize: 15,
  fontWeight: 680,
  letterSpacing: "-0.014em",
  // The parent's strut is 14 × 1.58; a 15px inline carrying its own 1.58 would
  // be taller than that and would push the one line it lands on further from
  // its neighbours than the rest of the paragraph. Collapsing this inline's
  // leading lets the parent's strut keep setting the rhythm.
  lineHeight: 1,
};

/**
 * Foil as ink at display size — the glyphs are the metal, in the brighter
 * gradient a thick stroke can afford.
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
