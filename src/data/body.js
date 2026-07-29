import { C } from "../tokens";

/**
 * Body screening — six conditions grouped into four organ systems.
 *
 * Why systems and not one pin per condition: three of the six (Alzheimer's,
 * Parkinson's, stroke) are neurological and would pile up on the head while
 * the rest of the figure sat empty. Cancer has no single organ at all, so the
 * systemic zone lights the whole body instead of an anchor point.
 *
 * Every marker is oriented "higher = worse" so one band rule covers them all.
 * All labels are i18n keys — the app ships in two languages.
 */

/** Level 0/1/2 → i18n key for its label. Colours live in tokens.js. */
export const BODY_STATUS_KEY = ["body.clear", "body.watch", "body.consult"];

export const ZONES = [
  {
    key: "neuro",
    nameKey: "zone.neuro",
    noteKey: "zone.neuro.note",
    conditionKeys: ["cond.alzheimers", "cond.parkinsons", "cond.stroke"],
    markers: [
      { name: "p-tau217", unit: "pg/mL", ref: 0.4, max: 1.2, dp: 2 },
      { name: "NfL", unit: "pg/mL", ref: 15, max: 40, dp: 1 },
      { name: "GFAP", unit: "pg/mL", ref: 130, max: 300, dp: 0 },
    ],
  },
  {
    key: "cardio",
    nameKey: "zone.cardio",
    noteKey: "zone.cardio.note",
    conditionKeys: ["cond.mi"],
    markers: [
      { name: "hs-CRP", unit: "mg/L", ref: 1.0, max: 5.0, dp: 1 },
      { name: "LDL-C", unit: "mg/dL", ref: 130, max: 200, dp: 0 },
      { name: "Lp(a)", unit: "nmol/L", ref: 50, max: 150, dp: 0 },
      { name: "Homocysteine", unit: "μmol/L", ref: 15, max: 30, dp: 1 },
    ],
  },
  {
    key: "metab",
    nameKey: "zone.metab",
    noteKey: "zone.metab.note",
    conditionKeys: ["cond.diabetes"],
    markers: [
      { name: "HbA1c", unit: "%", ref: 5.7, max: 8.0, dp: 1 },
      { name: "Fasting glucose", unit: "mg/dL", ref: 100, max: 160, dp: 0 },
      { name: "HOMA-IR", unit: "", ref: 2.5, max: 6.0, dp: 1 },
    ],
  },
  {
    key: "systemic",
    nameKey: "zone.systemic",
    noteKey: "zone.systemic.note",
    conditionKeys: ["cond.cancer"],
    markers: [
      { name: "cfDNA", unit: "ng/mL", ref: 10, max: 30, dp: 1 },
      { name: "CEA", unit: "ng/mL", ref: 5.0, max: 15, dp: 1 },
      { name: "CA19-9", unit: "U/mL", ref: 37, max: 100, dp: 0 },
    ],
  },
];

export const TOTAL_CONDITIONS = ZONES.reduce(
  (n, z) => n + z.conditionKeys.length,
  0,
);
export const TOTAL_MARKERS = ZONES.reduce((n, z) => n + z.markers.length, 0);

export function zoneOf(key) {
  return ZONES.find((z) => z.key === key);
}

/** 0 clear · 1 watch · 2 consult. 25% over the reference is the second step. */
export function markerLevel(marker, value) {
  if (value > marker.ref * 1.25) return 2;
  if (value > marker.ref) return 1;
  return 0;
}

/** "Optimal" is comfortably inside the range, not merely under the ceiling. */
export function isOptimal(marker, value) {
  return value <= marker.ref * 0.75;
}

export function zoneLevel(zone, values) {
  return zone.markers.reduce(
    (lv, m, i) => Math.max(lv, markerLevel(m, values[i])),
    0,
  );
}

export function formatValue(value, dp) {
  return dp > 0 ? value.toFixed(dp) : String(Math.round(value));
}

/**
 * Traffic-light band for one marker. Stops come from the clinical reference
 * rather than a fixed split, so the green zone means the same thing everywhere.
 */
export function markerBand(marker) {
  const green = Math.min(100, (marker.ref / marker.max) * 100);
  const amber = Math.min(100, ((marker.ref * 1.25) / marker.max) * 100);
  return (
    `linear-gradient(90deg,${C.optimal} 0 ${green.toFixed(1)}%,` +
    `${C.watch} ${green.toFixed(1)}% ${amber.toFixed(1)}%,` +
    `${C.alert} ${amber.toFixed(1)}% 100%)`
  );
}

export function markerLeft(value, max) {
  return `${Math.max(0, Math.min(100, (value / max) * 100)).toFixed(1)}%`;
}

/** Every zone of one session, with its computed level. */
export function zonesFor(session) {
  return ZONES.map((zone) => ({
    zone,
    values: session.body[zone.key],
    level: zoneLevel(zone, session.body[zone.key]),
  }));
}
