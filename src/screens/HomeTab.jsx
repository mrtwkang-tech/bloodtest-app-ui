import { useState } from "react";
import Pressable from "../components/Pressable";
import { Collapse, DisclosureButton } from "../components/Collapse";
import InBodyPanel from "../components/InBodyPanel";
import RiskEstimates from "../components/RiskEstimates";
import {
  Card,
  CountStrip,
  DataRow,
  Display,
  SectionLabel,
  SectionTitle,
  Status,
  Badge,
} from "../components/primitives";
import {
  C,
  EASE,
  LEVEL_COLOR,
  R,
  T,
  backlight,
  fadeUp,
} from "../tokens";
import { interactionsFor } from "../data/interactions";
import { formatValue } from "../data/body";
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
export default function HomeTab({ onGoStore, onOpenSession, onGoTab }) {
  const { t, lang } = useLang();
  const score = healthScore(latest);
  const counts = biomarkerCounts(latest);
  const signals = interactionsFor(latest.roundIndex);

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

      {/* The one number the whole panel resolves to. No tinted wash behind
          it: a coloured gradient under a number says nothing the number does
          not already say, and reads as decoration applied for its own sake. */}
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

      {/* Body composition lives here now, in full. It belongs on the
          whole-person screen rather than under the organ-system model: it is
          measured on a different instrument, on the same body, on the same
          schedule. */}
      <div style={{ marginTop: 10 }}>
        <InBodyPanel roundIndex={latest.roundIndex} delay={150} />
      </div>

      <div style={{ display: "flex", gap: 10, marginTop: 22, ...fadeUp(160) }}>
        <Card style={{ flex: 1, padding: "14px 16px" }}>
          <div style={{ ...T.micro, color: C.faint }}>{t("home.nextTest")}</div>
          <div style={{ ...T.title2, ...T.num, color: C.ink, marginTop: 7 }}>
            D-{PROFILE.nextInDays}
          </div>
          <div style={{ ...T.caption, color: C.faintest, marginTop: 3 }}>
            {pick(PROFILE.nextDate, lang)}
          </div>
          <div style={{ ...T.micro, color: C.faintest, marginTop: 5 }}>
            {t("home.tracked", {
              n: PROFILE.roundsSoFar,
              m: PROFILE.monthsTracked,
            })}
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
            // The one saturated fill on the screen, so it gets the one
            // coloured cast. Everything else stays flat.
            background: C.accent,
            boxShadow: backlight(C.accent),
            color: C.onAccent,
            textAlign: "left",
          }}
        >
          <div style={{ ...T.micro, opacity: 0.66 }}>
            {t("home.subscription")}
          </div>
          <div style={{ ...T.title3, marginTop: 7 }}>{t("home.buyKit")}</div>
          <div style={{ ...T.caption, opacity: 0.66, marginTop: 3 }}>→</div>
        </Pressable>
      </div>

      {/* Cross-system signals — combinations a single panel would not flag. */}
      <SectionTitle
        value={signals.length ? String(signals.length) : undefined}
        style={{ marginBottom: 8 }}
      >
        {t("ix.title")}
      </SectionTitle>
      <div style={{ marginBottom: 4, ...fadeUp(200) }}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            gap: 7,
            margin: "0 2px 9px",
          }}
        >
          <Badge color={C.accent} tint={C.accentSoft}>
            {t("ix.beta")}
          </Badge>
          <span
            style={{
              ...T.caption,
              color: C.faintest,
              flex: 1,
              lineHeight: 1.6,
              textWrap: "pretty",
            }}
          >
            {t("ix.note")}
          </span>
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
      </div>

      <RiskEstimates roundIndex={latest.roundIndex} />

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

      <p
        style={{
          ...T.bodyText,
          color: C.body,
          margin: "10px 0 0",
          textWrap: "pretty",
        }}
      >
        {t(signal.bodyKey, signal.stats)}
      </p>
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
