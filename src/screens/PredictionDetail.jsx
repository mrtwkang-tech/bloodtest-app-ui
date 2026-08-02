import { useState } from "react";
import { Collapse, DisclosureButton } from "../components/Collapse";
import { Display } from "../components/primitives";
import { C, DIVIDER, DIVIDER_TOP, T } from "../tokens";
import { cellAgeReport, paceReport } from "../data/models";
import { PROFILE, SESSIONS } from "../data/sessions";
import { useT } from "../i18n";

/**
 * What the models say, and what they are.
 *
 * The document's goal for this screen is "미래 세포 나이와 질병 위험도 예측".
 * The prediction is here. So is the fact that nothing behind it has been
 * trained or validated, at the same size, on the same screen — because a
 * number's provenance is only useful where the number is.
 *
 * That is not hedging. A cell age of 38.2 from a fitted, validated clock and a
 * cell age of 38.2 from six illustrative coefficients are different objects
 * that happen to print the same. The only way a reader can tell them apart is
 * if the screen says which one it is holding.
 */
export default function PredictionDetail({ sel }) {
  const t = useT();
  const session = SESSIONS[sel];
  const age = cellAgeReport(session.roundIndex, PROFILE.age);
  const pace = paceReport(session.roundIndex);

  return (
    <div>
      <div style={{ ...T.caption, color: C.faint }}>{t("model.cellAge")}</div>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          marginTop: 2,
        }}
      >
        <Display size={48}>{age.value.toFixed(1)}</Display>
        <span style={{ ...T.caption, color: C.faint }}>
          {t("model.vsCalendar", {
            age: PROFILE.age,
            gap: `${age.gap > 0 ? "+" : ""}${age.gap.toFixed(1)}`,
          })}
        </span>
      </div>

      {/* The pace, with its interval. A slope from twelve points over a clock
          whose own noise is unmeasured is not a point estimate, and printing
          it as one would be the single most misleading thing on this screen. */}
      <div style={{ marginTop: 18, paddingTop: 14, boxShadow: DIVIDER_TOP }}>
        <div style={{ ...T.caption, color: C.faint }}>{t("model.pace")}</div>
        {pace.value == null ? (
          <div style={{ ...T.bodyText, color: C.body, marginTop: 4 }}>
            {t("model.paceTooFew", { n: pace.n })}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
              marginTop: 4,
            }}
          >
            <span style={{ ...T.num, fontSize: 22, color: C.ink }}>
              {pace.value.toFixed(2)}
            </span>
            <span style={{ ...T.caption, color: C.faint }}>
              {t("model.paceRange", {
                lo: (pace.value - 1.96 * pace.se).toFixed(2),
                hi: (pace.value + 1.96 * pace.se).toFixed(2),
                n: pace.n,
              })}
            </span>
          </div>
        )}
      </div>

      <ModelCard model={age.model} contributions={age.contributions} />
      <ModelCard model={pace.model} />

      <p
        style={{
          ...T.caption,
          color: C.faintest,
          margin: "20px 0 0",
          paddingTop: 14,
          boxShadow: DIVIDER_TOP,
          textWrap: "pretty",
        }}
      >
        {t("model.disclaimer")}
      </p>
    </div>
  );
}

/**
 * One model, opened up.
 *
 * Class, inputs, what each input contributed, how many samples it was fitted
 * on and whether it has ever been validated. The last two are the fields that
 * matter and they are not in small print.
 */
function ModelCard({ model, contributions }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const untrained = !model.trainingN;

  return (
    <div style={{ marginTop: 20, paddingTop: 16, boxShadow: DIVIDER_TOP }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ ...T.label, color: C.ink }}>{t(model.labelKey)}</span>
        <span style={{ ...T.micro, color: C.faintest, marginLeft: "auto" }}>
          {t(`model.kind.${model.kind}`)}
        </span>
      </div>

      <dl style={{ margin: "12px 0 0", display: "grid", gap: 8 }}>
        <Field
          label={t("model.training")}
          value={untrained ? t("model.trainingNone") : `n = ${model.trainingN}`}
          warn={untrained}
        />
        <Field
          label={t("model.validation")}
          value={model.validation ?? t("model.validationNone")}
          warn={!model.validation}
        />
        <Field
          label={t("model.provenance")}
          value={t(`model.provenance.${model.provenance}`)}
          warn={model.provenance === "illustrative"}
        />
      </dl>

      {contributions?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <DisclosureButton
            open={open}
            onClick={() => setOpen((v) => !v)}
            label={open ? t("body.showLess") : t("model.showTerms")}
            hint={t("model.nTerms", { n: contributions.length })}
          />
          <Collapse open={open}>
            <div style={{ padding: "12px 0 2px" }}>
              {/* Beta is what the plate reported; M is what the model
                  multiplied. Both are shown because the conversion is the
                  step a reader would otherwise have to take on trust. */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr auto auto auto",
                  gap: "0 10px",
                  ...T.micro,
                  color: C.faintest,
                  paddingBottom: 6,
                  boxShadow: DIVIDER,
                }}
              >
                <span>{t("model.term")}</span>
                <span style={{ textAlign: "right" }}>β%</span>
                <span style={{ textAlign: "right" }}>M</span>
                <span style={{ textAlign: "right" }}>{t("model.years")}</span>
              </div>
              {contributions.map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr auto auto auto",
                    gap: "0 10px",
                    alignItems: "baseline",
                    padding: "7px 0",
                    boxShadow: DIVIDER,
                  }}
                >
                  <span style={{ ...T.caption, color: C.ink, minWidth: 0 }}>
                    {c.plainKey ? t(c.plainKey) : c.name}
                  </span>
                  <span style={{ ...T.num, fontSize: 11.5, color: C.faint }}>
                    {c.beta.toFixed(1)}
                  </span>
                  <span style={{ ...T.num, fontSize: 11.5, color: C.faint }}>
                    {c.m.toFixed(2)}
                  </span>
                  <span
                    style={{
                      ...T.num,
                      fontSize: 11.5,
                      color: C.ink,
                      textAlign: "right",
                    }}
                  >
                    {c.amount > 0 ? "+" : ""}
                    {c.amount.toFixed(2)}
                  </span>
                </div>
              ))}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "9px 0 0",
                  ...T.caption,
                  color: C.body,
                }}
              >
                <span>{t("model.intercept")}</span>
                <span style={{ ...T.num, fontSize: 11.5 }}>
                  {model.intercept.toFixed(2)}
                </span>
              </div>
            </div>
          </Collapse>
        </div>
      )}
    </div>
  );
}

function Field({ label, value, warn }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
      <dt style={{ ...T.caption, color: C.faint, flex: 1 }}>{label}</dt>
      <dd
        style={{
          ...T.caption,
          color: warn ? C.watch : C.ink,
          margin: 0,
          textAlign: "right",
        }}
      >
        {value}
      </dd>
    </div>
  );
}
