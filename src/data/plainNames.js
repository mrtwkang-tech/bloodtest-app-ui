/**
 * Plain names for blood markers.
 *
 * The panel was rendering "p-tau217", "NT-proBNP" and "α1-antitrypsin" at
 * reading size to people who came to find out whether they are alright. An
 * acronym is not information to a reader who does not already hold the field
 * in their head; it is a wall with a number next to it.
 *
 * Two rules for what goes in here:
 *
 *   1. Say what the marker TELLS YOU, not what it is made of. "NT-proBNP" is a
 *      peptide; what it tells you is how hard the heart is working. The second
 *      is the useful sentence and it is the one a reader can act on.
 *   2. Do not launder the uncertainty. "AFP" becomes "간 종양 표지자", not
 *      "간 건강" — a tumour marker is a tumour marker, and softening that would
 *      be dishonest in the one direction that matters.
 *
 * The technical name is never deleted. It stays alongside, one layer down,
 * where it marks the stratum an expert or a second opinion would want. This
 * lives in a lookup rather than as a field on each marker so the panel
 * definitions stay a description of the assay, not of the copy.
 */

const PLAIN = {
  // Brain and nerve
  "p-tau217": "pn.ptau217",
  NfL: "pn.nfl",
  GFAP: "pn.gfap",
  "Aβ42/40": "pn.abeta",
  "α-synuclein": "pn.asyn",
  S100B: "pn.s100b",
  "Kyn/Trp ratio": "pn.kyntrp",
  BDNF: "pn.bdnf",
  "6-sulfatoxymelatonin": "pn.melatonin",

  // Heart and vessels
  "hs-CRP": "pn.crp",
  "LDL-C": "pn.ldl",
  "HDL-C": "pn.hdl",
  Triglycerides: "pn.tg",
  ApoB: "pn.apob",
  "Lp(a)": "pn.lpa",
  Homocysteine: "pn.homocysteine",
  "NT-proBNP": "pn.bnp",
  "Troponin-I": "pn.troponin",

  // Hormones and metabolism
  HbA1c: "pn.hba1c",
  "Fasting glucose": "pn.glucose",
  "Fasting insulin": "pn.insulin",
  "HOMA-IR": "pn.homair",
  TSH: "pn.tsh",
  "Free T4": "pn.ft4",
  "Cortisol (AM)": "pn.cortisol",
  "DHEA-S": "pn.dheas",

  // Liver
  ALT: "pn.alt",
  AST: "pn.ast",
  GGT: "pn.ggt",
  ALP: "pn.alp",
  "Total bilirubin": "pn.bilirubin",
  Albumin: "pn.albumin",
  "FIB-4": "pn.fib4",

  // Kidney
  Creatinine: "pn.creatinine",
  eGFR: "pn.egfr",
  BUN: "pn.bun",
  "Cystatin C": "pn.cystatinc",
  UACR: "pn.uacr",
  "Uric acid": "pn.uricacid",

  // Blood
  Haemoglobin: "pn.hb",
  Haematocrit: "pn.hct",
  WBC: "pn.wbc",
  Platelets: "pn.platelets",
  Ferritin: "pn.ferritin",
  MCV: "pn.mcv",

  // Lungs and allergy
  Eosinophils: "pn.eosinophils",
  "Total IgE": "pn.ige",
  "α1-antitrypsin": "pn.a1at",
  "SpO₂": "pn.spo2",
  "KL-6": "pn.kl6",

  // Joints and immunity
  ESR: "pn.esr",
  "Rheumatoid factor": "pn.rf",
  "Anti-CCP": "pn.anticcp",
  "ANA titre": "pn.ana",
  "IL-6": "pn.il6",
  "Complement C3": "pn.c3",

  // Tumour markers. Named as what they are — see rule 2 above.
  cfDNA: "pn.cfdna",
  CEA: "pn.cea",
  "CA19-9": "pn.ca199",
  AFP: "pn.afp",
  "CA-125": "pn.ca125",
  PSA: "pn.psa",

  // Nutrition
  "Vitamin D": "pn.vitd",
  "Vitamin B12": "pn.b12",
  Folate: "pn.folate",
  Iron: "pn.iron",
  Magnesium: "pn.magnesium",
  Zinc: "pn.zinc",
  "Omega-3 index": "pn.omega3",
};

/**
 * The dictionary key for a marker's plain name, or null when there is none.
 * Methylation markers carry their own `plainKey`, so those win.
 */
export function plainKeyOf(marker) {
  return marker.plainKey ?? PLAIN[marker.name] ?? null;
}
