import { useCallback, useState } from "react";
import BodyScene from "../three/BodyScene";
import Masthead from "../components/Masthead";
import Pressable from "../components/Pressable";
import TrendChart from "../components/TrendChart";
import ZoneRow from "../components/ZoneRow";
import { Card, Caret, SectionTitle } from "../components/primitives";
import { C, LEVEL_COLOR, T, fadeUp } from "../tokens";
import { BODY_STATUS_KEY, formatValue, markerLevel } from "../data/body";
import {
  BODY_METRICS,
  SESSIONS,
  bodySeries,
  bodySummary,
} from "../data/sessions";
import { plainKeyOf } from "../data/plainNames";
import { zoneSummaryLine } from "./ZoneDetail";
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
 * The mind screen had solved this already: one row per axis, identical height,
 * detail in a sheet. So Body does the same. The rows subsume both the chip
 * rail and the legend — they are that list, with the state written out instead
 * of encoded in an icon's tint — and the figure keeps the job only it can do,
 * which is saying WHERE.
 *
 * Tapping a row and tapping an organ do the same thing: light it, and open it.
 */
export default function BodyTab({
  sel,
  onPickSession,
  onOpenComposition,
  onOpenZone,
}) {
  const { t } = useLang();
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(0);

  const session = SESSIONS[sel];
  const summary = bodySummary(session);

  const openZone = useCallback(
    (key) => {
      setActive(key);
      onOpenZone(key);
    },
    [onOpenZone],
  );

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
        <BodyScene
          zones={summary.zones}
          activeZone={active}
          onPickZone={openZone}
          height={340}
        />
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
          <ZoneRow
            key={zone.key}
            icon={zone.icon}
            name={t(zone.nameKey)}
            level={level}
            statusLabel={t(BODY_STATUS_KEY[level])}
            detail={zoneSummaryLine(zone, values, t)}
            onOpen={() => openZone(zone.key)}
            last={i === summary.zones.length - 1}
          />
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
