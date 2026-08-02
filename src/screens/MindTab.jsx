import { useCallback, useEffect, useState } from "react";
import RadarChart from "../components/RadarChart";
import BrainMap from "../components/BrainMap";
import DayDial from "../components/DayDial";
import MindScene from "../three/MindScene";
import PanelRow from "../components/PanelRow";
import PlaceLabel from "../components/PlaceLabel";
import { withEmphasis } from "../components/Emphasis";
import TrendChart from "../components/TrendChart";
import Masthead from "../components/Masthead";
import {
  Card,
  SectionLabel,
  SectionTitle,
  Segmented,
  Status,
} from "../components/primitives";
import { C, STATUS_COLOR, T, fadeUp } from "../tokens";
import { SCALE_LEVEL, SCALE_META, band } from "../data/scales";
import { scalePercentile } from "../data/cohorts";
import { SESSIONS, mindSummary, pick } from "../data/sessions";
import ScaleDetail from "./ScaleDetail";
import { useLang } from "../i18n";

/**
 * The mind screen: a picture, then one row per scale.
 *
 * WHY THIS IS NOW THE SAME SHAPE AS THE BODY SCREEN, having deliberately not
 * been for several passes. The stated reason for the divergence was that "a
 * mind scale has no picture to stay next to" — so its detail went into a sheet,
 * where the body's could not, because the body's would have covered the figure.
 * That reason has expired: the mind panel's own data names five brain
 * structures, one per index, and states the mapping as the argument for the
 * whole panel. The picture was always implied; it just had not been drawn.
 *
 * FOUR PICTURES, TEMPORARILY. The switcher below is a choosing tool, not a
 * feature — four candidates rendered from the same data so they can be compared
 * against each other rather than described. When one is chosen the other three
 * and the switcher come out. They are, in order:
 *
 *   회로   the neuroendocrine circuit in 3D, on the same figure Body uses
 *   단면   the same anatomy as a flat mid-sagittal section
 *   하루   the 24-hour dial — one axis, rendered properly
 *   지수   the radar that is here today, flipped to the score direction
 *
 * THE NUMBER FLIPPED. Every scale now shows `score`, where higher is better,
 * because the body screen's numeral means that and two adjacent tabs cannot
 * disagree about which way is up. The load index is still what the model
 * computes and still what the opened panel explains.
 */

const VIEWS = ["circuit", "section", "day", "radar"];
const VIEW_KEY = "pedia.mind.view";

export default function MindTab({ sel, onPickSession }) {
  const { t, lang } = useLang();
  const [metric, setMetric] = useState(2);
  const [active, setActive] = useState(null);
  const [view, setView] = useState(
    () => localStorage.getItem(VIEW_KEY) ?? VIEWS[0],
  );
  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view);
  }, [view]);

  const session = SESSIONS[sel];
  const summary = mindSummary(session);
  const meta = SCALE_META[metric];
  const rounds = [...SESSIONS].reverse();
  const activities = pick(session.mindActivities, lang);

  // One row open at a time, and opening it lights that circuit above — the
  // same contract Body has, for the same reason: the row and the picture are
  // the same object and the screen should be able to say so.
  const openScale = useCallback((key) => {
    setActive((cur) => (cur === key ? null : key));
  }, []);

  const activeIdx = SCALE_META.findIndex((m) => m.key === active);
  const activeMeta = activeIdx >= 0 ? SCALE_META[activeIdx] : null;

  const picture = {
    circuit: (
      <MindScene
        scores={session.scores}
        statuses={session.status}
        active={active}
        onPick={openScale}
        height={340}
      />
    ),
    section: (
      <BrainMap
        scores={session.scores}
        statuses={session.status}
        active={active}
        onPick={openScale}
      />
    ),
    day: (
      <DayDial
        scores={session.scores}
        statuses={session.status}
        active={active}
        onPick={openScale}
        roundIndex={session.roundIndex}
      />
    ),
    radar: (
      <RadarChart
        values={session.scores}
        statuses={session.status}
        active={active}
        onPick={openScale}
        delay={80}
      />
    ),
  }[view];

  return (
    <div>
      <Masthead
        title={t("mind.title")}
        sel={sel}
        onPickSession={onPickSession}
      />

      <Card pad="md" delay={40}>
        <SectionLabel value={`${summary.ok}/${SCALE_META.length}`}>
          {t("mind.summary")}
        </SectionLabel>
        <div style={{ ...T.title3, color: C.ink, marginTop: 9 }}>
          {summary.warn === 0
            ? t("mind.allGood")
            : t("mind.someGood", { ok: summary.ok })}
        </div>
        {summary.warn > 0 && (
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
              marginTop: 10,
            }}
          >
            {summary.keys.map((k) => {
              const i = SCALE_META.findIndex((m) => m.key === k);
              const m = SCALE_META[i];
              return (
                <Status
                  key={k}
                  icon={m.icon}
                  level={SCALE_LEVEL[session.status[i]]}
                >
                  {t(m.axisKey)}
                </Status>
              );
            })}
          </div>
        )}
        {/* In full. A "더 보기" on a three-line paragraph asks the reader to
            work for text that was going to fit anyway. Optional, though: since
            the move to monthly most rounds have nothing worth saying, and an
            empty paragraph is better left unrendered than filled. */}
        {pick(session.summary, lang) && (
          <p
            style={{
              ...T.bodyText,
              color: C.body,
              margin: "12px 0 0",
              textWrap: "pretty",
            }}
          >
            {withEmphasis(pick(session.summary, lang))}
          </p>
        )}
      </Card>

      {/* TEMPORARY — the chooser. Comes out with three of the four pictures. */}
      <div style={{ marginTop: 12, ...fadeUp(60) }}>
        <Segmented
          items={VIEWS.map((v) => ({ key: v, label: t(`mind.view.${v}`) }))}
          value={view}
          onChange={setView}
        />
      </div>

      <Card
        variant="group"
        style={{ padding: "4px 0 11px", overflow: "hidden", marginTop: 10 }}
        delay={80}
      >
        <div style={{ position: "relative" }}>
          {picture}
          {activeMeta && (
            <PlaceLabel
              key={active}
              name={t(activeMeta.axisKey)}
              level={SCALE_LEVEL[session.status[activeIdx]]}
              score={session.scores[activeIdx]}
              percentile={scalePercentile(
                session.scores[activeIdx],
                activeMeta.drivers.length,
              )}
              where={t(`where.${activeMeta.key}`)}
              anatomy={t(`anat.${activeMeta.key}`)}
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
          {t("mind.tapAxis")}
        </div>
      </Card>

      <SectionTitle value={`${summary.ok}/${SCALE_META.length}`}>
        {t("mind.scales")}
      </SectionTitle>
      <p
        style={{
          ...T.caption,
          color: C.faint,
          margin: "-2px 2px 10px",
          textWrap: "pretty",
        }}
      >
        {t("mind.cadenceNote")}
      </p>
      {/* Five rows of one shape, opening in place. Same component the body
          systems use — they were two copies of one object for months. */}
      <Card
        variant="group"
        style={{ overflow: "hidden", padding: 0, ...fadeUp(120) }}
      >
        {SCALE_META.map((m, i) => (
          <PanelRow
            key={m.key}
            icon={m.icon}
            name={t(m.axisKey)}
            level={SCALE_LEVEL[session.status[i]]}
            score={session.scores[i]}
            statusLabel={t(`status.${session.status[i]}`)}
            detail={t(`mind.vsPeer.${band(session.scores[i])}`)}
            onOpen={() => openScale(m.key)}
            open={active === m.key}
            last={i === SCALE_META.length - 1}
          >
            {active === m.key && <ScaleDetail scaleKey={m.key} sel={sel} />}
          </PanelRow>
        ))}
      </Card>

      <SectionTitle>{t("mind.trendLabel")}</SectionTitle>
      <TrendChart
        title={t(meta.axisKey)}
        unit={t("mind.scoreLabel")}
        series={rounds.map((s) => s.scores[metric])}
        labels={rounds.map((s) => t("round.n", { n: s.round }))}
        reference={50}
        referenceLabel={t("mind.peerAvg")}
        sel={sel}
        color={STATUS_COLOR[session.status[metric]]}
        options={SCALE_META.map((m) => ({ key: m.key, label: t(m.axisKey) }))}
        selectedOption={metric}
        onPickOption={setMetric}
        higherIsBetter
      />

      {/* Heading and card together, or neither. Six of the twelve rounds have
          no activities written for them — a heading over an empty card is the
          same mistake as advice invented to fill a box. */}
      {activities?.length > 0 && (
        <>
          <SectionTitle>{t("mind.activities")}</SectionTitle>
          <Card pad="md">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {activities.map((text, i) => (
                <div
                  key={text}
                  style={{ display: "flex", gap: 11, alignItems: "flex-start" }}
                >
                  <span
                    style={{
                      ...T.micro,
                      color: C.faintest,
                      flex: "none",
                      marginTop: 3,
                      width: 14,
                    }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span
                    style={{ ...T.bodyText, color: C.body, textWrap: "pretty" }}
                  >
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </>
      )}

      <SectionTitle>{t("mind.state")}</SectionTitle>
      {/* The card always renders: the caveats below are the terms these
          numbers come under, not a per-round remark. The prose above them is
          per-round, and is often absent. */}
      <Card pad="md">
        {pick(session.mind, lang) && (
          <p
            style={{
              ...T.bodyText,
              color: C.body,
              margin: "0 0 12px",
              textWrap: "pretty",
            }}
          >
            {withEmphasis(pick(session.mind, lang))}
          </p>
        )}
        {/* The caveats, as a footnote rather than a badge. A tinted pill made
            the disclaimer look like a status the reader had earned; it is not
            a result, it is the terms these numbers come under. The sentences
            themselves stay — the assays really are hypothetical and none of
            this is a diagnosis, and dropping either claim would misrepresent
            what the panel is. */}
        <p
          style={{
            ...T.caption,
            color: C.faintest,
            margin: 0,
            paddingTop: 11,
            boxShadow: `inset 0 1px 0 ${C.hairline}`,
            textWrap: "pretty",
          }}
        >
          {t("epi.hypothetical")} {t("mind.notDiagnosis")} {t("mind.crisis")}
        </p>
      </Card>
    </div>
  );
}
