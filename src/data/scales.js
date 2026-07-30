import { SYSTEMS, valuesAt } from "./body";

/**
 * Mind indices, derived from blood.
 *
 * This is a blood test, so a questionnaire score has no business being here —
 * the earlier PHQ-9 / GAD-7 numbers were values the panel cannot produce.
 * Each index is instead a weighted composite of markers the draw actually
 * measures, along the biological pathways that are known to move mood:
 * inflammation, the stress axis, tryptophan diversion, neuroplasticity,
 * methylation, oxygen delivery and thyroid output.
 *
 * Why a 1–3 month cadence is the right window: these markers integrate over
 * weeks to months, not hours. HbA1c averages 2–3 months of glucose, ferritin
 * and the omega-3 index shift over months, BDNF and cortisol over weeks. A
 * daily reading would be noise; a yearly one would miss the change.
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
    // The pathway label shown instead of a questionnaire code.
    code: "composite",
    drivers: [
      m("cardio", "hs-CRP", 1.2, "mech.inflammation"),
      m("immune", "IL-6", 1.2, "mech.inflammation"),
      m("neuro", "Kyn/Trp ratio", 1.4, "mech.tryptophan"),
      m("neuro", "BDNF", 1.3, "mech.plasticity"),
      m("nutrition", "Vitamin D", 0.9, "mech.vitaminD"),
      m("nutrition", "Omega-3 index", 0.8, "mech.omega3"),
    ],
  },
  {
    key: "tension",
    axisKey: "scale.tension",
    code: "composite",
    drivers: [
      m("endocrine", "Cortisol (AM)", 1.5, "mech.cortisol"),
      m("endocrine", "DHEA-S", 1.2, "mech.dhea"),
      m("nutrition", "Magnesium", 1.0, "mech.magnesium"),
      m("endocrine", "TSH", 0.8, "mech.thyroid"),
      m("immune", "IL-6", 0.6, "mech.inflammation"),
    ],
  },
  {
    key: "stress",
    axisKey: "scale.stress",
    code: "composite",
    drivers: [
      m("endocrine", "Cortisol (AM)", 1.4, "mech.cortisol"),
      m("endocrine", "HbA1c", 1.0, "mech.glucose"),
      m("cardio", "hs-CRP", 1.0, "mech.inflammation"),
      m("endocrine", "DHEA-S", 1.0, "mech.dhea"),
    ],
  },
  {
    key: "sleep",
    axisKey: "scale.sleep",
    code: "composite",
    drivers: [
      m("neuro", "6-sulfatoxymelatonin", 1.6, "mech.melatonin"),
      m("endocrine", "Cortisol (AM)", 1.0, "mech.cortisolRhythm"),
      m("nutrition", "Magnesium", 0.8, "mech.magnesium"),
      m("nutrition", "Vitamin D", 0.6, "mech.vitaminD"),
    ],
  },
  {
    key: "energy",
    axisKey: "scale.energy",
    code: "composite",
    drivers: [
      m("hematology", "Ferritin", 1.3, "mech.iron"),
      m("hematology", "Haemoglobin", 1.2, "mech.oxygen"),
      m("endocrine", "Free T4", 1.1, "mech.thyroid"),
      m("nutrition", "Vitamin B12", 0.9, "mech.b12"),
      m("endocrine", "Fasting insulin", 0.8, "mech.insulin"),
      m("cardio", "hs-CRP", 0.7, "mech.inflammation"),
    ],
  },
];

function findMarker(systemKey, markerName) {
  const system = SYSTEMS.find((s) => s.key === systemKey);
  const index = system?.markers.findIndex((x) => x.name === markerName) ?? -1;
  if (!system || index < 0) {
    throw new Error(`Unknown driver marker: ${systemKey}/${markerName}`);
  }
  return { system, index, marker: system.markers[index] };
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
    const { system, index, marker } = findMarker(d.system, d.marker);
    const value = valuesAt(system, roundIndex)[index];
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
      const { system, index, marker } = findMarker(d.system, d.marker);
      const value = valuesAt(system, roundIndex)[index];
      const load = markerLoad(marker, value);
      return {
        marker,
        value,
        load,
        systemKey: system.key,
        systemNameKey: system.nameKey,
        mechanismKey: d.mechanismKey,
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
