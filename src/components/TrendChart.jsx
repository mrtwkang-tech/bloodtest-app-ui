import Pressable from "./Pressable";
import { Card } from "./primitives";
import { C, EASE, T } from "../tokens";
import { computeTrend } from "../lib/trend";
import { useT } from "../i18n";

/**
 * Round-over-round chart, shared by mind and body.
 *
 * Value labels sit in an HTML row under the plot rather than inside the SVG:
 * they are the part people read, and they need to be selectable and to scale
 * with the user's text-size setting.
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
    <Card style={{ padding: "18px 18px 16px" }} delay={delay}>
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
            <span style={{ ...T.micro, color: C.faintest }}>{unit}</span>
          ) : null}
        </span>
        <span style={{ ...T.micro, color: deltaColor, whiteSpace: "nowrap" }}>
          {delta}
        </span>
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 6 }}
      >
        <span style={{ width: 14, borderTop: `1px dashed ${C.disabled}` }} />
        <span style={{ ...T.micro, color: C.faint }}>
          {referenceLabel} {formatValue(reference)}
        </span>
      </div>

      <svg
        width="100%"
        height="86"
        viewBox="0 0 246 86"
        style={{ marginTop: 10 }}
        aria-hidden="true"
      >
        <line
          x1="6"
          y1={tr.refY}
          x2="240"
          y2={tr.refY}
          stroke={C.hairlineStrong}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <polyline
          points={tr.xs.map((x, i) => `${x},${tr.ys[i]}`).join(" ")}
          fill="none"
          stroke={color}
          strokeWidth="2.25"
          strokeLinejoin="round"
          strokeLinecap="round"
          style={{ transition: `stroke 320ms ${EASE}` }}
        />
        {series.map((v, i) => (
          <circle
            key={labels[i]}
            cx={tr.xs[i]}
            cy={tr.ys[i]}
            r={tr.selX === i ? 5 : 3.2}
            fill={color}
            stroke="#fff"
            strokeWidth="2"
          />
        ))}
      </svg>

      <div style={{ display: "flex", marginTop: 6 }}>
        {series.map((v, i) => (
          <div key={labels[i]} style={{ flex: 1, textAlign: "center" }}>
            <div
              style={{
                ...T.callout,
                ...T.mono,
                color: tr.selX === i ? C.ink : C.faintest,
              }}
            >
              {formatValue(v)}
            </div>
            <div style={{ ...T.micro, color: C.faintest, marginTop: 1 }}>
              {labels[i]}
            </div>
          </div>
        ))}
      </div>

      {options && (
        <div
          style={{
            display: "flex",
            gap: 6,
            marginTop: 14,
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
              pressScale={0.94}
              style={{
                flex: "none",
                padding: "8px 12px",
                borderRadius: 999,
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
