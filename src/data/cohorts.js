import { percentileOf } from "../lib/stats";
import { PROFILE } from "./sessions";

/**
 * Comparison groups for the health score.
 *
 * A score of 62 out of 100 tells a reader almost nothing on its own — 100 is
 * not achievable and nobody knows what a normal one looks like. The useful
 * question is the one the number cannot answer by itself: how does this compare
 * to people like me. The ring that used to sit beside the score restated 62 as
 * an arc length and answered nothing.
 *
 * DIRECTION MATTERS AND IS THE OPPOSITE OF THE MIND SCALES. Those are load
 * scales where a higher value is worse, so `betterThan()` inverts the
 * percentile. The health score runs the other way — higher is better — so
 * `percentileOf` returns P(X < score), which already reads as "you are above
 * this share of the group". Inverting it here would silently report the best
 * scores as the worst.
 *
 * DEMO DISTRIBUTIONS. The means and standard deviations below are invented, and
 * chosen so the three cohorts land 62 in visibly different places — otherwise
 * the control looks broken. A real version would compute them from the cohort's
 * own scores each round.
 */
const COHORTS = [
  { key: "all", labelKey: "home.cohort.all", mean: 68, sd: 12 },
  { key: "age", labelKey: "home.cohort.age", mean: 72, sd: 11 },
  { key: "ageSex", labelKey: "home.cohort.ageSex", mean: 70, sd: 11.5 },
];

export const COHORT_KEYS = COHORTS.map((c) => c.key);
export const DEFAULT_COHORT = "all";

/** The decade label the age cohorts are described with — "30대" / "30s". */
export function ageBand() {
  return Math.floor(PROFILE.age / 10) * 10;
}

export function cohortsFor() {
  return COHORTS;
}

/**
 * Where this score sits in one cohort, 1–99, read as "better than this many".
 * Reuses `percentileOf` from lib/stats.js rather than repeating the erf.
 */
export function cohortPercentile(score, cohortKey) {
  const c = COHORTS.find((x) => x.key === cohortKey) ?? COHORTS[0];
  return percentileOf(score, c.mean, c.sd);
}

/**
 * Where ONE system's score sits, 1–99, read the same way: "better than this
 * many".
 *
 * ONE RULE RATHER THAN ELEVEN INVENTED NUMBERS. The three cohorts above carry
 * hand-picked means and standard deviations, and doing that eleven more times
 * would be eleven more numbers nobody could check. So this derives the spread
 * instead, from the one thing that genuinely differs between the panels: how
 * many markers they average. A mean of n readings has a standard deviation
 * proportional to 1/√n, so a four-marker panel really is a wider distribution
 * than a twelve-marker one, and the same score means less in it. Anchored so a
 * six-marker panel gets the ±11 the body cohorts use.
 *
 * The mean sits above the body cohorts' because these scores are higher by
 * construction — `systemScore` divides by its own system's marker count, so a
 * flag does not cost it what a flag costs the whole panel.
 */
const SYSTEM_MEAN = 76;

export function systemPercentile(score, markerCount) {
  const n = Math.max(1, markerCount);
  const sd = Math.max(6, Math.min(18, 11 * Math.sqrt(6 / n)));
  return percentileOf(score, SYSTEM_MEAN, sd);
}

/**
 * The same, for a mind scale.
 *
 * A DIFFERENT MEAN, AND THE REASON IS IN THE ARITHMETIC RATHER THAN IN AN
 * OPINION. A mind score is `100 − scaleIndex`, and `markerLoad` returns exactly
 * 0.5 for a marker sitting on its reference — so a person at every reference
 * scores 50 by construction. That is the peer average, it is stamped on the
 * radar as a pentagon and on every row as a notch, and it would be incoherent
 * for the percentile to disagree with it. The body cohorts sit at 76 because
 * `systemScore` is built the other way, out of credit for being in range.
 *
 * The spread follows the same 1/√n rule: an index averaged over four drivers is
 * a wider distribution than one averaged over eight, so the same score means
 * less in it.
 */
const SCALE_MEAN = 50;

export function scalePercentile(score, driverCount) {
  const n = Math.max(1, driverCount);
  const sd = Math.max(7, Math.min(20, 13 * Math.sqrt(6 / n)));
  return percentileOf(score, SCALE_MEAN, sd);
}
