import { useState } from "react";
import RadarChart from "../components/RadarChart";
import { withEmphasis } from "../components/Emphasis";
import ScaleRow from "../components/ScaleRow";
import { band } from "../components/ScaleRow";
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

export default function MindTab({ sel, onPickSession, onOpenScale }) {
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
        <div style={{ ...T.caption, color: C.faint, marginTop: 5 }}>
          {t("mind.subtitle")}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>

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
              const meta = SCALE_META[i];
              return (
                <Status
                  key={k}
                  icon={meta.icon}
                  level={session.status[i] === "alert" ? 2 : 1}
                >
                  {t(meta.axisKey)}
                </Status>
              );
            })}
          </div>
        )}
        {/* In full. A "더 보기" on a three-line paragraph asks the reader to
            work for text that was going to fit anyway. */}
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
      </Card>

      <div style={{ marginTop: 10 }}>
        <RadarChart
          values={session.indices}
          statuses={session.status}
          delay={80}
        />
      </div>

      <SectionTitle>{t("mind.scales")}</SectionTitle>
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
      {/* Five rows of one shape. The card used to be thin when the index was
          fine and tall when it was not, so the five never scanned as five of
          the same thing — and the detail unfolded downward, costing the reader
          their place. It opens in a sheet now. */}
      <Card
        variant="group"
        style={{ overflow: "hidden", padding: 0, ...fadeUp(120) }}
      >
        {SCALE_META.map((m, i) => (
          <ScaleRow
            key={m.key}
            meta={{
              icon: m.icon,
              label: t(m.axisKey),
              comparison: t(`mind.vsPeer.${band(session.indices[i])}`),
              statusLabel: t(`status.${session.status[i]}`),
            }}
            index={session.indices[i]}
            status={session.status[i]}
            onOpen={() => onOpenScale(m.key)}
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
      <Card pad="md">
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
      <Card pad="md">
        <p style={{ ...T.bodyText, color: C.body, margin: 0, textWrap: "pretty" }}>
          {withEmphasis(pick(session.mind, lang))}
        </p>
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
            margin: "12px 0 0",
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
