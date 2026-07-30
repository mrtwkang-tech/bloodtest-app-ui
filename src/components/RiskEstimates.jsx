import { useState } from "react";
import { Card, Badge, SectionTitle } from "./primitives";
import { Collapse, DisclosureButton } from "./Collapse";
import Icon from "./Icon";
import { C, DIVIDER, EASE, LEVEL_COLOR, R, T, tint } from "../tokens";
import { formatRisk, riskEstimates } from "../data/bayes";
import { useT } from "../i18n";

/**
 * Condition estimates.
 *
 * Two design decisions carry the ethics of this screen.
 *
 * First, it opens closed. A list of diseases you might have, unfolded on
 * arrival, is a worry generator regardless of what the numbers say — so the
 * section states what it is and how many conditions it has arithmetic for, and
 * waits to be asked.
 *
 * Second, the prior is shown at the same size as the posterior, on the same
 * line. Most health products print the scary number alone. Printing "12 per
 * million → 1.2%" side by side is what makes it information instead of a
 * scare: the reader can see both that the odds moved a thousandfold and that
 * they are still around one in a hundred.
 */
export default function RiskEstimates({ roundIndex, embedded }) {
  const t = useT();
  const [open, setOpen] = useState(Boolean(embedded));
  const risks = riskEstimates(roundIndex);
  if (risks.length === 0) return null;

  const body = (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
        paddingTop: embedded ? 0 : 10,
      }}
    >
      {risks.map((r) => (
        <RiskCard key={r.key} risk={r} />
      ))}
    </div>
  );

  if (embedded) {
    return (
      <>
        <div style={{ margin: "0 2px 12px" }}>
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
        {body}
      </>
    );
  }

  return (
    <>
      <SectionTitle value={String(risks.length)}>{t("dx.title")}</SectionTitle>
      <div style={{ margin: "0 2px 9px" }}>
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

      <DisclosureButton
        open={open}
        onClick={() => setOpen((v) => !v)}
        label={t("dx.title")}
        hint={String(risks.length)}
      />
      <Collapse open={open}>{body}</Collapse>
    </>
  );
}

function RiskCard({ risk }) {
  const t = useT();
  const [showWork, setShowWork] = useState(false);
  // Absolute risk, not the multiplier, sets the tone: a thousandfold shift to
  // 1.2% is not an emergency and must not be coloured like one.
  const level = risk.posterior >= 0.25 ? 2 : risk.posterior >= 0.08 ? 1 : 0;

  return (
    <Card style={{ padding: "15px 17px 13px" }}>
      <div style={{ ...T.title3, color: C.ink }}>{t(risk.nameKey)}</div>
      <div style={{ ...T.micro, color: C.faintest, marginTop: 4 }}>
        {t(risk.specialtyKey)}
      </div>

      {/* prior → posterior, at the same weight. Two columns rather than a
          single row: the Korean labels are long, and a label that wraps under
          its own figure stops reading as a pair. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "end",
          gap: 10,
          marginTop: 14,
        }}
      >
        <Figure label={t("dx.prior")} value={formatRisk(risk.prior)} muted />
        <span
          aria-hidden="true"
          style={{
            ...T.readout,
            color: C.faintest,
            paddingBottom: 4,
          }}
        >
          →
        </span>
        <Figure
          label={t("dx.posterior")}
          value={formatRisk(risk.posterior)}
          color={LEVEL_COLOR[level]}
        />
      </div>

      {/* The bar is a hundred squares; the filled ones are the posterior. This
          is the frequency format — "1 of 100" is understood correctly far more
          often than "1.2%". */}
      <Frequency p={risk.posterior} color={LEVEL_COLOR[level]} />

      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 11,
        }}
      >
        <span style={{ ...T.micro, color: LEVEL_COLOR[level], flex: "none" }}>
          {t("dx.multiple", { n: Math.round(risk.multiple).toLocaleString() })}
        </span>
        <span
          style={{
            ...T.caption,
            color: C.muted,
            flex: 1,
            minWidth: 0,
          }}
        >
          {risk.posterior < 0.08 ? t("dx.stillLow") : t("dx.worthAsking")}
        </span>
      </div>

      <div style={{ marginTop: 12 }}>
        <DisclosureButton
          open={showWork}
          onClick={() => setShowWork((v) => !v)}
          label={t("dx.evidence")}
          hint={`×${risk.lr < 10 ? risk.lr.toFixed(1) : Math.round(risk.lr).toLocaleString()}`}
        />
        <Collapse open={showWork}>
          <div style={{ padding: "11px 2px 2px" }}>
            <div
              style={{
                ...T.caption,
                color: C.faint,
                paddingBottom: 9,
                boxShadow: DIVIDER,
              }}
            >
              {t(risk.priorNoteKey)}
            </div>
            {risk.findings.map((f) => (
              <div
                key={f.key}
                style={{
                  display: "flex",
                  alignItems: "baseline",
                  gap: 8,
                  marginTop: 9,
                }}
              >
                <span style={{ ...T.caption, color: C.ink, flex: 1 }}>
                  {t(f.labelKey)}
                  {f.detail && (
                    <span style={{ ...T.micro, color: C.faintest }}>
                      {"  "}
                      {f.detail}
                    </span>
                  )}
                </span>
                <span
                  style={{
                    ...T.num,
                    fontSize: 12,
                    color: f.against ? C.optimal : C.watch,
                  }}
                >
                  ×{f.lr}
                </span>
                <span
                  style={{
                    ...T.micro,
                    color: C.faintest,
                    width: 44,
                    textAlign: "right",
                  }}
                >
                  {f.against ? t("dx.lrAgainst") : t("dx.lrFor")}
                </span>
              </div>
            ))}

            <div
              style={{
                marginTop: 14,
                padding: "11px 13px",
                borderRadius: R.inner,
                background: C.surfaceSunken,
              }}
            >
              <div style={{ ...T.micro, color: C.faint }}>
                {t("dx.confirmTitle")}
              </div>
              <p
                style={{
                  ...T.caption,
                  color: C.body,
                  margin: "5px 0 0",
                  textWrap: "pretty",
                }}
              >
                {t(risk.confirmKey)}
              </p>
            </div>
          </div>
        </Collapse>
      </div>
    </Card>
  );
}

function Figure({ label, value, color = C.ink, muted }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span
        style={{
          ...T.micro,
          color: C.faintest,
          display: "block",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </span>
      <span
        style={{
          ...T.num,
          fontSize: muted ? 17 : 24,
          fontWeight: 600,
          color: muted ? C.faint : color,
          lineHeight: 1.1,
          display: "block",
          marginTop: 3,
        }}
      >
        {value}
      </span>
    </span>
  );
}

/** 100 cells; the filled ones are the risk. Rounds up so 0.4% shows one cell. */
function Frequency({ p, color }) {
  const filled = Math.max(1, Math.ceil(p * 100));
  return (
    <div
      aria-hidden="true"
      style={{
        display: "grid",
        // 50 across, two rows deep: still exactly a hundred people, half the
        // vertical cost of a 25-column grid.
        gridTemplateColumns: "repeat(50, 1fr)",
        gap: 1.5,
        marginTop: 12,
      }}
    >
      {Array.from({ length: 100 }, (_, i) => (
        <span
          key={i}
          style={{
            height: 5,
            borderRadius: 1,
            background: i < filled ? color : C.surfaceSunken,
            transition: `background 420ms ${EASE}`,
          }}
        />
      ))}
    </div>
  );
}
