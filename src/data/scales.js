import { valuesAt } from "./body";
import { findMarker } from "./panels";

/**
 * Mind indices, derived from markers that accumulate.
 *
 * This is a blood test, so a questionnaire score has no business being here —
 * the earlier PHQ-9 / GAD-7 numbers were values the panel cannot produce.
 *
 * The second correction matters more. An earlier version of these indices ran
 * on morning cortisol, and morning cortisol cannot answer the question this
 * product asks. It varies two- to three-fold across a single day and moves
 * with the hour of the draw; two readings three months apart differ mostly
 * because the two mornings differed. A quarterly instrument has to be built on
 * markers whose value at the moment of the draw is a summary of the months
 * before it, not a snapshot of that morning.
 *
 * So every index below is anchored on integrating markers:
 *   · methylation marks, which accumulate and decay over weeks to months
 *     (see epigenetics.js — hypothetical assays, flagged as such everywhere)
 *   · HbA1c, ~3 months of glucose
 *   · the omega-3 index, ~4 months of membrane turnover
 *   · ferritin, haemoglobin, vitamin D, RBC magnesium — weeks to months
 *
 * Where a fast-moving plasma marker still earns a place (Kyn/Trp, overnight
 * melatonin, DHEA-S) it carries a small weight and never leads an index.
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
 */
export const SCALE_META = [
  {
    key: "mood",
    axisKey: "scale.mood",
    icon: "mood",
    // The pathway label shown instead of a questionnaire code.
    code: "composite",
    drivers: [
      m("epigen", "SLC6A4 promoter", 1.5, "mech.slc6a4"),
      m("epigen", "BDNF promoter IV", 1.4, "mech.bdnfMeth"),
      m("epigen", "DNAm inflammation", 1.2, "mech.dnamInflam"),
      m("nutrition", "Omega-3 index", 0.9, "mech.omega3"),
      m("nutrition", "Vitamin D", 0.7, "mech.vitaminD"),
      m("neuro", "Kyn/Trp ratio", 0.5, "mech.tryptophan"),
    ],
  },
  {
    key: "tension",
    axisKey: "scale.tension",
    icon: "tension",
    code: "composite",
    drivers: [
      m("epigen", "FKBP5 intron 7", 1.5, "mech.fkbp5"),
      m("epigen", "NR3C1 exon 1F", 1.3, "mech.nr3c1"),
      m("epigen", "COMT Val158 CpG", 1.0, "mech.comt"),
      m("epigen", "OXTR −934 CpG", 0.8, "mech.oxtr"),
      m("nutrition", "Magnesium", 0.7, "mech.magnesium"),
      m("endocrine", "DHEA-S", 0.5, "mech.dhea"),
    ],
  },
  {
    key: "stress",
    axisKey: "scale.stress",
    icon: "stress",
    code: "composite",
    drivers: [
      m("epigen", "DNAm cortisol (90d)", 1.6, "mech.cortisolLoad"),
      m("epigen", "NR3C1 exon 1F", 1.3, "mech.nr3c1"),
      m("endocrine", "HbA1c", 1.0, "mech.glucose"),
      m("epigen", "DunedinPACE", 0.9, "mech.pace"),
      m("epigen", "DNAm inflammation", 0.8, "mech.dnamInflam"),
    ],
  },
  {
    key: "sleep",
    axisKey: "scale.sleep",
    icon: "sleep",
    code: "composite",
    drivers: [
      m("epigen", "PER2/CLOCK index", 1.6, "mech.circadian"),
      m("epigen", "DNAm cortisol (90d)", 0.9, "mech.cortisolLoad"),
      m("neuro", "6-sulfatoxymelatonin", 0.8, "mech.melatonin"),
      m("nutrition", "Magnesium", 0.6, "mech.magnesium"),
    ],
  },
  {
    key: "energy",
    axisKey: "scale.energy",
    icon: "energy",
    code: "composite",
    drivers: [
      m("hematology", "Ferritin", 1.3, "mech.iron"),
      m("hematology", "Haemoglobin", 1.2, "mech.oxygen"),
      m("endocrine", "Free T4", 1.0, "mech.thyroid"),
      m("epigen", "DunedinPACE", 0.9, "mech.pace"),
      m("nutrition", "Vitamin B12", 0.8, "mech.b12"),
      m("epigen", "DNAmTL", 0.7, "mech.telomere"),
      m("epigen", "DNAm inflammation", 0.7, "mech.dnamInflam"),
    ],
  },
];

/** True when an index is built mostly on markers that integrate over months. */
export function cumulativeShare(meta) {
  const total = meta.drivers.reduce((n, d) => n + d.weight, 0);
  const slow = meta.drivers
    .filter((d) => d.system === "epigen" || SLOW_BLOOD.has(d.marker))
    .reduce((n, d) => n + d.weight, 0);
  return slow / total;
}

/** Blood markers whose value is already an average over weeks or months. */
const SLOW_BLOOD = new Set([
  "HbA1c",
  "Omega-3 index",
  "Ferritin",
  "Haemoglobin",
  "Vitamin D",
  "Vitamin B12",
  "Magnesium",
]);

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
    const value = valuesAt(panel, roundIndex)[index];
    sum += markerLoad(marker, value) * d.weight;
    weight += d.weight;
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
        // Methylation markers integrate; plasma markers mostly do not.
        cumulative: panel.key === "epigen" || SLOW_BLOOD.has(marker.name),
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
 * Radar polygon in a 200x200 viewBox, plotted on the indices.
 * Every axis is the same 0–100 load scale, so the shape is comparable and
 * the peer average is a regular pentagon at 50.
 */
export function radarPoints(values, radius = 78) {
  return values
    .map((p, i) => {
      const a = (AXES[i] * Math.PI) / 180;
      const r = radius * Math.max(0.06, Math.min(1, p / 100));
      return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;
    })
    .join(" ");
}
