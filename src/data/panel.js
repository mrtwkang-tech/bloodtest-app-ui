import { ROUNDS, SYSTEMS } from "./body";
import { EPIGEN } from "./epigenetics";
import { COMPOSITION } from "./inbody";

/**
 * The raw draw, and the one door into the app's numbers.
 *
 * WHAT WAS MISSING. Every value in this product was generated, not entered.
 * `withSeries()` in body.js either read a hand-authored `demo` array or ran a
 * seeded mean-reverting walk from `base` and `spread`. The derivation on top of
 * that is real and correct — `markerLoad` → `scaleIndex` → `statusOf`,
 * `markerLevel` → `systemLevel` → `bodySummary` → `healthScore`, plus the
 * likelihood ratios in bayes.js and the cross-panel rules in interactions.js —
 * but there was no entrance. You could not hand the app a plate of assay
 * results and watch the screens follow.
 *
 * So this file is the entrance, and deliberately nothing else. It does not
 * compute anything a screen shows; it writes values into the series the
 * existing readers already read, which is why entering one number moves the
 * body row, the deviation in the sheet, the health score, the mind index that
 * marker drives, and the signal that watches its trend — all at once, with no
 * new derivation code.
 *
 * WHY WRITE-THROUGH RATHER THAN A LOOKUP. `marker.demo` is read from fifteen
 * places across body, sessions, interactions, bayes and inbody. Routing all of
 * them through an accessor would be a large change to code that is working, to
 * no benefit: the store IS the source of truth for a saved round, so it can own
 * those cells outright. Rounds with nothing saved keep their generated series,
 * so the fixture still stands up on a clean install.
 */

const KEY = "pedia.panels.v1";

/* ------------------------------------------------------------ M and beta */

/**
 * Methylation has two units and the document is right about which goes where:
 * "분석은 M값으로, 보고는 베타값으로."
 *
 * Beta is the fraction of copies methylated — 0 to 1, the thing a lab reports
 * and the only one a reader can hold. It is also heteroscedastic: near 0 and
 * near 1 its variance collapses, so a difference of 0.02 means something very
 * different at 0.50 than at 0.97, and any linear model fitted on it is fitted
 * on a ruler whose marks change width. M is the logit — unbounded, roughly
 * homoscedastic, and what association analysis and any regression should run
 * on.
 *
 * Hence the split this file enforces: STORE AND SHOW BETA, MODEL IN M. The
 * conversion is exact and lossless in both directions, so nothing is given up
 * by keeping the reader's unit as the stored one.
 */
export const betaToM = (beta) => {
  const b = Math.min(1 - 1e-6, Math.max(1e-6, beta));
  return Math.log2(b / (1 - b));
};
export const mToBeta = (m) => 2 ** m / (2 ** m + 1);

/** The panel reports percent methylated; the models want M. */
export const pctToM = (pct) => betaToM(pct / 100);
export const mToPct = (m) => mToBeta(m) * 100;

/* ---------------------------------------------------------------- fields */

/**
 * Every enterable field, derived from the panels themselves rather than
 * listed. A hand-written catalogue would drift the first time a marker is
 * added; this one cannot.
 */
export function panelFields() {
  const groups = [];
  SYSTEMS.forEach((s) => {
    groups.push({
      key: `sys:${s.key}`,
      nameKey: s.nameKey,
      kind: "analyte",
      fields: s.markers.map((m) => ({
        id: `${s.key}/${m.name}`,
        label: m.name,
        plainKey: m.plainKey,
        unit: m.unit,
        ref: m.ref,
        dp: m.dp ?? 1,
        dir: m.dir,
        series: m.demo,
      })),
    });
  });
  groups.push({
    key: "epigen",
    nameKey: EPIGEN.nameKey,
    kind: "methylation",
    fields: EPIGEN.markers.map((m) => ({
      id: `${EPIGEN.key}/${m.name}`,
      label: m.name,
      plainKey: m.plainKey,
      unit: m.unit,
      ref: m.ref,
      dp: m.dp ?? 1,
      dir: m.dir,
      // Only the "% me" markers are true beta readings. The composite indices
      // in the same panel are unitless scores and must not be logit-ed.
      isBeta: m.unit === "% me",
      series: m.demo,
    })),
  });
  groups.push({
    key: "inbody",
    nameKey: "body.compositionRow",
    kind: "composition",
    fields: COMPOSITION.map((c) => ({
      id: `inbody/${c.key}`,
      label: c.key,
      plainKey: c.nameKey,
      unit: c.unit,
      ref: c.band?.high ?? c.band?.low ?? null,
      dp: c.dp ?? 1,
      dir: c.dir,
      series: c.demo,
    })),
  });
  return groups;
}

/** Flat id → series cell, so a record can be applied without a search. */
function seriesById() {
  const map = new Map();
  panelFields().forEach((g) =>
    g.fields.forEach((f) => map.set(f.id, f.series)),
  );
  return map;
}

/* ----------------------------------------------------------------- store */

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    // A corrupt or unavailable store must not take the app down with it —
    // the generated series is a perfectly good fallback.
    return {};
  }
}

function persist(all) {
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* private mode, quota — the in-memory write already happened */
  }
}

/**
 * Values currently in the series for one round, as an editable record.
 *
 * Rounded to the marker's own precision. The generated walk produces full
 * doubles — 10.051651000000001 in a field a technician is meant to check
 * against a printout is not a value, it is noise with a decimal point.
 */
export function readPanel(roundIndex) {
  const out = {};
  panelFields().forEach((g) =>
    g.fields.forEach((f) => {
      const v = f.series[roundIndex];
      out[f.id] = Number.isFinite(v) ? Number(v.toFixed(f.dp)) : v;
    }),
  );
  return out;
}

/** Which ids a saved panel is currently overriding, for the entry screen. */
export function savedIds(roundIndex) {
  const rec = load()[roundIndex];
  return new Set(rec ? Object.keys(rec) : []);
}

/**
 * Write a record into the live series. Only ids present in the record move —
 * a partial panel is a normal thing to have, and the rest keeps whatever it
 * had.
 */
export function applyPanel(roundIndex, record) {
  const map = seriesById();
  let applied = 0;
  Object.entries(record).forEach(([id, value]) => {
    const series = map.get(id);
    if (!series || !Number.isFinite(value)) return;
    series[roundIndex] = value;
    applied += 1;
  });
  return applied;
}

export function savePanel(roundIndex, record) {
  const all = load();
  all[roundIndex] = { ...(all[roundIndex] ?? {}), ...record };
  persist(all);
  return applyPanel(roundIndex, record);
}

export function clearPanel(roundIndex) {
  const all = load();
  delete all[roundIndex];
  persist(all);
}

export function clearAllPanels() {
  persist({});
}

/**
 * Replay everything saved, once, before React renders. Values entered in a
 * previous visit have to be in the series by the time the first index is
 * computed, or the first paint shows the generated numbers and then jumps.
 */
export function hydratePanels() {
  const all = load();
  let rounds = 0;
  Object.entries(all).forEach(([round, record]) => {
    const i = Number(round);
    if (i >= 0 && i < ROUNDS && applyPanel(i, record) > 0) rounds += 1;
  });
  return rounds;
}

/* ------------------------------------------------------------------ text */

/**
 * Paste support. Labs hand over a column of `name<TAB>value`, and typing 105
 * fields is not a thing anyone will do twice. Accepts tab, comma or a run of
 * spaces, matches on either the assay name or the plain name, and reports what
 * it could not place rather than silently dropping it.
 */
export function parsePaste(text, t) {
  const byLabel = new Map();
  panelFields().forEach((g) =>
    g.fields.forEach((f) => {
      byLabel.set(f.label.toLowerCase(), f.id);
      if (f.plainKey && t) byLabel.set(t(f.plainKey).toLowerCase(), f.id);
    }),
  );

  const record = {};
  const unmatched = [];
  text.split(/\r?\n/).forEach((line) => {
    if (!line.trim()) return;
    const parts = line.split(/\t|,|;|\s{2,}/).filter((p) => p.trim());
    if (parts.length < 2) {
      unmatched.push(line.trim());
      return;
    }
    const value = Number(parts[parts.length - 1].replace(/[^\d.\-+eE]/g, ""));
    const label = parts.slice(0, -1).join(" ").trim().toLowerCase();
    const id = byLabel.get(label);
    if (!id || !Number.isFinite(value)) {
      unmatched.push(line.trim());
      return;
    }
    record[id] = value;
  });
  return { record, unmatched };
}
