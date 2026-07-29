import { percentileOf } from "../lib/stats";

// Radar axis angles, clockwise from top.
export const AXES = [-90, -18, 54, 126, 198];

/**
 * `avg` and `sd` describe the peer population for each instrument, so a raw
 * score converts to a percentile. `cutoff` is the screening threshold the
 * status comes from — a referral trigger, not a diagnosis.
 *
 * Labels are i18n keys, never literal strings: the app ships in two languages
 * and a hardcoded name here would leak through every screen.
 */
export const SCALE_META = [
  {
    key: "depression",
    code: "PHQ-9",
    max: 27,
    avg: 6.5,
    sd: 4.8,
    cutoff: 10,
    severe: 15,
  },
  {
    key: "anxiety",
    code: "GAD-7",
    max: 21,
    avg: 6.2,
    sd: 4.5,
    cutoff: 10,
    severe: 15,
  },
  {
    key: "stress",
    code: "PSS",
    max: 40,
    avg: 18.5,
    sd: 6.5,
    cutoff: 20,
    severe: 27,
  },
  {
    key: "sleep",
    code: "ISI",
    max: 28,
    avg: 8.1,
    sd: 5.2,
    cutoff: 15,
    severe: 22,
  },
  {
    key: "burnout",
    code: "MBI",
    max: 60,
    avg: 33,
    sd: 11,
    cutoff: 45,
    severe: 54,
  },
];

/** 'good' | 'watch' | 'alert' — instrument cutoff first, peer average second. */
export function statusOf(meta, score) {
  if (score >= meta.severe) return "alert";
  if (score >= meta.cutoff) return "watch";
  return score > meta.avg ? "watch" : "good";
}

/** Burnout reads as a band rather than a raw score. */
export function burnoutBand(score) {
  return score < 30 ? "low" : score < 45 ? "mid" : "high";
}

export function scalePercentile(meta, score) {
  return percentileOf(score, meta.avg, meta.sd);
}

/**
 * Radar polygon in a 200x200 viewBox, plotted on percentiles.
 *
 * Raw score/max is not comparable across instruments — MBI 28/60 and PHQ-9
 * 4/27 look wildly different while both sit near the 30th percentile — so a
 * raw-ratio radar silently exaggerates whichever scale has the widest range.
 * On a percentile radar the peer average is a regular pentagon at 50.
 */
export function radarPoints(percentiles, radius = 78) {
  return percentiles
    .map((p, i) => {
      const a = (AXES[i] * Math.PI) / 180;
      const r = radius * Math.max(0.06, Math.min(1, p / 100));
      return `${(100 + r * Math.cos(a)).toFixed(1)},${(100 + r * Math.sin(a)).toFixed(1)}`;
    })
    .join(" ");
}
