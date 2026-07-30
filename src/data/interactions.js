import { SYSTEMS, markerLevel } from "./body";
import { readMarker } from "./panels";
import { SCALE_META, scaleIndex } from "./scales";

/**
 * Cross-system signals — BETA.
 *
 * A per-specialty panel asks "is this marker out of range?". It cannot ask
 * "are these three in-range markers, in this combination, a pattern?" — and
 * that is where most of the clinically interesting stuff lives. Residual
 * inflammatory risk, stress-driven glycaemia, and the inflammation→mood
 * pathway are all combinations no single reading flags.
 *
 * Each rule is deliberately conservative: it states the pattern, names the
 * evidence it is built on, and suggests a next step. None of them is a
 * diagnosis, and the UI labels the whole section BETA because these are
 * heuristics over demo data, not a validated risk model.
 */

/** Marker lookup by panel key and name. */
function read(roundIndex, systemKey, markerName) {
  return readMarker(systemKey, markerName, roundIndex);
}

/** Ratio of a value to its reference, oriented so >1 always means "worse". */
function ratio({ marker, value }) {
  return marker.dir === "low" ? marker.ref / value : value / marker.ref;
}

/** The full series for a marker, oldest first. */
function seriesOf(systemKey, markerName) {
  const system = SYSTEMS.find((s) => s.key === systemKey);
  const marker = system.markers.find((x) => x.name === markerName);
  return { marker, series: marker.demo, systemKey };
}

/**
 * Fractional change per round, fitted over the last `n` rounds.
 *
 * This is the measurement a single draw cannot make. A value can sit inside
 * its reference range at every visit and still be doubling; the slope is what
 * separates "normal" from "normal, so far".
 */
function riseRate(series, upto, n = 4) {
  const from = Math.max(0, upto - n + 1);
  const window = series.slice(from, upto + 1);
  if (window.length < 3 || window[0] <= 0) return 0;
  const steps = window.length - 1;
  return Math.pow(window[window.length - 1] / window[0], 1 / steps) - 1;
}

/** True when a series has moved the same way at every step. */
function monotonic(series, upto, n = 4, up = true) {
  const from = Math.max(0, upto - n + 1);
  const w = series.slice(from, upto + 1);
  return w.every((v, i) => i === 0 || (up ? v > w[i - 1] : v < w[i - 1]));
}

const RULES = [
  {
    key: "hepaticTrajectory",
    titleKey: "ix.hepaticTrajectory.title",
    bodyKey: "ix.hepaticTrajectory.body",
    actionKey: "ix.hepaticTrajectory.action",
    systems: ["hepatic", "oncology", "hematology"],
    /**
     * The reason this product exists.
     *
     * Hepatocellular carcinoma is caught late because the markers that move
     * first move slowly and from inside the normal range. AFP under 10 is
     * "normal" — AFP that has risen at every one of twelve monthly draws,
     * while GGT and the fibrosis estimate climb and platelets fall, is a
     * surveillance finding. No single draw can see any of that, and the
     * monthly cadence is what makes twelve points available to fit.
     */
    evaluate(r) {
      const afp = seriesOf("oncology", "AFP");
      const ggt = seriesOf("hepatic", "GGT");
      const fib = seriesOf("hepatic", "FIB-4");
      const plt = seriesOf("hematology", "Platelets");
      const alb = seriesOf("hepatic", "Albumin");

      const afpRate = riseRate(afp.series, r);
      const afpRising = monotonic(afp.series, r, 4, true);
      const supporting =
        (monotonic(ggt.series, r, 4, true) ? 1 : 0) +
        (monotonic(fib.series, r, 4, true) ? 1 : 0) +
        (monotonic(plt.series, r, 4, false) ? 1 : 0);

      // Needs a real climb plus at least two corroborating directions. The
      // threshold is PER ROUND, and a round is a month — roughly 8%/month is
      // the same biology that read as 25%/quarter before the cadence changed.
      // A constant that silently depends on the interval is the same class of
      // bug data/window.js exists to prevent.
      if (!(afpRising && afpRate >= 0.08 && supporting >= 2)) return null;

      const evidence = [afp, ggt, fib, plt, alb].map((e) => ({
        marker: e.marker,
        value: e.series[r],
        level: markerLevel(e.marker, e.series[r]),
        systemKey: e.systemKey,
        series: e.series.slice(0, r + 1),
      }));

      return {
        severity: markerLevel(afp.marker, afp.series[r]) > 0 ? 2 : 1,
        evidence,
        // Surfaced in the copy so the claim is checkable.
        stats: {
          rate: Math.round(afpRate * 100),
          rounds: Math.min(4, r + 1),
          crossed: markerLevel(afp.marker, afp.series[r]) > 0,
        },
      };
    },
  },
  {
    key: "residualInflammation",
    titleKey: "ix.residualInflammation.title",
    bodyKey: "ix.residualInflammation.body",
    systems: ["cardio", "immune", "nutrition"],
    evaluate(r) {
      const crp = read(r, "cardio", "hs-CRP");
      const il6 = read(r, "immune", "IL-6");
      const o3 = read(r, "nutrition", "Omega-3 index");
      // Lipids handled, inflammation not — the residual-risk pattern.
      const ldl = read(r, "cardio", "LDL-C");
      const hit =
        ratio(crp) > 0.9 &&
        ratio(il6) > 0.3 &&
        ratio(o3) > 0.7 &&
        ldl.level === 0;
      return hit
        ? { severity: ratio(crp) > 1 ? 2 : 1, evidence: [crp, il6, o3] }
        : null;
    },
  },
  {
    key: "stressGlycaemia",
    titleKey: "ix.stressGlycaemia.title",
    bodyKey: "ix.stressGlycaemia.body",
    systems: ["endocrine", "epigen"],
    evaluate(r) {
      // Both sides of this pattern are cumulative on purpose: HbA1c averages a
      // quarter of glucose, and the methylation score averages a quarter of
      // glucocorticoid exposure. A morning cortisol would have made the same
      // claim from a single hour.
      const load = read(r, "epigen", "DNAm cortisol (90d)");
      const a1c = read(r, "endocrine", "HbA1c");
      const nr3c1 = read(r, "epigen", "NR3C1 exon 1F");
      const dhea = read(r, "endocrine", "DHEA-S");
      const hit = ratio(a1c) > 0.99 && ratio(load) > 1.0 && ratio(nr3c1) > 0.95;
      return hit ? { severity: 1, evidence: [a1c, load, nr3c1, dhea] } : null;
    },
  },
  {
    key: "inflammatoryMood",
    titleKey: "ix.inflammatoryMood.title",
    bodyKey: "ix.inflammatoryMood.body",
    systems: ["immune", "neuro", "nutrition"],
    evaluate(r) {
      const kyn = read(r, "neuro", "Kyn/Trp ratio");
      const bdnf = read(r, "neuro", "BDNF");
      const crp = read(r, "cardio", "hs-CRP");
      const meta = SCALE_META.find((s) => s.key === "inflammation");
      const load = scaleIndex(meta, r);
      // Tryptophan being pulled down the inflammatory branch, with plasticity
      // falling at the same time.
      const hit = ratio(kyn) > 1.02 && ratio(bdnf) > 0.95 && load >= 48;
      return hit
        ? { severity: load >= 60 ? 2 : 1, evidence: [kyn, bdnf, crp] }
        : null;
    },
  },
  {
    key: "fatigueChain",
    titleKey: "ix.fatigueChain.title",
    bodyKey: "ix.fatigueChain.body",
    actionKey: "ix.fatigueChain.action",
    systems: ["hematology", "endocrine", "nutrition"],
    evaluate(r) {
      const ferritin = read(r, "hematology", "Ferritin");
      const t4 = read(r, "endocrine", "Free T4");
      const b12 = read(r, "nutrition", "Vitamin B12");
      // Three in-range values that together explain low energy.
      const hit =
        ratio(ferritin) > 0.32 && ratio(t4) > 0.82 && ratio(b12) > 0.78;
      return hit ? { severity: 1, evidence: [ferritin, t4, b12] } : null;
    },
  },
  {
    key: "sleepAxis",
    titleKey: "ix.sleepAxis.title",
    bodyKey: "ix.sleepAxis.body",
    actionKey: "ix.sleepAxis.action",
    systems: ["epigen", "neuro"],
    evaluate(r) {
      const clock = read(r, "epigen", "PER2/CLOCK index");
      const melatonin = read(r, "neuro", "6-sulfatoxymelatonin");
      const load = read(r, "epigen", "DNAm cortisol (90d)");
      // One night's melatonin is one night. The clock-gene drift is what says
      // the phase problem has been there for weeks.
      const hit = ratio(clock) > 0.95 && ratio(melatonin) > 0.9;
      return hit
        ? {
            severity: ratio(clock) > 1.15 ? 2 : 1,
            evidence: [clock, melatonin, load],
          }
        : null;
    },
  },
  {
    key: "metabolicLiver",
    titleKey: "ix.metabolicLiver.title",
    bodyKey: "ix.metabolicLiver.body",
    systems: ["hepatic", "endocrine", "cardio"],
    evaluate(r) {
      const ggt = read(r, "hepatic", "GGT");
      const alt = read(r, "hepatic", "ALT");
      const insulin = read(r, "endocrine", "Fasting insulin");
      const tg = read(r, "cardio", "Triglycerides");
      // Enzymes drifting up alongside insulin: the metabolic-liver axis, which
      // no single one of these would flag on its own.
      const hit =
        ratio(ggt) > 0.8 && ratio(alt) > 0.88 && ratio(insulin) > 0.78;
      return hit ? { severity: 1, evidence: [ggt, alt, insulin, tg] } : null;
    },
  },
];

/** Fired signals for one round, most severe first. */
export function interactionsFor(roundIndex) {
  return RULES.map((rule) => {
    const result = rule.evaluate(roundIndex);
    return result ? { ...rule, ...result } : null;
  })
    .filter(Boolean)
    .sort((a, b) => b.severity - a.severity);
}
