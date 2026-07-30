import { useState } from "react";
import { Collapse, DisclosureButton } from "../components/Collapse";
import { withEmphasis } from "../components/Emphasis";
import MarkerBar from "../components/MarkerBar";
import NextStep from "../components/NextStep";
import { C, DIVIDER_TOP, LEVEL_COLOR, T } from "../tokens";
import { BODY_STATUS_KEY, deviationOf, markerLevel } from "../data/body";
import { plainKeyOf } from "../data/plainNames";
import { SESSIONS, bodySummary, pick } from "../data/sessions";
import { useLang } from "../i18n";

/**
 * One body system in full, in a sheet.
 *
 * The counterpart to ScaleDetail, and deliberately the same shape: what the
 * panel is, what it found in you, the measurements it found it in, and only
 * then what to do. The evidence is the body of the screen rather than a
 * disclosure inside it, because a claim about a system is only worth as much
 * as the readings under it.
 *
 * The one thing that IS folded is the full marker list. Findings are open;
 * the twenty-odd readings that came back in range are one tap away. That is a
 * different kind of information — not detail about the finding, but proof that
 * everything else was looked at — and it is the only thing on the screen a
 * reader can be trusted to want on request rather than by default.
 */
export default function ZoneDetail({ zoneKey, sel }) {
  const { t, lang } = useLang();
  const [showAll, setShowAll] = useState(false);
  const session = SESSIONS[sel];
  const entry = bodySummary(session).zones.find((z) => z.zone.key === zoneKey);
  if (!entry) return null;

  const { zone, values, level } = entry;
  const note = pick(session.bodyNote?.[zone.key], lang);
  const action = pick(session.bodyAction?.[zone.key], lang);
  const over = zone.markers
    .map((m, i) => ({ marker: m, value: values[i] }))
    .filter((p) => markerLevel(p.marker, p.value) > 0);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
        <span style={{ ...T.bodyText, color: C.ink }}>
          {t(zone.specialtyKey)}
        </span>
        <span
          style={{
            ...T.caption,
            color: LEVEL_COLOR[level],
            marginLeft: "auto",
          }}
        >
          {t(BODY_STATUS_KEY[level])}
        </span>
      </div>
      <div style={{ ...T.caption, color: C.faintest, marginTop: 5 }}>
        {zone.conditionKeys.map((k) => t(k)).join(" · ")}
      </div>

      {/* What the panel is for, then what this reader's result means. */}
      <p
        style={{
          ...T.bodyText,
          color: C.body,
          margin: "16px 0 0",
          paddingTop: 14,
          boxShadow: DIVIDER_TOP,
          textWrap: "pretty",
        }}
      >
        {t(zone.noteKey)}
      </p>

      {(note || over.length === 0) && (
        <p
          style={{
            ...T.bodyText,
            color: C.ink,
            margin: "10px 0 0",
            textWrap: "pretty",
          }}
        >
          {note ? withEmphasis(note) : t("body.clearAll")}
        </p>
      )}

      {over.length > 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 15,
            marginTop: 18,
          }}
        >
          {over.map(({ marker, value }) => (
            <MarkerBar key={marker.name} marker={marker} value={value} />
          ))}
        </div>
      )}

      <div style={{ marginTop: 16 }}>
        <DisclosureButton
          open={showAll}
          onClick={() => setShowAll((v) => !v)}
          label={
            showAll
              ? t("body.showLess")
              : t("body.showAll", { n: zone.markers.length })
          }
          hint={
            over.length
              ? t("body.outOfRangeOnly", { n: over.length })
              : undefined
          }
        />
        <Collapse open={showAll}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 15,
              padding: "15px 0 2px",
            }}
          >
            {zone.markers.map((m, i) => (
              <MarkerBar key={m.name} marker={m} value={values[i]} />
            ))}
          </div>
        </Collapse>
      </div>

      {/* Last, after the evidence — and only when the system has an action the
          app cannot take for you. A level-1 system ends here, which is honest:
          "관찰 필요" is already on the badge above. */}
      <NextStep label={t("body.consultNow")} where={t(zone.specialtyKey)}>
        {action}
      </NextStep>
    </div>
  );
}

/** The row's second line: findings when there are any, else what was screened. */
export function zoneSummaryLine(zone, values, t) {
  const over = zone.markers
    .map((m, i) => ({ marker: m, value: values[i] }))
    .filter((p) => markerLevel(p.marker, p.value) > 0);
  if (over.length === 0) {
    return t("body.screenedFor", { n: zone.markers.length });
  }
  return over
    .map((p) => {
      const k = plainKeyOf(p.marker);
      const name = k ? t(k) : p.marker.name;
      return `${name} ${deviationOf(p.marker, p.value).pct}%`;
    })
    .join(" · ");
}
