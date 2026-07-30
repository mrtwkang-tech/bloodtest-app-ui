import { C } from "../tokens";

/**
 * Body screening, organised the way a referral is: one system per medical
 * specialty, so a flagged result maps to a clinic you can actually book.
 *
 * Each marker carries its own three-round demo series, so a value and the
 * reference it is judged against never drift apart in separate files.
 *
 * `dir` is the direction of harm. Most markers are 'high' (over the reference
 * is bad); HDL, eGFR, haemoglobin and the vitamins are 'low' (under the
 * reference is bad). Everything downstream reads `dir` rather than assuming.
 */

/** Level 0/1/2 → i18n key. Colours live in tokens.js. */
export const BODY_STATUS_KEY = ["body.clear", "body.watch", "body.consult"];

export const SYSTEMS = [
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
        demo: [0.21, 0.19, 0.18],
      },
      {
        name: "NfL",
        unit: "pg/mL",
        ref: 15,
        max: 40,
        dp: 1,
        demo: [10.4, 9.8, 9.2],
      },
      {
        name: "GFAP",
        unit: "pg/mL",
        ref: 130,
        max: 300,
        dp: 0,
        demo: [88, 82, 78],
      },
      {
        name: "Aβ42/40",
        unit: "ratio",
        ref: 0.07,
        max: 0.12,
        dp: 3,
        dir: "low",
        demo: [0.081, 0.084, 0.086],
      },
      {
        name: "α-synuclein",
        unit: "pg/mL",
        ref: 1.6,
        max: 4,
        dp: 2,
        demo: [0.9, 0.88, 0.91],
      },
      {
        name: "S100B",
        unit: "μg/L",
        ref: 0.1,
        max: 0.3,
        dp: 2,
        demo: [0.06, 0.06, 0.05],
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
        demo: [1.2, 0.8, 0.7],
      },
      {
        name: "LDL-C",
        unit: "mg/dL",
        ref: 130,
        max: 200,
        dp: 0,
        demo: [142, 121, 108],
      },
      {
        name: "HDL-C",
        unit: "mg/dL",
        ref: 50,
        max: 100,
        dp: 0,
        dir: "low",
        demo: [44, 52, 55],
      },
      {
        name: "Triglycerides",
        unit: "mg/dL",
        ref: 150,
        max: 300,
        dp: 0,
        demo: [162, 134, 121],
      },
      {
        name: "ApoB",
        unit: "mg/dL",
        ref: 90,
        max: 160,
        dp: 0,
        demo: [104, 86, 84],
      },
      {
        name: "Lp(a)",
        unit: "nmol/L",
        ref: 50,
        max: 150,
        dp: 0,
        demo: [26, 24, 22],
      },
      {
        name: "Homocysteine",
        unit: "μmol/L",
        ref: 15,
        max: 30,
        dp: 1,
        demo: [10.2, 9.4, 9.1],
      },
      {
        name: "NT-proBNP",
        unit: "pg/mL",
        ref: 125,
        max: 400,
        dp: 0,
        demo: [48, 44, 41],
      },
      {
        name: "Troponin-I",
        unit: "ng/L",
        ref: 15,
        max: 50,
        dp: 1,
        demo: [2.1, 1.9, 1.8],
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
        demo: [5.4, 5.5, 5.9],
      },
      {
        name: "Fasting glucose",
        unit: "mg/dL",
        ref: 100,
        max: 180,
        dp: 0,
        demo: [92, 94, 104],
      },
      {
        name: "Fasting insulin",
        unit: "μIU/mL",
        ref: 12,
        max: 30,
        dp: 1,
        demo: [7.8, 8.1, 9.6],
      },
      {
        name: "HOMA-IR",
        unit: "",
        ref: 2.5,
        max: 6,
        dp: 1,
        demo: [1.7, 1.8, 2.2],
      },
      {
        name: "TSH",
        unit: "mIU/L",
        ref: 4.0,
        max: 10,
        dp: 2,
        demo: [2.1, 2.3, 2.4],
      },
      {
        name: "Free T4",
        unit: "ng/dL",
        ref: 0.9,
        max: 2,
        dp: 2,
        dir: "low",
        demo: [1.12, 1.09, 1.06],
      },
      {
        name: "Cortisol (AM)",
        unit: "μg/dL",
        ref: 20,
        max: 35,
        dp: 1,
        demo: [14.2, 13.6, 16.8],
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
        demo: [29, 26, 31],
      },
      {
        name: "AST",
        unit: "U/L",
        ref: 32,
        max: 120,
        dp: 0,
        demo: [24, 22, 25],
      },
      {
        name: "GGT",
        unit: "U/L",
        ref: 40,
        max: 150,
        dp: 0,
        demo: [31, 27, 34],
      },
      {
        name: "ALP",
        unit: "U/L",
        ref: 120,
        max: 300,
        dp: 0,
        demo: [78, 74, 80],
      },
      {
        name: "Total bilirubin",
        unit: "mg/dL",
        ref: 1.2,
        max: 3,
        dp: 2,
        demo: [0.7, 0.66, 0.72],
      },
      {
        name: "Albumin",
        unit: "g/dL",
        ref: 3.8,
        max: 5.5,
        dp: 1,
        dir: "low",
        demo: [4.4, 4.5, 4.4],
      },
      {
        name: "FIB-4",
        unit: "",
        ref: 1.3,
        max: 4,
        dp: 2,
        demo: [0.92, 0.88, 0.95],
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
        demo: [0.94, 0.91, 0.95],
      },
      {
        name: "eGFR",
        unit: "mL/min",
        ref: 90,
        max: 140,
        dp: 0,
        dir: "low",
        demo: [98, 101, 97],
      },
      {
        name: "BUN",
        unit: "mg/dL",
        ref: 20,
        max: 50,
        dp: 0,
        demo: [14, 13, 15],
      },
      {
        name: "Cystatin C",
        unit: "mg/L",
        ref: 1.0,
        max: 2.5,
        dp: 2,
        demo: [0.82, 0.79, 0.84],
      },
      {
        name: "UACR",
        unit: "mg/g",
        ref: 30,
        max: 120,
        dp: 0,
        demo: [9, 8, 11],
      },
      {
        name: "Uric acid",
        unit: "mg/dL",
        ref: 7.0,
        max: 12,
        dp: 1,
        demo: [5.8, 5.5, 6.1],
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
        demo: [14.6, 14.9, 14.7],
      },
      {
        name: "Haematocrit",
        unit: "%",
        ref: 40,
        max: 55,
        dp: 1,
        dir: "low",
        demo: [43.2, 44.1, 43.6],
      },
      {
        name: "WBC",
        unit: "10³/μL",
        ref: 10,
        max: 18,
        dp: 1,
        demo: [6.2, 5.9, 6.4],
      },
      {
        name: "Platelets",
        unit: "10³/μL",
        ref: 140,
        max: 450,
        dp: 0,
        dir: "low",
        demo: [246, 252, 241],
      },
      {
        name: "Ferritin",
        unit: "ng/mL",
        ref: 30,
        max: 300,
        dp: 0,
        dir: "low",
        demo: [88, 94, 82],
      },
      {
        name: "MCV",
        unit: "fL",
        ref: 80,
        max: 100,
        dp: 1,
        dir: "low",
        demo: [89.4, 90.1, 89.8],
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
        demo: [148, 132, 161],
      },
      {
        name: "Total IgE",
        unit: "IU/mL",
        ref: 100,
        max: 400,
        dp: 0,
        demo: [42, 38, 47],
      },
      {
        name: "α1-antitrypsin",
        unit: "mg/dL",
        ref: 90,
        max: 200,
        dp: 0,
        dir: "low",
        demo: [128, 131, 126],
      },
      {
        name: "SpO₂",
        unit: "%",
        ref: 95,
        max: 100,
        dp: 0,
        dir: "low",
        demo: [98, 98, 97],
      },
      {
        name: "KL-6",
        unit: "U/mL",
        ref: 500,
        max: 1500,
        dp: 0,
        demo: [212, 205, 219],
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
        demo: [11, 9, 12],
      },
      {
        name: "Rheumatoid factor",
        unit: "IU/mL",
        ref: 14,
        max: 60,
        dp: 1,
        demo: [4.2, 3.8, 4.5],
      },
      {
        name: "Anti-CCP",
        unit: "U/mL",
        ref: 20,
        max: 100,
        dp: 1,
        demo: [2.1, 2.0, 2.3],
      },
      {
        name: "ANA titre",
        unit: "1:n",
        ref: 80,
        max: 640,
        dp: 0,
        demo: [40, 40, 40],
      },
      {
        name: "IL-6",
        unit: "pg/mL",
        ref: 7,
        max: 25,
        dp: 1,
        demo: [2.4, 2.1, 2.8],
      },
      {
        name: "Complement C3",
        unit: "mg/dL",
        ref: 90,
        max: 180,
        dp: 0,
        dir: "low",
        demo: [112, 115, 110],
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
        demo: [5.4, 4.8, 5.1],
      },
      {
        name: "CEA",
        unit: "ng/mL",
        ref: 5.0,
        max: 15,
        dp: 1,
        demo: [2.0, 1.7, 1.8],
      },
      {
        name: "CA19-9",
        unit: "U/mL",
        ref: 37,
        max: 100,
        dp: 0,
        demo: [12, 10, 11],
      },
      {
        name: "AFP",
        unit: "ng/mL",
        ref: 10,
        max: 40,
        dp: 1,
        demo: [2.8, 2.6, 2.9],
      },
      {
        name: "CA-125",
        unit: "U/mL",
        ref: 35,
        max: 120,
        dp: 0,
        demo: [11, 10, 12],
      },
      {
        name: "PSA",
        unit: "ng/mL",
        ref: 4.0,
        max: 10,
        dp: 2,
        demo: [0.72, 0.68, 0.74],
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
        demo: [26.4, 30.6, 31.2],
      },
      {
        name: "Vitamin B12",
        unit: "pg/mL",
        ref: 300,
        max: 900,
        dp: 0,
        dir: "low",
        demo: [388, 402, 371],
      },
      {
        name: "Folate",
        unit: "ng/mL",
        ref: 4.0,
        max: 20,
        dp: 1,
        dir: "low",
        demo: [8.2, 8.6, 7.9],
      },
      {
        name: "Iron",
        unit: "μg/dL",
        ref: 60,
        max: 170,
        dp: 0,
        dir: "low",
        demo: [92, 96, 88],
      },
      {
        name: "Magnesium",
        unit: "mg/dL",
        ref: 1.7,
        max: 2.6,
        dp: 2,
        dir: "low",
        demo: [2.02, 2.05, 1.98],
      },
      {
        name: "Zinc",
        unit: "μg/dL",
        ref: 70,
        max: 130,
        dp: 0,
        dir: "low",
        demo: [88, 91, 85],
      },
      {
        name: "Omega-3 index",
        unit: "%",
        ref: 4.0,
        max: 12,
        dp: 1,
        dir: "low",
        demo: [5.2, 5.6, 5.4],
      },
    ],
  },
];

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
