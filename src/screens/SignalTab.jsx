import { useState } from "react";
import DisclosureRow from "../components/DisclosureRow";
import NextStep from "../components/NextStep";
import RiskBody, { riskLevel } from "../components/RiskEstimates";
import SessionChips from "../components/SessionChips";
import { LinkBody } from "../components/InBodyPanel";
import { Collapse, DisclosureButton } from "../components/Collapse";
import { Badge, Card, SectionTitle } from "../components/primitives";
import {
  C,
  DIVIDER_TOP,
  LEVEL_COLOR,
  LEVEL_LAMP,
  R,
  T,
  fadeUp,
} from "../tokens";
import { formatValue } from "../data/body";
import { interactionsFor } from "../data/interactions";
import { riskEstimates } from "../data/bayes";
import { inbodyLinksFor } from "../data/inbody";
import { plainKeyOf } from "../data/plainNames";
import { SESSIONS } from "../data/sessions";
import { useLang } from "../i18n";

/**
 * Everything that only exists when the panels are read together.
 *
 * NOT EVERYTHING DESERVES A ROW.
 *
 * The first version of this screen printed all twelve findings as open cards
 * and ran to 2843px. The second collapsed all twelve to rows, which halved the
 * scrolling and was still wrong: twelve identical rows is twelve pieces of
 * latent work, and a list of things to click is not the same as a clean screen.
 * Folding is a way of storing information, not a way of deciding about it.
 *
 * So this version decides. Three tiers, shaped differently on purpose because
 * they deserve different amounts of the reader's life:
 *
 *   THE LEAD    one finding, as prose, already open. No row, no chrome, no tap.
 *               If the screen has a point, the point should be readable.
 *   WATCH       the other findings that are asking for something. A row each,
 *               because there are two or three and each is a real decision.
 *   CONTEXT     everything that changes how a number reads without warning
 *               about anything — the cross-reads, and any condition whose odds
 *               barely moved. These were five rows. They are one line now,
 *               because "five things that are fine" is one fact, not five.
 *
 * Twelve rows became one paragraph, a few rows, and a line.
 */
export default function SignalTab({ sel, onPickSession }) {
  const { t } = useLang();
  const roundIndex = SESSIONS[sel].roundIndex;

  const links = inbodyLinksFor(roundIndex);
  const signals = interactionsFor(roundIndex);
  const risks = riskEstimates(roundIndex);

  // One shape for all three sources, so tiering is a sort rather than a
  // three-way branch repeated at every render site.
  const items = [
    ...signals.map((s) => ({
      id: `sig:${s.key}`,
      level: s.severity,
      title: t(s.titleKey),
      meta: s.systems.map((k) => t(`sys.${k}`)).join(" · "),
      count: s.evidence.length,
      body: <SignalBody signal={s} />,
    })),
    ...risks.map((r) => ({
      id: `dx:${r.key}`,
      level: riskLevel(r),
      title: t(r.nameKey),
      meta: t(r.specialtyKey),
      count: r.findings.length,
      body: <RiskBody risk={r} />,
    })),
    ...links.map((l) => ({
      // Cross-reads carry no severity, and correctly so: they change how a
      // number should be read rather than warning about it. One of them exists
      // purely to say a high creatinine is muscle, not kidneys.
      id: `link:${l.key}`,
      level: 0,
      title: t(l.titleKey),
      count: l.blood.length + l.composition.length,
      body: <LinkBody link={l} />,
    })),
  ].sort((a, b) => b.level - a.level);

  if (items.length === 0) {
    return (
      <Screen sel={sel} onPickSession={onPickSession}>
        <Card pad="md" delay={40}>
          <p style={{ ...T.bodyText, color: C.ink, margin: 0 }}>
            {t("signal.leadNone")}
          </p>
        </Card>
      </Screen>
    );
  }

  const [lead, ...rest] = items;
  const watch = rest.filter((i) => i.level > 0);
  const context = rest.filter((i) => i.level === 0);

  return (
    <Screen sel={sel} onPickSession={onPickSession}>
      {/* The lead. Open, on the page, nothing between the reader and it. */}
      <Card pad="md" delay={40}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          {lead.level > 0 && (
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                flex: "none",
                background: LEVEL_LAMP[lead.level],
              }}
            />
          )}
          <span style={{ ...T.caption, color: C.faint }}>
            {t(lead.level > 0 ? "signal.leadLabel" : "signal.contextLabel")}
          </span>
        </div>
        <h2 style={{ ...T.title2, color: C.ink, margin: "8px 0 0" }}>
          {lead.title}
        </h2>
        {lead.meta && (
          <div style={{ ...T.caption, color: C.faintest, marginTop: 4 }}>
            {lead.meta}
          </div>
        )}
        <div style={{ marginTop: 12 }}>{lead.body}</div>
      </Card>

      {watch.length > 0 && (
        <>
          <SectionTitle value={String(watch.length)}>
            {t("signal.watchTitle")}
          </SectionTitle>
          <Card variant="group" style={{ overflow: "hidden", padding: 0 }}>
            {watch.map((item, i) => (
              <DisclosureRow
                key={item.id}
                level={item.level}
                title={item.title}
                meta={item.meta}
                count={item.count}
                last={i === watch.length - 1}
              >
                {item.body}
              </DisclosureRow>
            ))}
          </Card>
        </>
      )}

      {context.length > 0 && (
        <div style={{ marginTop: 18 }}>
          <Card variant="group" style={{ overflow: "hidden", padding: 0 }}>
            {/* One line for the whole tier. Five things that are fine is one
                fact about this round, not five things to work through. */}
            <DisclosureRow
              title={t("signal.contextTitle")}
              meta={t("signal.contextNote")}
              count={context.length}
              last
            >
              {context.map((item, i) => (
                <div
                  key={item.id}
                  style={
                    i === 0
                      ? null
                      : {
                          marginTop: 14,
                          paddingTop: 14,
                          boxShadow: DIVIDER_TOP,
                        }
                  }
                >
                  <div style={{ ...T.label, color: C.ink }}>{item.title}</div>
                  <div style={{ marginTop: 7 }}>{item.body}</div>
                </div>
              ))}
            </DisclosureRow>
          </Card>
        </div>
      )}

      {/* Conditions are estimated, not diagnosed, and the reader has now seen
          at least one. Said once at the end rather than above every card. */}
      {risks.length > 0 && (
        <div style={{ margin: "16px 2px 0" }}>
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
      )}
    </Screen>
  );
}

function Screen({ sel, onPickSession, children }) {
  const { t } = useLang();
  return (
    <div>
      <header style={fadeUp(0)}>
        <h1 style={{ ...T.title1, color: C.ink, margin: 0 }}>
          {t("signal.title")}
        </h1>
        <div style={{ ...T.caption, color: C.faint, marginTop: 5 }}>
          {t("signal.subtitle2")}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>
      {children}
    </div>
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
        style={{ ...T.bodyText, color: C.body, margin: 0, textWrap: "pretty" }}
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
                  {plainKeyOf(e.marker)
                    ? t(plainKeyOf(e.marker))
                    : e.marker.name}
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
          </div>
        </Collapse>
      </div>

      <NextStep label={t("signal.nextStep")}>
        {signal.actionKey ? t(signal.actionKey) : null}
      </NextStep>
    </div>
  );
}
