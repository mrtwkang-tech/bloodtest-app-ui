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
} from "../components/primitives";
import { C, STATUS_COLOR, T, fadeUp } from "../tokens";
import { SCALE_LEVEL, SCALE_META, scaleSummaryLine } from "../data/scales";
import { scalePercentile } from "../data/cohorts";
import { SESSIONS, mindSummary, pick } from "../data/sessions";
import ScaleDetail from "./ScaleDetail";
import { crisisLines } from "../data/legal";
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
        previous={SESSIONS[sel + 1]?.scores}
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

      {/* THE COUNT, ONCE.
          It used to be stated four times in about 110px: as "4/5" here, as a
          sentence 9px below, as a chip row naming the flagged one, and as
          "4/5" again over the row list. The sentence is the one that survives
          — it is the only version a reader does not have to decode — and the
          chip row went because the five rows underneath already carry the same
          icon at the same level, which is what a chip is. */}
      <Card pad="md" delay={40}>
        <SectionLabel>{t("mind.summary")}</SectionLabel>
        <div style={{ ...T.title3, color: C.ink, marginTop: 9 }}>
          {summary.warn === 0
            ? t("mind.allGood")
            : t("mind.someGood", { ok: summary.ok })}
        </div>
        {/* `session.summary` used to render here: twelve hand-authored
            paragraphs for twelve demo rounds, five of the six contradicting the
            numbers plotted below them — round 8 said "다섯 경로 모두 또래 평균
            아래입니다" over four scores above 50 — and, the argument that
            settled it, nothing at all for a real reader's thirteenth draw. A
            computed finding takes this slot; until then the slot is empty,
            which is the honest state of a card that has nothing to add. */}
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
          {/* ONLY OVER THE TWO VIEWS THAT DRAW ANATOMY. `PlaceLabel` answers
              "where is this in me", pins itself to the top right, and assumes a
              centred figure leaves that corner free. Neither assumption holds
              for the other two: the dial draws time and the radar draws five
              indices, so neither has a "where" to name, and both fill their
              canvas — the label landed on the dial's night arc and on the
              radar's own header. The open row below carries the score and the
              percentile either way. */}
          {activeMeta && (view === "circuit" || view === "section") && (
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
        {/* NOT ON THE DIAL, because there it is false. The circuit, the section
            and the radar each pass a per-shape key, so tapping picks which
            scale to open. `DayDial`'s root svg is `onClick={() =>
            onPick("circadian")}` — one hardcoded target, because the dial only
            ever speaks for one axis. Telling a reader to choose from a picture
            with nothing to choose is worse than saying nothing. */}
        {view !== "day" && (
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
        )}
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
            detail={scaleSummaryLine(m, session.roundIndex, t)}
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
        {/* ONE SENTENCE PAIR, NOT THREE.
            This was three keys concatenated, and the reader saw "정신질환의
            진단이 아닙니다. 선별검사 결과이며 의학적 진단이 아닙니다." back to
            back — the same claim twice inside one paragraph. `mind.crisis`
            already opens with it and is the only one of the three that also
            carries a number a reader in trouble can call, so it is the one
            that stays. `epi.hypothetical` moved to the screen that prints the
            assays; it was rendering in both places, identically.
            Never gated on status: the reader who needs the last sentence is
            not necessarily the one with a flagged scale. */}
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
          {t("mind.crisis", { lines: crisisLines(lang) })}
        </p>
      </Card>
    </div>
  );
}
