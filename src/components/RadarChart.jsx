import { Card, SectionLabel } from "./primitives";
import { AXES, SCALE_META } from "../data/scales";
import { C, EASE, STATUS_LAMP, T } from "../tokens";
import { useT } from "../i18n";

const CX = 150;
const CY = 112;
const R_MAX = 76;
const RINGS = [20, 40, 60, 80, 100];

const rad = (deg) => (deg * Math.PI) / 180;
const pt = (angle, r) => [
  CX + Math.cos(rad(angle)) * r,
  CY + Math.sin(rad(angle)) * r,
];
const poly = (values, scale = 1) =>
  values
    .map((v, i) =>
      pt(AXES[i], (Math.max(3, Math.min(100, v)) / 100) * R_MAX * scale),
    )
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

const ringPoly = (v) =>
  AXES.map((a) => pt(a, (v / 100) * R_MAX))
    .map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`)
    .join(" ");

/**
 * Percentile radar.
 *
 * Plotting score/max would not be comparable across instruments — MBI 28/60
 * and PHQ-9 4/27 look wildly different while both sit near the 30th
 * percentile. On a percentile radar every axis means the same thing, the peer
 * average is a regular pentagon at 50, and distance from centre is readable.
 *
 * The graduated rings, spokes and per-axis readouts are what turn it from a
 * decorative blob into something you can actually take a measurement off.
 */
export default function RadarChart({ values, statuses, delay = 40 }) {
  const t = useT();

  return (
    <Card style={{ padding: "15px 14px 12px" }} delay={delay}>
      <SectionLabel value={`${t("mind.me")} · ${t("mind.peer")}`}>
        {t("mind.index")}
      </SectionLabel>

      <svg
        width="100%"
        viewBox="0 0 300 244"
        role="img"
        style={{ display: "block", marginTop: 6 }}
        aria-label={SCALE_META.map(
          (m, i) => `${t(m.axisKey)} ${values[i]}`,
        ).join(", ")}
      >
        {/* Graduated rings — the scale you read the polygon against. */}
        {RINGS.map((v) => (
          <polygon
            key={v}
            points={ringPoly(v)}
            fill="none"
            stroke={v === 100 ? C.hairlineStrong : C.hairline}
            strokeWidth="1"
          />
        ))}

        {/* Spokes, so each vertex has a line to sit on. */}
        {AXES.map((a, i) => {
          const [x, y] = pt(a, R_MAX);
          return (
            <line
              key={i}
              x1={CX}
              y1={CY}
              x2={x}
              y2={y}
              stroke={C.hairline}
              strokeWidth="1"
            />
          );
        })}

        {/* Ring values, printed once up the top spoke. */}
        {RINGS.slice(0, 4).map((v) => (
          <text
            key={v}
            x={CX - 6}
            y={CY - (v / 100) * R_MAX + 3}
            textAnchor="end"
            style={{ ...T.micro, fontSize: 7.5, letterSpacing: "0.04em" }}
            fill={C.faintest}
          >
            {v}
          </text>
        ))}

        {/* Peer average: an outline at 50, never a filled blob competing with you. */}
        <polygon
          points={ringPoly(50)}
          fill="none"
          stroke={C.peerStroke}
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />

        {/* You. */}
        <polygon
          points={poly(values)}
          fill="rgba(67,56,202,.10)"
          stroke={C.accent}
          strokeWidth="1.75"
          strokeLinejoin="round"
          style={{ transition: `all 560ms ${EASE}` }}
        />

        {/* Vertices, coloured by that scale's own status. */}
        {values.map((v, i) => {
          const [x, y] = pt(
            AXES[i],
            (Math.max(3, Math.min(100, v)) / 100) * R_MAX,
          );
          return (
            <circle
              key={SCALE_META[i].key}
              cx={x}
              cy={y}
              r="3.4"
              fill={STATUS_LAMP[statuses[i]]}
              stroke={C.surface}
              strokeWidth="1.6"
              style={{ transition: `all 560ms ${EASE}` }}
            />
          );
        })}

        {/* Axis readouts: name above, measured percentile below. */}
        {SCALE_META.map((m, i) => {
          const a = AXES[i];
          const [lx, ly] = pt(a, R_MAX + 22);
          const cos = Math.cos(rad(a));
          const anchor =
            Math.abs(cos) < 0.3 ? "middle" : cos > 0 ? "start" : "end";
          const top = Math.sin(rad(a)) < -0.5;
          const baseY = top ? ly - 4 : ly + 2;
          return (
            <g key={m.key}>
              <text
                x={lx}
                y={baseY}
                textAnchor={anchor}
                style={{ ...T.micro, fontSize: 9, letterSpacing: "0.05em" }}
                fill={C.muted}
              >
                {t(m.axisKey)}
              </text>
              <text
                x={lx}
                y={baseY + 13}
                textAnchor={anchor}
                style={{ ...T.num, fontSize: 12.5, fontWeight: 600 }}
                fill={C.ink}
              >
                {values[i]}
              </text>
            </g>
          );
        })}
      </svg>

      <div
        style={{
          ...T.caption,
          color: C.faint,
          textAlign: "center",
          paddingTop: 10,
          marginTop: 2,
          boxShadow: `inset 0 1px 0 ${C.hairline}`,
        }}
      >
        {t("mind.radarCaption")}
      </div>
    </Card>
  );
}
