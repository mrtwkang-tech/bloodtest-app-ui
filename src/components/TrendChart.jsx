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
  delay = 0,
}) {
  const t = useT();
  const tr = computeTrend({ series, reference, selIndex: sel });
  const deltaColor = tr.isFirst ? C.faint : tr.diff <= 0 ? C.optimal : C.watch;
  const delta = tr.isFirst
    ? t("trend.first")
    : tr.diff === 0
      ? t("trend.same")
      : tr.diff < 0
        ? t("trend.down", { p: tr.pctChange })
        : t("trend.up", { p: tr.pctChange });

  return (
    <Card style={{ padding: "16px 17px 15px" }} delay={delay}>
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

      <div style={{ display: "flex", marginTop: 5 }}>
        {series.map((v, i) => (
          <div key={labels[i]} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                ...T.num,
                fontSize: 13,
                fontWeight: 600,
                color: tr.selX === i ? C.ink : C.faintest,
              }}
            >
              {formatValue(v)}
            </div>
            <div style={{ ...T.micro, color: C.faintest, marginTop: 2 }}>
              {labels[i]}
            </div>
          </div>
        ))}
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
