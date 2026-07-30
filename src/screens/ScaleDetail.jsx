import Clamp from "../components/Clamp";
import { Dot } from "../components/primitives";
import { band } from "../components/ScaleRow";
import { C, DIVIDER_TOP, EASE, STATUS_COLOR, STATUS_LAMP, T } from "../tokens";
import { formatValue } from "../data/body";
import { plainKeyOf } from "../data/plainNames";
import { SCALE_META, scaleDrivers } from "../data/scales";
import { SESSIONS } from "../data/sessions";
import { useT } from "../i18n";

/**
 * One mind index in full, in a sheet.
 *
 * This is the content that used to unfold inside the scale card and push the
 * page down by four hundred pixels — the whole driver chain, each marker's
 * value, its assay name, the span of time it covers and the mechanism that ties
 * it to the index. It is the same information; the difference is that arriving
 * over the page rather than inside it means the reader keeps their position.
 *
 * The chain is the point of the screen. An index of 54 is not interpretable on
 * its own, and the honest answer to "why 54?" is a list of measurements and
 * what each one does — so that list is the body, not a disclosure inside it.
 */
export default function ScaleDetail({ scaleKey, sel }) {
  const t = useT();
  const meta = SCALE_META.find((m) => m.key === scaleKey);
  const session = SESSIONS[sel];
  const i = SCALE_META.indexOf(meta);
  const index = session.indices[i];
  const status = session.status[i];
  const drivers = scaleDrivers(meta, session.roundIndex);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
        <span style={{ ...T.bodyText, color: C.ink }}>
          {t(`mind.vsPeer.${band(index)}`)}
        </span>
        <span
          style={{
            ...T.caption,
            color: STATUS_COLOR[status],
            marginLeft: "auto",
          }}
        >
          {t(`status.${status}`)}
        </span>
      </div>

      <div
        style={{
          position: "relative",
          height: 5,
          borderRadius: 2.5,
          background: C.surfaceSunken,
          margin: "12px 0 6px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: `${index}%`,
            background: status === "good" ? C.ink2 : STATUS_LAMP[status],
            borderRadius: 2.5,
            transition: `width 520ms ${EASE}`,
          }}
        />
        <span
          style={{
            position: "absolute",
            top: -2,
            left: "50%",
            width: 2,
            marginLeft: -1,
            height: 9,
            borderRadius: 1,
            background: C.bg,
            boxShadow: `0 0 0 1px ${C.hairlineStrong}`,
          }}
        />
      </div>
      <div style={{ ...T.caption, color: C.faintest }}>
        {t("mind.peerMark")}
      </div>

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
        {t(`${meta.axisKey}.base`)} {t(`status.line.${status}`)}
      </p>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: 18,
        }}
      >
        {drivers.map((d) => (
          <div key={d.marker.name}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <Dot
                color={d.pushesUp ? C.watchLamp : C.inRangeLamp}
                size={5}
                style={{ transform: "translateY(-2px)" }}
              />
              <span style={{ ...T.label, color: C.ink }}>
                {plainKeyOf(d.marker) ? t(plainKeyOf(d.marker)) : d.marker.name}
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
            <Clamp lines={2} tone={C.faint} style={{ margin: "5px 0 0 13px" }}>
              {t(d.mechanismKey)}
            </Clamp>
          </div>
        ))}
      </div>
    </div>
  );
}
