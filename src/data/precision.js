/**
 * How big a change has to be before it is a change.
 *
 * THE FAILURE THIS EXISTS TO PREVENT, and it is the twin of the one `window.js`
 * exists to prevent. That file asks whether a draw is NEW INFORMATION — whether
 * the assay's integration window is shorter than the gap between draws. This one
 * asks the orthogonal question the product has never asked: **is this difference
 * bigger than the noise?**
 *
 * They are not the same question and a marker can fail either independently.
 * hs-CRP has a seven-day window, so every monthly draw is genuinely new — and a
 * within-person variation near 43%, so it can triple between two draws with
 * nothing whatsoever having happened. Until this file existed, `TrendChart` drew
 * that tripling as "▲200% 증가" in alarm colour. HbA1c is the mirror image: a
 * hundred-day window that `window.js` rules out of the index entirely, and a
 * variation of 3%, which makes it one of the most trustworthy deltas in
 * medicine.
 *
 * WHAT THIS GATES, AND WHAT IT MUST NOT. RCV is a statement about the
 * difference between two measurements. It is not a statement about either
 * measurement. So:
 *
 *   gated      the round-over-round delta — "▼9 since last month"
 *   NOT gated  the level — whether a value is inside its reference range
 *   NOT gated  the index — `markerLoad` reads the absolute value, untouched
 *
 * That boundary is what keeps the blast radius inside the display layer. A CRP
 * of 3.0 is still a CRP of 3.0 and still lights whatever it lights; what this
 * file forbids is the separate claim that it ROSE.
 *
 * WHERE THE NUMBERS COME FROM. `cvPct` is the combined within-subject
 * coefficient of variation, √(CV_A² + CV_I²) — analytical imprecision folded
 * together with within-person biological variation. Values are representative
 * figures from the published biological-variation literature (the EFLM
 * Biological Variation Database and assay inserts), NOT measurements from any
 * particular laboratory or platform, and several markers in this panel are
 * hypothetical assays with no published variation at all. `docs/measurement-
 * cadence.md` carries the per-marker basis and says which are estimates.
 */

/**
 * Reference change value, on the log scale.
 *
 * The familiar form is RCV = 2.77 · CV, symmetric, and it is wrong here. Every
 * marker in this panel is a strictly positive, right-skewed quantity, and at
 * hs-CRP's CV the symmetric form yields a significant fall of −119%, which is
 * not a quantity a concentration can have. The log form gives the honest
 * asymmetry — a factor of 3.1 up, or down to a third — and converges on the
 * familiar one as CV gets small.
 *
 * Returned as the RATIO R, so the test is `next/prev > R` or `next/prev < 1/R`.
 * 1.96·√2 is the two-sided 95% constant; √2 is there because a difference of
 * two measurements carries the variance of both.
 */
export function rcvRatio(cvPct) {
  const cv = Math.max(0, cvPct) / 100;
  const sigmaLog = Math.sqrt(Math.log(1 + cv * cv));
  return Math.exp(1.96 * Math.SQRT2 * sigmaLog);
}

/**
 * Fallback for a marker with no published figure.
 *
 * 12% is not a neutral choice — it is roughly the median of the table below,
 * and it sits at R ≈ 1.4, which is loose enough not to silence a real move and
 * tight enough not to wave every wobble through. Anything landing here should
 * be treated as unmeasured rather than measured-and-average; the coverage check
 * in the verification script exists to keep this set empty.
 */
export const DEFAULT_CV_PCT = 12;

/**
 * Combined within-subject CV, percent, per marker.
 *
 * Keyed by exact marker name, exactly like `WINDOW_DAYS` — and carrying the
 * same hazard, that a rename in `body.js` silently drops a marker to the
 * default rather than erroring. Kept that way deliberately so the two tables
 * are the same kind of object; `assertPrecisionCoverage` below is the guard.
 *
 * Grouped by system, in the order the systems are declared.
 */
export const CV_PCT = {
  // ── neuro ──────────────────────────────────────────────────────────────
  // The plasma neurodegeneration markers are young assays: analytical
  // imprecision dominates, and it is what most of these figures are.
  "p-tau217": 12,
  NfL: 12,
  GFAP: 12,
  // A ratio of two analytes that drift together, which is the entire reason
  // the ratio is reported instead of Aβ42 alone — the common drift cancels.
  "Aβ42/40": 6,
  "α-synuclein": 18,
  S100B: 20,
  "Kyn/Trp ratio": 15,
  "Free tryptophan": 15,
  // Serum BDNF is mostly platelet BDNF released during clotting, so it varies
  // with platelet count and handling as much as with anything neural.
  BDNF: 25,
  // One night's production, and nights differ.
  "6-sulfatoxymelatonin": 28,

  // ── cardio ─────────────────────────────────────────────────────────────
  // The largest number in this table, and the most consequential. This is why
  // cardiovascular risk assessment asks for two measurements a fortnight apart
  // and averages them, and why a value over 10 mg/L is discarded as
  // intercurrent illness rather than interpreted.
  "hs-CRP": 43,
  "LDL-C": 9,
  "HDL-C": 8,
  Triglycerides: 22,
  // Measured directly rather than calculated, which is most of why it beats
  // LDL-C as a monitoring target.
  ApoB: 8,
  // Near-genetically fixed. The variation here is almost entirely the assay —
  // there is very little biology left to vary.
  "Lp(a)": 9,
  Homocysteine: 10,
  "NT-proBNP": 33,
  "Troponin-I": 18,

  // ── endocrine ──────────────────────────────────────────────────────────
  // The most trustworthy delta on this panel, and `window.js` currently gives
  // it a weight of zero. See the note in docs/measurement-cadence.md.
  HbA1c: 3,
  "Fasting glucose": 6,
  "Fasting insulin": 22,
  Fructosamine: 5,
  // Two variable analytes divided by one another; the variances add.
  "Cortisol:DHEA-S": 25,
  // Even sampled correctly — at waking, +30, +45 — the awakening response
  // varies enough between days that a single day's value is unreliable and
  // two or three days are wanted. This number is why.
  "Cortisol awakening response": 35,
  "GDF-15": 13,
  // glucose × insulin / 405, so it inherits insulin's variation.
  "HOMA-IR": 25,
  TSH: 20,
  "Free T4": 6,
  "Cortisol (AM)": 22,
  "DHEA-S": 8,

  // ── hepatic ────────────────────────────────────────────────────────────
  ALT: 20,
  AST: 13,
  GGT: 12,
  ALP: 7,
  "Total bilirubin": 23,
  Albumin: 4,
  // Derived from AST, ALT, platelets and age — three varying inputs.
  "FIB-4": 16,

  // ── renal ──────────────────────────────────────────────────────────────
  Creatinine: 6,
  // A formula over creatinine, so it tracks creatinine's precision.
  eGFR: 6,
  BUN: 14,
  "Cystatin C": 6,
  // Spot albumin:creatinine swings with hydration, posture and recent
  // exercise. Confirmation on a second sample is standard practice for this
  // reason, not for caution's sake.
  UACR: 35,
  "Uric acid": 9,

  // ── hematology ─────────────────────────────────────────────────────────
  Haemoglobin: 4,
  Haematocrit: 4,
  WBC: 12,
  Platelets: 9,
  // Tightly controlled — but also an acute-phase reactant, so a rise can be
  // inflammation rather than iron. Precision is not the only trap here.
  Ferritin: 16,
  // The steadiest index on the panel. A red cell population turns over slowly
  // and its mean volume barely moves.
  MCV: 2,

  // ── pulmonary ──────────────────────────────────────────────────────────
  Eosinophils: 25,
  "Total IgE": 15,
  "α1-antitrypsin": 7,
  "SpO₂": 2,
  "KL-6": 11,

  // ── immune ─────────────────────────────────────────────────────────────
  ESR: 20,
  "Rheumatoid factor": 20,
  "Anti-CCP": 15,
  // Reported in doubling dilutions, so the smallest possible change IS a
  // factor of two. Anything finer than that is a rounding artefact.
  "ANA titre": 30,
  // Half-life around an hour, a nocturnal peak, and it rises with exercise and
  // with a short night. A single draw is a snapshot of the preceding hours.
  "IL-6": 45,
  "Neutrophil:lymphocyte": 25,
  "Complement C3": 6,

  // ── oncology ───────────────────────────────────────────────────────────
  // Cell-free DNA clears with a half-life of minutes to a couple of hours, and
  // hard exercise can raise it roughly tenfold before it returns to baseline
  // within the hour. What this number really measures is how well the draw was
  // standardised. ESTIMATE — there is no settled published figure.
  cfDNA: 45,
  CEA: 12,
  "CA19-9": 17,
  AFP: 11,
  "CA-125": 25,
  // Why PSA velocity needs three measurements over eighteen months rather than
  // two over six.
  PSA: 15,

  // ── nutrition ──────────────────────────────────────────────────────────
  "Vitamin D": 13,
  "Vitamin B12": 14,
  "Active B12 (holoTC)": 16,
  "Plasma omega-3": 12,
  // Serum folate tracks the last few meals more than the stores.
  Folate: 24,
  // Serum iron has a diurnal swing of its own on top of the meal effect, which
  // is why status is judged on ferritin and transferrin saturation instead.
  Iron: 28,
  Magnesium: 5,
  Zinc: 10,
  // A red cell membrane average over four months. Slow to move and precise
  // when it does — the opposite trade from plasma omega-3 above.
  "Omega-3 index": 7,

  // ── skeletal ───────────────────────────────────────────────────────────
  // These two figures assume the standardised draw — fasting, morning, same
  // clock time. Unstandardised they are far worse: CTX-1 has a twofold
  // circadian swing and food suppresses it by half within the hour. The
  // familiar "least significant change of 25–30%" for bone turnover is this
  // number run through the formula above.
  "CTX-1": 11,
  P1NP: 8,
  "Bone ALP": 7,
  // Pulsatile secretion. A single draw samples one point of a rhythm.
  PTH: 25,
  Osteocalcin: 15,
  // Regulated hour to hour within a very narrow band, and it shows.
  "Corrected calcium": 2,
  Phosphate: 9,

  // ── epigenetics ────────────────────────────────────────────────────────
  // Locus-level methylation assays are precise; the variation that matters is
  // biological and, in leukocytes, is partly CELL COMPOSITION rather than
  // methylation — a shift in neutrophil fraction moves the apparent value.
  // These figures do not include that confounder, which the panel does not
  // correct for. See docs/measurement-cadence.md.
  "DNAm cortisol (90d)": 8,
  "NR3C1 exon 1F": 10,
  "FKBP5 intron 7": 8,
  "DNAm inflammation": 8,
  "SLC6A4 promoter": 10,
  "BDNF promoter IV": 10,
  "PER2/CLOCK index": 10,
  "COMT Val158 CpG": 8,
  "OXTR −934 CpG": 10,
  // Built for repeat measurement, and it shows in the precision — but the
  // quantity itself moves so slowly that a year is the shortest interval that
  // can see anything, whatever the assay's precision.
  DunedinPACE: 4,
  DNAmTL: 4,
  // Same standardisation problem as total cfDNA, on a smaller signal.
  // ESTIMATES throughout — these are hypothetical assays.
  "cfDNA sgACC (SST-CpG)": 40,
  "cfDNA amygdala (GAD1-CpG)": 40,
  "cfDNA PVN (CRH-CpG)": 40,
  "cfDNA SCN (VIP-CpG)": 40,
  "cfDNA oligodendrocyte (MBP-CpG)": 40,
};

/** Attaches precision to a marker definition. Called once, by `withSeries`. */
export function stampPrecision(marker) {
  const cvPct = marker.cvPct ?? CV_PCT[marker.name] ?? DEFAULT_CV_PCT;
  return { ...marker, cvPct, rcv: rcvRatio(cvPct) };
}

/**
 * Did it actually move?
 *
 * Two floors, and a value has to clear both. The RCV floor is the statistical
 * one. The display floor is cruder and just as necessary: a marker reported to
 * one decimal cannot meaningfully have changed by less than half of one, and
 * `InBodyPanel` has been applying exactly that rule to body composition since
 * it was written.
 *
 * `pct` is returned whether or not the change cleared the floor, because the
 * caller sometimes wants to say how big the non-move was.
 */
export function movedSince(prev, next, marker) {
  const dir = next > prev ? 1 : next < prev ? -1 : 0;
  const pct = prev ? Math.round((Math.abs(next - prev) / prev) * 100) : 0;
  const flat = { moved: false, dir, pct };

  if (dir === 0) return flat;

  // A ratio test needs a positive denominator. Nothing in this panel can be
  // zero or negative, but a user-entered panel could be, and silently
  // returning Infinity would read as a significant change.
  if (!(prev > 0) || !(next > 0)) return { moved: true, dir, pct };

  const dp = marker?.dp;
  if (dp != null && Math.abs(next - prev) < Math.pow(10, -dp) / 2) return flat;

  const r = marker?.rcv ?? rcvRatio(marker?.cvPct ?? DEFAULT_CV_PCT);
  const ratio = next / prev;
  return { moved: ratio > r || ratio < 1 / r, dir, pct };
}

/**
 * Names in the panel with no published figure behind them.
 *
 * `WINDOW_DAYS` has the same string-join hazard and no such check, which is how
 * forty-nine markers ended up silently sharing one default. Exported rather
 * than run on import so the build stays quiet and the verification script can
 * assert on it.
 */
export function uncoveredMarkers(markers) {
  return markers.filter((m) => CV_PCT[m.name] === undefined).map((m) => m.name);
}
