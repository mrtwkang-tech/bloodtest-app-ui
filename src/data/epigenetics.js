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
 * How long each marker takes to form lives in data/window.js, in one table
 * for the whole panel — it is a property of the assay, and at a monthly draw
 * it is what decides whether a marker can be scored at all.
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
      ref: 50,
      max: 100,
      dp: 0,
      demo: [46, 47, 51, 54, 55, 59, 62, 63, 58, 55, 56, 52],
    },
    {
      name: "NR3C1 exon 1F",
      plainKey: "epi.nr3c1",
      mechanismKey: "mech.nr3c1",
      unit: "% me",
      ref: 4.0,
      max: 9,
      dp: 2,
      demo: [3.42, 3.58, 3.66, 3.76, 3.94, 4.1, 4.32, 4.29, 4.28, 4.21, 4.11, 3.94],
    },
    {
      // Chronic glucocorticoid exposure DEMETHYLATES this intron, so less
      // methylation is the harmful direction — the brake wears down.
      name: "FKBP5 intron 7",
      plainKey: "epi.fkbp5",
      mechanismKey: "mech.fkbp5",
      unit: "% me",
      ref: 62,
      max: 85,
      dp: 1,
      dir: "low",
      demo: [66.4, 65.2, 65.3, 63.9, 61.2, 60.4, 59.3, 58.6, 60.3, 60.2, 61.4, 62.5],
    },
    {
      name: "DNAm inflammation",
      plainKey: "epi.inflammation",
      mechanismKey: "mech.dnamInflam",
      ref: 50,
      max: 100,
      dp: 0,
      demo: [48, 50, 51, 53, 54, 56, 59, 58, 56, 56, 56, 54],
    },
    {
      name: "SLC6A4 promoter",
      plainKey: "epi.slc6a4",
      mechanismKey: "mech.slc6a4",
      unit: "% me",
      ref: 8.0,
      max: 18,
      dp: 2,
      demo: [7.1, 7.46, 7.49, 8.04, 8.45, 8.53, 8.75, 9.08, 8.82, 8.42, 8.09, 8.02],
    },
    {
      name: "BDNF promoter IV",
      plainKey: "epi.bdnf",
      mechanismKey: "mech.bdnfMeth",
      unit: "% me",
      ref: 12,
      max: 26,
      dp: 1,
      demo: [10.8, 11.1, 11.4, 11.9, 12.7, 13.1, 13.7, 13.7, 13.5, 12.8, 12.6, 12.4],
    },
    {
      name: "PER2/CLOCK index",
      plainKey: "epi.circadian",
      mechanismKey: "mech.circadian",
      ref: 50,
      max: 100,
      dp: 0,
      demo: [55, 57, 58, 59, 62, 60, 60, 57, 56, 53, 51, 48],
    },
    {
      name: "COMT Val158 CpG",
      plainKey: "epi.comt",
      mechanismKey: "mech.comt",
      unit: "% me",
      ref: 55,
      max: 80,
      dp: 1,
      demo: [52.4, 53.4, 53.6, 54.6, 55.9, 56.9, 57.8, 57.6, 57.1, 56, 55.5, 55.2],
    },
    {
      name: "OXTR −934 CpG",
      plainKey: "epi.oxtr",
      mechanismKey: "mech.oxtr",
      unit: "% me",
      ref: 40,
      max: 70,
      dp: 1,
      demo: [36.2, 36.8, 37.7, 39.1, 39.8, 41.3, 42.5, 42.6, 40.5, 39.5, 39.5, 38.5],
    },
    {
      name: "DunedinPACE",
      plainKey: "epi.pace",
      mechanismKey: "mech.pace",
      unit: "yr/yr",
      ref: 1.0,
      max: 1.6,
      dp: 2,
      demo: [0.96, 0.97, 0.99, 1.01, 1.03, 1.04, 1.06, 1.06, 1.05, 1.04, 1.03, 1.01],
    },
    {
      name: "DNAmTL",
      plainKey: "epi.tl",
      mechanismKey: "mech.telomere",
      unit: "kb",
      ref: 6.9,
      max: 8.5,
      dp: 2,
      dir: "low",
      demo: [7.12, 7.11, 7.08, 7.05, 7.01, 6.99, 6.96, 6.94, 6.95, 6.97, 6.96, 6.98],
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
      ref: 14,
      max: 40,
      dp: 1,
      demo: [11.8, 12.5, 12.9, 14.6, 16.1, 17.1, 17.6, 18.6, 16.8, 16.4, 15.2, 14.6],
    },
    {
      // Amygdala GABAergic neurons: the brake on the threat response.
      name: "cfDNA amygdala (GAD1-CpG)",
      plainKey: "epi.cfTension",
      mechanismKey: "mech.cfTension",
      unit: "copies/mL",
      ref: 11,
      max: 34,
      dp: 1,
      demo: [9.2, 9.8, 10.6, 11, 12.1, 13.4, 13.6, 13.6, 13.5, 12.3, 11.6, 11.3],
    },
    {
      // CRH neurons of the hypothalamic paraventricular nucleus — the switch at
      // the very top of the stress axis, upstream of every cortisol reading.
      name: "cfDNA PVN (CRH-CpG)",
      plainKey: "epi.cfStress",
      mechanismKey: "mech.cfStress",
      unit: "copies/mL",
      ref: 9,
      max: 30,
      dp: 1,
      demo: [8.1, 9.3, 9.3, 10.7, 12.2, 13.4, 14.4, 14.6, 12.7, 11.8, 10.7, 10.2],
    },
    {
      // VIP neurons of the suprachiasmatic nucleus: the body clock itself.
      name: "cfDNA SCN (VIP-CpG)",
      plainKey: "epi.cfSleep",
      mechanismKey: "mech.cfSleep",
      unit: "copies/mL",
      ref: 6,
      max: 22,
      dp: 1,
      demo: [6.4, 6.8, 7, 7.4, 8, 7.9, 7.9, 7.5, 7, 6.7, 6.1, 5.8],
    },
    {
      // Oligodendrocytes — myelin turnover. White-matter maintenance is
      // metabolically expensive, and it is the first thing a tired brain skimps.
      name: "cfDNA oligodendrocyte (MBP-CpG)",
      plainKey: "epi.cfEnergy",
      mechanismKey: "mech.cfEnergy",
      unit: "copies/mL",
      ref: 18,
      max: 48,
      dp: 1,
      demo: [16.9, 17.4, 18.5, 19.2, 20.7, 22.2, 23.9, 23.8, 23.8, 22.5, 22.9, 22.4],
    },
  ],
};

export const EPIGEN = withSeries(RAW);
