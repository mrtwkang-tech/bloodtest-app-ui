import { C } from "../tokens";

/**
 * Body screening, organised the way a referral is: one system per medical
 * specialty, so a flagged result maps to a clinic you can actually book.
 *
 * SIX rounds at three-month intervals. That span is the point of the product:
 * a single draw can only ask "is this value in range?", while six of them from
 * the same body can ask "which way is it moving, and how fast?". The liver
 * series below is written to demonstrate exactly that — see ROUNDS.
 *
 * Markers either carry an explicit `demo` series (the ones that carry a
 * narrative) or a `base`/`spread` pair, from which a deterministic walk fills
 * six plausible readings. Deterministic so the demo does not shuffle on
 * reload.
 *
 * `dir` is the direction of harm. Most markers are 'high'; HDL, eGFR,
 * haemoglobin and the vitamins are 'low'. Everything downstream reads `dir`.
 */

export const ROUNDS = 6;

/** FNV-1a, so a marker's series depends only on its name. */
function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** A gently mean-reverting walk around `base`. */
function walk(name, base, spread) {
  let h = hash(name);
  let v = base;
  const out = [];
  for (let i = 0; i < ROUNDS; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    const u = ((h >>> 16) & 0xffff) / 0xffff - 0.5;
    v = base + (v - base) * 0.45 + u * spread;
    out.push(v);
  }
  return out;
}

/** Fills in `demo` for any marker that only declared a base. */
function withSeries(system) {
  return {
    ...system,
    markers: system.markers.map((m) => {
      const demo = m.demo ?? walk(`${system.key}:${m.name}`, m.base, m.spread);
      if (demo.length !== ROUNDS) {
        throw new Error(`${system.key}/${m.name}: expected ${ROUNDS} readings, got ${demo.length}`);
      }
      return { ...m, demo };
    }),
  };
}

/** Level 0/1/2 → i18n key. Colours live in tokens.js. */
export const BODY_STATUS_KEY = ["body.clear", "body.watch", "body.consult"];

const RAW_SYSTEMS = [
  {
    key: "neuro",
    nameKey: "sys.neuro",
    specialtyKey: "spec.neuro",
    noteKey: "sys.neuro.note",
    conditionKeys: ["cond.alzheimers", "cond.parkinsons", "cond.stroke"],
    markers: [
      {
        name: "p-tau217",
        unit: "pg/mL",
        ref: 0.4,
        max: 1.2,
        dp: 2,
        base: 0.1933, spread: 0.033,
      },
      {
        name: "NfL",
        unit: "pg/mL",
        ref: 15,
        max: 40,
        dp: 1,
        base: 9.8, spread: 1.32,
      },
      {
        name: "GFAP",
        unit: "pg/mL",
        ref: 130,
        max: 300,
        dp: 0,
        base: 82.6667, spread: 11.0,
      },
      {
        name: "Aβ42/40",
        unit: "ratio",
        ref: 0.07,
        max: 0.12,
        dp: 3,
        dir: "low",
        base: 0.0837, spread: 0.0055,
      },
      {
        name: "α-synuclein",
        unit: "pg/mL",
        ref: 1.6,
        max: 4,
        dp: 2,
        base: 0.8967, spread: 0.0592,
      },
      {
        name: "S100B",
        unit: "μg/L",
        ref: 0.1,
        max: 0.3,
        dp: 2,
        base: 0.0567, spread: 0.011,
      },
      {
        name: "Kyn/Trp ratio",
        unit: "μmol/mmol",
        ref: 30,
        max: 80,
        dp: 1,
        demo: [34.6, 30.2, 28.1, 29.4, 31.6, 33.2],
      },
      {
        name: "BDNF",
        unit: "ng/mL",
        ref: 20,
        max: 45,
        dp: 1,
        dir: "low",
        demo: [17.2, 20.8, 22.4, 21.6, 20.2, 19.1],
      },
      {
        name: "6-sulfatoxymelatonin",
        unit: "μg/night",
        ref: 12,
        max: 40,
        dp: 1,
        dir: "low",
        demo: [9.4, 12.6, 14.2, 13.8, 13.1, 12.8],
      },
    ],
  },
  {
    key: "cardio",
    nameKey: "sys.cardio",
    specialtyKey: "spec.cardio",
    noteKey: "sys.cardio.note",
    conditionKeys: ["cond.mi", "cond.hypertension"],
    markers: [
      {
        name: "hs-CRP",
        unit: "mg/L",
        ref: 1.0,
        max: 5,
        dp: 1,
        demo: [1.2, 0.9, 0.8, 0.7, 0.8, 0.7],
      },
      {
        name: "LDL-C",
        unit: "mg/dL",
        ref: 130,
        max: 200,
        dp: 0,
        demo: [142, 131, 121, 114, 110, 108],
      },
      {
        name: "HDL-C",
        unit: "mg/dL",
        ref: 50,
        max: 100,
        dp: 0,
        dir: "low",
        demo: [44, 48, 52, 54, 54, 55],
      },
      {
        name: "Triglycerides",
        unit: "mg/dL",
        ref: 150,
        max: 300,
        dp: 0,
        demo: [162, 148, 134, 126, 123, 121],
      },
      {
        name: "ApoB",
        unit: "mg/dL",
        ref: 90,
        max: 160,
        dp: 0,
        demo: [104, 95, 86, 85, 84, 84],
      },
      {
        name: "Lp(a)",
        unit: "nmol/L",
        ref: 50,
        max: 150,
        dp: 0,
        base: 24.0, spread: 4.4,
      },
      {
        name: "Homocysteine",
        unit: "μmol/L",
        ref: 15,
        max: 30,
        dp: 1,
        base: 9.5667, spread: 1.21,
      },
      {
        name: "NT-proBNP",
        unit: "pg/mL",
        ref: 125,
        max: 400,
        dp: 0,
        base: 44.3333, spread: 7.7,
      },
      {
        name: "Troponin-I",
        unit: "ng/L",
        ref: 15,
        max: 50,
        dp: 1,
        base: 1.9333, spread: 0.33,
      },
    ],
  },
  {
    key: "endocrine",
    nameKey: "sys.endocrine",
    specialtyKey: "spec.endocrine",
    noteKey: "sys.endocrine.note",
    conditionKeys: ["cond.diabetes", "cond.thyroid"],
    markers: [
      {
        name: "HbA1c",
        unit: "%",
        ref: 5.7,
        max: 9,
        dp: 1,
        demo: [5.4, 5.4, 5.5, 5.6, 5.7, 5.9],
      },
      {
        name: "Fasting glucose",
        unit: "mg/dL",
        ref: 100,
        max: 180,
        dp: 0,
        demo: [92, 93, 94, 98, 101, 104],
      },
      {
        name: "Fasting insulin",
        unit: "μIU/mL",
        ref: 12,
        max: 30,
        dp: 1,
        demo: [7.8, 7.9, 8.1, 8.6, 9.1, 9.6],
      },
      {
        name: "HOMA-IR",
        unit: "",
        ref: 2.5,
        max: 6,
        dp: 1,
        base: 1.9, spread: 0.55,
      },
      {
        name: "TSH",
        unit: "mIU/L",
        ref: 4.0,
        max: 10,
        dp: 2,
        base: 2.2667, spread: 0.33,
      },
      {
        name: "Free T4",
        unit: "ng/dL",
        ref: 0.9,
        max: 2,
        dp: 2,
        dir: "low",
        base: 1.09, spread: 0.0719,
      },
      {
        name: "Cortisol (AM)",
        unit: "μg/dL",
        ref: 20,
        max: 35,
        dp: 1,
        demo: [14.2, 13.9, 13.6, 14.8, 15.9, 16.8],
      },
      {
        name: "DHEA-S",
        unit: "μg/dL",
        ref: 160,
        max: 450,
        dp: 0,
        dir: "low",
        demo: [188, 205, 214, 202, 189, 176],
      },
    ],
  },
  {
    key: "hepatic",
    nameKey: "sys.hepatic",
    specialtyKey: "spec.hepatic",
    noteKey: "sys.hepatic.note",
    conditionKeys: ["cond.fattyLiver", "cond.hepatitis"],
    markers: [
      {
        name: "ALT",
        unit: "U/L",
        ref: 33,
        max: 120,
        dp: 0,
        demo: [26, 29, 31, 34, 33, 38],
      },
      {
        name: "AST",
        unit: "U/L",
        ref: 32,
        max: 120,
        dp: 0,
        demo: [22, 24, 25, 27, 29, 33],
      },
      {
        name: "GGT",
        unit: "U/L",
        ref: 40,
        max: 150,
        dp: 0,
        demo: [27, 31, 36, 44, 53, 68],
      },
      {
        name: "ALP",
        unit: "U/L",
        ref: 120,
        max: 300,
        dp: 0,
        demo: [74, 78, 82, 91, 103, 118],
      },
      {
        name: "Total bilirubin",
        unit: "mg/dL",
        ref: 1.2,
        max: 3,
        dp: 2,
        demo: [0.66, 0.7, 0.72, 0.78, 0.86, 0.98],
      },
      {
        name: "Albumin",
        unit: "g/dL",
        ref: 3.8,
        max: 5.5,
        dp: 1,
        dir: "low",
        demo: [4.5, 4.4, 4.4, 4.3, 4.1, 3.9],
      },
      {
        name: "FIB-4",
        unit: "",
        ref: 1.3,
        max: 4,
        dp: 2,
        demo: [0.88, 0.95, 1.08, 1.22, 1.41, 1.68],
      },
    ],
  },
  {
    key: "renal",
    nameKey: "sys.renal",
    specialtyKey: "spec.renal",
    noteKey: "sys.renal.note",
    conditionKeys: ["cond.ckd"],
    markers: [
      {
        name: "Creatinine",
        unit: "mg/dL",
        ref: 1.2,
        max: 3,
        dp: 2,
        base: 0.9333, spread: 0.0616,
      },
      {
        name: "eGFR",
        unit: "mL/min",
        ref: 90,
        max: 140,
        dp: 0,
        dir: "low",
        base: 98.6667, spread: 6.512,
      },
      {
        name: "BUN",
        unit: "mg/dL",
        ref: 20,
        max: 50,
        dp: 0,
        base: 14.0, spread: 2.2,
      },
      {
        name: "Cystatin C",
        unit: "mg/L",
        ref: 1.0,
        max: 2.5,
        dp: 2,
        base: 0.8167, spread: 0.055,
      },
      {
        name: "UACR",
        unit: "mg/g",
        ref: 30,
        max: 120,
        dp: 0,
        base: 9.3333, spread: 3.3,
      },
      {
        name: "Uric acid",
        unit: "mg/dL",
        ref: 7.0,
        max: 12,
        dp: 1,
        base: 5.8, spread: 0.66,
      },
    ],
  },
  {
    key: "hematology",
    nameKey: "sys.hematology",
    specialtyKey: "spec.hematology",
    noteKey: "sys.hematology.note",
    conditionKeys: ["cond.anemia"],
    markers: [
      {
        name: "Haemoglobin",
        unit: "g/dL",
        ref: 13.5,
        max: 18,
        dp: 1,
        dir: "low",
        base: 14.7333, spread: 0.9724,
      },
      {
        name: "Haematocrit",
        unit: "%",
        ref: 40,
        max: 55,
        dp: 1,
        dir: "low",
        base: 43.6333, spread: 2.8798,
      },
      {
        name: "WBC",
        unit: "10³/μL",
        ref: 10,
        max: 18,
        dp: 1,
        base: 6.1667, spread: 0.55,
      },
      {
        name: "Platelets",
        unit: "10³/μL",
        ref: 140,
        max: 450,
        dp: 0,
        dir: "low",
        demo: [252, 246, 238, 221, 203, 178],
      },
      {
        name: "Ferritin",
        unit: "ng/mL",
        ref: 30,
        max: 300,
        dp: 0,
        dir: "low",
        base: 88.0, spread: 13.2,
      },
      {
        name: "MCV",
        unit: "fL",
        ref: 80,
        max: 100,
        dp: 1,
        dir: "low",
        base: 89.7667, spread: 5.9246,
      },
    ],
  },
  {
    key: "pulmonary",
    nameKey: "sys.pulmonary",
    specialtyKey: "spec.pulmonary",
    noteKey: "sys.pulmonary.note",
    conditionKeys: ["cond.copd", "cond.asthma"],
    markers: [
      {
        name: "Eosinophils",
        unit: "/μL",
        ref: 300,
        max: 900,
        dp: 0,
        base: 147.0, spread: 31.9,
      },
      {
        name: "Total IgE",
        unit: "IU/mL",
        ref: 100,
        max: 400,
        dp: 0,
        base: 42.3333, spread: 9.9,
      },
      {
        name: "α1-antitrypsin",
        unit: "mg/dL",
        ref: 90,
        max: 200,
        dp: 0,
        dir: "low",
        base: 128.3333, spread: 8.47,
      },
      {
        name: "SpO₂",
        unit: "%",
        ref: 95,
        max: 100,
        dp: 0,
        dir: "low",
        base: 97.6667, spread: 6.446,
      },
      {
        name: "KL-6",
        unit: "U/mL",
        ref: 500,
        max: 1500,
        dp: 0,
        base: 212.0, spread: 15.4,
      },
    ],
  },
  {
    key: "immune",
    nameKey: "sys.immune",
    specialtyKey: "spec.immune",
    noteKey: "sys.immune.note",
    conditionKeys: ["cond.ra", "cond.autoimmune"],
    markers: [
      {
        name: "ESR",
        unit: "mm/hr",
        ref: 20,
        max: 60,
        dp: 0,
        base: 10.6667, spread: 3.3,
      },
      {
        name: "Rheumatoid factor",
        unit: "IU/mL",
        ref: 14,
        max: 60,
        dp: 1,
        base: 4.1667, spread: 0.77,
      },
      {
        name: "Anti-CCP",
        unit: "U/mL",
        ref: 20,
        max: 100,
        dp: 1,
        base: 2.1333, spread: 0.33,
      },
      {
        name: "ANA titre",
        unit: "1:n",
        ref: 80,
        max: 640,
        dp: 0,
        base: 40.0, spread: 2.64,
      },
      {
        name: "IL-6",
        unit: "pg/mL",
        ref: 7,
        max: 25,
        dp: 1,
        base: 2.4333, spread: 0.77,
      },
      {
        name: "Complement C3",
        unit: "mg/dL",
        ref: 90,
        max: 180,
        dp: 0,
        dir: "low",
        base: 112.3333, spread: 7.414,
      },
    ],
  },
  {
    key: "oncology",
    nameKey: "sys.oncology",
    specialtyKey: "spec.oncology",
    noteKey: "sys.oncology.note",
    conditionKeys: ["cond.cancer"],
    markers: [
      {
        name: "cfDNA",
        unit: "ng/mL",
        ref: 10,
        max: 30,
        dp: 1,
        demo: [4.8, 5.1, 5.4, 6.2, 7.1, 8.6],
      },
      {
        name: "CEA",
        unit: "ng/mL",
        ref: 5.0,
        max: 15,
        dp: 1,
        base: 1.8333, spread: 0.33,
      },
      {
        name: "CA19-9",
        unit: "U/mL",
        ref: 37,
        max: 100,
        dp: 0,
        base: 11.0, spread: 2.2,
      },
      {
        name: "AFP",
        unit: "ng/mL",
        ref: 10,
        max: 40,
        dp: 1,
        demo: [2.6, 2.9, 3.5, 5.1, 7.6, 11.4],
      },
      {
        name: "CA-125",
        unit: "U/mL",
        ref: 35,
        max: 120,
        dp: 0,
        base: 11.0, spread: 2.2,
      },
      {
        name: "PSA",
        unit: "ng/mL",
        ref: 4.0,
        max: 10,
        dp: 2,
        base: 0.7133, spread: 0.066,
      },
    ],
  },
  {
    key: "nutrition",
    nameKey: "sys.nutrition",
    specialtyKey: "spec.nutrition",
    noteKey: "sys.nutrition.note",
    conditionKeys: ["cond.deficiency"],
    markers: [
      {
        name: "Vitamin D",
        unit: "ng/mL",
        ref: 30,
        max: 80,
        dp: 1,
        dir: "low",
        demo: [26.4, 29.1, 30.6, 31.4, 31.8, 31.2],
      },
      {
        name: "Vitamin B12",
        unit: "pg/mL",
        ref: 300,
        max: 900,
        dp: 0,
        dir: "low",
        base: 387.0, spread: 34.1,
      },
      {
        name: "Folate",
        unit: "ng/mL",
        ref: 4.0,
        max: 20,
        dp: 1,
        dir: "low",
        base: 8.2333, spread: 0.77,
      },
      {
        name: "Iron",
        unit: "μg/dL",
        ref: 60,
        max: 170,
        dp: 0,
        dir: "low",
        base: 92.0, spread: 8.8,
      },
      {
        name: "Magnesium",
        unit: "mg/dL",
        ref: 1.7,
        max: 2.6,
        dp: 2,
        dir: "low",
        base: 2.0167, spread: 0.1331,
      },
      {
        name: "Zinc",
        unit: "μg/dL",
        ref: 70,
        max: 130,
        dp: 0,
        dir: "low",
        base: 88.0, spread: 6.6,
      },
      {
        name: "Omega-3 index",
        unit: "%",
        ref: 4.0,
        max: 12,
        dp: 1,
        dir: "low",
        base: 5.4, spread: 0.44,
      },
    ],
  },
];

export const SYSTEMS = RAW_SYSTEMS.map(withSeries);

/** Kept as an alias so existing call sites reading "zones" still work. */
export const ZONES = SYSTEMS;

export const TOTAL_CONDITIONS = SYSTEMS.reduce(
  (n, s) => n + s.conditionKeys.length,
  0,
);
export const TOTAL_MARKERS = SYSTEMS.reduce((n, s) => n + s.markers.length, 0);

export function systemOf(key) {
  return SYSTEMS.find((s) => s.key === key);
}
export const zoneOf = systemOf;

/**
 * 0 clear · 1 watch · 2 consult.
 * 25% the wrong side of the reference is the second step, in whichever
 * direction that marker's harm runs.
 */
export function markerLevel(marker, value) {
  if (marker.dir === "low") {
    if (value < marker.ref * 0.75) return 2;
    if (value < marker.ref) return 1;
    return 0;
  }
  if (value > marker.ref * 1.25) return 2;
  if (value > marker.ref) return 1;
  return 0;
}

/** "Optimal" is comfortably inside the range, not merely the right side of it. */
export function isOptimal(marker, value) {
  return marker.dir === "low"
    ? value >= marker.ref * 1.25
    : value <= marker.ref * 0.75;
}

export function systemLevel(system, values) {
  return system.markers.reduce(
    (lv, m, i) => Math.max(lv, markerLevel(m, values[i])),
    0,
  );
}
export const zoneLevel = systemLevel;

export function formatValue(value, dp) {
  return dp > 0 ? value.toFixed(dp) : String(Math.round(value));
}

/**
 * Traffic-light band for one marker, oriented by `dir` so the green stretch is
 * always the safe side of the reference.
 */
export function markerBand(marker) {
  if (marker.dir === "low") {
    const red = Math.max(0, ((marker.ref * 0.75) / marker.max) * 100);
    const amber = Math.max(0, (marker.ref / marker.max) * 100);
    return (
      `linear-gradient(90deg,${C.alert} 0 ${red.toFixed(1)}%,` +
      `${C.watch} ${red.toFixed(1)}% ${amber.toFixed(1)}%,` +
      `${C.optimal} ${amber.toFixed(1)}% 100%)`
    );
  }
  const green = Math.min(100, (marker.ref / marker.max) * 100);
  const amber = Math.min(100, ((marker.ref * 1.25) / marker.max) * 100);
  return (
    `linear-gradient(90deg,${C.optimal} 0 ${green.toFixed(1)}%,` +
    `${C.watch} ${green.toFixed(1)}% ${amber.toFixed(1)}%,` +
    `${C.alert} ${amber.toFixed(1)}% 100%)`
  );
}

export function markerLeft(value, max) {
  return `${Math.max(0, Math.min(100, (value / max) * 100)).toFixed(1)}%`;
}

/** Values for one system at one round index (0 = oldest). */
export function valuesAt(system, roundIndex) {
  return system.markers.map((m) => m.demo[roundIndex]);
}

/** Every system at one round, with its computed level. */
export function systemsAt(roundIndex) {
  return SYSTEMS.map((system) => {
    const values = valuesAt(system, roundIndex);
    return { zone: system, system, values, level: systemLevel(system, values) };
  });
}
