import { useState } from "react";
import RadarChart from "../components/RadarChart";
import ScaleCard from "../components/ScaleCard";
import TrendChart from "../components/TrendChart";
import SessionChips from "../components/SessionChips";
import { Card, Pill, SectionTitle } from "../components/primitives";
import {
  C,
  DIVIDER_TOP,
  STATUS_COLOR,
  STATUS_TINT,
  T,
  fadeUp,
} from "../tokens";
import { SCALE_META } from "../data/scales";
import { SESSIONS, mindSummary, pick } from "../data/sessions";
import { useLang } from "../i18n";

export default function MindTab({ sel, onPickSession, showNew }) {
  const { t, lang } = useLang();
  const [metric, setMetric] = useState(2);
  const session = SESSIONS[sel];
  const summary = mindSummary(session);
  const meta = SCALE_META[metric];
  const rounds = [...SESSIONS].reverse();

  return (
    <div>
      <header style={fadeUp(0)}>
        <h1 style={{ ...T.title1, color: C.ink, margin: 0 }}>
          {t("mind.title")}
        </h1>
        <div style={{ ...T.caption, color: C.faint, marginTop: 3 }}>
          {t("mind.subtitle")}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>

      {showNew && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 9,
            background: C.optimalTint,
            borderRadius: 14,
            padding: "11px 14px",
            marginTop: 12,
            ...fadeUp(20),
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: C.optimal,
            }}
          />
          <span style={{ ...T.caption, color: C.ink2 }}>
            {t("mind.newResult")}
          </span>
        </div>
      )}

      <Card style={{ padding: "18px 20px", marginTop: 12 }} delay={40}>
        <div style={{ ...T.micro, color: C.faint }}>{t("mind.summary")}</div>
        <div style={{ ...T.title3, color: C.ink, marginTop: 6 }}>
          {summary.warn === 0
            ? t("mind.allGood")
            : t("mind.someGood", { ok: summary.ok })}
        </div>
        {summary.warn > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
          >
            {summary.keys.map((k) => {
              const i = SCALE_META.findIndex((m) => m.key === k);
              const st = session.status[i];
              return (
                <Pill key={k} color={STATUS_COLOR[st]} tint={STATUS_TINT[st]}>
                  {t(`scale.${k}`)}
                </Pill>
              );
            })}
          </div>
        )}
        <p
          style={{
            ...T.body,
            color: C.body,
            margin: "12px 0 0",
            textWrap: "pretty",
          }}
        >
          {pick(session.summary, lang)}
        </p>
      </Card>

      <div style={{ marginTop: 12 }}>
        <RadarChart percentiles={session.percentiles} delay={80} />
      </div>

      <SectionTitle>{t("mind.percentile")}</SectionTitle>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          ...fadeUp(120),
        }}
      >
        {SCALE_META.map((m, i) => (
          <ScaleCard
            key={m.key}
            meta={m}
            score={session.scores[i]}
            status={session.status[i]}
            percentile={session.percentiles[i]}
          />
        ))}
      </div>

      <div style={{ marginTop: 16 }}>
        <TrendChart
          title={t("mind.trend", { name: t(`scale.${meta.key}`) })}
          unit={meta.code}
          series={rounds.map((s) => s.scores[metric])}
          labels={rounds.map((s) => t("round.n", { n: s.round }))}
          reference={meta.avg}
          referenceLabel={t("mind.peerAvg")}
          sel={sel}
          color={STATUS_COLOR[session.status[metric]]}
          options={SCALE_META.map((m) => ({
            key: m.key,
            label: t(`scale.${m.key}`),
          }))}
          selectedOption={metric}
          onPickOption={setMetric}
        />
      </div>

      <SectionTitle>{t("mind.activities")}</SectionTitle>
      <Card style={{ padding: "16px 18px" }} delay={0}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pick(session.mindActivities, lang).map((text, i) => (
            <div
              key={text}
              style={{ display: "flex", gap: 11, alignItems: "flex-start" }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: C.surfaceSunken,
                  color: C.muted,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  ...T.micro,
                  flex: "none",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span style={{ ...T.body, color: C.body, textWrap: "pretty" }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </Card>

      <SectionTitle>{t("mind.state")}</SectionTitle>
      <Card style={{ padding: "16px 18px" }} delay={0}>
        <p style={{ ...T.body, color: C.body, margin: 0, textWrap: "pretty" }}>
          {pick(session.mind, lang)}
        </p>
        <p
          style={{
            ...T.micro,
            color: C.faintest,
            margin: "12px 0 0",
            paddingTop: 12,
            boxShadow: DIVIDER_TOP,
            lineHeight: 1.6,
            textWrap: "pretty",
          }}
        >
          {t("mind.crisis")}
        </p>
      </Card>
    </div>
  );
}
