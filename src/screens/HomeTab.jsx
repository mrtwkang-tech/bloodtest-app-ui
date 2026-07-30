import { useState } from "react";
import Pressable from "../components/Pressable";
import { NavIcon } from "../components/Icon";
import { Caret, Display, Segmented } from "../components/primitives";
import {
  C,
  DIVIDER,
  LEVEL_LAMP,
  R,
  STATUS_LAMP,
  T,
  backlight,
  fadeUp,
} from "../tokens";
import { interactionsFor } from "../data/interactions";
import { riskEstimates } from "../data/bayes";
import { inbodyLinksFor } from "../data/inbody";
import {
  PROFILE,
  SESSIONS,
  bodySummary,
  healthScore,
  mindSummary,
  pick,
} from "../data/sessions";
import {
  DEFAULT_COHORT,
  ageBand,
  cohortPercentile,
  cohortsFor,
} from "../data/cohorts";
import { useLang } from "../i18n";

const latest = SESSIONS[0];
const previous = SESSIONS[1];

/**
 * Home: the verdict, and the state of every place you can go.
 *
 * WHAT THIS SCREEN IS FOR, after three attempts at it.
 *
 * The first version was a table of contents — fifteen labels restating two
 * other screens. The second traded that for a score, a four-column inventory
 * of marker counts with a proportional bar under it, three body-composition
 * numbers, and a link group headed "더 보기". That is a landing page: a stack
 * of unrelated blocks, each answering a question nobody arriving had.
 *
 * The inventory was the clearest symptom. "69 total · 36 optimal · 24 in range
 * · 9 out" said the same thing three ways — numeral, label, bar segment — and
 * left the reader holding a statistic they could not act on. Nine out of range
 * of WHAT? The composition trio was a fourth domain wedged in beside it, and
 * "더 보기" is not a heading, it is a drawer.
 *
 * THE CONSTRAINT THAT SHAPED THIS VERSION: the structure must not change
 * between visits. A card that appears only when something is wrong makes the
 * app look different every month and turns the home screen into an alarm. So
 * there are no conditional blocks here. One row per domain, always present,
 * always the same shape — what varies is the sentence inside it. Adding a
 * sixth domain later means adding a row, not redesigning the screen.
 *
 * The rows carry what the tab bar cannot: not that Body exists, but what state
 * Body is in. That is the difference between a table of contents and a
 * dashboard, and it is the whole reason this screen gets to exist.
 */
export default function HomeTab({ onGoStore, onGoTab }) {
  const { t, lang } = useLang();
  const [cohort, setCohort] = useState(DEFAULT_COHORT);

  const score = healthScore(latest);
  // The month-on-month move. At a quarterly cadence a delta was noise; at a
  // monthly one it is the single most useful number on the screen, and it was
  // missing entirely.
  const delta = score - healthScore(previous);

  const mind = mindSummary(latest);
  const body = bodySummary(latest);
  const crossPanel =
    inbodyLinksFor(latest.roundIndex).length +
    interactionsFor(latest.roundIndex).length +
    riskEstimates(latest.roundIndex).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100%" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 18,
          ...fadeUp(0),
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Sans, not tracked monospace. A date is a word, not a measurement,
              and the mono treatment was one of three type voices competing in
              the top forty pixels of the app. */}
          <div style={{ ...T.caption, color: C.faint }}>
            {t("home.drawnOn", { date: pick(latest.fullDate, lang) })} ·{" "}
            {t("round.n", { n: latest.round })}
          </div>
          <h1 style={{ ...T.title1, color: C.ink, margin: "4px 0 0" }}>
            {t("home.greeting", { name: pick(PROFILE.name, lang) })}
          </h1>
        </div>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: R.control,
            background: C.chipIdle,
            color: C.body,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...T.label,
            flex: "none",
          }}
        >
          {PROFILE.initial}
        </div>
      </header>

      {/* The verdict. One display numeral — the only one in the product — with
          the month's move beside it and the comparison underneath. */}
      <div style={fadeUp(40)}>
        <div style={{ ...T.caption, color: C.faint }}>{t("home.myScore")}</div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 10,
            marginTop: 2,
          }}
        >
          <Display size={60}>{score}</Display>
          <Delta value={delta} />
        </div>

        <div style={{ marginTop: 14 }}>
          <Segmented
            items={cohortsFor().map((c) => ({
              key: c.key,
              label: t(c.labelKey, {
                band: ageBand(),
                sex: pick(PROFILE.sex, lang),
              }),
            }))}
            value={cohort}
            onChange={setCohort}
          />
          <div style={{ ...T.bodyText, color: C.ink, marginTop: 11 }}>
            {t("home.percentile", { pct: cohortPercentile(score, cohort) })}
          </div>
        </div>
      </div>

      {/* One row per destination, always all of them. The tab bar says these
          places exist; these rows say what is in them. */}
      <div style={{ marginTop: 26, ...fadeUp(90) }}>
        <DomainRow
          icon="mind"
          label={t("mind.title")}
          state={
            mind.warn === 0
              ? t("home.state.mindClear", { n: 5 })
              : t("home.state.mindWatch", { n: mind.warn })
          }
          lamp={mind.warn ? STATUS_LAMP[mind.worst] : null}
          onClick={() => onGoTab("mind")}
        />
        <DomainRow
          icon="body"
          label={t("body.title")}
          state={
            body.flagged.length === 0
              ? t("home.state.bodyClear", { n: body.total })
              : t("home.state.bodyWatch", {
                  total: body.total,
                  n: body.flagged.length,
                })
          }
          lamp={body.flagged.length ? LEVEL_LAMP[body.worst] : null}
          onClick={() => onGoTab("body")}
        />
        <DomainRow
          icon="signal"
          label={t("signal.title")}
          state={t("home.state.signals", { n: crossPanel })}
          onClick={() => onGoTab("signal")}
          last
        />
      </div>

      <div style={{ flex: 1, minHeight: 20 }} />

      {/* "12회차" appeared twice on this screen meaning two different things —
          the round just drawn, and the number drawn so far. The header owns
          the first; this line owns the tally. */}
      <div
        style={{
          ...T.caption,
          color: C.faint,
          margin: "24px 2px 10px",
          ...fadeUp(140),
        }}
      >
        {t("home.nextOn", { date: pick(PROFILE.nextDate, lang) })} ·{" "}
        {t("home.trackedSoFar", { m: PROFILE.monthsTracked })}
      </div>

      <Pressable
        as="button"
        type="button"
        onClick={onGoStore}
        pressScale={0.98}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          padding: "14px 15px",
          borderRadius: R.card,
          border: "none",
          cursor: "pointer",
          background: C.accent,
          boxShadow: backlight(C.accent),
          color: C.onAccent,
          ...fadeUp(160),
        }}
      >
        <span style={{ ...T.title3 }}>{t("home.buyKit")}</span>
      </Pressable>
    </div>
  );
}

/**
 * The month's move.
 *
 * Direction is the fact; the arrow carries it and the numeral confirms it. No
 * status colour — a three-point drop is not a result out of range, and
 * spending the alert palette on it would be the same borrowing of urgency the
 * advice blocks were guilty of.
 */
function Delta({ value }) {
  const t = useLang().t;
  if (!value) {
    return (
      <span style={{ ...T.caption, color: C.faintest }}>
        {t("home.deltaFlat")}
      </span>
    );
  }
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "baseline",
        gap: 4,
        ...T.caption,
        color: C.faint,
      }}
    >
      <span style={{ ...T.num, fontSize: 14, color: C.ink }}>
        {value > 0 ? "▲" : "▼"}
        {Math.abs(value)}
      </span>
      {t("home.deltaSince")}
    </span>
  );
}

/**
 * One destination and the state it is in.
 *
 * Rendered unconditionally, including when there is nothing to report — the
 * screen has to look the same on a quiet month as on a loud one, and "all
 * clear" is itself the answer to the question the row asks.
 */
function DomainRow({ icon, label, state, lamp, onClick, last }) {
  return (
    <Pressable
      as="button"
      type="button"
      onClick={onClick}
      pressScale={0.995}
      hoverStyle={{ background: C.surfaceHover }}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: "14px 2px",
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: last ? "none" : DIVIDER,
      }}
    >
      <span style={{ color: C.body, display: "flex", flex: "none" }}>
        <NavIcon name={icon} size={22} />
      </span>
      <span style={{ flex: 1, minWidth: 0 }}>
        <span
          style={{
            ...T.label,
            color: C.ink,
            display: "block",
            marginBottom: 2,
          }}
        >
          {label}
        </span>
        <span style={{ ...T.caption, color: C.faint, display: "block" }}>
          {state}
        </span>
      </span>
      {lamp && (
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: lamp,
            flex: "none",
          }}
        />
      )}
      <Caret />
    </Pressable>
  );
}
