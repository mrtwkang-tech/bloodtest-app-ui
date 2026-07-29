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
 */
export function computeTrend({ series, reference, selIndex }) {
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
  const pctChange = prev ? Math.round((Math.abs(diff) / prev) * 100) : 0;

  return {
    xs,
    ys: series.map(y),
    refY: y(reference),
    selX,
    isFirst,
    diff,
    pctChange,
  };
}
