import { useCallback, useState } from "react";
import BodyScene from "../three/BodyScene";
import Masthead from "../components/Masthead";
import Pressable from "../components/Pressable";
import TrendChart from "../components/TrendChart";
import PanelRow from "../components/PanelRow";
import PlaceLabel from "../components/PlaceLabel";
import { Card, Caret, SectionTitle } from "../components/primitives";
import { C, LEVEL_COLOR, T, fadeUp } from "../tokens";
import {
  BODY_STATUS_KEY,
  formatValue,
  markerLevel,
  systemScore,
} from "../data/body";
import { systemPercentile } from "../data/cohorts";
import {
  BODY_METRICS,
  SESSIONS,
  bodySeries,
  bodySummary,
  healthScore,
} from "../data/sessions";
import { plainKeyOf } from "../data/plainNames";
import ZoneDetail, { zoneSummaryLine } from "./ZoneDetail";
import { useLang } from "../i18n";

/**
 * The body screen: the figure, then one row per system.
 *
 * WHAT THIS REPLACES, and why it is now the same shape as the mind screen.
 *
 * There used to be three renderings of the same ten systems stacked down one
 * page — a horizontally-scrolling chip rail, the lit organs in the figure, and
 * a two-column icon legend — followed by a ~300px essay for each flagged
 * system. Four of those essays made the screen 3,400px long, and the systems
 * that were clear appeared only as icons, so the ten never scanned as ten of
 * the same thing.
 *
 * The mind screen had solved half of this already: one row per axis, identical
 * height. The rows subsume both the chip rail and the legend — they are that
 * list, with the state written out instead of encoded in an icon's tint.
 *
 * The other half is where the detail goes, and here Body must NOT copy Mind.
 * Mind puts it in a sheet, which is right there because a mind scale has no
 * picture to stay next to. Body does: the figure is the thing that says WHERE
 * the liver is, and a sheet slides up over it at exactly the moment you asked
 * about the liver. So it opens in place, one row at a time, and opening a row
 * lights that organ above — the row and the body are the same object, and the
 * screen should be able to say so without covering one with the other.
 *
 * Tapping a row and tapping an organ do the same thing.
 */
export default function BodyTab({ sel, onPickSession, onOpenComposition }) {
  const { t } = useLang();
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(0);

  const session = SESSIONS[sel];
  const summary = bodySummary(session);

  // How the figure carries itself. Mapped from the same health score the home
  // screen shows, over the range where the score actually varies — 40 to 85 —
  // because normalising 0–100 would leave every real result in the middle and
  // the posture would never change.
  const vitality = Math.max(0, Math.min(1, (healthScore(session) - 40) / 45));

  // One row open at a time, and opening it lights the organ above. The row
  // and the figure are the same object; the screen should say so.
  const openZone = useCallback((key) => {
    setActive((cur) => (cur === key ? null : key));
  }, []);

  const activeZone = summary.zones.find((z) => z.zone.key === active) ?? null;
  const activeScore = activeZone
    ? systemScore(activeZone.zone, activeZone.values)
    : null;

  const pickMetric = BODY_METRICS[metric];
  // The trend chart picker listed assay names too — the same wall, in a control.
  const plainName = (mk) => {
    const k = plainKeyOf(mk);
    return k ? t(k) : mk.name;
  };
  const series = bodySeries(pickMetric.zone, pickMetric.mi);
  const rounds = [...SESSIONS].reverse();
  const currentValue = series[series.length - 1 - sel];

  return (
    <div>
      <Masthead
        title={t("body.title")}
        sel={sel}
        onPickSession={onPickSession}
      />

      <Card
        variant="group"
        style={{ padding: "4px 0 11px", overflow: "hidden" }}
        delay={40}
      >
        <div style={{ position: "relative" }}>
          <BodyScene
            zones={summary.zones}
            activeZone={active}
            onPickZone={openZone}
            vitality={vitality}
            height={340}
          />
          {/* Keyed on the selection so switching systems replays the fade
              rather than swapping the words under a static label. */}
          {activeZone && (
            <PlaceLabel
              key={active}
              name={t(activeZone.zone.nameKey)}
              level={activeZone.level}
              score={activeScore}
              percentile={systemPercentile(
                activeScore,
                activeZone.zone.markers.length,
              )}
              where={t(`where.${activeZone.zone.key}`)}
            />
          )}
        </div>
        <div
          style={{
            ...T.caption,
            color: C.faintest,
            textAlign: "center",
            padding: "0 18px",
          }}
        >
          {summary.flagged.length === 0
            ? t("body.allInRange")
            : t("body.tapOrgan")}
        </div>
      </Card>

      <SectionTitle value={`${summary.okConditions}/${summary.total}`}>
        {t("body.systems")}
      </SectionTitle>
      {/* Ten rows of one shape. What varies is the sentence inside. */}
      <Card
        variant="group"
        style={{ overflow: "hidden", padding: 0, ...fadeUp(90) }}
      >
        {summary.zones.map(({ zone, values, level }, i) => (
          <PanelRow
            key={zone.key}
            icon={zone.icon}
            name={t(zone.nameKey)}
            level={level}
            score={systemScore(zone, values)}
            statusLabel={t(BODY_STATUS_KEY[level])}
            detail={zoneSummaryLine(zone, values, t)}
            onOpen={() => openZone(zone.key)}
            open={active === zone.key}
            last={i === summary.zones.length - 1}
          >
            {active === zone.key && <ZoneDetail zoneKey={zone.key} sel={sel} />}
          </PanelRow>
        ))}
      </Card>

      <Card
        variant="group"
        style={{ overflow: "hidden", padding: 0, marginTop: 14 }}
      >
        <Pressable
          as="button"
          type="button"
          onClick={onOpenComposition}
          pressScale={0.995}
          hoverStyle={{ background: C.surfaceHover }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "14px 16px",
            background: "transparent",
            border: "none",
            textAlign: "left",
            cursor: "pointer",
          }}
        >
          <span style={{ ...T.label, color: C.ink, flex: 1 }}>
            {t("body.compositionRow")}
          </span>
          <Caret />
        </Pressable>
      </Card>

      <p
        style={{
          ...T.caption,
          color: C.faintest,
          margin: "13px 4px 0",
          textWrap: "pretty",
        }}
      >
        {t("body.disclaimer")}
      </p>

      <SectionTitle>{t("mind.trendLabel")}</SectionTitle>
      <TrendChart
        title={plainName(pickMetric.marker)}
        unit={pickMetric.marker.unit}
        series={series}
        labels={rounds.map((s) => t("round.n", { n: s.round }))}
        reference={pickMetric.marker.ref}
        referenceLabel={t(
          pickMetric.marker.dir === "low" ? "body.refLower" : "body.refUpper",
        )}
        sel={sel}
        color={LEVEL_COLOR[markerLevel(pickMetric.marker, currentValue)]}
        options={BODY_METRICS.map((m) => ({
          key: `${m.zone}-${m.mi}`,
          label: plainName(m.marker),
        }))}
        selectedOption={metric}
        onPickOption={setMetric}
        formatValue={(v) => formatValue(v, pickMetric.marker.dp)}
      />
    </div>
  );
}
