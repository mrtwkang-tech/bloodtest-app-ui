/**
 * Percentile math for the mental health scales.
 *
 * Every scale is scored so that a HIGHER value means worse symptoms, and each
 * has a published population mean and standard deviation. That lets us place a
 * raw score on the peer distribution instead of hardcoding a percentile string
 * per session, which is what the earlier mockup did (and got inconsistent).
 */

/** Abramowitz & Stegun 7.1.26 — max error 1.5e-7, plenty for a percentile. */
function erf(x) {
  const sign = x < 0 ? -1 : 1;
  const z = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * z);
  const y =
    1 -
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
      t +
      0.254829592) *
      t *
      Math.exp(-z * z);
  return sign * y;
}

/** P(X < x) for X ~ N(mean, sd²). */
export function normalCdf(x, mean, sd) {
  return 0.5 * (1 + erf((x - mean) / (sd * Math.SQRT2)));
}

/**
 * Where this score sits in the peer distribution, 1–99.
 * Clamped off the extremes because a screening test cannot resolve the tails,
 * and "백분위 0" would overstate the precision we have.
 */
export function percentileOf(score, mean, sd) {
  const p = normalCdf(score, mean, sd) * 100;
  return Math.min(99, Math.max(1, Math.round(p)));
}

/**
 * The percentile restated in the direction that helps the reader.
 * Lower symptoms are better, so a 30th-percentile score beats 70% of peers.
 */
export function betterThan(percentile) {
  return 100 - percentile;
}
