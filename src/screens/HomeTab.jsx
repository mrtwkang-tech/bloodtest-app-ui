import { useState } from "react";
import Pressable from "../components/Pressable";
import {
  Card,
  Caret,
  CountStrip,
  Display,
  SectionLabel,
  SectionTitle,
  Segmented,
} from "../components/primitives";
import {
  C,
  DIVIDER,
  DIVIDER_TOP,
  LEVEL_COLOR,
  R,
  T,
  backlight,
  fadeUp,
} from "../tokens";
import { COMPOSITION, DEVICE, metricLevel } from "../data/inbody";
import { formatValue } from "../data/body";
import {
  PROFILE,
  SESSIONS,
  biomarkerCounts,
  healthScore,
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

/** The three composition numbers worth a place on the first screen. */
const HOME_METRICS = ["smm", "bodyFat", "visceral"];

/**
 * Home carries the whole-person view: one score, the panel's shape, body
 * composition, and the cross-system signals.
 *
 * It deliberately does NOT restate the individual mind indices or organ
 * systems. Those lists lived here as two dense summary cards, which meant the
 * first screen was a table of contents for two other screens — the reader had
 * to parse fifteen labels before reaching anything Home alone could tell them.
 * The tab bar already navigates; Home now says something.
 */
export default function HomeTab({ onGoStore, onOpen }) {
  const { t, lang } = useLang();
  const [cohort, setCohort] = useState(DEFAULT_COHORT);
  const score = healthScore(latest);
  const counts = biomarkerCounts(latest);

  return (
    <div>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 14,
          ...fadeUp(0),
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...T.micro, color: C.faint }}>
            {t("home.drawnOn", { date: pick(latest.fullDate, lang) })}
          </div>
          <h1 style={{ ...T.title1, color: C.ink, margin: "5px 0 0" }}>
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

      {/* The one number the whole panel resolves to.
          There used to be a progress ring beside it, which restated 62 as an
          arc length — a second encoding of a number that was already legible,
          and it answered nothing a reader actually wonders. 62 out of 100 means
          nothing without a group to sit in, so the space goes to the comparison
          instead. */}
      <Card pad="md" delay={40}>
        <div style={{ ...T.caption, color: C.faint }}>{t("home.myScore")}</div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 8,
            marginTop: 2,
          }}
        >
          <Display size={60}>{score}</Display>
          <span style={{ ...T.caption, color: C.faintest }}>
            {t("home.scoreOutOf")}
          </span>
        </div>
        {/* The comparison, and it replaces a prose summary that used to sit
            here ("a few values need attention"). That sentence was stranded
            between two quantitative statements — the score above it and the
            in-range counts immediately below, which say the same thing with
            actual numbers and put the 9 in red. */}
        <div
          style={{
            marginTop: 12,
            paddingTop: 11,
            boxShadow: `inset 0 1px 0 ${C.hairline}`,
          }}
        >
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
      </Card>

      <Card pad="sm" style={{ boxShadow: DIVIDER_TOP }} delay={80}>
        <SectionLabel>{t("home.biomarkers")}</SectionLabel>
        <div style={{ marginTop: 13 }}>
          <CountStrip
            counts={counts}
            labels={{
              total: t("home.total"),
              optimal: t("home.optimal"),
              inRange: t("home.inRange"),
              out: t("home.outOfRange"),
            }}
          />
        </div>
      </Card>

      {/* Three composition numbers, not the whole device panel. Enough to
          see the body has been measured; the rest is a tap away. */}
      <Card pad="sm" style={{ boxShadow: DIVIDER_TOP }} delay={120}>
        <SectionLabel value={DEVICE.brand}>{t("ib.title")}</SectionLabel>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 10,
            marginTop: 12,
          }}
        >
          {HOME_METRICS.map((key) => {
            const m = COMPOSITION.find((c) => c.key === key);
            const value = m.demo[latest.roundIndex];
            const lv = metricLevel(m, value);
            return (
              <div key={key}>
                <div style={{ ...T.caption, color: C.faintest }}>
                  {t(m.nameKey)}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 3,
                    marginTop: 5,
                  }}
                >
                  <span
                    style={{
                      ...T.num,
                      fontSize: 18,
                      fontWeight: 600,
                      color: m.band ? LEVEL_COLOR[lv] : C.ink,
                    }}
                  >
                    {formatValue(value, m.dp)}
                  </span>
                  <span style={{ ...T.unit, color: C.faintest }}>{m.unit}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Cross-reading, cross-system signals and condition estimates used to be
          three rows here. They are one destination now — everything that only
          exists when panels are read together — so this list is what is left:
          the body panel in full, and the archive. */}
      <SectionTitle style={{ margin: "14px 2px 8px" }}>
        {t("home.more")}
      </SectionTitle>
      <Card
        variant="group"
        style={{ overflow: "hidden", padding: 0 }}
        delay={160}
      >
        <MoreRow
          label={t("home.compositionRow")}
          onClick={() => onOpen("composition")}
        />
        <MoreRow
          label={t("home.historyRow")}
          count={SESSIONS.length}
          onClick={() => onOpen("history")}
          last
        />
      </Card>

      {/* The kit-registration button sat beside this one until QR came out.
          Buying is the only action left on the screen, so it takes the width. */}
      <div
        style={{
          ...T.caption,
          color: C.faint,
          margin: "16px 2px 8px",
          ...fadeUp(180),
        }}
      >
        {t("home.nextTest")} D-{PROFILE.nextInDays} ·{" "}
        {t("home.tracked", {
          n: PROFILE.roundsSoFar,
          m: PROFILE.monthsTracked,
        })}
      </div>

      <div style={{ ...fadeUp(190) }}>
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
            textAlign: "left",
          }}
        >
          <span style={{ ...T.title3 }}>{t("home.buyKit")}</span>
        </Pressable>
      </div>
    </div>
  );
}

/** One way deeper. Label, how many things are in there, chevron. */
function MoreRow({ label, count, beta, onClick, last }) {
  const { t } = useLang();
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
        gap: 8,
        width: "100%",
        padding: "12px 16px",
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: last ? "none" : DIVIDER,
      }}
    >
      <span style={{ ...T.label, color: C.ink }}>{label}</span>
      {beta && (
        <span style={{ ...T.micro, color: C.accent }}>{t("ix.beta")}</span>
      )}
      {count != null && (
        <span
          style={{ marginLeft: "auto", ...T.num, fontSize: 12, color: C.faint }}
        >
          {count}
        </span>
      )}
      <Caret style={count != null ? null : { marginLeft: "auto" }} />
    </Pressable>
  );
}
