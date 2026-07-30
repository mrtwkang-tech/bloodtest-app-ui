import { useState } from "react";
import RadarChart from "../components/RadarChart";
import ScaleCard from "../components/ScaleCard";
import TrendChart from "../components/TrendChart";
import SessionChips from "../components/SessionChips";
import {
  Card,
  SectionLabel,
  SectionTitle,
  Status,
} from "../components/primitives";
import { C, R, STATUS_COLOR, T, fadeUp } from "../tokens";
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
        <div style={{ ...T.monoSm, color: C.faint, marginTop: 5 }}>
          {t("mind.subtitle")}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>

      {showNew && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: C.accentSoft,
            borderRadius: R.inner,
            padding: "10px 13px",
            marginTop: 12,
            ...fadeUp(20),
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.accent,
            }}
          />
          <span style={{ ...T.monoSm, color: C.ink2 }}>
            {t("mind.newResult")}
          </span>
        </div>
      )}

      <Card style={{ padding: "16px 18px" }} delay={40}>
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
              return (
                <Status key={k} color={STATUS_COLOR[session.status[i]]}>
                  {t(SCALE_META.find((x) => x.key === k).axisKey)}
                </Status>
              );
            })}
          </div>
        )}
        <p
          style={{
            ...T.bodyText,
            color: C.body,
            margin: "12px 0 0",
            textWrap: "pretty",
          }}
        >
          {pick(session.summary, lang)}
        </p>
      </Card>

      <div style={{ marginTop: 10 }}>
        <RadarChart
          values={session.indices}
          statuses={session.status}
          delay={80}
        />
      </div>

      <SectionTitle value={t("mind.index")}>{t("mind.scales")}</SectionTitle>
      <p
        style={{
          ...T.monoSm,
          color: C.faint,
          margin: "-2px 2px 10px",
          textWrap: "pretty",
        }}
      >
        {t("mind.cadenceNote")}
      </p>
      <Card style={{ overflow: "hidden", ...fadeUp(120) }}>
        {SCALE_META.map((m, i) => (
          <ScaleCard
            key={m.key}
            meta={m}
            index={session.indices[i]}
            status={session.status[i]}
            roundIndex={session.roundIndex}
            last={i === SCALE_META.length - 1}
          />
        ))}
      </Card>

      <SectionTitle>{t("mind.trendLabel")}</SectionTitle>
      <TrendChart
        title={t(meta.axisKey)}
        unit={t("mind.index")}
        series={rounds.map((s) => s.indices[metric])}
        labels={rounds.map((s) => t("round.n", { n: s.round }))}
        reference={50}
        referenceLabel={t("mind.peerAvg")}
        sel={sel}
        color={STATUS_COLOR[session.status[metric]]}
        options={SCALE_META.map((m) => ({ key: m.key, label: t(m.axisKey) }))}
        selectedOption={metric}
        onPickOption={setMetric}
      />

      <SectionTitle>{t("mind.activities")}</SectionTitle>
      <Card style={{ padding: "15px 17px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pick(session.mindActivities, lang).map((text, i) => (
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

      <SectionTitle>{t("mind.state")}</SectionTitle>
      <Card style={{ padding: "15px 17px" }}>
        <p
          style={{
            ...T.bodyText,
            color: C.body,
            margin: 0,
            textWrap: "pretty",
          }}
        >
          {pick(session.mind, lang)}
        </p>
        <p
          style={{
            ...T.monoSm,
            color: C.faint,
            margin: "12px 0 0",
            paddingTop: 11,
            boxShadow: `inset 0 1px 0 ${C.hairline}`,
            textWrap: "pretty",
          }}
        >
          {t("mind.notDiagnosis")} {t("mind.crisis")}
        </p>
      </Card>
    </div>
  );
}
