import { Card } from "./primitives";
import { C, EASE, T } from "../tokens";
import { SCALE_META, radarPoints } from "../data/scales";
import { useT } from "../i18n";

// Axis label anchors, just outside the outer ring in viewBox units.
const LABEL_POS = [
  { x: 100, y: 12 },
  { x: 188, y: 74 },
  { x: 155, y: 185 },
  { x: 45, y: 185 },
  { x: 12, y: 74 },
];

const PEER = radarPoints([50, 50, 50, 50, 50]);
const RING_75 = radarPoints([75, 75, 75, 75, 75]);
const RING_25 = radarPoints([25, 25, 25, 25, 25]);

/**
 * Percentile radar.
 *
 * Plotting score/max instead would not be comparable across instruments — MBI
 * 28/60 and PHQ-9 4/27 look wildly different while both sit near the 30th
 * percentile. On a percentile radar every axis means the same thing and the
 * peer average is a regular pentagon at 50.
 */
export default function RadarChart({ percentiles, delay = 40 }) {
  const t = useT();
  const mine = radarPoints(percentiles);

  return (
    <Card style={{ padding: "16px 14px 12px" }} delay={delay}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          justifyContent: "center",
          ...T.micro,
          color: C.muted,
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: 9,
              height: 9,
              borderRadius: 3,
              background: C.accent,
            }}
          />
          {t("mind.me")}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{ width: 9, height: 9, borderRadius: 3, background: C.peer }}
          />
          {t("mind.peer")}
        </span>
      </div>

      <svg
        width="100%"
        height="208"
        viewBox="0 0 200 200"
        role="img"
        aria-label={SCALE_META.map(
          (m, i) => `${t(`scale.${m.key}`)} ${percentiles[i]}`,
        ).join(", ")}
      >
        <polygon
          points={RING_75}
          fill="none"
          stroke={C.hairline}
          strokeWidth="1"
        />
        <polygon
          points={RING_25}
          fill="none"
          stroke={C.hairline}
          strokeWidth="1"
        />
        <polygon
          points={PEER}
          fill="rgba(213,216,221,.55)"
          stroke={C.peerStroke}
          strokeWidth="1.25"
        />
        <polygon
          points={mine}
          fill="rgba(11,11,12,.12)"
          stroke={C.accent}
          strokeWidth="2"
          strokeLinejoin="round"
          style={{ transition: `all 520ms ${EASE}` }}
        />
        {SCALE_META.map((m, i) => (
          <text
            key={m.key}
            x={LABEL_POS[i].x}
            y={LABEL_POS[i].y}
            textAnchor="middle"
            fontSize="9.5"
            fontWeight="600"
            fill={C.muted}
          >
            {t(`scale.${m.key}`)}
          </text>
        ))}
      </svg>

      {/* Numbers live outside the SVG so they stay selectable and scale with text size. */}
      <div style={{ display: "flex", marginTop: 2 }}>
        {SCALE_META.map((m, i) => (
          <div
            key={m.key}
            style={{ flex: 1, textAlign: "center", minWidth: 0 }}
          >
            <div style={{ ...T.callout, ...T.mono, color: C.ink }}>
              {percentiles[i]}
            </div>
            <div
              style={{
                ...T.micro,
                color: C.faintest,
                marginTop: 1,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {t(`scale.${m.key}`)}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          textAlign: "center",
          ...T.micro,
          color: C.faint,
          marginTop: 10,
        }}
      >
        {t("mind.radarCaption")}
      </div>
    </Card>
  );
}
