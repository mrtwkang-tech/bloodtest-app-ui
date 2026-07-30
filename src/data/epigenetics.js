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
 * The second half of the panel works the other way round — see the cell-free
 * DNA block below. Those count what is happening today rather than what has
 * accumulated, which is the point: a months marker and a today marker
 * disagreeing tells you which direction things are moving.
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

    /* ── Brain-derived cell-free DNA ───────────────────────────────────────
     *
     * The same trick liver-cancer surveillance uses, pointed at the brain.
     *
     * A dying cell spills its DNA into the bloodstream, and that DNA keeps the
     * methylation pattern of the tissue it came from — the pattern is what makes
     * a liver fragment identifiable as liver rather than as blood. HCC screens
     * count tumour-derived fragments this way. Brain cell types carry their own
     * unmethylated signatures at loci they alone express, so the same
     * deconvolution names the region a fragment came from, and the count is a
     * measure of how hard that region is being worked.
     *
     * ONE REGION PER INDEX, and the mapping is the argument: the region has to
     * be the one the index is actually about, or this is astrology with a
     * sequencer.
     *
     * DIFFERENT CLOCK FROM EVERYTHING ABOVE, and it is marked `snapshot` for
     * that reason. Methylation on your own leukocytes accumulates over months;
     * cell-free DNA clears in hours, so this counts what is happening NOW. That
     * is not a weakness to hide — a marker of months and a marker of today
     * disagreeing is itself the finding. It is why these lead an index but never
     * carry it alone.
     */
    {
      // Subgenual anterior cingulate — the region most consistently implicated
      // in depression, and where somatostatin interneurons are lost.
      name: "cfDNA sgACC (SST-CpG)",
      plainKey: "epi.cfMood",
      mechanismKey: "mech.cfMood",
      unit: "copies/mL",
      windowKey: "epi.window.now",
      snapshot: true,
      ref: 14,
      max: 40,
      dp: 1,
      demo: [11.8, 13.4, 16.2, 18.9, 16.4, 14.6],
    },
    {
      // Amygdala GABAergic neurons: the brake on the threat response.
      name: "cfDNA amygdala (GAD1-CpG)",
      plainKey: "epi.cfTension",
      mechanismKey: "mech.cfTension",
      unit: "copies/mL",
      windowKey: "epi.window.now",
      snapshot: true,
      ref: 11,
      max: 34,
      dp: 1,
      demo: [9.2, 10.4, 12.8, 14.1, 12.6, 11.3],
    },
    {
      // CRH neurons of the hypothalamic paraventricular nucleus — the switch at
      // the very top of the stress axis, upstream of every cortisol reading.
      name: "cfDNA PVN (CRH-CpG)",
      plainKey: "epi.cfStress",
      mechanismKey: "mech.cfStress",
      unit: "copies/mL",
      windowKey: "epi.window.now",
      snapshot: true,
      ref: 9,
      max: 30,
      dp: 1,
      demo: [8.1, 9.6, 12.4, 14.8, 12.1, 10.2],
    },
    {
      // VIP neurons of the suprachiasmatic nucleus: the body clock itself.
      name: "cfDNA SCN (VIP-CpG)",
      plainKey: "epi.cfSleep",
      mechanismKey: "mech.cfSleep",
      unit: "copies/mL",
      windowKey: "epi.window.now",
      snapshot: true,
      ref: 6,
      max: 22,
      dp: 1,
      demo: [6.4, 7.1, 8.2, 7.6, 6.6, 5.8],
    },
    {
      // Oligodendrocytes — myelin turnover. White-matter maintenance is
      // metabolically expensive, and it is the first thing a tired brain skimps.
      name: "cfDNA oligodendrocyte (MBP-CpG)",
      plainKey: "epi.cfEnergy",
      mechanismKey: "mech.cfEnergy",
      unit: "copies/mL",
      windowKey: "epi.window.now",
      snapshot: true,
      ref: 18,
      max: 48,
      dp: 1,
      demo: [16.9, 18.4, 21.6, 24.2, 23.1, 22.4],
    },
  ],
};

export const EPIGEN = withSeries(RAW);
