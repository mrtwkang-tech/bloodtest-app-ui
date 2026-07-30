import { Card } from "./primitives";
import { C, EASE, R, STATUS_COLOR, T } from "../tokens";
import { burnoutBand } from "../data/scales";
import { useT } from "../i18n";

// Where the peer average and the screening threshold fall on a percentile axis.
const AVG_AT = 50;
const WATCH_AT = 80;

/**
 * One scale: the raw score, its position in the peer distribution, and what
 * that position means.
 *
 * The percentile is computed from the score, so the number and the marker can
 * never disagree.
 */
export default function ScaleCard({ meta, score, status, percentile }) {
  const t = useT();
  const color = STATUS_COLOR[status];
  const scoreText =
    meta.key === "burnout" ? t(`burnout.${burnoutBand(score)}`) : `${score}`;

  return (
    <Card style={{ padding: "14px 16px 13px" }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ ...T.title3, color: C.ink }}>
          {t(`scale.${meta.key}`)}
        </span>
        <span style={{ ...T.micro, color: C.faintest }}>{meta.code}</span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          marginTop: 9,
        }}
      >
        <span
          style={{
            ...T.num,
            fontSize: 27,
            fontWeight: 600,
            color: C.ink,
            lineHeight: 1,
          }}
        >
          {scoreText}
        </span>
        <span style={{ ...T.monoSm, color, paddingBottom: 2 }}>
          {t(`status.${status}`)}
        </span>
        <span
          style={{ marginLeft: "auto", textAlign: "right", paddingBottom: 1 }}
        >
          <span
            style={{ ...T.num, fontSize: 15, fontWeight: 600, color: C.ink }}
          >
            {percentile}
          </span>
          <span style={{ ...T.micro, color: C.faintest, marginLeft: 4 }}>
            {t("mind.pct")}
          </span>
        </span>
      </div>

      <Ruler percentile={percentile} color={color} />

      <div style={{ ...T.monoSm, color: C.faint, marginTop: 9 }}>
        {t("mind.peerAvg")} {meta.avg} · {t("mind.percentileSentence", { p: percentile })}
      </div>

      <p
        style={{
          ...T.monoSm,
          color: C.muted,
          margin: "11px 0 0",
          paddingTop: 10,
          boxShadow: `inset 0 1px 0 ${C.hairline}`,
          textWrap: "pretty",
        }}
      >
        {t(`scale.${meta.key}.base`)} {t(`status.line.${status}`)}
      </p>
    </Card>
  );
}

/**
 * A measured axis rather than a decorative gradient.
 *
 * The bar fills to the percentile so length carries the value, the two
 * reference points that matter (peer average, screening threshold) are marked
 * on the axis itself, and the ticks below let you read a position off it
 * instead of estimating one.
 */
function Ruler({ percentile, color }) {
  return (
    <div style={{ marginTop: 13 }}>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 2,
          background: C.surfaceSunken,
          overflow: "visible",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: `${percentile}%`,
            background: color,
            borderRadius: 2,
            transition: `width 520ms ${EASE}, background 240ms ${EASE}`,
          }}
        />

        {/* Reference marks sit on the axis, labelled below. */}
        <Mark at={AVG_AT} strong />
        <Mark at={WATCH_AT} />

        {/* The reading. */}
        <div
          style={{
            position: "absolute",
            top: -3,
            left: `${percentile}%`,
            width: 3,
            height: 12,
            marginLeft: -1.5,
            borderRadius: 1.5,
            background: C.ink,
            boxShadow: `0 0 0 2px ${C.surface}`,
            transition: `left 520ms ${EASE}`,
          }}
        />
      </div>

      {/* Ruler: a tick every 10, taller at the quarters. */}
      <div style={{ position: "relative", height: 6, marginTop: 3 }}>
        {Array.from({ length: 11 }, (_, i) => i * 10).map((v) => (
          <span
            key={v}
            style={{
              position: "absolute",
              left: `${v}%`,
              top: 0,
              width: 1,
              height: v % 25 === 0 || v === 100 ? 5 : 3,
              background: v % 50 === 0 ? C.hairlineStrong : C.hairline,
            }}
          />
        ))}
      </div>

      <div style={{ position: "relative", height: 12, marginTop: 1 }}>
        <Tick at={0} align="start" label="0" />
        <Tick at={AVG_AT} align="middle" label="50" muted={false} />
        <Tick at={100} align="end" label="100" />
      </div>
    </div>
  );
}

function Mark({ at, strong }) {
  return (
    <span
      style={{
        position: "absolute",
        top: -2,
        left: `${at}%`,
        width: 1,
        height: 10,
        background: strong ? "rgba(23,24,26,.42)" : C.hairlineStrong,
      }}
    />
  );
}

function Tick({ at, align, label, muted = true }) {
  const transform =
    align === "start"
      ? "none"
      : align === "end"
        ? "translateX(-100%)"
        : "translateX(-50%)";
  return (
    <span
      style={{
        position: "absolute",
        left: `${at}%`,
        transform,
        ...T.micro,
        fontSize: 9,
        color: muted ? C.faintest : C.faint,
      }}
    >
      {label}
    </span>
  );
}
