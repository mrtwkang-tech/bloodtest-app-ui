import { useState } from "react";
import DisclosureRow from "../components/DisclosureRow";
import RiskBody, { riskLevel } from "../components/RiskEstimates";
import SessionChips from "../components/SessionChips";
import { LinkBody } from "../components/InBodyPanel";
import { Collapse, DisclosureButton } from "../components/Collapse";
import { Badge, Card, SectionTitle } from "../components/primitives";
import { C, LEVEL_COLOR, R, T, fadeUp } from "../tokens";
import { formatValue } from "../data/body";
import { interactionsFor } from "../data/interactions";
import { riskEstimates } from "../data/bayes";
import { inbodyLinksFor } from "../data/inbody";
import { SESSIONS } from "../data/sessions";
import { useLang } from "../i18n";

/**
 * Everything that only exists when the panels are read together.
 *
 * Mind and Body each answer for their own measurements. This screen answers for
 * the ones that are only visible in combination — a blood value that means
 * something different once composition is known, two systems drifting together,
 * a condition whose odds move because several unremarkable findings point the
 * same way.
 *
 * TWELVE FINDINGS, TWELVE LINES.
 *
 * The first version of this screen rendered every finding as a fully-open card
 * and ran to 2843px — three and a half screens of scrolling, with the first and
 * the twelfth given identical weight. The data was already ranked; the screen
 * was not showing it. So the screen now opens with the one thing worth acting
 * on, states the shape of the rest in a single line, and keeps everything else
 * one press away.
 *
 * Ordered by how far each group reaches: what the numbers already say, then
 * what they say jointly, then what they might imply. The last of those is the
 * one that can frighten, so it is last.
 */
export default function SignalTab({ sel, onPickSession }) {
  const { t } = useLang();
  const roundIndex = SESSIONS[sel].roundIndex;

  const links = inbodyLinksFor(roundIndex);
  const signals = interactionsFor(roundIndex);
  const risks = riskEstimates(roundIndex);
  const total = links.length + signals.length + risks.length;

  // Cross-reads carry no severity of their own, and correctly so: they change
  // how a number should be read rather than warning about it — one of them
  // exists purely to say a high creatinine is muscle, not kidneys.
  const items = [
    ...signals.map((s) => ({
      level: s.severity,
      id: `sig:${s.key}`,
      title: t(s.titleKey),
    })),
    ...risks.map((r) => ({
      level: riskLevel(r),
      id: `dx:${r.key}`,
      title: t(r.nameKey),
    })),
  ];
  // Identified by key, not by title. Two findings can legitimately be phrased
  // the same way, and matching on the rendered string would open both.
  const lead =
    items.find((i) => i.level === 2) ?? items.find((i) => i.level === 1);
  const counts = [0, 1, 2].map(
    (lv) =>
      items.filter((i) => i.level === lv).length +
      (lv === 0 ? links.length : 0),
  );

  return (
    <div>
      <header style={fadeUp(0)}>
        <h1 style={{ ...T.title1, color: C.ink, margin: 0 }}>
          {t("signal.title")}
        </h1>
        <div style={{ ...T.caption, color: C.faint, marginTop: 5 }}>
          {total === 0 ? t("signal.none") : t("signal.subtitle", { n: total })}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>

      {total > 0 && (
        <Card pad="md" delay={40}>
          <p
            style={{
              ...T.bodyText,
              color: C.ink,
              margin: 0,
              textWrap: "pretty",
            }}
          >
            {lead
              ? t("signal.lead", { title: lead.title })
              : t("signal.leadNone")}
          </p>
          <div style={{ ...T.caption, color: C.faint, marginTop: 8 }}>
            {t("signal.countLine", {
              check: counts[2],
              watch: counts[1],
              note: counts[0],
            })}
          </div>
        </Card>
      )}

      <Group title={t("home.crossRead")} n={links.length}>
        {links.map((link, i) => (
          <DisclosureRow
            key={link.key}
            title={t(link.titleKey)}
            count={link.blood.length + link.composition.length}
            last={i === links.length - 1}
          >
            <LinkBody link={link} />
          </DisclosureRow>
        ))}
      </Group>

      <Group title={t("home.signalsRow")} n={signals.length}>
        {signals.map((sig, i) => (
          <DisclosureRow
            key={sig.key}
            level={sig.severity}
            title={t(sig.titleKey)}
            meta={sig.systems.map((k) => t(`sys.${k}`)).join(" · ")}
            count={sig.evidence.length}
            defaultOpen={lead?.id === `sig:${sig.key}`}
            last={i === signals.length - 1}
          >
            <SignalBody signal={sig} />
          </DisclosureRow>
        ))}
      </Group>

      {risks.length > 0 && (
        <Group title={t("home.risksRow")} n={risks.length}>
          {/* The disclaimer belongs above the conditions, not inside each one. */}
          <div style={{ padding: "12px 16px 4px" }}>
            <Badge color={C.watch} tint={C.watchTint}>
              {t("dx.beta")}
            </Badge>
            <p
              style={{
                ...T.caption,
                color: C.faint,
                margin: "8px 0 0",
                lineHeight: 1.6,
                textWrap: "pretty",
              }}
            >
              {t("dx.note")}
            </p>
          </div>
          {risks.map((risk, i) => (
            <DisclosureRow
              key={risk.key}
              level={riskLevel(risk)}
              title={t(risk.nameKey)}
              meta={t(risk.specialtyKey)}
              count={risk.findings.length}
              defaultOpen={lead?.id === `dx:${risk.key}`}
              last={i === risks.length - 1}
            >
              <RiskBody risk={risk} />
            </DisclosureRow>
          ))}
        </Group>
      )}
    </div>
  );
}

/** A heading and the rows under it. Renders nothing when the group is empty. */
function Group({ title, n, children }) {
  if (!n) return null;
  return (
    <>
      <SectionTitle value={String(n)}>{title}</SectionTitle>
      <Card variant="group" style={{ overflow: "hidden", padding: 0 }}>
        {children}
      </Card>
    </>
  );
}

/**
 * One cross-system pattern. The evidence list is the point: a claim about a
 * combination has to show the readings it was built from.
 */
function SignalBody({ signal }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);

  return (
    <div>
      <p
        style={{
          ...T.bodyText,
          color: C.body,
          margin: 0,
          textWrap: "pretty",
        }}
      >
        {t(signal.bodyKey, signal.stats)}
      </p>

      <div style={{ marginTop: 11 }}>
        <DisclosureButton
          open={open}
          onClick={() => setOpen((v) => !v)}
          label={t("ix.evidence")}
          hint={`${signal.evidence.length}`}
        />
        <Collapse open={open}>
          <div style={{ padding: "11px 2px 2px" }}>
            {signal.evidence.map((e) => (
              <div
                key={e.marker.name}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 6,
                }}
              >
                <span style={{ ...T.caption, color: C.ink, flex: 1 }}>
                  {e.marker.name}
                </span>
                <span
                  style={{
                    ...T.num,
                    fontSize: 12,
                    color: LEVEL_COLOR[e.level],
                  }}
                >
                  {formatValue(e.value, e.marker.dp)}
                </span>
                <span
                  style={{
                    ...T.caption,
                    color: C.faintest,
                    width: 58,
                    textAlign: "right",
                  }}
                >
                  {e.marker.unit || "—"}
                </span>
              </div>
            ))}
            {/* Why a pattern beats a single reading — it belongs with the
                evidence, not above it as a standing disclaimer. */}
            {signal.stats && (
              <div
                style={{
                  background: C.surfaceSunken,
                  borderRadius: R.inner,
                  padding: "10px 12px",
                  marginTop: 12,
                }}
              >
                <p
                  style={{
                    ...T.caption,
                    color: C.muted,
                    margin: 0,
                    textWrap: "pretty",
                  }}
                >
                  {t("ix.trajectoryNote")}
                </p>
              </div>
            )}
            <p
              style={{
                ...T.caption,
                color: C.muted,
                margin: "12px 0 0",
                textWrap: "pretty",
              }}
            >
              {t(signal.actionKey)}
            </p>
          </div>
        </Collapse>
      </div>
    </div>
  );
}
