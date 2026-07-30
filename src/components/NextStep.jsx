import { C, DIVIDER_TOP, T } from "../tokens";

/**
 * The one thing to do, and the only place it is allowed to appear.
 *
 * WHY THIS EXISTS AS A COMPONENT.
 *
 * Advice used to live in three places, in three treatments, at three depths: a
 * colour-filled callout halfway down a body zone, a bare paragraph at the
 * bottom of a nested disclosure in Signals, and a sunken box at the bottom of
 * another one in the condition estimates. Same kind of content, different shape
 * every time — which is exactly why it read as slotted in wherever there
 * happened to be room. The problem was never the box. It was that the app had
 * no rule for where "so what do I do" goes.
 *
 * THE RULES.
 *
 *  1. LAST. After the evidence, always. Advice that arrives before the reader
 *     has seen what it is based on reads as pre-written — which is what the
 *     body zones were doing, putting the callout above the marker bars.
 *  2. NO FILL, NO STATUS COLOUR. A hairline and text. In this product colour
 *     means *a value is outside its range*; spending it on a sentence borrows
 *     urgency the sentence does not own.
 *  3. ONLY FOR WHAT THE APP CANNOT DO ITSELF — book a clinic, request a named
 *     test, decide not to wait for the next round. Lifestyle suggestions do not
 *     qualify, and when there is nothing of that kind to say this renders
 *     nothing at all. A level-1 result means "nothing to do yet"; restating
 *     that as a coloured imperative manufactures urgency the data lacks, and
 *     the status badge has already said it.
 *  4. NAME THE CLINIC when there is one. That is the actual next step, and the
 *     card is already carrying the fact.
 */
export default function NextStep({ label, children, where }) {
  if (!children) return null;
  return (
    <div style={{ marginTop: 14, paddingTop: 12, boxShadow: DIVIDER_TOP }}>
      <div style={{ ...T.label, color: C.faint }}>
        {label}
        {where && (
          <span style={{ color: C.ink, marginLeft: 6 }}>· {where}</span>
        )}
      </div>
      <p
        style={{
          ...T.bodyText,
          color: C.body,
          margin: "6px 0 0",
          textWrap: "pretty",
        }}
      >
        {children}
      </p>
    </div>
  );
}
