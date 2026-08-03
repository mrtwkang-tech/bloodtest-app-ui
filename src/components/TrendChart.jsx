import Pressable from "./Pressable";
import { Card } from "./primitives";
import { C, EASE, R, T } from "../tokens";
import { computeTrend } from "../lib/trend";
import { useT } from "../i18n";

/**
 * Round-over-round chart, shared by mind and body.
 *
 * Value labels sit in an HTML row under the plot rather than inside the SVG:
 * they are the part people read, and they need to stay selectable and to
 * scale with the user's text-size setting.
 */
export default function TrendChart({
  title,
  unit,
  series,
  labels,
  reference,
  referenceLabel,
  sel,
  color,
  options,
  selectedOption,
  onPickOption,
  formatValue = (v) => String(v),
  // Which way is good. Body markers are almost all harmful-when-high, so
  // falling is improving and that was hardcoded here. Mind plots a SCORE,
  // where the arrow points the other way — and a chart that labels a rising
  // score "감소 · 개선" is worse than one that says nothing.
  higherIsBetter = false,
  // The marker this series belongs to, when there is one. Carries `rcv` and
  // `dp`, which is all `computeTrend` needs to tell a move from a wobble. Mind
  // plots a composite score, has no marker, and is deliberately left ungated.
  marker,
  delay = 0,
}) {
  const t = useT();
  const tr = computeTrend({ series, reference, selIndex: sel, marker });
  const better = higherIsBetter ? tr.diff > 0 : tr.diff < 0;

  // A change too small to be real is not good news or bad news, so it does not
  // get a colour. This is the same rule the status palette follows everywhere
  // else: in range is not a colour, and neither is "we cannot tell".
  const deltaColor = !tr.moved ? C.faint : better ? C.optimal : C.watch;
  const delta = tr.isFirst
    ? t("trend.first")
    : tr.diff === 0
      ? t("trend.same")
      : !tr.moved
        ? t("trend.flat")
        : tr.diff < 0
          ? t(better ? "trend.downGood" : "trend.down", { p: tr.pctChange })
          : t(better ? "trend.upGood" : "trend.up", { p: tr.pctChange });

  // TWO INDEPENDENT CLAIMS, and they used to be one. The trend line only fired
  // when the month was ALSO flat, and then opened by repeating that — "이번 달은
  // 변화 없음 · 12회차 추세는 상승" under a caption 20px above already reading
  // "의미 있는 변화 아님". Whether the month moved and whether the run is going
  // somewhere are different questions with different tests; the delta caption
  // answers the first, this line answers the second, and neither needs to state
  // the other's answer.
  const prev = tr.isFirst ? null : series[tr.selX - 1];
  const flatNote =
    tr.trending !== 0
      ? t(tr.trending > 0 ? "trend.rising" : "trend.falling", { n: tr.rounds })
      : !tr.moved && prev > 0 && marker?.rcv
        ? t("trend.flatNote", {
            lo: formatValue(prev / marker.rcv),
            hi: formatValue(prev * marker.rcv),
          })
        : null;

  return (
    <Card pad="md" delay={delay}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <span style={{ ...T.title3, color: C.ink }}>
          {title}{" "}
          {unit ? (
            <span style={{ ...T.unit, color: C.faintest }}>{unit}</span>
          ) : null}
        </span>
        <span style={{ ...T.micro, color: deltaColor, whiteSpace: "nowrap" }}>
          {delta}
        </span>
      </div>

      {/* Under the title rather than beside the delta: it is a sentence about
          the whole series, not a second reading of this month. */}
      {flatNote && (
        <div style={{ ...T.caption, color: C.body, marginTop: 4 }}>
          {flatNote}
        </div>
      )}

      <div
        style={{ display: "flex", alignItems: "center", gap: 7, marginTop: 7 }}
      >
        <span
          style={{ width: 13, borderTop: `1px dashed ${C.hairlineStrong}` }}
        />
        <span style={{ ...T.micro, color: C.faint }}>
          {referenceLabel} {formatValue(reference)}
        </span>
      </div>

      <svg
        width="100%"
        height="84"
        viewBox="0 0 246 84"
        style={{ marginTop: 9 }}
        aria-hidden="true"
      >
        <line
          x1="4"
          y1={tr.refY}
          x2="242"
          y2={tr.refY}
          stroke={C.hairlineStrong}
          strokeWidth="1"
          strokeDasharray="3 3"
        />
        <polyline
          points={tr.xs.map((x, i) => `${x},${tr.ys[i]}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: `stroke 300ms ${EASE}` }}
        />
        {series.map((v, i) => (
          <circle
            key={labels[i]}
            cx={tr.xs[i]}
            cy={tr.ys[i]}
            r={tr.selX === i ? 4.4 : 2.8}
            fill={color}
            stroke={C.surface}
            strokeWidth="1.8"
          />
        ))}
      </svg>

      {/* Twelve monthly draws will not fit twelve values and twelve labels
          across 340px — at that density the numbers collide and the labels
          wrap mid-word. Past eight points only the selected round and the two
          ends are named, and every other value is printed. The line already
          carries the shape; this row exists to anchor it. */}
      <div style={{ display: "flex", marginTop: 5 }}>
        {series.map((v, i) => {
          const dense = series.length > 8;
          const showValue =
            !dense ||
            i === tr.selX ||
            i === 0 ||
            i === series.length - 1 ||
            i % 2 === 1;
          const showLabel =
            !dense || i === tr.selX || i === 0 || i === series.length - 1;
          return (
            <div
              key={labels[i]}
              style={{ flex: 1, textAlign: "center", minWidth: 0 }}
            >
              <div
                style={{
                  ...T.num,
                  fontSize: dense ? 11 : 13,
                  fontWeight: 600,
                  color: tr.selX === i ? C.ink : C.faintest,
                  opacity: showValue ? 1 : 0,
                }}
              >
                {formatValue(v)}
              </div>
              <div
                style={{
                  ...T.micro,
                  color: C.faintest,
                  marginTop: 2,
                  whiteSpace: "nowrap",
                  opacity: showLabel ? 1 : 0,
                }}
              >
                {labels[i]}
              </div>
            </div>
          );
        })}
      </div>

      {options && (
        <div
          style={{
            display: "flex",
            gap: 5,
            marginTop: 13,
            paddingTop: 13,
            boxShadow: `inset 0 1px 0 ${C.hairline}`,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {options.map((opt, i) => (
            <Pressable
              key={opt.key}
              as="button"
              type="button"
              aria-pressed={selectedOption === i}
              onClick={() => onPickOption(i)}
              pressScale={0.95}
              style={{
                flex: "none",
                padding: "6px 10px",
                borderRadius: R.control,
                cursor: "pointer",
                whiteSpace: "nowrap",
                background: selectedOption === i ? C.accent : C.surfaceSunken,
                color: selectedOption === i ? C.onAccent : C.muted,
                border: "none",
                ...T.micro,
              }}
            >
              {opt.label}
            </Pressable>
          ))}
        </div>
      )}
    </Card>
  );
}
