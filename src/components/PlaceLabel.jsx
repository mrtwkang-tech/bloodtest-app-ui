import { C, LEVEL_LAMP, T, fadeUp } from "../tokens";
import { useT } from "../i18n";

/**
 * What is lit, and where it is — pinned to the top right of a diagram.
 *
 * The rows below a diagram already name the thing and give its state, so a
 * label that only repeated the name would be decoration. What the rows cannot
 * say, and a diagram can, is WHERE — and "where" is exactly the question a
 * reader has when a shape somewhere inside a translucent body starts glowing.
 * A kidney lighting up behind the waist is unrecognisable at 340px unless
 * something says "the small of your back", and then it is obvious.
 *
 * ON THE MIND TAB THE ANATOMY GOES ONE LAYER DOWN. `where` is the plain
 * sentence — "the switch at the top of the stress axis" — and `anatomy` is the
 * name of the structure under it, smaller. The product deliberately strips the
 * anatomy out of its reader-facing marker names (sgACC is "기분 회로 활동"),
 * and putting "무릎밑 앞띠다발피질" in the same weight as everything else would
 * undo that in the one place a reader is most likely to over-read it. It is
 * still shown, because a diagram that draws a structure and refuses to name it
 * is worse than one that names it quietly.
 *
 * Top right rather than over the figure: the whole point of opening a row in
 * place was that nothing should cover the picture. Right-aligned and capped in
 * width so the text grows away from it, never across it.
 *
 * BOTH OF THOSE PREMISES ASSUME A CENTRED FIGURE — 11% of the canvas wide,
 * both top corners empty. A picture that fills its canvas has no free corner to
 * pin to, and no amount of capping or scrimming fixes that: a backdrop wide
 * enough to carry four lines covers a quarter of the drawing. The day dial is
 * such a picture, and it is also not a map of a place, so `MindTab` does not
 * give it one of these. Anything added here that fills a corner should make the
 * same call rather than reach for a plate.
 */
export default function PlaceLabel({
  name,
  level = 0,
  score,
  percentile,
  where,
  anatomy,
}) {
  const t = useT();
  if (!name) return null;

  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 14,
        // A centred head is about 11% of the canvas wide, so it occupies
        // 44–56%. Anything wider than 44% here runs into it — which is what
        // happened as soon as the label grew a third line.
        maxWidth: "44%",
        textAlign: "right",
        pointerEvents: "none",
        ...fadeUp(0),
      }}
    >
      {/* Name and score on one line, because both are short and because the
          score belongs to the name rather than to the sentence under it.
          Everything wraps: the widest line here sits at the height of the
          skull, and an unwrapped flex row would overflow the cap and run
          across the face. */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "0 7px",
        }}
      >
        {level > 0 && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flex: "none",
              alignSelf: "center",
              background: LEVEL_LAMP[level],
            }}
          />
        )}
        <span style={{ ...T.label, color: C.ink }}>{name}</span>
        {score != null && (
          <span style={{ ...T.num, fontSize: 14.5, color: C.ink }}>
            {t("body.score", { n: score })}
          </span>
        )}
      </div>

      {percentile != null && (
        <div
          style={{
            ...T.caption,
            color: C.faint,
            marginTop: 2,
            textWrap: "pretty",
          }}
        >
          {t("body.scoreVsPeers", { pct: percentile })}
        </div>
      )}

      {where && (
        <div
          style={{
            ...T.caption,
            color: C.faintest,
            marginTop: 2,
            textWrap: "pretty",
          }}
        >
          {where}
        </div>
      )}

      {anatomy && (
        <div
          style={{
            ...T.micro,
            color: C.faintest,
            marginTop: 3,
            textWrap: "pretty",
          }}
        >
          {anatomy}
        </div>
      )}
    </div>
  );
}
