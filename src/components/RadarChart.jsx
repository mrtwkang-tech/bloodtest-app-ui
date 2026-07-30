import { Card, SectionLabel } from "./primitives";
import { AXES, SCALE_META } from "../data/scales";
import { C, EASE, STATUS_LAMP, T, tint } from "../tokens";
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
    <Card pad="sm" delay={delay}>
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

        {/* Peer average: an outline at 50, never a filled blob competing with you. */}
        <polygon
          points={ringPoly(50)}
          fill="none"
          stroke={C.peerStroke}
          strokeWidth="1.25"
          strokeDasharray="3 3"
        />

        {/* You. The fill was a hardcoded indigo — left behind by an accent that
            was rejected two passes ago — which meant the shape carried a hue
            belonging to nothing else on the screen. It takes the accent now, so
            there is one brand colour and it is the same everywhere. */}
        <polygon
          points={poly(values)}
          fill={tint(C.accent, 0.07)}
          stroke={C.accent}
          strokeWidth="1.75"
          strokeLinejoin="round"
          style={{ transition: `all 560ms ${EASE}` }}
        />

        {/* Vertices. Five status-coloured dots put green on three or four of
            them every round, which is the palette's one standing rule broken in
            the one place it is most visible: in range is not a colour. Only the
            axes that are asking for something are lit; the rest are ink. */}
        {values.map((v, i) => {
          const [x, y] = pt(
            AXES[i],
            (Math.max(3, Math.min(100, v)) / 100) * R_MAX,
          );
          const lit = statuses[i] !== "good";
          return (
            <circle
              key={SCALE_META[i].key}
              cx={x}
              cy={y}
              r={lit ? 3.8 : 2.8}
              fill={lit ? STATUS_LAMP[statuses[i]] : C.ink}
              stroke={C.bg}
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
