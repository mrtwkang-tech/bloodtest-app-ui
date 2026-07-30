import { useState } from "react";
import Clamp from "../components/Clamp";
import InBodyPanel from "../components/InBodyPanel";
import RiskEstimates from "../components/RiskEstimates";
import { Collapse, DisclosureButton } from "../components/Collapse";
import {
  Badge,
  Card,
  DataRow,
  SectionLabel,
  Status,
} from "../components/primitives";
import { C, LEVEL_COLOR, R, T } from "../tokens";
import { formatValue } from "../data/body";
import { interactionsFor } from "../data/interactions";
import {
  SESSIONS,
  bodySummary,
  healthScore,
  mindSummary,
  pick,
} from "../data/sessions";
import { useLang } from "../i18n";

/**
 * The second layer of Home.
 *
 * Everything here used to sit on the first screen, which meant arriving at the
 * app put six sections and roughly nine paragraphs in front of someone whose
 * actual question was "am I alright?". None of it was wrong; all of it was
 * early. Each view below is one tap from Home and answers exactly one thing.
 */
export default function HomeDetail({ view, roundIndex, onOpenSession }) {
  const { t, lang } = useLang();

  if (view === "crossread") {
    return <InBodyPanel roundIndex={roundIndex} show="links" />;
  }

  if (view === "composition") {
    return <InBodyPanel roundIndex={roundIndex} show="panel" />;
  }

  if (view === "risks") {
    return <RiskEstimates roundIndex={roundIndex} embedded />;
  }

  if (view === "signals") {
    const signals = interactionsFor(roundIndex);
    return (
      <>
        <div style={{ margin: "0 2px 12px" }}>
          <Badge color={C.accent} tint={C.accentSoft}>
            {t("ix.beta")}
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
            {t("ix.note")}
          </p>
        </div>
        {signals.length === 0 ? (
          <Card style={{ padding: "14px 16px" }}>
            <Status color={C.optimalLamp}>{t("ix.none")}</Status>
          </Card>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {signals.map((sig) => (
              <SignalCard key={sig.key} signal={sig} />
            ))}
          </div>
        )}
      </>
    );
  }

  if (view === "history") {
    return (
      <Card style={{ overflow: "hidden" }}>
        {SESSIONS.map((s, i) => {
          const m = mindSummary(s);
          const b = bodySummary(s);
          const flagged = m.warn + b.flagged.length;
          return (
            <DataRow
              key={s.round}
              rank={SESSIONS.length - i}
              name={t("home.roundTest", { round: t("round.n", { n: s.round }) })}
              sub={pick(s.fullDate, lang)}
              value={healthScore(s)}
              color={flagged ? C.watchLamp : C.optimalLamp}
              last={i === SESSIONS.length - 1}
              onClick={() => onOpenSession(i)}
            />
          );
        })}
      </Card>
    );
  }

  return null;
}

/**
 * One cross-system pattern. The evidence list is the point: a claim about a
 * combination has to show the readings it was built from.
 */
function SignalCard({ signal }) {
  const { t } = useLang();
  const [open, setOpen] = useState(false);
  const color = LEVEL_COLOR[signal.severity];

  return (
    <Card style={{ padding: "14px 16px 12px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            flex: "none",
            marginTop: 6,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ ...T.title3, color: C.ink }}>{t(signal.titleKey)}</div>
          <div style={{ ...T.micro, color: C.faintest, marginTop: 4 }}>
            {signal.systems.map((k) => t(`sys.${k}`)).join(" · ")}
          </div>
        </div>
      </div>

      <Clamp lines={3} style={{ marginTop: 10 }}>
        {t(signal.bodyKey, signal.stats)}
      </Clamp>
      {signal.stats && (
        <div
          style={{
            background: C.surfaceSunken,
            borderRadius: R.inner,
            padding: "10px 12px",
            marginTop: 11,
          }}
        >
          <div style={{ ...T.micro, color: C.faint }}>
            {t("ix.whyLongitudinal")}
          </div>
          <p
            style={{
              ...T.caption,
              color: C.muted,
              margin: "5px 0 0",
              textWrap: "pretty",
            }}
          >
            {t("ix.trajectoryNote")}
          </p>
        </div>
      )}

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
                    ...T.micro,
                    color: C.faintest,
                    width: 58,
                    textAlign: "right",
                  }}
                >
                  {e.marker.unit || "—"}
                </span>
              </div>
            ))}
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
    </Card>
  );
}
