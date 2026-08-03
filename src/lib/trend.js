import { movedSince } from "../data/precision";
import { slopeTest } from "./stats";

// Chart geometry for the trend card's 246x82 viewBox.
const X_START = 34;
const X_END = 230;
const Y_TOP = 16;
const Y_BOTTOM = 70;

/**
 * Project one series onto the trend chart.
 *
 * `series` is oldest-first. `reference` is the line the series is judged
 * against — the peer average for a mental scale, the clinical cutoff for a
 * body marker — and is folded into the Y range so it always stays on screen.
 * `selIndex` counts from the newest round, the way the session chips do.
 *
 * TWO STATEMENTS, TWO TESTS. `marker` is optional and carries the precision
 * stamped on by `precision.js`; pass it and the two claims this chart makes get
 * judged separately:
 *
 *   `moved`      did it change SINCE LAST ROUND — one difference, two
 *                measurements, so the reference change value decides
 *   `trend`      is it going anywhere AT ALL — a direction across every round
 *                up to the selected one, so a slope test decides
 *
 * They disagree often, and the disagreement is the useful part. Five markers
 * whose every monthly step is inside the noise, all sloping the same way for
 * half a year, is a finding; twelve months of "▲8% 증가" captions is not.
 *
 * Omit `marker` and nothing is gated — `moved` is true whenever the value
 * differs, which is what this function did before it could tell. The mind tab
 * plots a composite score with no assay behind it and takes that path.
 */
export function computeTrend({ series, reference, selIndex, marker }) {
  const pool = [...series, reference];
  const lo = Math.min(...pool);
  const hi = Math.max(...pool);
  const span = hi - lo || 1;
  const y = (v) =>
    +(Y_BOTTOM - ((v - lo) / span) * (Y_BOTTOM - Y_TOP)).toFixed(1);

  const n = series.length;
  const xs = series.map((_, i) =>
    n > 1 ? X_START + (i * (X_END - X_START)) / (n - 1) : (X_START + X_END) / 2,
  );

  const selX = n - 1 - selIndex;
  const isFirst = selX === 0;
  const prev = isFirst ? null : series[selX - 1];
  const diff = isFirst ? 0 : series[selX] - prev;

  const step = isFirst
    ? { moved: false, pct: 0 }
    : movedSince(prev, series[selX], marker);

  // Everything up to and including the round being viewed, never past it.
  // Reading round 5 and being told about a trend that runs through round 12
  // would be the chart quietly using the future. Three points cannot carry a
  // slope test worth printing, so four is the floor.
  //
  // NOT GATED ON `marker`, and it was. A slope test needs a time series, not an
  // assay CV — the two tests are independent, which this file's own header says
  // is the whole point of having both, and then the gate tied them to the same
  // input. The cost was silence: on the mind tab, which passes no marker, three
  // of the five scales have a statistically significant direction and the chart
  // said nothing about any of them.
  const sofar = series.slice(0, selX + 1);
  const fit = sofar.length >= 4 ? slopeTest(sofar) : null;

  return {
    xs,
    ys: series.map(y),
    refY: y(reference),
    selX,
    isFirst,
    diff,
    pctChange: step.pct,
    // True when nothing gated it — the pre-precision behaviour, which is what
    // a caller that passes no marker still gets.
    moved: marker ? step.moved : diff !== 0,
    rounds: sofar.length,
    trending: fit?.significant ? Math.sign(fit.slope) : 0,
  };
}
