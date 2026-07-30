import { SYSTEMS, valuesAt } from "./body";

/**
 * Body composition, imported from an InBody device.
 *
 * The reason this belongs next to the blood panel is not that both are health
 * data — it is that each one changes how the other should be read, and both
 * are only interpretable against the same person's own history. A single
 * cross-sectional reading of either is close to meaningless; three of both,
 * from the same body, is a longitudinal record.
 *
 * The clearest example is creatinine. It is a muscle breakdown product, so a
 * muscular person runs a high creatinine and a low estimated GFR without
 * anything being wrong with their kidneys. Reading the two panels together
 * resolves that; reading either alone does not.
 */

export const DEVICE = {
  brand: "InBody",
  model: "InBody970",
  connected: true,
  // Rounds line up with the blood draws so the two series can be compared.
  syncedRoundIndex: 5,
};

/** Demo series are oldest-first, matching the blood marker arrays. */
export const COMPOSITION = [
  {
    key: "weight",
    nameKey: "ib.weight",
    unit: "kg",
    dp: 1,
    demo: [74.8, 75.1, 75.4, 75.0, 74.2, 72.6],
    band: null,
  },
  {
    key: "smm",
    nameKey: "ib.smm",
    unit: "kg",
    dp: 1,
    demo: [33.1, 33.6, 34.0, 33.8, 33.2, 32.4],
    band: { low: 30, high: 38 },
    dir: "low",
  },
  {
    key: "bodyFat",
    nameKey: "ib.bodyFat",
    unit: "%",
    dp: 1,
    demo: [23.4, 22.1, 20.8, 21.2, 21.8, 22.6],
    band: { low: 10, high: 20 },
    dir: "high",
  },
  {
    key: "visceral",
    nameKey: "ib.visceral",
    unit: "cm²",
    dp: 0,
    demo: [96, 89, 82, 85, 88, 91],
    band: { low: 0, high: 100 },
    dir: "high",
  },
  {
    key: "bmr",
    nameKey: "ib.bmr",
    unit: "kcal",
    dp: 0,
    demo: [1618, 1634, 1642, 1636, 1620, 1598],
    band: null,
  },
  {
    key: "ecwTbw",
    nameKey: "ib.ecwTbw",
    unit: "ratio",
    dp: 3,
    demo: [0.379, 0.378, 0.379, 0.381, 0.384, 0.389],
    band: { low: 0.36, high: 0.39 },
    dir: "high",
  },
  {
    key: "phaseAngle",
    nameKey: "ib.phaseAngle",
    unit: "°",
    dp: 1,
    demo: [5.6, 5.7, 5.8, 5.7, 5.5, 5.2],
    band: { low: 5.0, high: 8.0 },
    dir: "low",
  },
];

/** Segmental lean mass, as a percentage of the expected value for this body. */
export const SEGMENTS = [
  { key: "armL", nameKey: "ib.armL", demo: [92, 94, 96, 95, 94, 92] },
  { key: "armR", nameKey: "ib.armR", demo: [95, 97, 99, 98, 97, 95] },
  { key: "trunk", nameKey: "ib.trunk", demo: [101, 103, 104, 103, 102, 100] },
  { key: "legL", nameKey: "ib.legL", demo: [97, 99, 100, 99, 98, 96] },
  { key: "legR", nameKey: "ib.legR", demo: [98, 100, 101, 100, 100, 98] },
];

export function compositionAt(roundIndex) {
  return COMPOSITION.map((c) => ({ ...c, value: c.demo[roundIndex] }));
}

/** 0 in band · 1 outside it. `band: null` means the metric has no target. */
export function metricLevel(metric, value) {
  if (!metric.band) return 0;
  if (metric.dir === "low") return value < metric.band.low ? 1 : 0;
  return value > metric.band.high ? 1 : 0;
}

function bloodValue(systemKey, markerName, roundIndex) {
  const system = SYSTEMS.find((s) => s.key === systemKey);
  const i = system.markers.findIndex((x) => x.name === markerName);
  return { marker: system.markers[i], value: valuesAt(system, roundIndex)[i] };
}

function metricValue(key, roundIndex) {
  const metric = COMPOSITION.find((c) => c.key === key);
  return { metric, value: metric.demo[roundIndex] };
}

/**
 * Where a body-composition reading changes how a blood value should be read.
 * These are the pairings that make importing the device worth doing.
 */
const LINKS = [
  {
    key: "creatinine",
    titleKey: "ib.link.creatinine.title",
    bodyKey: "ib.link.creatinine.body",
    evaluate(r) {
      const smm = metricValue("smm", r);
      const cr = bloodValue("renal", "Creatinine", r);
      const egfr = bloodValue("renal", "eGFR", r);
      // Muscle mass in the upper part of its band, with creatinine in the
      // upper part of its own: the reading is explained by build.
      return smm.value >= 32 && cr.value >= 0.9
        ? { blood: [cr, egfr], composition: [smm] }
        : null;
    },
  },
  {
    key: "visceralMetabolic",
    titleKey: "ib.link.visceral.title",
    bodyKey: "ib.link.visceral.body",
    evaluate(r) {
      const vis = metricValue("visceral", r);
      const a1c = bloodValue("endocrine", "HbA1c", r);
      const insulin = bloodValue("endocrine", "Fasting insulin", r);
      const alt = bloodValue("hepatic", "ALT", r);
      return vis.value >= 88 && a1c.value >= 5.6
        ? { blood: [a1c, insulin, alt], composition: [vis] }
        : null;
    },
  },
  {
    key: "inflammationFluid",
    titleKey: "ib.link.fluid.title",
    bodyKey: "ib.link.fluid.body",
    evaluate(r) {
      const ecw = metricValue("ecwTbw", r);
      const phase = metricValue("phaseAngle", r);
      const crp = bloodValue("cardio", "hs-CRP", r);
      const alb = bloodValue("hepatic", "Albumin", r);
      return ecw.value >= 0.382 && crp.value >= 0.9
        ? { blood: [crp, alb], composition: [ecw, phase] }
        : null;
    },
  },
  {
    key: "muscleEnergy",
    titleKey: "ib.link.muscle.title",
    bodyKey: "ib.link.muscle.body",
    evaluate(r) {
      const smm = metricValue("smm", r);
      const bmr = metricValue("bmr", r);
      const ferritin = bloodValue("hematology", "Ferritin", r);
      const t4 = bloodValue("endocrine", "Free T4", r);
      // Muscle and metabolic rate slipping together, with the two blood
      // values that most often drive it.
      const prev =
        r > 0 ? COMPOSITION.find((c) => c.key === "smm").demo[r - 1] : null;
      return prev !== null && smm.value < prev
        ? { blood: [ferritin, t4], composition: [smm, bmr] }
        : null;
    },
  },
];

const WEIGHT_LOSS = {
  key: 'unintendedLoss',
  titleKey: 'ib.link.loss.title',
  bodyKey: 'ib.link.loss.body',
  evaluate(r) {
    if (r < 2) return null;
    const w = COMPOSITION.find((c) => c.key === 'weight');
    const pa = COMPOSITION.find((c) => c.key === 'phaseAngle');
    const smm = COMPOSITION.find((c) => c.key === 'smm');
    const drop = (w.demo[r - 2] - w.demo[r]) / w.demo[r - 2];
    // Over 3% off in two rounds, with cell integrity falling alongside it.
    if (drop < 0.03 || pa.demo[r] >= pa.demo[r - 2]) return null;
    const alb = bloodValue('hepatic', 'Albumin', r);
    const afp = bloodValue('oncology', 'AFP', r);
    return {
      composition: [
        { metric: w, value: w.demo[r] },
        { metric: pa, value: pa.demo[r] },
        { metric: smm, value: smm.demo[r] },
      ],
      blood: [alb, afp],
    };
  },
};

export function inbodyLinksFor(roundIndex) {
  return [WEIGHT_LOSS, ...LINKS].map((link) => {
    const result = link.evaluate(roundIndex);
    return result ? { ...link, ...result } : null;
  }).filter(Boolean);
}
