import Pressable from "../components/Pressable";
import {
  Card,
  CountStrip,
  Display,
  MarkerRow,
  Pill,
  SectionTitle,
} from "../components/primitives";
import {
  C,
  CARD,
  DIVIDER,
  EASE,
  LEVEL_COLOR,
  LEVEL_TINT,
  STATUS_COLOR,
  T,
  fadeUp,
} from "../tokens";
import { SCALE_META } from "../data/scales";
import {
  PROFILE,
  SESSIONS,
  biomarkerCounts,
  bodySummary,
  healthScore,
  mindSummary,
  pick,
} from "../data/sessions";
import { useLang } from "../i18n";

const latest = SESSIONS[0];

export default function HomeTab({
  onGoMind,
  onGoBody,
  onGoStore,
  onOpenSession,
}) {
  const { t, lang } = useLang();
  const score = healthScore(latest);
  const counts = biomarkerCounts(latest);
  const mind = mindSummary(latest);
  const body = bodySummary(latest);

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
          marginBottom: 18,
          ...fadeUp(0),
        }}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...T.micro, color: C.faint }}>
            {t("home.drawnOn", { date: pick(latest.fullDate, lang) })}
          </div>
          <h1 style={{ ...T.title1, color: C.ink, margin: "3px 0 0" }}>
            {t("home.greeting", { name: pick(PROFILE.name, lang) })}
          </h1>
        </div>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: "50%",
            background: C.chipIdle,
            color: C.body,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            ...T.callout,
            flex: "none",
          }}
        >
          {PROFILE.initial}
        </div>
      </header>

      {/* Score — the one number the whole panel resolves to. */}
      <Card style={{ padding: "20px 22px 22px" }} delay={40}>
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ ...T.callout, color: C.faint }}>
              {t("home.score")}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 8,
                marginTop: 8,
              }}
            >
              <Display size={64} color={C.ink}>
                {score}
              </Display>
              <span style={{ ...T.caption, color: C.faintest }}>
                {t("home.scoreOutOf")}
              </span>
            </div>
          </div>
          <ScoreRing value={score} />
        </div>
        <p
          style={{
            ...T.body,
            color: C.body,
            margin: "14px 0 0",
            textWrap: "pretty",
          }}
        >
          {t(leadKey)}
        </p>
      </Card>

      <Card style={{ padding: "18px 20px 20px", marginTop: 12 }} delay={80}>
        <div style={{ ...T.callout, color: C.faint, marginBottom: 14 }}>
          {t("home.biomarkers")}
        </div>
        <CountStrip
          counts={counts}
          labels={{
            total: t("home.total"),
            optimal: t("home.optimal"),
            inRange: t("home.inRange"),
            out: t("home.outOfRange"),
          }}
        />
      </Card>

      {/* Two domains, two doors. */}
      <div style={{ display: "flex", gap: 12, marginTop: 12, ...fadeUp(120) }}>
        <DomainCard
          label={t("home.mind")}
          headline={
            mind.warn === 0
              ? t("home.allClear")
              : t("home.needsAttention", { n: mind.warn })
          }
          color={STATUS_COLOR[mind.worst]}
          tint={
            mind.worst === "good"
              ? C.optimalTint
              : mind.worst === "watch"
                ? C.watchTint
                : C.alertTint
          }
          chips={SCALE_META.map((m, i) => ({
            key: m.key,
            label: t(`scale.${m.key}`),
            color: STATUS_COLOR[latest.status[i]],
          }))}
          onClick={onGoMind}
        />
        <DomainCard
          label={t("home.body")}
          headline={
            body.flagged.length === 0
              ? t("home.allClear")
              : t("home.needsAttention", { n: body.flagged.length })
          }
          color={LEVEL_COLOR[body.worst]}
          tint={LEVEL_TINT[body.worst]}
          chips={body.zones.map(({ zone, level }) => ({
            key: zone.key,
            label: t(zone.nameKey),
            color: LEVEL_COLOR[level],
          }))}
          onClick={onGoBody}
        />
      </div>

      <div style={{ display: "flex", gap: 12, marginTop: 12, ...fadeUp(160) }}>
        <Card style={{ flex: 1, padding: 16 }}>
          <div style={{ ...T.micro, color: C.faint }}>{t("home.nextTest")}</div>
          <div style={{ ...T.title2, ...T.mono, color: C.ink, marginTop: 5 }}>
            D-{PROFILE.nextInDays}
          </div>
          <div style={{ ...T.micro, color: C.faintest, marginTop: 2 }}>
            {pick(PROFILE.nextDate, lang)}
          </div>
        </Card>
        <Pressable
          as="button"
          type="button"
          onClick={onGoStore}
          pressScale={0.98}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 20,
            border: "none",
            cursor: "pointer",
            background: C.accent,
            color: C.onAccent,
            textAlign: "left",
          }}
        >
          <div style={{ ...T.micro, opacity: 0.62 }}>
            {t("home.subscription")}
          </div>
          <div style={{ ...T.title3, marginTop: 5 }}>{t("home.buyKit")}</div>
          <div style={{ ...T.micro, opacity: 0.62, marginTop: 4 }}>→</div>
        </Pressable>
      </div>

      <SectionTitle>{t("home.history")}</SectionTitle>
      <Card style={{ overflow: "hidden" }} delay={200}>
        {SESSIONS.map((s, i) => {
          const m = mindSummary(s);
          const b = bodySummary(s);
          const flagged = m.warn + b.flagged.length;
          return (
            <MarkerRow
              key={s.round}
              name={t("home.roundTest", {
                round: t("round.n", { n: s.round }),
              })}
              sub={pick(s.fullDate, lang)}
              value={healthScore(s)}
              color={flagged ? C.watch : C.optimal}
              last={i === SESSIONS.length - 1}
              onClick={() => onOpenSession(i)}
            />
          );
        })}
      </Card>
    </div>
  );
}

/** Thin progress ring — the score as a proportion, not a second number. */
function ScoreRing({ value }) {
  const r = 26;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="64" height="64" viewBox="0 0 64 64" aria-hidden="true">
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={C.surfaceSunken}
        strokeWidth="5"
      />
      <circle
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={value >= 80 ? C.optimal : value >= 60 ? C.watch : C.alert}
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray={`${(circ * value) / 100} ${circ}`}
        transform="rotate(-90 32 32)"
        style={{ transition: `stroke-dasharray 720ms ${EASE}` }}
      />
    </svg>
  );
}

function DomainCard({ label, headline, color, tint, chips, onClick }) {
  return (
    <Pressable
      as="button"
      type="button"
      onClick={onClick}
      pressScale={0.98}
      style={{
        flex: 1,
        minWidth: 0,
        padding: "16px 16px 14px",
        borderRadius: 20,
        background: C.surface,
        boxShadow: CARD,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ ...T.micro, color: C.faint }}>{label}</span>
        <span style={{ marginLeft: "auto", ...T.micro, color: C.faintest }}>
          ›
        </span>
      </div>
      <div style={{ marginTop: 8 }}>
        <Pill color={color} tint={tint}>
          {headline}
        </Pill>
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 12 }}>
        {chips.map((c) => (
          <span
            key={c.key}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              ...T.micro,
              color: C.muted,
              background: C.surfaceSunken,
              borderRadius: 999,
              padding: "3px 7px",
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: c.color,
              }}
            />
            {c.label}
          </span>
        ))}
      </div>
    </Pressable>
  );
}
