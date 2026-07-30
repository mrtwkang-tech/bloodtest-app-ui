import { useState } from "react";
import { Collapse, DisclosureButton } from "./Collapse";
import { Dot } from "./primitives";
import Pressable from "./Pressable";
import Clamp from "./Clamp";
import Icon from "./Icon";
import { C, DIVIDER, EASE, STATUS_COLOR, STATUS_LAMP, T } from "../tokens";
import { formatValue } from "../data/body";
import { scaleDrivers } from "../data/scales";
import { useT } from "../i18n";

// Where the peer average and the referral threshold fall on the 0–100 index.
// These are load scales: 50 is the peer average AND the point at which
// `statusOf` in data/scales.js starts calling a result "watch". Being at the
// average is already the beginning of a concern.
const AVG_AT = 50;
const WATCH_AT = 66;

/**
 * The index, as a comparison rather than a number.
 *
 * The cut points have to be `statusOf`'s own, or the sentence contradicts the
 * badge beside it — an index of 52 read as "about the same as your peers" while
 * the badge said 주의, because 50 is the average and the threshold at once.
 */
function band(index) {
  if (index >= WATCH_AT) return "high";
  if (index >= AVG_AT) return "aboveAvg";
  if (index >= AVG_AT - 10) return "avg";
  return "low";
}

/**
 * One mind index, and the chain that produced it.
 *
 * The index alone is uninterpretable to anyone who is not a biochemist, so
 * the card always shows the top driver's mechanism in plain language, and
 * opens to the full marker list on request.
 *
 * `collapsed` starts it as a single row. An index that is fine still takes a
 * full card's worth of screen otherwise — bar, driver, value, disclosure —
 * which is four fifths of the page spent on the four fifths of results that
 * are not asking for anything. Tapping the row opens the card in place, so
 * nothing is hidden, only deferred.
 */
export default function ScaleCard({
  meta,
  index,
  status,
  roundIndex,
  collapsed = false,
  last,
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(!collapsed);
  const color = STATUS_COLOR[status];
  // An index that is fine gets a neutral bar. Five green bars down the screen
  // read as decoration; the amber one then has to shout to be noticed at all.
  const lamp = status === "good" ? C.ink2 : STATUS_LAMP[status];
  const drivers = scaleDrivers(meta, roundIndex);
  const lead = drivers[0];

  const heading = (
    <>
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        <Icon
          name={meta.icon}
          level={status === "alert" ? 2 : status === "watch" ? 1 : 0}
          size={26}
        />
        <span style={{ ...T.title3, color: C.ink }}>{t(meta.axisKey)}</span>
      </span>
      <span style={{ ...T.caption, color }}>{t(`status.${status}`)}</span>
    </>
  );

  if (!expanded) {
    return (
      <Pressable
        as="button"
        type="button"
        onClick={() => setExpanded(true)}
        pressScale={0.995}
        hoverStyle={{ background: C.surfaceHover }}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
          width: "100%",
          padding: "11px 16px",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
          boxShadow: last ? "none" : DIVIDER,
        }}
      >
        {heading}
      </Pressable>
    );
  }

  return (
    <div
      style={{ padding: "12px 16px 11px", boxShadow: last ? "none" : DIVIDER }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        {heading}
      </div>

      {/* "57 · INDEX · DERIVED" said nothing to anyone who is not already
          holding the scale in their head: there is no unit, and 57 of what was
          never on screen. The comparison is the whole content, so the
          comparison is what gets said. */}
      <div style={{ ...T.bodyText, color: C.body, marginTop: 8 }}>
        {t(`mind.vsPeer.${band(index)}`)}
      </div>

      <Ruler index={index} lamp={lamp} />

      {/* One line of why, then the door. The full chain — every driver, its
          locus, its averaging window and its mechanism — used to sit open on
          this card, five times down the screen. It is the same information,
          now asked for rather than served. */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 6,
          marginTop: 11,
        }}
      >
        <span style={{ ...T.caption, color: C.body, flex: 1, minWidth: 0 }}>
          {lead.marker.plainKey ? t(lead.marker.plainKey) : lead.marker.name}
        </span>
        <span
          style={{
            ...T.num,
            fontSize: 12,
            color: lead.pushesUp ? C.watch : C.muted,
          }}
        >
          {formatValue(lead.value, lead.marker.dp)}
          {lead.marker.unit ? ` ${lead.marker.unit}` : ""}
        </span>
        <span style={{ ...T.micro, color: C.faintest }}>
          {lead.pushesUp ? t("mind.pushesUp") : t("mind.pushesDown")}
        </span>
      </div>

      <div style={{ marginTop: 10 }}>
        <DisclosureButton
          open={open}
          onClick={() => setOpen((v) => !v)}
          label={open ? t("mind.hideMarkers") : t("mind.showMarkers")}
          hint={`${drivers.length}`}
        />
        <Collapse open={open}>
          <div style={{ padding: "12px 2px 2px" }}>
            <p
              style={{
                ...T.caption,
                color: C.muted,
                margin: "0 0 14px",
                textWrap: "pretty",
              }}
            >
              {t(`${meta.axisKey}.base`)} {t(`status.line.${status}`)}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
              {drivers.map((d) => (
                <div key={d.marker.name}>
                  <div
                    style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                  >
                    <Dot
                      color={d.pushesUp ? C.watchLamp : C.inRangeLamp}
                      size={5}
                      style={{ transform: "translateY(-2px)" }}
                    />
                    <span style={{ ...T.label, color: C.ink }}>
                      {d.marker.plainKey ? t(d.marker.plainKey) : d.marker.name}
                    </span>
                    <span
                      style={{
                        marginLeft: "auto",
                        ...T.num,
                        fontSize: 12,
                        color: C.body,
                      }}
                    >
                      {formatValue(d.value, d.marker.dp)}
                    </span>
                    <span
                      style={{
                        ...T.unit,
                        color: C.faintest,
                        width: 56,
                        textAlign: "right",
                      }}
                    >
                      {d.marker.unit || "\u2014"}
                    </span>
                  </div>
                  <div
                    style={{
                      ...T.micro,
                      color: C.faintest,
                      margin: "4px 0 0 13px",
                      display: "flex",
                      gap: 6,
                      flexWrap: "wrap",
                    }}
                  >
                    <span>{d.marker.name}</span>
                    <span style={{ opacity: 0.45 }}>·</span>
                    <span>
                      {d.marker.windowKey
                        ? t(d.marker.windowKey)
                        : d.cumulative
                          ? t("mind.cumulativeTag")
                          : t("mind.snapshotTag")}
                    </span>
                  </div>
                  <Clamp
                    lines={2}
                    tone={C.faint}
                    style={{ margin: "5px 0 0 13px" }}
                  >
                    {t(d.mechanismKey)}
                  </Clamp>
                </div>
              ))}
            </div>
          </div>
        </Collapse>
      </div>
    </div>
  );
}

/**
 * Where this index sits, and where the average is.
 *
 * This used to be a full instrument scale: a fill, a thumb, two threshold
 * marks, eleven tick rules and three numeric labels — seventeen elements, five
 * times down the screen. Nobody reads a mind index off a ruler to the nearest
 * unit; the only two facts anyone takes from it are "where am I" and "where is
 * everyone else", so those are the only two things drawn.
 */
function Ruler({ index, lamp }) {
  return (
    <div
      style={{
        position: "relative",
        height: 6,
        borderRadius: 3,
        background: C.surfaceSunken,
        marginTop: 12,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: "0 auto 0 0",
          width: `${index}%`,
          background: lamp,
          borderRadius: 3,
          transition: `width 520ms ${EASE}, background 240ms ${EASE}`,
        }}
      />
      {/* The peer average, as a notch cut through the fill. */}
      <span
        style={{
          position: "absolute",
          top: -2,
          left: `${AVG_AT}%`,
          width: 2,
          marginLeft: -1,
          height: 10,
          borderRadius: 1,
          background: C.bg,
          boxShadow: `0 0 0 1px ${C.hairlineStrong}`,
        }}
      />
    </div>
  );
}
