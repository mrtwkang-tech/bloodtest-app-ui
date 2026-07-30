import { SYSTEMS, markerLevel, valuesAt } from "./body";
import { EPIGEN } from "./epigenetics";

/**
 * Every panel a marker can come from: the ten organ systems plus the
 * methylation panel. Lookups go through here so that a rename anywhere fails
 * loudly at import time instead of silently scoring zero.
 */
export const PANELS = [...SYSTEMS, EPIGEN];

export function findMarker(panelKey, markerName) {
  const panel = PANELS.find((p) => p.key === panelKey);
  const index = panel?.markers.findIndex((x) => x.name === markerName) ?? -1;
  if (!panel || index < 0) {
    throw new Error(`Unknown marker: ${panelKey}/${markerName}`);
  }
  return { panel, index, marker: panel.markers[index] };
}

/** A marker's reading at one round, with its level already resolved. */
export function readMarker(panelKey, markerName, roundIndex) {
  const { panel, index, marker } = findMarker(panelKey, markerName);
  const value = valuesAt(panel, roundIndex)[index];
  return {
    marker,
    value,
    level: markerLevel(marker, value),
    systemKey: panel.key,
  };
}
