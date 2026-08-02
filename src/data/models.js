import { EPIGEN } from "./epigenetics";
import { pctToM } from "./panel";
import { ROUNDS } from "./body";
import { slopeTest } from "../lib/stats";

/**
 * The models, declared rather than hidden.
 *
 * WHAT THE SOURCE DOCUMENT ASKS FOR, and what is honestly buildable.
 *
 * The plan is machine learning in two places: screening candidate CpGs out of
 * multi-omics data (TCGA plus an own cohort), and predicting future cell age
 * and disease risk. The first is a discovery problem and does not run in a
 * phone — it belongs in `docs/ai-pipeline.md`. The second does run here, and
 * the question is what class of model is defensible.
 *
 * The answer is: a small linear one. Not as a compromise — as the correct
 * choice. Horvath's clock and DunedinPACE, the two things this prediction is
 * modelled on, ARE penalised linear regressions over a few hundred CpGs. With
 * 450k–935k probes against a cohort of hundreds, p ≫ n by three orders of
 * magnitude, and a deep network there is a well-documented way to memorise the
 * batch structure of your own plates. For risk, the app already does the right
 * thing in bayes.js: likelihood ratios in odds form, where what matters for a
 * screening test is calibration rather than discrimination, and where every
 * step is auditable by the clinician the reader is being sent to.
 *
 * SO WHY IS THERE A MODEL HERE AT ALL, given the panel is hypothetical and
 * there is no training set? Because the thing worth building now is the
 * INSTRUMENT — the path from a raw plate to a number a reader sees — with the
 * model slot cut to the right shape and visibly empty. Every model below
 * declares its inputs, its coefficients, how many samples it was fitted on
 * (zero) and whether it has ever been validated (no), and the model card
 * renders those fields as prominently as the prediction. A number whose
 * provenance is on the same screen is a number a reader can discount
 * correctly.
 *
 * The coefficients are illustrative and say so. When a real fit exists, it
 * replaces `coefficients`, `trainingN` and `validation` — and nothing else in
 * the app has to change.
 */

/**
 * Look up a methylation marker, and refuse anything that is not a beta.
 *
 * The M/beta rule has to be enforced somewhere or it is just a comment. The
 * same panel carries CpG readings in "% me" AND composite indices that are
 * unitless scores — DNAm cortisol, PER2/CLOCK, DunedinPACE. Taking the logit
 * of a composite index is not a units error a reviewer would catch from the
 * output; it produces a plausible-looking number from a meaningless operation.
 * So the clock may only cite a marker the plate actually reports as a fraction
 * methylated.
 */
function epiBeta(name) {
  const m = EPIGEN.markers.find((x) => x.name === name);
  if (!m) throw new Error(`models: unknown methylation marker ${name}`);
  if (m.unit !== "% me") {
    throw new Error(
      `models: ${name} is a composite index, not a beta — it has no logit`,
    );
  }
  return m;
}

/**
 * A penalised-regression clock, in the form a real one takes: an intercept
 * plus a weighted sum over CpGs, evaluated in M rather than beta because that
 * is the scale a linear fit is valid on.
 */
const CELL_AGE = {
  id: "cellAge",
  kind: "elastic-net",
  labelKey: "model.cellAge",
  unitKey: "model.years",
  dp: 1,
  // Centred so the fixture lands near its subject's calendar age; a clock
  // whose intercept is not centred reports everyone as a child.
  intercept: 50.74,
  // name → weight, in years per unit M. CpG betas only — see epiBeta.
  coefficients: {
    "FKBP5 intron 7": -1.9,
    "NR3C1 exon 1F": 2.4,
    "SLC6A4 promoter": 1.1,
    "BDNF promoter IV": -1.4,
    "COMT Val158 CpG": 0.6,
    "OXTR −934 CpG": 0.5,
  },
  trainingN: 0,
  validation: null,
  provenance: "illustrative",
  predict(roundIndex) {
    const contributions = Object.entries(this.coefficients).map(
      ([name, weight]) => {
        const marker = epiBeta(name);
        const pct = marker.demo[roundIndex];
        // Beta is what the plate reports and what the reader is shown; M is
        // what the model is allowed to do arithmetic on.
        const m = pctToM(pct);
        return {
          name,
          plainKey: marker.plainKey,
          beta: pct,
          m,
          weight,
          amount: m * weight,
        };
      },
    );
    const value =
      this.intercept + contributions.reduce((s, c) => s + c.amount, 0);
    return {
      value,
      contributions: contributions.sort(
        (a, b) => Math.abs(b.amount) - Math.abs(a.amount),
      ),
    };
  },
};

/**
 * How fast the clock is running, from the rounds so far.
 *
 * Ordinary least squares on the twelve monthly estimates, reported with the
 * standard error of the slope. The error bar is not decoration: with twelve
 * points and a clock whose own noise is unmeasured, the honest output is a
 * range, and a product that shows a bare "1.08× 노화 속도" is claiming a
 * precision it does not have.
 */
const PACE = {
  id: "pace",
  kind: "ols-slope",
  labelKey: "model.pace",
  unitKey: "model.perYear",
  dp: 2,
  trainingN: 0,
  validation: null,
  provenance: "derived",
  predict(roundIndex) {
    const n = roundIndex + 1;
    if (n < 3) return { value: null, contributions: [], se: null, n };
    const ys = [];
    for (let i = 0; i <= roundIndex; i++) ys.push(CELL_AGE.predict(i).value);
    // `slopeTest` regresses on the index, so its slope is per ROUND and this
    // one is per YEAR. Twelve rounds a year, hence the factor — and the same
    // factor on the standard error, since scaling x by k scales both by k.
    const fit = slopeTest(ys);
    return {
      value: fit.slope * 12,
      se: fit.se == null ? null : fit.se * 12,
      n,
      contributions: [],
    };
  },
};

export const MODELS = [CELL_AGE, PACE];

export function modelById(id) {
  return MODELS.find((m) => m.id === id);
}

/**
 * Cell age against calendar age. The gap is the number people actually read,
 * so it is computed in one place rather than in each screen.
 */
export function cellAgeReport(roundIndex, calendarAge) {
  const { value, contributions } = CELL_AGE.predict(roundIndex);
  return {
    value,
    gap: value - calendarAge,
    contributions,
    model: CELL_AGE,
  };
}

export function paceReport(roundIndex) {
  return { ...PACE.predict(roundIndex), model: PACE };
}

/** Rounds available, for the forecast's honesty note. */
export const MODEL_ROUNDS = ROUNDS;
