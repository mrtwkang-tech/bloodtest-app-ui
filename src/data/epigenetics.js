import { withSeries } from "./body";

/**
 * The methylation panel — the instrument the mind indices actually run on.
 *
 * WHY THIS PANEL EXISTS INSTEAD OF HORMONES
 *
 * Morning cortisol was the wrong measurement for this product. Cortisol swings
 * two- to three-fold within a single day, moves with the hour of the draw, the
 * previous night's sleep, and the stress of the needle itself. Comparing one
 * morning's cortisol to another morning's, three months apart, mostly measures
 * the two mornings — not the quarter between them.
 *
 * What a quarterly test needs is a marker that INTEGRATES. DNA methylation
 * does: sustained glucocorticoid exposure, sustained inflammation and sustained
 * circadian disruption leave marks on the regulatory regions of the genes that
 * respond to them, and those marks accumulate and decay over weeks to months.
 * That is precisely the window between two draws. HbA1c is the same idea
 * applied to glucose, and nobody screens diabetes on a single finger-prick.
 *
 * STATUS: HYPOTHETICAL.
 *
 * The loci below are real and really are studied in relation to stress, mood
 * and circadian biology. The assays, the reference values and the composite
 * indices are NOT — they are written as though the discovery work had already
 * landed. Nothing here is clinically validated, and every surface that renders
 * one of these markers says so.
 */

/**
 * Markers carry a `plainKey` as well as a technical `name`. The plain name is
 * what the reader sees first; the locus is kept next to it so the claim stays
 * checkable rather than mystical.
 *
 * `window` is the span of time the marker integrates over — the single most
 * important property here, and the reason each one earned its place.
 */
const RAW = {
  key: "epigen",
  nameKey: "sys.epigen",
  specialtyKey: "spec.epigen",
  markers: [
    {
      name: "DNAm cortisol (90d)",
      plainKey: "epi.cortisolLoad",
      mechanismKey: "mech.cortisolLoad",
      windowKey: "epi.window.90d",
      ref: 50,
      max: 100,
      dp: 0,
      demo: [46, 51, 58, 63, 57, 52],
    },
    {
      name: "NR3C1 exon 1F",
      plainKey: "epi.nr3c1",
      mechanismKey: "mech.nr3c1",
      unit: "% me",
      windowKey: "epi.window.months",
      ref: 4.0,
      max: 9,
      dp: 2,
      demo: [3.42, 3.61, 4.05, 4.38, 4.21, 3.94],
    },
    {
      // Chronic glucocorticoid exposure DEMETHYLATES this intron, so less
      // methylation is the harmful direction — the brake wears down.
      name: "FKBP5 intron 7",
      plainKey: "epi.fkbp5",
      mechanismKey: "mech.fkbp5",
      unit: "% me",
      windowKey: "epi.window.months",
      ref: 62,
      max: 85,
      dp: 1,
      dir: "low",
      demo: [66.4, 64.8, 61.2, 58.6, 60.3, 62.5],
    },
    {
      name: "DNAm inflammation",
      plainKey: "epi.inflammation",
      mechanismKey: "mech.dnamInflam",
      windowKey: "epi.window.90d",
      ref: 50,
      max: 100,
      dp: 0,
      demo: [48, 52, 55, 59, 56, 54],
    },
    {
      name: "SLC6A4 promoter",
      plainKey: "epi.slc6a4",
      mechanismKey: "mech.slc6a4",
      unit: "% me",
      windowKey: "epi.window.months",
      ref: 8.0,
      max: 18,
      dp: 2,
      demo: [7.1, 7.62, 8.44, 9.05, 8.51, 8.02],
    },
    {
      name: "BDNF promoter IV",
      plainKey: "epi.bdnf",
      mechanismKey: "mech.bdnfMeth",
      unit: "% me",
      windowKey: "epi.window.months",
      ref: 12,
      max: 26,
      dp: 1,
      demo: [10.8, 11.6, 12.9, 13.8, 13.1, 12.4],
    },
    {
      name: "PER2/CLOCK index",
      plainKey: "epi.circadian",
      mechanismKey: "mech.circadian",
      windowKey: "epi.window.weeks",
      ref: 50,
      max: 100,
      dp: 0,
      demo: [55, 58, 62, 59, 53, 48],
    },
    {
      name: "COMT Val158 CpG",
      plainKey: "epi.comt",
      mechanismKey: "mech.comt",
      unit: "% me",
      windowKey: "epi.window.months",
      ref: 55,
      max: 80,
      dp: 1,
      demo: [52.4, 53.8, 56.1, 57.9, 56.4, 55.2],
    },
    {
      name: "OXTR −934 CpG",
      plainKey: "epi.oxtr",
      mechanismKey: "mech.oxtr",
      unit: "% me",
      windowKey: "epi.window.months",
      ref: 40,
      max: 70,
      dp: 1,
      demo: [36.2, 37.4, 40.8, 42.6, 40.1, 38.5],
    },
    {
      name: "DunedinPACE",
      plainKey: "epi.pace",
      mechanismKey: "mech.pace",
      unit: "yr/yr",
      windowKey: "epi.window.year",
      ref: 1.0,
      max: 1.6,
      dp: 2,
      demo: [0.96, 0.99, 1.03, 1.07, 1.04, 1.01],
    },
    {
      name: "DNAmTL",
      plainKey: "epi.tl",
      mechanismKey: "mech.telomere",
      unit: "kb",
      windowKey: "epi.window.year",
      ref: 6.9,
      max: 8.5,
      dp: 2,
      dir: "low",
      demo: [7.12, 7.08, 7.01, 6.94, 6.96, 6.98],
    },
  ],
};

export const EPIGEN = withSeries(RAW);
