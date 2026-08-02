import { C } from "../tokens";
import { stampWindow } from "./window";

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

// Twelve monthly draws. Was six quarterly ones — the interval is what makes
// most of the methylation panel unreadable month to month, which is the whole
// subject of data/window.js.
export const ROUNDS = 12;

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
export function withSeries(system) {
  return {
    ...system,
    markers: system.markers.map((raw) => {
      // Every marker carries how long its value took to form, from the one
      // table in window.js, so nothing downstream has to look it up.
      const m = stampWindow(raw);
      const demo = m.demo ?? walk(`${system.key}:${m.name}`, m.base, m.spread);
      if (demo.length !== ROUNDS) {
        throw new Error(
          `${system.key}/${m.name}: expected ${ROUNDS} readings, got ${demo.length}`,
        );
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
    icon: "neuro",
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
        base: 0.1933,
        spread: 0.033,
      },
      {
        name: "NfL",
        unit: "pg/mL",
        ref: 15,
        max: 40,
        dp: 1,
        base: 9.8,
        spread: 1.32,
      },
      {
        name: "GFAP",
        unit: "pg/mL",
        ref: 130,
        max: 300,
        dp: 0,
        base: 82.6667,
        spread: 11.0,
      },
      {
        name: "Aβ42/40",
        unit: "ratio",
        ref: 0.07,
        max: 0.12,
        dp: 3,
        dir: "low",
        base: 0.0837,
        spread: 0.0055,
      },
      {
        name: "α-synuclein",
        unit: "pg/mL",
        ref: 1.6,
        max: 4,
        dp: 2,
        base: 0.8967,
        spread: 0.0592,
      },
      {
        name: "S100B",
        unit: "μg/L",
        ref: 0.1,
        max: 0.3,
        dp: 2,
        base: 0.0567,
        spread: 0.011,
      },
      {
        name: "Kyn/Trp ratio",
        unit: "μmol/mmol",
        ref: 30,
        max: 80,
        dp: 1,
        demo: [
          34.6, 32.5, 30.2, 29.6, 28.3, 28.3, 28.9, 30.3, 30.6, 31.3, 32.2,
          33.2,
        ],
      },
      {
        // The raw material. Kyn/Trp says how much is being diverted; this says
        // how much there was to divert.
        name: "Free tryptophan",
        unit: "μmol/L",
        ref: 8,
        max: 20,
        dp: 1,
        dir: "low",
        base: 10.6,
        spread: 1.3,
      },
      {
        name: "BDNF",
        unit: "ng/mL",
        ref: 20,
        max: 45,
        dp: 1,
        dir: "low",
        demo: [
          17.2, 19, 20.3, 21.4, 22, 21.9, 21.9, 21.5, 20.6, 20.5, 19.8, 19.1,
        ],
      },
      {
        name: "6-sulfatoxymelatonin",
        unit: "μg/night",
        ref: 12,
        max: 40,
        dp: 1,
        dir: "low",
        demo: [
          9.4, 11.1, 12.6, 13, 14.3, 13.9, 13.8, 14, 13.4, 13.4, 13.2, 12.8,
        ],
      },
    ],
  },
  {
    key: "cardio",
    nameKey: "sys.cardio",
    icon: "cardio",
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
        demo: [1.2, 1, 0.9, 0.9, 0.8, 0.7, 0.7, 0.7, 0.8, 0.8, 0.7, 0.7],
      },
      {
        name: "LDL-C",
        unit: "mg/dL",
        ref: 130,
        max: 200,
        dp: 0,
        demo: [142, 138, 132, 129, 120, 119, 113, 115, 109, 111, 109, 108],
      },
      {
        name: "HDL-C",
        unit: "mg/dL",
        ref: 50,
        max: 100,
        dp: 0,
        dir: "low",
        demo: [44, 47, 47, 49, 51, 52, 54, 54, 54, 55, 55, 55],
      },
      {
        name: "Triglycerides",
        unit: "mg/dL",
        ref: 150,
        max: 300,
        dp: 0,
        demo: [162, 153, 148, 145, 135, 130, 127, 126, 122, 123, 119, 121],
      },
      {
        name: "ApoB",
        unit: "mg/dL",
        ref: 90,
        max: 160,
        dp: 0,
        demo: [104, 98, 96, 93, 89, 85, 85, 85, 85, 84, 83, 84],
      },
      {
        name: "Lp(a)",
        unit: "nmol/L",
        ref: 50,
        max: 150,
        dp: 0,
        base: 24.0,
        spread: 4.4,
      },
      {
        name: "Homocysteine",
        unit: "μmol/L",
        ref: 15,
        max: 30,
        dp: 1,
        base: 9.5667,
        spread: 1.21,
      },
      {
        name: "NT-proBNP",
        unit: "pg/mL",
        ref: 125,
        max: 400,
        dp: 0,
        base: 44.3333,
        spread: 7.7,
      },
      {
        name: "Troponin-I",
        unit: "ng/L",
        ref: 15,
        max: 50,
        dp: 1,
        base: 1.9333,
        spread: 0.33,
      },
    ],
  },
  {
    key: "endocrine",
    nameKey: "sys.endocrine",
    icon: "endocrine",
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
        demo: [5.4, 5.4, 5.4, 5.4, 5.5, 5.6, 5.6, 5.6, 5.7, 5.7, 5.8, 5.9],
      },
      {
        name: "Fasting glucose",
        unit: "mg/dL",
        ref: 100,
        max: 180,
        dp: 0,
        demo: [92, 93, 93, 93, 93, 95, 97, 98, 100, 101, 102, 104],
      },
      {
        name: "Fasting insulin",
        unit: "μIU/mL",
        ref: 12,
        max: 30,
        dp: 1,
        demo: [7.8, 7.7, 7.8, 8, 7.9, 8.2, 8.3, 8.7, 8.8, 9.1, 9.4, 9.6],
      },
      {
        // Two to three weeks of glucose, against HbA1c's hundred. Same
        // question, a window this cadence can actually see move.
        name: "Fructosamine",
        unit: "μmol/L",
        ref: 285,
        max: 400,
        dp: 0,
        demo: [248, 253, 257, 262, 268, 272, 278, 284, 283, 289, 294, 299],
      },
      {
        // The catabolic/anabolic balance. A ratio rather than either hormone
        // alone: both move with the hour of the draw, and dividing cancels
        // some of that shared variance.
        name: "Cortisol:DHEA-S",
        unit: "",
        ref: 0.075,
        max: 0.16,
        dp: 3,
        requiresFixedTime: true,
        base: 0.058,
        spread: 0.009,
      },
      {
        // Rise in the 30 minutes after waking — a phase marker, not a level.
        name: "Cortisol awakening response",
        unit: "nmol/L",
        ref: 5,
        max: 20,
        dp: 1,
        dir: "low",
        requiresFixedTime: true,
        base: 7.4,
        spread: 1.5,
      },
      {
        // Cellular stress and mitochondrial dysfunction; tracks fatigue better
        // than anything else that comes out of a tube.
        name: "GDF-15",
        unit: "pg/mL",
        ref: 1200,
        max: 3000,
        dp: 0,
        base: 720,
        spread: 95,
      },
      {
        name: "HOMA-IR",
        unit: "",
        ref: 2.5,
        max: 6,
        dp: 1,
        base: 1.9,
        spread: 0.55,
      },
      {
        name: "TSH",
        unit: "mIU/L",
        ref: 4.0,
        max: 10,
        dp: 2,
        base: 2.2667,
        spread: 0.33,
      },
      {
        name: "Free T4",
        unit: "ng/dL",
        ref: 0.9,
        max: 2,
        dp: 2,
        dir: "low",
        base: 1.09,
        spread: 0.0719,
      },
      {
        name: "Cortisol (AM)",
        unit: "μg/dL",
        ref: 20,
        max: 35,
        dp: 1,
        demo: [
          14.2, 13.9, 13.8, 13.7, 13.8, 14.1, 14.6, 15, 15.5, 16.2, 16.6, 16.8,
        ],
      },
      {
        name: "DHEA-S",
        unit: "μg/dL",
        ref: 160,
        max: 450,
        dp: 0,
        dir: "low",
        demo: [188, 195, 204, 206, 215, 214, 206, 200, 192, 187, 183, 176],
      },
    ],
  },
  {
    key: "hepatic",
    nameKey: "sys.hepatic",
    icon: "hepatic",
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
        demo: [26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 37, 38],
      },
      {
        name: "AST",
        unit: "U/L",
        ref: 32,
        max: 120,
        dp: 0,
        demo: [22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33],
      },
      {
        name: "GGT",
        unit: "U/L",
        ref: 40,
        max: 150,
        dp: 0,
        demo: [27, 29, 31, 34, 37, 40, 44, 48, 53, 58, 63, 68],
      },
      {
        name: "ALP",
        unit: "U/L",
        ref: 120,
        max: 300,
        dp: 0,
        demo: [74, 76, 77, 78, 84, 86, 90, 93, 96, 105, 108, 118],
      },
      {
        name: "Total bilirubin",
        unit: "mg/dL",
        ref: 1.2,
        max: 3,
        dp: 2,
        demo: [
          0.66, 0.7, 0.72, 0.69, 0.7, 0.74, 0.75, 0.81, 0.83, 0.89, 0.93, 0.98,
        ],
      },
      {
        name: "Albumin",
        unit: "g/dL",
        ref: 3.8,
        max: 5.5,
        dp: 1,
        dir: "low",
        demo: [4.5, 4.5, 4.4, 4.4, 4.4, 4.3, 4.3, 4.3, 4.2, 4.1, 4, 3.9],
      },
      {
        name: "FIB-4",
        unit: "",
        ref: 1.3,
        max: 4,
        dp: 2,
        demo: [
          0.88, 0.94, 1.0, 1.06, 1.13, 1.2, 1.27, 1.34, 1.42, 1.5, 1.59, 1.68,
        ],
      },
    ],
  },
  {
    key: "renal",
    nameKey: "sys.renal",
    icon: "renal",
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
        base: 0.9333,
        spread: 0.0616,
      },
      {
        name: "eGFR",
        unit: "mL/min",
        ref: 90,
        max: 140,
        dp: 0,
        dir: "low",
        base: 98.6667,
        spread: 6.512,
      },
      {
        name: "BUN",
        unit: "mg/dL",
        ref: 20,
        max: 50,
        dp: 0,
        base: 14.0,
        spread: 2.2,
      },
      {
        name: "Cystatin C",
        unit: "mg/L",
        ref: 1.0,
        max: 2.5,
        dp: 2,
        base: 0.8167,
        spread: 0.055,
      },
      {
        name: "UACR",
        unit: "mg/g",
        ref: 30,
        max: 120,
        dp: 0,
        base: 9.3333,
        spread: 3.3,
      },
      {
        name: "Uric acid",
        unit: "mg/dL",
        ref: 7.0,
        max: 12,
        dp: 1,
        base: 5.8,
        spread: 0.66,
      },
    ],
  },
  {
    key: "hematology",
    nameKey: "sys.hematology",
    icon: "hematology",
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
        base: 14.7333,
        spread: 0.9724,
      },
      {
        name: "Haematocrit",
        unit: "%",
        ref: 40,
        max: 55,
        dp: 1,
        dir: "low",
        base: 43.6333,
        spread: 2.8798,
      },
      {
        name: "WBC",
        unit: "10³/μL",
        ref: 10,
        max: 18,
        dp: 1,
        base: 6.1667,
        spread: 0.55,
      },
      {
        name: "Platelets",
        unit: "10³/μL",
        ref: 140,
        max: 450,
        dp: 0,
        dir: "low",
        demo: [252, 245, 238, 231, 225, 219, 213, 207, 201, 195, 188, 178],
      },
      {
        name: "Ferritin",
        unit: "ng/mL",
        ref: 30,
        max: 300,
        dp: 0,
        dir: "low",
        base: 88.0,
        spread: 13.2,
      },
      {
        name: "MCV",
        unit: "fL",
        ref: 80,
        max: 100,
        dp: 1,
        dir: "low",
        base: 89.7667,
        spread: 5.9246,
      },
    ],
  },
  {
    key: "pulmonary",
    nameKey: "sys.pulmonary",
    icon: "pulmonary",
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
        base: 147.0,
        spread: 31.9,
      },
      {
        name: "Total IgE",
        unit: "IU/mL",
        ref: 100,
        max: 400,
        dp: 0,
        base: 42.3333,
        spread: 9.9,
      },
      {
        name: "α1-antitrypsin",
        unit: "mg/dL",
        ref: 90,
        max: 200,
        dp: 0,
        dir: "low",
        base: 128.3333,
        spread: 8.47,
      },
      {
        name: "SpO₂",
        unit: "%",
        ref: 95,
        max: 100,
        dp: 0,
        dir: "low",
        base: 97.6667,
        spread: 6.446,
      },
      {
        name: "KL-6",
        unit: "U/mL",
        ref: 500,
        max: 1500,
        dp: 0,
        base: 212.0,
        spread: 15.4,
      },
    ],
  },
  {
    key: "immune",
    nameKey: "sys.immune",
    icon: "immune",
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
        base: 10.6667,
        spread: 3.3,
      },
      {
        name: "Rheumatoid factor",
        unit: "IU/mL",
        ref: 14,
        max: 60,
        dp: 1,
        base: 4.1667,
        spread: 0.77,
      },
      {
        name: "Anti-CCP",
        unit: "U/mL",
        ref: 20,
        max: 100,
        dp: 1,
        base: 2.1333,
        spread: 0.33,
      },
      {
        name: "ANA titre",
        unit: "1:n",
        ref: 80,
        max: 640,
        dp: 0,
        base: 40.0,
        spread: 2.64,
      },
      {
        name: "IL-6",
        unit: "pg/mL",
        ref: 7,
        max: 25,
        dp: 1,
        base: 2.4333,
        spread: 0.77,
      },
      {
        // Free from the CBC differential, and one of the cheapest usable
        // inflammation signals there is.
        name: "Neutrophil:lymphocyte",
        unit: "",
        ref: 2.5,
        max: 6,
        dp: 2,
        base: 1.74,
        spread: 0.28,
      },
      {
        name: "Complement C3",
        unit: "mg/dL",
        ref: 90,
        max: 180,
        dp: 0,
        dir: "low",
        base: 112.3333,
        spread: 7.414,
      },
    ],
  },
  {
    key: "oncology",
    nameKey: "sys.oncology",
    icon: "oncology",
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
        demo: [4.8, 5.2, 5.1, 4.9, 5.4, 5.9, 6.2, 6.2, 7, 7.3, 7.9, 8.6],
      },
      {
        name: "CEA",
        unit: "ng/mL",
        ref: 5.0,
        max: 15,
        dp: 1,
        base: 1.8333,
        spread: 0.33,
      },
      {
        name: "CA19-9",
        unit: "U/mL",
        ref: 37,
        max: 100,
        dp: 0,
        base: 11.0,
        spread: 2.2,
      },
      {
        name: "AFP",
        unit: "ng/mL",
        ref: 10,
        max: 40,
        dp: 1,
        demo: [2.6, 3.0, 3.4, 3.9, 4.4, 5.0, 5.7, 6.5, 7.4, 8.5, 9.7, 11.1],
      },
      {
        name: "CA-125",
        unit: "U/mL",
        ref: 35,
        max: 120,
        dp: 0,
        base: 11.0,
        spread: 2.2,
      },
      {
        name: "PSA",
        unit: "ng/mL",
        ref: 4.0,
        max: 10,
        dp: 2,
        base: 0.7133,
        spread: 0.066,
      },
    ],
  },
  {
    key: "nutrition",
    nameKey: "sys.nutrition",
    icon: "nutrition",
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
        demo: [
          26.4, 27.5, 28.9, 29.8, 30.4, 31.2, 31.5, 31.3, 31.6, 31.8, 31.8,
          31.2,
        ],
      },
      {
        name: "Vitamin B12",
        unit: "pg/mL",
        ref: 300,
        max: 900,
        dp: 0,
        dir: "low",
        base: 387.0,
        spread: 34.1,
      },
      {
        // The fraction bound to transcobalamin — the part a cell can take up.
        // Total B12 moves slowly and stays normal long after the usable pool
        // has fallen.
        name: "Active B12 (holoTC)",
        unit: "pmol/L",
        ref: 35,
        max: 130,
        dp: 0,
        dir: "low",
        base: 61,
        spread: 8,
      },
      {
        // Red cells live 120 days, so the omega-3 INDEX is a four-month
        // window. The plasma fraction answers the same question in three weeks.
        name: "Plasma omega-3",
        unit: "%",
        ref: 4.0,
        max: 10,
        dp: 2,
        dir: "low",
        base: 4.9,
        spread: 0.55,
      },
      {
        name: "Folate",
        unit: "ng/mL",
        ref: 4.0,
        max: 20,
        dp: 1,
        dir: "low",
        base: 8.2333,
        spread: 0.77,
      },
      {
        name: "Iron",
        unit: "μg/dL",
        ref: 60,
        max: 170,
        dp: 0,
        dir: "low",
        base: 92.0,
        spread: 8.8,
      },
      {
        name: "Magnesium",
        unit: "mg/dL",
        ref: 1.7,
        max: 2.6,
        dp: 2,
        dir: "low",
        base: 2.0167,
        spread: 0.1331,
      },
      {
        name: "Zinc",
        unit: "μg/dL",
        ref: 70,
        max: 130,
        dp: 0,
        dir: "low",
        base: 88.0,
        spread: 6.6,
      },
      {
        name: "Omega-3 index",
        unit: "%",
        ref: 4.0,
        max: 12,
        dp: 1,
        dir: "low",
        base: 5.4,
        spread: 0.44,
      },
    ],
  },
  {
    /**
     * BONE, AND WHY IT IS ITS OWN PANEL.
     *
     * The skeleton used to be drawn under haematology, on the reasoning that
     * marrow lives in bone. That is true and it is not the same claim: marrow
     * is a TENANT. A CBC says nothing about the beam it is housed in, and
     * lighting up a whole skeleton when a reader taps "혈액" told them their
     * blood panel was about their bones. Haematology now shows the marrow
     * itself — the red marrow in the spine, sternum, ribs, ilium and the
     * proximal femur, which is exactly the distribution a marrow biopsy
     * samples — and the skeleton is here, where it has its own blood panel.
     *
     * WHICH IS A REAL PANEL. Bone turnover is measured in serum, not on a
     * scan: a resorption marker (CTX-1), two formation markers (P1NP, bone
     * ALP), the hormone that drives the exchange (PTH) and the two minerals
     * it moves. A DXA scan says how much bone there is TODAY; these say which
     * way it is going, which is the question a monthly draw can answer and a
     * two-yearly scan cannot.
     *
     * Vitamin D is the other half of this story and it is deliberately NOT
     * duplicated here — it is a nutrient, it already sits in `nutrition`, and
     * one analyte appearing in two panels would be counted twice by every
     * total on the home screen.
     */
    key: "skeletal",
    nameKey: "sys.skeletal",
    icon: "skeletal",
    specialtyKey: "spec.skeletal",
    noteKey: "sys.skeletal.note",
    conditionKeys: ["cond.osteoporosis", "cond.hyperpara"],
    markers: [
      {
        // The resorption side: a fragment of type-I collagen released as bone
        // is broken down. Rising here while formation stays flat is
        // "uncoupled remodelling" — the state that precedes bone loss, and
        // the only one of these a monthly series can catch early.
        name: "CTX-1",
        unit: "ng/mL",
        ref: 0.58,
        max: 1.2,
        dp: 2,
        demo: [
          0.31, 0.33, 0.34, 0.37, 0.39, 0.42, 0.44, 0.47, 0.5, 0.53, 0.56, 0.61,
        ],
      },
      {
        // The formation side. Flat, against a resorption marker that is not.
        name: "P1NP",
        unit: "μg/L",
        ref: 76,
        max: 150,
        dp: 0,
        demo: [48, 47, 49, 46, 48, 50, 47, 49, 46, 48, 47, 49],
      },
      {
        name: "Bone ALP",
        unit: "μg/L",
        ref: 20,
        max: 45,
        dp: 1,
        base: 12.4,
        spread: 1.1,
      },
      {
        name: "PTH",
        unit: "pg/mL",
        ref: 65,
        max: 150,
        dp: 1,
        base: 41.0,
        spread: 4.2,
      },
      {
        name: "Osteocalcin",
        unit: "ng/mL",
        ref: 30,
        max: 60,
        dp: 1,
        base: 18.6,
        spread: 1.9,
      },
      {
        // Albumin-corrected, because half of serum calcium is bound to it and
        // the uncorrected figure tracks the albumin rather than the calcium.
        name: "Corrected calcium",
        unit: "mg/dL",
        ref: 10.2,
        max: 12,
        dp: 2,
        base: 9.38,
        spread: 0.18,
      },
      {
        name: "Phosphate",
        unit: "mg/dL",
        ref: 4.5,
        max: 6,
        dp: 2,
        base: 3.42,
        spread: 0.22,
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

/**
 * How far this value sits from its limit, as a proportion.
 *
 * THE POINT IS THAT IT HAS NO UNIT. The panel measures in μmol/mmol, 10³/μL,
 * pg/mL and twenty other scales, so a reader shown "33.2" has to know the limit
 * is 30 and do the arithmetic before the number means anything — and cannot
 * compare it to anything else on the screen. A proportion of the limit is the
 * one reading that works the same way for all eighty-four markers.
 *
 * `ref` is a THRESHOLD for every marker, not a midpoint, and `dir` says which
 * side is harmful (see markerLevel above). For `dir: "low"` the reference is a
 * floor, so the ratio inverts. Either way 1.00 is the limit exactly and 1.34
 * means a third of the way past it — which keeps the sign in one place instead
 * of at every call site.
 */
export function deviationOf(marker, value) {
  const ratio =
    marker.dir === "low"
      ? marker.ref / Math.max(value, 1e-9)
      : value / marker.ref;
  return {
    ratio,
    // Distance from the limit in either direction, so the copy can say
    // "34% past it" or "34% of headroom left" from the same number.
    pct: Math.round(Math.abs(ratio - 1) * 100),
    over: ratio > 1,
  };
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

/**
 * One system's score, 0–100.
 *
 * WHY A NUMBER PER SYSTEM AT ALL. "관찰 필요" is a threshold word: it fires the
 * moment one marker crosses one line and then says the same thing whether that
 * was by one per cent or by forty. Eleven rows of threshold words cannot be
 * ranked, and ranking them is the question a reader actually has — which of
 * these should I look at first. A score can be.
 *
 * Same per-marker weights as the whole-body score: an optimal marker is worth
 * full marks, one merely inside its range most of them, one outside nothing,
 * and a flagged marker costs again on top so that "out by a lot" is not the
 * same as "out by a little". Here the whole thing is divided by the system's
 * own marker count, so a four-marker panel and a twelve-marker panel are on
 * the same scale and can be read down a column.
 *
 * IT IS NOT THE CASE THAT THE BODY SCORE IS THE MEAN OF THESE, and that is
 * deliberate rather than an oversight. `healthScore` charges every flag
 * against the whole panel, so nine flags spread across nine systems cost nine
 * times what one flag costs — which is the right behaviour for a summary of a
 * person, and the wrong behaviour for a summary of one system.
 */
export function systemScore(system, values) {
  let credit = 0;
  let penalty = 0;
  system.markers.forEach((m, i) => {
    const lv = markerLevel(m, values[i]);
    if (lv === 0) credit += isOptimal(m, values[i]) ? 1 : 0.82;
    if (lv === 1) penalty += 0.015;
    if (lv === 2) penalty += 0.04;
  });
  const n = Math.max(1, system.markers.length);
  return Math.max(0, Math.min(100, Math.round(((credit - penalty) / n) * 100)));
}

export function formatValue(value, dp) {
  return dp > 0 ? value.toFixed(dp) : String(Math.round(value));
}

/**
 * Traffic-light band for one marker, oriented by `dir` so the safe stretch is
 * always the correct side of the reference.
 *
 * Drawn in the pale tints rather than the lamps. At full chroma, eighty-four of
 * these on one screen is a wall of colour that drowns out the two or three
 * values actually worth looking at — and the band is background information
 * anyway. The dark pointer riding on it is the foreground.
 */
export function markerBand(marker) {
  if (marker.dir === "low") {
    const red = Math.max(0, ((marker.ref * 0.75) / marker.max) * 100);
    const amber = Math.max(0, (marker.ref / marker.max) * 100);
    return (
      `linear-gradient(90deg,${C.alertTint} 0 ${red.toFixed(1)}%,` +
      `${C.watchTint} ${red.toFixed(1)}% ${amber.toFixed(1)}%,` +
      `${C.optimalTint} ${amber.toFixed(1)}% 100%)`
    );
  }
  const green = Math.min(100, (marker.ref / marker.max) * 100);
  const amber = Math.min(100, ((marker.ref * 1.25) / marker.max) * 100);
  return (
    `linear-gradient(90deg,${C.optimalTint} 0 ${green.toFixed(1)}%,` +
    `${C.watchTint} ${green.toFixed(1)}% ${amber.toFixed(1)}%,` +
    `${C.alertTint} ${amber.toFixed(1)}% 100%)`
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
