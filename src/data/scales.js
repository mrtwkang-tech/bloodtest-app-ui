import { valuesAt } from "./body";
import { findMarker } from "./panels";
import { indexWeight, sampling, SAMPLING } from "./window";

/**
 * Five regulatory systems, derived from the markers a monthly draw can read.
 *
 * WHY THESE ARE NOT CALLED MOOD, TENSION AND ENERGY ANY MORE.
 *
 * Those were names for subjective experience, attached to measurements of
 * biology. A reader shown "mood 54" believes their mood has been measured. It
 * has not, and it cannot be: mood is reachable only by self-report or by
 * behaviour. What the draw measured was the state of the systems that regulate
 * mood — inflammation, substrate availability, the stress axis. Those dispose
 * an experience; they do not record one. Naming them after the feeling was a
 * category error, and it also blurred the axes into each other: "tension" and
 * "stress load" were both the HPA axis, and "sleep" measured circadian phase
 * with no actigraphy anywhere near it.
 *
 * So each axis is now named for the system it actually interrogates, and the
 * product says what it is doing: it measures the body that carries a mind, not
 * the mind.
 *
 * WHY THE MARKERS CHANGED.
 *
 * The draw is monthly. A marker whose value takes ninety days to form cannot
 * report a month — consecutive draws share two thirds of their window and the
 * resulting line is smooth because of the assay, not because of the person.
 * See data/window.js. Every index below is built from markers whose window
 * fits inside the interval; the slower ones are still shown, but they carry
 * zero weight and are labelled as context.
 *
 * IMPORTANT: an index is a description of biological load along a pathway,
 * not a diagnosis of a mental illness. Every string that renders one says so.
 */

// Radar axis angles, clockwise from top.
export const AXES = [-90, -18, 54, 126, 198];

const m = (system, marker, weight, mechanismKey) => ({
  system,
  marker,
  weight,
  mechanismKey,
});

/**
 * `drivers` name the markers behind each index by system key and marker name,
 * so a rename in body.js fails loudly instead of silently scoring nothing.
 * Drivers whose window exceeds the interval stay in the list on purpose — they
 * are worth reading, they are simply not worth scoring this month, and
 * `window.js` is what decides which is which.
 */
export const SCALE_META = [
  {
    // Not how much stress there was — whether the axis still switches off.
    key: "recovery",
    axisKey: "scale.recovery",
    icon: "recovery",
    code: "composite",
    drivers: [
      m("epigen", "cfDNA PVN (CRH-CpG)", 1.8, "mech.cfStress"),
      m("endocrine", "Cortisol:DHEA-S", 1.6, "mech.cortDhea"),
      m("endocrine", "DHEA-S", 1.2, "mech.dhea"),
      m("epigen", "FKBP5 intron 7", 1.0, "mech.fkbp5"),
      m("epigen", "DNAm cortisol (90d)", 0.8, "mech.cortisolLoad"),
    ],
  },
  {
    // The most reproducible biological correlate of depression there is.
    key: "inflammation",
    axisKey: "scale.inflammation",
    icon: "inflammation",
    code: "composite",
    drivers: [
      m("epigen", "cfDNA sgACC (SST-CpG)", 1.6, "mech.cfMood"),
      m("cardio", "hs-CRP", 1.5, "mech.crp"),
      m("immune", "IL-6", 1.2, "mech.il6"),
      m("neuro", "Kyn/Trp ratio", 1.2, "mech.tryptophan"),
      m("immune", "Neutrophil:lymphocyte", 0.9, "mech.nlr"),
      m("epigen", "DNAm inflammation", 0.8, "mech.dnamInflam"),
    ],
  },
  {
    // Whether there is anything to build a neurotransmitter out of.
    key: "substrate",
    axisKey: "scale.substrate",
    icon: "substrate",
    code: "composite",
    drivers: [
      m("neuro", "Free tryptophan", 1.4, "mech.tryptophanPool"),
      m("nutrition", "Active B12 (holoTC)", 1.2, "mech.holotc"),
      m("hematology", "Ferritin", 1.1, "mech.iron"),
      m("nutrition", "Folate", 1.0, "mech.folate"),
      m("nutrition", "Vitamin D", 1.0, "mech.vitaminD"),
      m("nutrition", "Plasma omega-3", 1.0, "mech.omega3Plasma"),
      m("epigen", "BDNF promoter IV", 0.8, "mech.bdnfMeth"),
      m("epigen", "SLC6A4 promoter", 0.8, "mech.slc6a4"),
    ],
  },
  {
    // Phase, not duration. Nothing here knows how long you slept.
    key: "circadian",
    axisKey: "scale.circadian",
    icon: "circadian",
    code: "composite",
    drivers: [
      m("epigen", "cfDNA SCN (VIP-CpG)", 1.6, "mech.cfSleep"),
      m("epigen", "PER2/CLOCK index", 1.5, "mech.circadian"),
      m("neuro", "6-sulfatoxymelatonin", 1.5, "mech.melatonin"),
      m("endocrine", "Cortisol awakening response", 1.4, "mech.car"),
    ],
  },
  {
    // Fuel and oxygen for the most expensive organ in the body.
    key: "metabolic",
    axisKey: "scale.metabolic",
    icon: "metabolic",
    code: "composite",
    drivers: [
      m("epigen", "cfDNA oligodendrocyte (MBP-CpG)", 1.6, "mech.cfEnergy"),
      m("endocrine", "Fructosamine", 1.4, "mech.fructosamine"),
      m("endocrine", "GDF-15", 1.2, "mech.gdf15"),
      m("endocrine", "Free T4", 1.1, "mech.thyroid"),
      m("hematology", "Haemoglobin", 1.1, "mech.oxygen"),
      m("endocrine", "TSH", 0.9, "mech.tsh"),
      m("epigen", "DunedinPACE", 0.7, "mech.pace"),
      m("epigen", "DNAmTL", 0.6, "mech.telomere"),
    ],
  },
];

/** What share of an index's weight comes from markers this cadence can read. */
export function readableShare(meta) {
  const total = meta.drivers.reduce((n, d) => n + d.weight, 0);
  const usable = meta.drivers
    .filter((d) => indexWeight(findMarker(d.system, d.marker).marker))
    .reduce((n, d) => n + d.weight, 0);
  return usable / total;
}

/**
 * One marker's contribution, 0–1.
 *
 * Sitting exactly on the reference is 0.5 by construction, which is what
 * anchors the peer average of every index at 50 — the dashed pentagon on the
 * radar. The exponent makes the curve steepen as a value runs away from the
 * reference, so one badly-out marker is not averaged into invisibility.
 */
export function markerLoad(marker, value) {
  const t =
    marker.dir === "low"
      ? marker.ref / Math.max(value, 1e-6)
      : value / marker.ref;
  return Math.min(0.98, Math.max(0.02, 0.5 * Math.pow(t, 1.5)));
}

/** The index for one scale at one round, 1–99. */
export function scaleIndex(meta, roundIndex) {
  let sum = 0;
  let weight = 0;
  meta.drivers.forEach((d) => {
    const { panel, index, marker } = findMarker(d.system, d.marker);
    // A marker whose window outruns the interval contributes nothing. At full
    // weight it would anchor the score to a value that barely moves, damping
    // exactly the monthly change the index exists to show — and invisibly.
    const w = d.weight * indexWeight(marker);
    if (!w) return;
    const value = valuesAt(panel, roundIndex)[index];
    sum += markerLoad(marker, value) * w;
    weight += w;
  });
  return Math.min(99, Math.max(1, Math.round((sum / weight) * 100)));
}

/**
 * Which markers pushed this index, strongest first. This is the chain the
 * reader actually needs: marker → mechanism → index.
 */
export function scaleDrivers(meta, roundIndex) {
  return meta.drivers
    .map((d) => {
      const { panel, index, marker } = findMarker(d.system, d.marker);
      const value = valuesAt(panel, roundIndex)[index];
      const load = markerLoad(marker, value);
      return {
        marker,
        value,
        load,
        systemKey: panel.key,
        systemNameKey: panel.nameKey,
        mechanismKey: d.mechanismKey,
        // 'independent' | 'overlapping' | 'context' — drives both the sheet's
        // grouping and whether this counted toward the score.
        sampling: sampling(marker),
        counted: indexWeight(marker) > 0,
        // Contribution to the index, so the ordering reflects the weighting.
        contribution: load * d.weight,
        pushesUp: load > 0.5,
      };
    })
    .sort((a, b) => b.contribution - a.contribution);
}

/** 'good' | 'watch' | 'alert' from the index itself. */
export function statusOf(index) {
  if (index >= 66) return "alert";
  if (index >= 50) return "watch";
  return "good";
}

/**
 * The number the reader is shown. Higher is better.
 *
 * WHY THIS EXISTS RATHER THAN JUST PRINTING THE INDEX. The body screen prints
 * `systemScore`, where 92 is good. The mind screen printed `scaleIndex`, where
 * 92 is bad. Two adjacent tabs, the same position in the same-shaped row, the
 * same three digits — and opposite meanings. That is not a subtlety a reader
 * will discover; it is a reading they will get wrong and never find out about.
 *
 * The arithmetic underneath does NOT change. `markerLoad` still measures load,
 * `scaleIndex` still averages it, and `scaleDrivers` still reports which marker
 * pushed the load up — those are the honest units of the model and the sheet
 * still explains them in those terms. Only the headline number is oriented, and
 * it is oriented to match the rest of the product.
 *
 * 50 stays fixed under the flip, which is the point: the peer average is at 50
 * on both scales, so the radar's pentagon, the row's notch and the trend
 * chart's reference line all keep meaning exactly what they meant.
 */
export function scaleScore(meta, roundIndex) {
  return 100 - scaleIndex(meta, roundIndex);
}

/** The same three bands, read off a score instead of a load. */
export function statusOfScore(score) {
  return statusOf(100 - score);
}

/**
 * The score as a comparison rather than a number.
 *
 * The cut points have to be `statusOf`'s own, or the sentence contradicts the
 * badge beside it — a score of 48 read as "about the same as your peers" while
 * the badge said 주의, because 50 is the average and the threshold at once.
 *
 * This lived in `ScaleRow` until the row merged with `ZoneRow`. It is a
 * threshold, not a layout decision, so it belongs beside the thresholds.
 */
export function band(score) {
  if (score <= 34) return "below";
  if (score <= 50) return "belowAvg";
  if (score <= 60) return "avg";
  return "above";
}

/** Mind status → the 0/1/2 level the icons and colours share with Body. */
export const SCALE_LEVEL = { good: 0, watch: 1, alert: 2 };

/*
 * `radarPoints` used to live here — a second polygon helper on a 200×200
 * viewBox that RadarChart never called, since it has its own on a 300×244 one.
 * Removed rather than left: it was written against the load orientation, and a
 * dead helper that plots the wrong way round is exactly the thing someone
 * reaches for later and gets a mirrored chart from.
 */
