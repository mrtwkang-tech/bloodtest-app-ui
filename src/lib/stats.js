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

/**
 * Two-sided 5% critical value of t. Table to df 20, normal beyond.
 *
 * A table rather than an approximation because the only df this product ever
 * asks for is small and known — twelve rounds gives df 10 — and three digits
 * from a table beat four from a series expansion nobody can check by eye.
 */
const T_CRIT_05 = [
  12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201,
  2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086,
];
const tCrit = (df) => (df < 1 ? Infinity : (T_CRIT_05[df - 1] ?? 1.96));

/**
 * Least-squares slope of a series against its own index, with a significance
 * test — "is this going anywhere, or is it just wobbling?"
 *
 * WHY THIS IS A SEPARATE QUESTION from the one `precision.js` answers, and the
 * reason both exist. RCV judges ONE difference between TWO measurements. This
 * judges a DIRECTION across ALL of them. A marker can easily fail the first and
 * pass the second — in fact that is the interesting case, and it is the case
 * this product was built to show: no single month moved, and the year did.
 *
 * Lifted verbatim out of `models.js`, where it was computing the ageing pace
 * and was the only piece of uncertainty machinery in the codebase. It is a
 * general helper and now lives with the other general helpers.
 *
 * `x` is the index, so `slope` is per-step — per round here. Callers wanting
 * per-year scale it themselves, which is what `models.js` does.
 */
export function slopeTest(series) {
  const n = series.length;
  if (n < 3) return { slope: 0, se: null, n, significant: false };

  const mx = (n - 1) / 2;
  const my = series.reduce((a, b) => a + b, 0) / n;
  let sxy = 0;
  let sxx = 0;
  for (let i = 0; i < n; i++) {
    sxy += (i - mx) * (series[i] - my);
    sxx += (i - mx) ** 2;
  }
  const slope = sxy / sxx;
  const intercept = my - slope * mx;
  let sse = 0;
  for (let i = 0; i < n; i++) sse += (series[i] - (intercept + slope * i)) ** 2;

  // A perfectly straight line has zero residual, which would divide to
  // Infinity. It is also unambiguously a trend, so say so.
  const se = Math.sqrt(sse / (n - 2) / sxx);
  if (!(se > 0)) return { slope, se: 0, n, significant: slope !== 0 };

  return {
    slope,
    se,
    n,
    significant: Math.abs(slope / se) > tCrit(n - 2),
  };
}
