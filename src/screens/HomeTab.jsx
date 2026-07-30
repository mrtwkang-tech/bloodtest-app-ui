import Pressable from "../components/Pressable";
import { ScanGlyph } from "../components/Icon";
import {
  Card,
  Caret,
  CountStrip,
  Display,
  SectionLabel,
  SectionTitle,
} from "../components/primitives";
import {
  C,
  DIVIDER,
  DIVIDER_TOP,
  EASE,
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
export default function HomeTab({ onGoStore, onOpen, onScan }) {
  const { t, lang } = useLang();
  const score = healthScore(latest);
  const counts = biomarkerCounts(latest);

  const leadKey =
    score >= 82
      ? "home.scoreLead.great"
      : counts.out === 0
        ? "home.scoreLead.ok"
        : "home.scoreLead.watch";

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

      {/* The one number the whole panel resolves to. No tinted wash behind
          it: a coloured gradient under a number says nothing the number does
          not already say, and reads as decoration applied for its own sake. */}
      <Card pad="md" delay={40}>
        <SectionLabel value={t("home.scoreOutOf")}>
          {t("home.score")}
        </SectionLabel>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginTop: 10,
          }}
        >
          <Display size={54}>{score}</Display>
          <ScoreRing value={score} />
        </div>
        <p
          style={{
            ...T.bodyText,
            color: C.body,
            margin: "12px 0 0",
            textWrap: "pretty",
          }}
        >
          {t(leadKey)}
        </p>
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

      {/* Registering a kit is the one thing on this screen that is an action
          rather than a reading, and for a quarter of the year it is the only
          reason to open the app at all. It gets the same weight as buying one —
          a labelled button, not a glyph tucked into the header. */}
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

      <div style={{ display: "flex", gap: 10, ...fadeUp(190) }}>
        <Pressable
          as="button"
          type="button"
          onClick={onScan}
          pressScale={0.98}
          hoverStyle={{ background: C.surfaceHover }}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "14px 15px",
            borderRadius: R.card,
            border: "none",
            cursor: "pointer",
            background: C.surface,
            boxShadow: `inset 0 0 0 1px ${C.hairline}`,
            color: C.ink,
            textAlign: "left",
          }}
        >
          <ScanGlyph size={22} />
          <span style={{ ...T.title3 }}>{t("home.registerKit")}</span>
        </Pressable>
        <Pressable
          as="button"
          type="button"
          onClick={onGoStore}
          pressScale={0.98}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
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

/**
 * Thin progress ring — the score restated as a proportion.
 *
 * The track is recessed and the arc is lit: a soft blurred copy underneath
 * throws the arc's own colour onto the panel, and the arc itself carries a
 * gradient so the light falls off along its length rather than sitting at one
 * flat value the whole way round.
 */
function ScoreRing({ value }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  // Lamp values: this is a shape, not text.
  const color =
    value >= 80 ? C.optimalLamp : value >= 60 ? C.watchLamp : C.alertLamp;
  const dash = `${(circ * value) / 100} ${circ}`;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <defs>
        <linearGradient id="ringLight" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.72" />
          <stop offset="55%" stopColor={color} stopOpacity="1" />
        </linearGradient>
        <filter id="ringGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
      </defs>
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={C.surfaceSunken}
        strokeWidth="4.5"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={color}
        strokeOpacity="0.55"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={dash}
        transform="rotate(-90 32 32)"
        filter="url(#ringGlow)"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke="url(#ringLight)"
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeDasharray={dash}
        transform="rotate(-90 32 32)"
        style={{ transition: `stroke-dasharray 720ms ${EASE}` }}
      />
    </svg>
  );
}

/** One domain, one line: a lamp, a name, a verdict. */
