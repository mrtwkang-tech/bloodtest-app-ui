import { Card } from "./primitives";
import { C, DIVIDER_TOP, EASE, STATUS_COLOR, T } from "../tokens";
import { burnoutBand } from "../data/scales";
import { useT } from "../i18n";

/**
 * One scale: raw score, where it lands on the peer distribution, and what
 * that means. The percentile is computed from the score, so the two can never
 * disagree on screen.
 */
export default function ScaleCard({ meta, score, status, percentile }) {
  const t = useT();
  const scoreText =
    meta.key === "burnout" ? t(`burnout.${burnoutBand(score)}`) : `${score}`;

  return (
    <Card style={{ padding: "15px 17px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ ...T.title3, color: C.ink }}>
          {t(`scale.${meta.key}`)}{" "}
          <span style={{ ...T.micro, color: C.faintest }}>{meta.code}</span>
        </span>
        <span style={{ ...T.callout, ...T.mono, color: STATUS_COLOR[status] }}>
          {scoreText} · {t(`status.${status}`)}
        </span>
      </div>

      {/* Percentile strip: the whole bar is the peer population, 0 to 100. */}
      <div style={{ marginTop: 14 }}>
        <div
          style={{
            position: "relative",
            height: 6,
            borderRadius: 999,
            background: `linear-gradient(90deg,${C.optimal} 0 50%,${C.watch} 50% 80%,${C.alert} 80% 100%)`,
          }}
        >
          {/* The peer average sits at the 50th percentile by definition. */}
          <div
            style={{
              position: "absolute",
              top: -2,
              left: "50%",
              width: 1.5,
              height: 10,
              background: "rgba(11,11,12,.45)",
            }}
          />
          <div
            style={{
              position: "absolute",
              top: -4,
              left: `${percentile}%`,
              width: 4,
              height: 14,
              borderRadius: 999,
              background: C.ink,
              transform: "translateX(-2px)",
              boxShadow: "0 0 0 2px #fff",
              transition: `left 420ms ${EASE}`,
            }}
            aria-label={`${t("mind.percentile")} ${percentile}`}
          />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            ...T.micro,
            color: C.faintest,
            marginTop: 4,
          }}
        >
          <span>0</span>
          <span>50</span>
          <span>100</span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginTop: 6,
        }}
      >
        <span style={{ ...T.micro, color: C.faint }}>
          {t("mind.peerAvg")} {meta.avg} · {t("mind.yourScore")} {score}
        </span>
        <span style={{ ...T.micro, ...T.mono, color: STATUS_COLOR[status] }}>
          {t("mind.percentile")} {percentile}
        </span>
      </div>

      <div style={{ ...T.caption, color: C.muted, marginTop: 4 }}>
        {t("mind.percentileSentence", { p: percentile })}
      </div>

      <p
        style={{
          ...T.caption,
          color: C.muted,
          margin: "10px 0 0",
          paddingTop: 10,
          boxShadow: DIVIDER_TOP,
          textWrap: "pretty",
        }}
      >
        {t(`scale.${meta.key}.base`)} {t(`status.line.${status}`)}
      </p>
    </Card>
  );
}
