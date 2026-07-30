import { readMarker } from "./panels";
import { COMPOSITION } from "./inbody";

/**
 * WHAT A SCREEN LIKE THIS CAN HONESTLY SAY ABOUT A DISEASE.
 *
 * Not "you may have X". A panel of markers cannot diagnose, and a product that
 * implies otherwise is doing harm. What it CAN do is arithmetic that is
 * completely defensible: start from how common a condition is in someone of
 * this age, multiply by how much each finding shifts the odds, and report where
 * that lands. That is Bayes' rule, and it is the only form in which a number
 * like this means anything.
 *
 *     posterior odds = prior odds × LR₁ × LR₂ × …
 *
 * Two things fall out of doing it properly, and both are worth showing:
 *
 * 1. The posterior is usually still SMALL. A finding with a likelihood ratio of
 *    40 sounds alarming until you multiply it by a base rate of 12 per million
 *    and get 1.7%. Printing that number is the honest antidote to the way most
 *    health products talk — the reader learns their risk went up 1400-fold AND
 *    that it is still under two in a hundred.
 * 2. The multiplier is the actionable part. Going from 0.0012% to 1.7% is not a
 *    diagnosis, it is a reason to do the confirmatory test that CAN diagnose.
 *
 * The likelihood ratios below are order-of-magnitude figures chosen to be
 * plausible for demo data. They are not extracted from a validated model, and
 * every surface that renders one says so.
 */

/** Probability → odds and back. */
const toOdds = (p) => p / (1 - p);
const toProb = (o) => o / (1 + o);

function series(panelKey, name) {
  const { marker } = readMarker(panelKey, name, 0);
  return marker.demo;
}

/** Same monotonic test the trajectory rules use. */
function rising(s, upto, n = 4, up = true) {
  const w = s.slice(Math.max(0, upto - n + 1), upto + 1);
  return w.every((v, i) => i === 0 || (up ? v > w[i - 1] : v < w[i - 1]));
}

function growth(s, upto, n = 4) {
  const w = s.slice(Math.max(0, upto - n + 1), upto + 1);
  if (w.length < 3 || w[0] <= 0) return 0;
  return Math.pow(w[w.length - 1] / w[0], 1 / (w.length - 1)) - 1;
}

/**
 * Each condition names its prior, then lists findings that are only counted
 * when they are actually present. `lr` above 1 argues for, below 1 argues
 * against — and the "against" entries matter: a model that can only ever raise
 * your risk is not a model.
 */
const CONDITIONS = [
  {
    key: "hcc",
    nameKey: "dx.hcc.name",
    specialtyKey: "spec.hepatic",
    // Annual incidence of hepatocellular carcinoma, 30–39, per 100,000.
    prior: 1.2 / 100000,
    priorNoteKey: "dx.hcc.prior",
    confirmKey: "dx.hcc.confirm",
    findings(r) {
      const afp = series("oncology", "AFP");
      const ggt = series("hepatic", "GGT");
      const fib = series("hepatic", "FIB-4");
      const plt = series("hematology", "Platelets");
      const weight = COMPOSITION.find((c) => c.key === "weight").demo;
      const out = [];

      if (rising(afp, r) && growth(afp, r) >= 0.25) {
        out.push({
          key: "afpRise",
          labelKey: "dx.f.afpRise",
          lr: 40,
          detail: `AFP +${Math.round(growth(afp, r) * 100)}%/round × 4`,
        });
      }
      if (rising(fib, r)) {
        out.push({
          key: "fib",
          labelKey: "dx.f.fib",
          lr: 4,
          detail: `FIB-4 ${fib[r].toFixed(2)}`,
        });
      }
      if (rising(plt, r, 4, false)) {
        out.push({
          key: "plt",
          labelKey: "dx.f.plt",
          lr: 3,
          detail: `Platelets ${Math.round(plt[r])}`,
        });
      }
      if (rising(ggt, r)) {
        out.push({
          key: "ggt",
          labelKey: "dx.f.ggt",
          lr: 2,
          detail: `GGT ${Math.round(ggt[r])}`,
        });
      }
      if (r >= 2 && (weight[r - 2] - weight[r]) / weight[r - 2] > 0.03) {
        out.push({
          key: "loss",
          labelKey: "dx.f.loss",
          lr: 3,
          detail: `−${(weight[r - 2] - weight[r]).toFixed(1)} kg`,
        });
      }
      // Nothing here is a viral hepatitis or cirrhosis history, which is what
      // most of the population risk for this actually rides on.
      out.push({
        key: "noHbv",
        labelKey: "dx.f.noHbv",
        lr: 0.35,
        against: true,
      });
      return out;
    },
  },
  {
    key: "fibrosis",
    nameKey: "dx.fibrosis.name",
    specialtyKey: "spec.hepatic",
    // Significant fibrosis (≥F2) in a metabolically-at-risk adult.
    prior: 0.06,
    priorNoteKey: "dx.fibrosis.prior",
    confirmKey: "dx.fibrosis.confirm",
    findings(r) {
      const fib = series("hepatic", "FIB-4");
      const ggt = series("hepatic", "GGT");
      const plt = series("hematology", "Platelets");
      const alb = series("hepatic", "Albumin");
      const out = [];
      if (fib[r] >= 1.3) {
        out.push({
          key: "fibHigh",
          labelKey: "dx.f.fibHigh",
          lr: 2.5,
          detail: `FIB-4 ${fib[r].toFixed(2)}`,
        });
      } else if (rising(fib, r)) {
        out.push({
          key: "fibTrend",
          labelKey: "dx.f.fibTrend",
          lr: 1.8,
          detail: `FIB-4 ${fib[r].toFixed(2)}`,
        });
      }
      if (rising(ggt, r)) {
        out.push({
          key: "ggt2",
          labelKey: "dx.f.ggt",
          lr: 1.5,
          detail: `GGT ${Math.round(ggt[r])}`,
        });
      }
      if (rising(plt, r, 4, false)) {
        out.push({
          key: "plt2",
          labelKey: "dx.f.plt",
          lr: 2,
          detail: `Platelets ${Math.round(plt[r])}`,
        });
      }
      if (alb[r] >= 3.8) {
        out.push({
          key: "alb",
          labelKey: "dx.f.alb",
          lr: 0.6,
          against: true,
          detail: `Albumin ${alb[r].toFixed(1)}`,
        });
      }
      return out;
    },
  },
  {
    key: "t2d",
    nameKey: "dx.t2d.name",
    specialtyKey: "spec.endocrine",
    // Five-year risk of progressing to type 2 diabetes, general adult.
    prior: 0.04,
    priorNoteKey: "dx.t2d.prior",
    confirmKey: "dx.t2d.confirm",
    findings(r) {
      const a1c = readMarker("endocrine", "HbA1c", r);
      const glu = readMarker("endocrine", "Fasting glucose", r);
      const ins = readMarker("endocrine", "Fasting insulin", r);
      const vis = COMPOSITION.find((c) => c.key === "visceral").demo;
      const a1cSeries = series("endocrine", "HbA1c");
      const out = [];
      if (a1c.value >= 5.7) {
        out.push({
          key: "a1c",
          labelKey: "dx.f.a1c",
          lr: 3.5,
          detail: `HbA1c ${a1c.value.toFixed(1)}%`,
        });
      }
      if (rising(a1cSeries, r)) {
        out.push({ key: "a1cTrend", labelKey: "dx.f.a1cTrend", lr: 1.8 });
      }
      if (glu.value >= 100) {
        out.push({
          key: "glu",
          labelKey: "dx.f.glu",
          lr: 1.6,
          detail: `${Math.round(glu.value)} mg/dL`,
        });
      }
      if (vis[r] >= 85) {
        out.push({
          key: "vis",
          labelKey: "dx.f.vis",
          lr: 1.4,
          detail: `${Math.round(vis[r])} cm²`,
        });
      }
      if (ins.value < 12) {
        out.push({
          key: "ins",
          labelKey: "dx.f.ins",
          lr: 0.7,
          against: true,
          detail: `${ins.value.toFixed(1)} μIU/mL`,
        });
      }
      return out;
    },
  },
];

/**
 * Posterior for every condition at one round, most-shifted first.
 *
 * `shown` gates the UI: the arithmetic runs on everything, but a result is only
 * surfaced when the findings actually moved the needle. Printing a condition
 * whose odds did not change would be pure alarm with no information in it.
 */
export function riskEstimates(roundIndex) {
  return CONDITIONS.map((c) => {
    const findings = c.findings(roundIndex);
    const lr = findings.reduce((acc, f) => acc * f.lr, 1);
    const posterior = toProb(toOdds(c.prior) * lr);
    return {
      ...c,
      findings,
      lr,
      posterior,
      multiple: posterior / c.prior,
      // Either the absolute risk is now worth a conversation, or the shift is
      // large enough that the trajectory is the finding.
      shown: posterior >= 0.08 || (lr >= 20 && posterior >= 0.005),
    };
  })
    .filter((c) => c.shown)
    .sort((a, b) => b.posterior - a.posterior);
}

/** 1.7% · 0.6% · 34% — never more precision than the model can support. */
export function formatRisk(p) {
  if (p >= 0.1) return `${Math.round(p * 100)}%`;
  if (p >= 0.01) return `${(p * 100).toFixed(1)}%`;
  if (p >= 0.001) return `${(p * 100).toFixed(2)}%`;
  return `${(p * 100).toPrecision(1)}%`;
}
