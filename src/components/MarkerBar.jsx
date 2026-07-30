import { C, LEVEL_COLOR, T } from "../tokens";
import {
  deviationOf,
  formatValue,
  markerBand,
  markerLeft,
  markerLevel,
} from "../data/body";
import { plainKeyOf } from "../data/plainNames";
import { useT } from "../i18n";

/**
 * One biomarker, read as distance from its limit rather than as a raw value.
 *
 * "33.2 μmol/mmol" asks the reader to know that the limit is 30 and to do the
 * subtraction, and it cannot be compared to the "178 10³/μL" two rows down. A
 * proportion of the limit is unitless, so every marker in the panel is suddenly
 * on one scale — which is the whole reason this is the headline number now and
 * the assay value sits underneath with the name.
 *
 * The copy deliberately never says "높음" or "낮음". For a `dir: "low"` marker
 * the reference is a floor, so eGFR at 98.7 against a limit of 90 is 9% of
 * headroom while being numerically higher. Safe-side versus past-the-limit is
 * the only framing that survives both directions.
 */
export default function MarkerBar({ marker, value }) {
  const t = useT();
  const level = markerLevel(marker, value);
  const plain = plainKeyOf(marker);
  const dev = deviationOf(marker, value);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          gap: 10,
        }}
      >
        <span style={{ minWidth: 0 }}>
          <span style={{ ...T.label, color: C.ink, display: "block" }}>
            {plain ? t(plain) : marker.name}
          </span>
          <span
            style={{
              ...T.micro,
              color: C.faintest,
              display: "block",
              marginTop: 2,
            }}
          >
            {plain ? `${marker.name} · ` : ""}
            {formatValue(value, marker.dp)}
            {marker.unit ? ` ${marker.unit}` : ""}
          </span>
        </span>
        <span
          style={{
            ...T.label,
            fontWeight: 600,
            color: LEVEL_COLOR[level],
            flex: "none",
            textAlign: "right",
          }}
        >
          {dev.pct === 0
            ? t("body.dev.at")
            : t(dev.over ? "body.dev.over" : "body.dev.under", {
                pct: dev.pct,
              })}
        </span>
      </div>
      {/* Same grammar as the mind scale: the band, where the limit is, and
          where you are. The separate reference tick sat one pixel from the
          colour change it was already marking. */}
      <div
        style={{
          position: "relative",
          height: 5,
          borderRadius: 2,
          background: markerBand(marker),
          margin: "9px 0 5px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -3.5,
            left: markerLeft(value, marker.max),
            width: 3,
            height: 12,
            marginLeft: -1.5,
            borderRadius: 1.5,
            background: C.ink,
            boxShadow: `0 0 0 2px ${C.bg}`,
          }}
        />
      </div>
      <div style={{ ...T.caption, color: C.faintest }}>
        {t(marker.dir === "low" ? "body.referenceMin" : "body.reference", {
          v: formatValue(marker.ref, marker.dp),
        })}
      </div>
    </div>
  );
}
