import Pressable from "../components/Pressable";
import {
  Card,
  CountStrip,
  DataRow,
  Display,
  SectionLabel,
  SectionTitle,
  Status,
} from "../components/primitives";
import {
  C,
  CARD,
  EASE,
  LEVEL_COLOR,
  R,
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

      {/* The one number the whole panel resolves to. */}
      <Card style={{ padding: "18px 20px 20px" }} delay={40}>
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
          <Display size={58}>{score}</Display>
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

      <Card style={{ padding: "16px 20px 18px", marginTop: 10 }} delay={80}>
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

      <div style={{ display: "flex", gap: 10, marginTop: 10, ...fadeUp(120) }}>
        <DomainCard
          label={t("home.mind")}
          headline={
            mind.warn === 0
              ? t("home.allClear")
              : t("home.needsAttention", { n: mind.warn })
          }
          color={STATUS_COLOR[mind.worst]}
          rows={SCALE_META.map((m, i) => ({
            key: m.key,
            label: t(`scale.${m.key}`),
            color: STATUS_COLOR[latest.status[i]],
            value: latest.percentiles[i],
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
          rows={body.zones.map(({ zone, level }) => ({
            key: zone.key,
            label: t(zone.nameKey),
            color: LEVEL_COLOR[level],
          }))}
          onClick={onGoBody}
        />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 10, ...fadeUp(160) }}>
        <Card style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ ...T.micro, color: C.faint }}>{t("home.nextTest")}</div>
          <div style={{ ...T.title2, ...T.num, color: C.ink, marginTop: 7 }}>
            D-{PROFILE.nextInDays}
          </div>
          <div style={{ ...T.monoSm, color: C.faintest, marginTop: 3 }}>
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
            padding: "14px 16px",
            borderRadius: R.card,
            border: "none",
            cursor: "pointer",
            background: C.accent,
            color: C.onAccent,
            textAlign: "left",
          }}
        >
          <div style={{ ...T.micro, opacity: 0.66 }}>
            {t("home.subscription")}
          </div>
          <div style={{ ...T.title3, marginTop: 7 }}>{t("home.buyKit")}</div>
          <div style={{ ...T.monoSm, opacity: 0.66, marginTop: 3 }}>→</div>
        </Pressable>
      </div>

      <SectionTitle value={`${SESSIONS.length}`}>
        {t("home.history")}
      </SectionTitle>
      <Card style={{ overflow: "hidden" }} delay={200}>
        {SESSIONS.map((s, i) => {
          const m = mindSummary(s);
          const b = bodySummary(s);
          const flagged = m.warn + b.flagged.length;
          return (
            <DataRow
              key={s.round}
              rank={SESSIONS.length - i}
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

/** Thin progress ring — the score restated as a proportion. */
function ScoreRing({ value }) {
  const r = 25;
  const circ = 2 * Math.PI * r;
  return (
    <svg width="60" height="60" viewBox="0 0 60 60" aria-hidden="true">
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke={C.surfaceSunken}
        strokeWidth="4"
      />
      <circle
        cx="30"
        cy="30"
        r={r}
        fill="none"
        stroke={value >= 80 ? C.optimal : value >= 60 ? C.watch : C.alert}
        strokeWidth="4"
        strokeLinecap="round"
        strokeDasharray={`${(circ * value) / 100} ${circ}`}
        transform="rotate(-90 30 30)"
        style={{ transition: `stroke-dasharray 720ms ${EASE}` }}
      />
    </svg>
  );
}

function DomainCard({ label, headline, color, rows, onClick }) {
  return (
    <Pressable
      as="button"
      type="button"
      onClick={onClick}
      pressScale={0.985}
      style={{
        display: "block",
        alignSelf: "stretch",
        flex: 1,
        minWidth: 0,
        padding: "14px 15px 13px",
        borderRadius: R.card,
        background: C.surface,
        boxShadow: CARD,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span style={{ ...T.micro, color: C.faint }}>{label}</span>
        <span style={{ marginLeft: "auto", ...T.monoSm, color: C.faintest }}>
          ›
        </span>
      </div>
      <div style={{ marginTop: 9 }}>
        <Status color={color}>{headline}</Status>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 5,
          marginTop: 12,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.key}
            style={{ display: "flex", alignItems: "center", gap: 6 }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: r.color,
                flex: "none",
              }}
            />
            <span
              style={{
                ...T.monoSm,
                color: C.muted,
                flex: 1,
                minWidth: 0,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {r.label}
            </span>
            {r.value != null && (
              <span style={{ ...T.num, fontSize: 11, color: C.faint }}>
                {r.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </Pressable>
  );
}
