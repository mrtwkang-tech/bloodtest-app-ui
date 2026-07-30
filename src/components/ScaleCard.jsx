import { useState } from "react";
import { Collapse, DisclosureButton } from "./Collapse";
import { C, DIVIDER, EASE, STATUS_COLOR, T } from "../tokens";
import { formatValue } from "../data/body";
import { scaleDrivers } from "../data/scales";
import { useT } from "../i18n";

// Where the peer average and the referral threshold fall on the 0–100 index.
const AVG_AT = 50;
const WATCH_AT = 66;

/**
 * One mind index, and the chain that produced it.
 *
 * The index alone is uninterpretable to anyone who is not a biochemist, so
 * the card always shows the top driver's mechanism in plain language, and
 * opens to the full marker list on request.
 */
export default function ScaleCard({ meta, index, status, roundIndex, last }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const color = STATUS_COLOR[status];
  const drivers = scaleDrivers(meta, roundIndex);
  const lead = drivers[0];

  return (
    <div style={{ padding: "13px 16px 12px", boxShadow: last ? "none" : DIVIDER }}>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 10,
        }}
      >
        <span style={{ ...T.title3, color: C.ink }}>{t(meta.axisKey)}</span>
        <span style={{ ...T.micro, color: C.faintest }}>
          {t("mind.derived")}
        </span>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 10,
          marginTop: 9,
        }}
      >
        <span
          style={{
            ...T.num,
            fontSize: 27,
            fontWeight: 600,
            color: C.ink,
            lineHeight: 1,
          }}
        >
          {index}
        </span>
        <span style={{ ...T.monoSm, color, paddingBottom: 2 }}>
          {t(`status.${status}`)}
        </span>
        <span
          style={{
            marginLeft: "auto",
            ...T.micro,
            color: C.faintest,
            paddingBottom: 2,
          }}
        >
          {t("mind.index")}
        </span>
      </div>

      <Ruler index={index} color={color} />

      {/* The mechanism, not the number: this is the part a reader can use. */}
      <div style={{ marginTop: 10 }}>
        <div style={{ ...T.micro, color: C.faintest }}>{t("mind.whyThis")}</div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 7,
            marginTop: 6,
          }}
        >
          <span style={{ ...T.label, color: C.ink }}>{lead.marker.name}</span>
          <span
            style={{
              ...T.num,
              fontSize: 12,
              color: lead.pushesUp ? C.watch : C.optimal,
            }}
          >
            {formatValue(lead.value, lead.marker.dp)}
            {lead.marker.unit ? ` ${lead.marker.unit}` : ""}
          </span>
          <span style={{ ...T.micro, color: C.faintest }}>
            {lead.pushesUp ? t("mind.pushesUp") : t("mind.pushesDown")}
          </span>
        </div>
        <p
          style={{
            ...T.monoSm,
            color: C.muted,
            margin: "6px 0 0",
            textWrap: "pretty",
          }}
        >
          {t(lead.mechanismKey)}
        </p>
      </div>

      <div style={{ marginTop: 11 }}>
        <DisclosureButton
          open={open}
          onClick={() => setOpen((v) => !v)}
          label={open ? t("mind.hideMarkers") : t("mind.showMarkers")}
          hint={`${drivers.length}`}
        />
        <Collapse open={open}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 11,
              padding: "12px 2px 2px",
            }}
          >
            {drivers.map((d) => (
              <div key={d.marker.name}>
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
                  <span
                    style={{
                      width: 5,
                      height: 5,
                      borderRadius: "50%",
                      background: d.pushesUp ? C.watch : C.optimal,
                      flex: "none",
                      transform: "translateY(-2px)",
                    }}
                  />
                  <span style={{ ...T.monoSm, color: C.ink }}>
                    {d.marker.name}
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
                    {d.marker.unit || "—"}
                  </span>
                </div>
                <p
                  style={{
                    ...T.micro,
                    color: C.faint,
                    margin: "4px 0 0 13px",
                    lineHeight: 1.6,
                    textWrap: "pretty",
                  }}
                >
                  {t(d.mechanismKey)}
                </p>
              </div>
            ))}
          </div>
        </Collapse>
      </div>

      <p
        style={{
          ...T.monoSm,
          color: C.muted,
          margin: "11px 0 0",
          paddingTop: 10,
          boxShadow: `inset 0 1px 0 ${C.hairline}`,
          textWrap: "pretty",
        }}
      >
        {t(`${meta.axisKey}.base`)} {t(`status.line.${status}`)}
      </p>
    </div>
  );
}

/**
 * A measured axis rather than a decorative gradient. The fill carries the
 * value, the peer average and referral threshold are marked on the axis, and
 * the ticks let you read a position instead of estimating one.
 */
function Ruler({ index, color }) {
  return (
    <div style={{ marginTop: 13 }}>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 2,
          background: C.surfaceSunken,
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: `${index}%`,
            background: color,
            borderRadius: 2,
            transition: `width 520ms ${EASE}, background 240ms ${EASE}`,
          }}
        />
        <Mark at={AVG_AT} strong />
        <Mark at={WATCH_AT} />
        <div
          style={{
            position: "absolute",
            top: -3,
            left: `${index}%`,
            width: 3,
            height: 12,
            marginLeft: -1.5,
            borderRadius: 1.5,
            background: C.ink,
            boxShadow: `0 0 0 2px ${C.surface}`,
            transition: `left 520ms ${EASE}`,
          }}
        />
      </div>

      <div style={{ position: "relative", height: 6, marginTop: 3 }}>
        {Array.from({ length: 11 }, (_, i) => i * 10).map((v) => (
          <span
            key={v}
            style={{
              position: "absolute",
              left: `${v}%`,
              top: 0,
              width: 1,
              height: v % 25 === 0 || v === 100 ? 5 : 3,
              background: v % 50 === 0 ? C.hairlineStrong : C.hairline,
            }}
          />
        ))}
      </div>

      <div style={{ position: "relative", height: 12, marginTop: 1 }}>
        <Tick at={0} align="start" label="0" />
        <Tick at={AVG_AT} align="middle" label="50" muted={false} />
        <Tick at={100} align="end" label="100" />
      </div>
    </div>
  );
}

function Mark({ at, strong }) {
  return (
    <span
      style={{
        position: "absolute",
        top: -2,
        left: `${at}%`,
        width: 1,
        height: 10,
        background: strong ? "rgba(23,24,26,.42)" : C.hairlineStrong,
      }}
    />
  );
}

function Tick({ at, align, label, muted = true }) {
  const transform =
    align === "start"
      ? "none"
      : align === "end"
        ? "translateX(-100%)"
        : "translateX(-50%)";
  return (
    <span
      style={{
        position: "absolute",
        left: `${at}%`,
        transform,
        ...T.micro,
        fontSize: 9,
        color: muted ? C.faintest : C.faint,
      }}
    >
      {label}
    </span>
  );
}
