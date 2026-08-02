import { useCallback, useState } from "react";
import BodyScene from "../three/BodyScene";
import Masthead from "../components/Masthead";
import Pressable from "../components/Pressable";
import TrendChart from "../components/TrendChart";
import ZoneRow from "../components/ZoneRow";
import { Card, Caret, SectionTitle } from "../components/primitives";
import { C, LEVEL_COLOR, LEVEL_LAMP, T, fadeUp } from "../tokens";
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
          <PlaceLabel key={active} zone={activeZone} />
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
          <ZoneRow
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
          </ZoneRow>
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

/**
 * What is lit, and where it is — pinned to the top right of the figure.
 *
 * The rows below already name the system and give its state, so a label that
 * only repeated the name would be decoration. What the rows cannot say, and
 * the figure can, is WHERE — and "where" is exactly the question a reader has
 * when a shape somewhere inside a translucent body starts glowing. A kidney
 * lighting up behind the waist is unrecognisable at 340px unless something
 * says "the small of your back", and then it is obvious.
 *
 * Top right rather than over the figure: the whole point of opening a row in
 * place last round was that nothing should cover the body. Right-aligned and
 * capped in width so the text grows away from the figure, never across it.
 */
function PlaceLabel({ zone }) {
  const { t } = useLang();
  if (!zone) return null;

  const { zone: z, level, values } = zone;
  const score = systemScore(z, values);
  return (
    <div
      style={{
        position: "absolute",
        top: 10,
        right: 14,
        // The head is centred and about 11% of the canvas wide, so it occupies
        // 44–56%. Anything wider than 44% here runs into it — which is what
        // happened as soon as the label grew a third line.
        maxWidth: "44%",
        textAlign: "right",
        pointerEvents: "none",
        ...fadeUp(0),
      }}
    >
      {/* Name and score on one line, because both are short and because the
          score belongs to the name rather than to the sentence under it.
          Everything wraps: the widest line here sits at the height of the
          skull, and an unwrapped flex row would overflow the cap and run
          across the face. */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "flex-end",
          flexWrap: "wrap",
          gap: "0 7px",
        }}
      >
        {level > 0 && (
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              flex: "none",
              alignSelf: "center",
              background: LEVEL_LAMP[level],
            }}
          />
        )}
        <span style={{ ...T.label, color: C.ink }}>{t(z.nameKey)}</span>
        <span style={{ ...T.num, fontSize: 14.5, color: C.ink }}>
          {t("body.score", { n: score })}
        </span>
      </div>
      {/* What the score is measured against, and then where the thing is.
          Both are answers the rows below cannot give: a row can say "관찰
          필요", which is a threshold word that reads the same one per cent
          past the line as forty per cent past it. */}
      <div
        style={{
          ...T.caption,
          color: C.faint,
          marginTop: 2,
          textWrap: "pretty",
        }}
      >
        {t("body.scoreVsPeers", {
          pct: systemPercentile(score, z.markers.length),
        })}
      </div>
      <div
        style={{
          ...T.caption,
          color: C.faintest,
          marginTop: 2,
          textWrap: "pretty",
        }}
      >
        {t(`where.${z.key}`)}
      </div>
    </div>
  );
}
