import { useState } from "react";
import { Collapse, DisclosureButton } from "./Collapse";
import { C, DIVIDER, EASE, LEVEL_COLOR, R, T } from "../tokens";
import { formatRisk } from "../data/bayes";
import { useT } from "../i18n";

/**
 * One condition estimate — the body of a row, not a card.
 *
 * The card shell, the section heading and the "opens closed" disclosure all
 * moved out to `DisclosureRow` in the Signals screen, which now collapses every
 * finding to a line. The ethical property that made the old shell worth having
 * survives the move and is stronger for it: a list of diseases you might have,
 * unfolded on arrival, is a worry generator regardless of what the numbers say,
 * and now the row itself is what stays shut.
 *
 * What is left here is the one decision that has to live with the numbers: the
 * prior is shown at the same size as the posterior, on the same line. Most
 * health products print the scary number alone. Printing "12 per million →
 * 1.2%" side by side is what makes it information instead of a scare — the
 * reader sees both that the odds moved a thousandfold and that they are still
 * around one in a hundred.
 */
export function riskLevel(risk) {
  // Absolute risk, not the multiplier, sets the tone: a thousandfold shift to
  // 1.2% is not an emergency and must not be coloured like one.
  return risk.posterior >= 0.25 ? 2 : risk.posterior >= 0.08 ? 1 : 0;
}

export default function RiskBody({ risk }) {
  const t = useT();
  const [showWork, setShowWork] = useState(false);
  const level = riskLevel(risk);

  return (
    <div>
      {/* prior → posterior, at the same weight. Two columns rather than a
          single row: the Korean labels are long, and a label that wraps under
          its own figure stops reading as a pair. */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "end",
          gap: 10,
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
              <div style={{ ...T.label, color: C.faint }}>
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
    </div>
  );
}

function Figure({ label, value, color = C.ink, muted }) {
  return (
    <span style={{ minWidth: 0 }}>
      <span
        style={{
          ...T.caption,
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
