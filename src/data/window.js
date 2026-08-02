/**
 * How long a marker's value takes to form, against how often we draw.
 *
 * THE FAILURE THIS EXISTS TO PREVENT.
 *
 * A blood marker is rarely a reading of this instant. HbA1c is roughly a
 * hundred days of glucose; the omega-3 index is a red cell's lifetime of
 * membrane; a methylation mark is weeks to months of exposure. That is a virtue
 * when the draw is quarterly — it is the whole argument for testing this way.
 *
 * It becomes a defect the moment the interval is shorter than the window.
 * Two draws thirty days apart on a ninety-day marker share two thirds of their
 * measurement period: the second reading is mostly a re-measurement of the
 * first. Plot them and you get a smooth line, and the smoothness is an artefact
 * of the assay, not a fact about the person. Autocorrelation wearing the
 * costume of stability.
 *
 * So the ratio decides what a marker is allowed to be used for. Nothing here
 * judges whether a marker is good — only whether this cadence can see it move.
 */

/** Days between draws. The whole panel is monthly. */
export const INTERVAL_DAYS = 30;

export const SAMPLING = {
  /** Each draw is new information. Safe to trend, safe to score. */
  INDEPENDENT: "independent",
  /** Windows overlap. The direction is readable; month-to-month wobble is not. */
  OVERLAPPING: "overlapping",
  /** Mostly a re-measurement. Says where you are, never what changed. */
  CONTEXT: "context",
};

/**
 * How long each marker takes to form, in days.
 *
 * One table rather than a field on seventy-odd marker definitions: the number
 * is a property of the assay, not of the panel it happens to sit in, and having
 * it in one place is what makes the cadence audit above possible at a glance.
 * `withSeries` stamps it onto every marker at load, so everything downstream
 * reads `marker.windowDays`.
 *
 * Unlisted markers default to a week — true for most plasma proteins and
 * metabolites, and the conservative assumption for a monthly panel.
 */
export const DEFAULT_WINDOW_DAYS = 7;

export const WINDOW_DAYS = {
  // Reports the moment of the draw.
  "Cortisol (AM)": 1,
  "Cortisol awakening response": 1,
  "6-sulfatoxymelatonin": 1,
  "cfDNA sgACC (SST-CpG)": 1,
  "cfDNA amygdala (GAD1-CpG)": 1,
  "cfDNA PVN (CRH-CpG)": 1,
  "cfDNA SCN (VIP-CpG)": 1,
  "cfDNA oligodendrocyte (MBP-CpG)": 1,
  cfDNA: 1,

  // Days.
  "IL-6": 3,
  Iron: 3,
  "Neutrophil:lymphocyte": 5,
  "Kyn/Trp ratio": 10,

  // Weeks — the sweet spot for a monthly draw.
  Folate: 14,
  Magnesium: 14,
  Zinc: 14,
  "GDF-15": 14,
  Fructosamine: 18,
  "PER2/CLOCK index": 21,
  Ferritin: 21,
  "Vitamin D": 21,
  "Active B12 (holoTC)": 21,
  "Plasma omega-3": 21,
  "Cortisol:DHEA-S": 21,
  "DHEA-S": 21,
  "Free T4": 21,
  TSH: 21,

  // A month or so — red cell turnover, and indices derived from it.
  Haemoglobin: 30,
  Haematocrit: 30,
  MCV: 30,
  "Vitamin B12": 30,
  "FIB-4": 30,

  // Bone. A remodelling cycle runs three to six months, so a turnover marker
  // is a running average over most of that — which is precisely why one draw
  // of CTX-1 is uninterpretable and twelve of them are the whole point. The
  // two minerals and the hormone that moves them are the exception: those are
  // regulated hour to hour and report the week they were drawn in.
  "Corrected calcium": 7,
  Phosphate: 7,
  PTH: 7,
  "CTX-1": 60,
  Osteocalcin: 60,
  P1NP: 90,
  "Bone ALP": 90,

  // Longer than the interval. These become context, by rule, not by opinion.
  "FKBP5 intron 7": 75,
  "NR3C1 exon 1F": 75,
  "SLC6A4 promoter": 75,
  "BDNF promoter IV": 75,
  "COMT Val158 CpG": 75,
  "OXTR −934 CpG": 75,
  "DNAm cortisol (90d)": 90,
  "DNAm inflammation": 90,
  HbA1c: 100,
  "Omega-3 index": 120,
  DunedinPACE: 365,
  DNAmTL: 365,
};

/** Attaches the window to a marker definition. Called once, by `withSeries`. */
export function stampWindow(marker) {
  return {
    ...marker,
    windowDays:
      marker.windowDays ?? WINDOW_DAYS[marker.name] ?? DEFAULT_WINDOW_DAYS,
  };
}

/**
 * `windowDays` is the span the value summarises — 1 for anything that reports
 * the moment of the draw (cell-free DNA clears in hours; an overnight melatonin
 * metabolite is one night).
 *
 * The two cut points are deliberately not at 1.0. A marker whose window is a
 * little longer than the interval still moves enough to trend — the overlap
 * damps the swing rather than erasing it. Past about 2.5 intervals there is
 * nothing left of a single month in the reading.
 */
export function sampling(marker, intervalDays = INTERVAL_DAYS) {
  const ratio = (marker.windowDays ?? 1) / intervalDays;
  if (ratio <= 1.2) return SAMPLING.INDEPENDENT;
  if (ratio <= 2.5) return SAMPLING.OVERLAPPING;
  return SAMPLING.CONTEXT;
}

/** Can this cadence see this marker move at all? */
export function canTrend(marker, intervalDays = INTERVAL_DAYS) {
  return sampling(marker, intervalDays) !== SAMPLING.CONTEXT;
}

/**
 * Weight multiplier for a composite index.
 *
 * A context marker contributes nothing. Left in at full weight it would anchor
 * the index to a value that barely moves, damping exactly the month-to-month
 * change the index exists to show — and it would do so invisibly. It is not
 * discarded, only excluded from the score: the detail sheet still shows it,
 * under a heading that says this month cannot be read from it.
 */
export function indexWeight(marker, intervalDays = INTERVAL_DAYS) {
  return sampling(marker, intervalDays) === SAMPLING.CONTEXT ? 0 : 1;
}

/** Dictionary key describing the window in the reader's own terms. */
export function windowKeyOf(marker) {
  const d = marker.windowDays ?? 1;
  if (d <= 1) return "win.now";
  if (d <= 10) return "win.days";
  if (d <= 24) return "win.weeks";
  if (d <= 45) return "win.month";
  if (d <= 120) return "win.months";
  return "win.year";
}
