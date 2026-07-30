import Emphasis, { withEmphasis } from "../components/Emphasis";
import { Dot } from "../components/primitives";
import { band } from "../components/ScaleRow";
import { C, DIVIDER_TOP, EASE, STATUS_COLOR, STATUS_LAMP, T } from "../tokens";
import { formatValue } from "../data/body";
import { plainKeyOf } from "../data/plainNames";
import { SCALE_META, scaleDrivers } from "../data/scales";
import { windowKeyOf } from "../data/window";
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
  // The window rule, made visible. A marker slower than the interval is still
  // worth reading — it just cannot say what changed this month, and the sheet
  // is the place to be honest about which is which.
  const counted = drivers.filter((d) => d.counted);
  const context = drivers.filter((d) => !d.counted);

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 9 }}>
        <span style={{ ...T.bodyText, color: C.ink }}>
          <Emphasis>{t(`mind.vsPeer.${band(index)}`)}</Emphasis>
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
        {t(`${meta.axisKey}.base`)} {withEmphasis(t(`status.line.${status}`))}
      </p>

      {context.length > 0 && (
        <div style={{ ...T.label, color: C.faint, marginTop: 20 }}>
          {t("mind.counted")}
        </div>
      )}

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 14,
          marginTop: context.length > 0 ? 10 : 18,
        }}
      >
        {counted.map((d) => (
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
              <span>{t(windowKeyOf(d.marker))}</span>
            </div>
            <p
              style={{
                ...T.caption,
                color: C.faint,
                margin: "5px 0 0 13px",
                textWrap: "pretty",
              }}
            >
              {t(d.mechanismKey)}
            </p>
          </div>
        ))}
      </div>

      {context.length > 0 && (
        <div style={{ marginTop: 22, paddingTop: 16, boxShadow: DIVIDER_TOP }}>
          <div style={{ ...T.label, color: C.faint }}>
            {t("mind.contextGroup")}
          </div>
          <p
            style={{
              ...T.caption,
              color: C.faintest,
              margin: "6px 0 0",
              textWrap: "pretty",
            }}
          >
            {t("mind.contextNote")}
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 12,
              marginTop: 14,
            }}
          >
            {context.map((d) => (
              <div key={d.marker.name}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <span style={{ ...T.label, color: C.muted }}>
                    {plainKeyOf(d.marker)
                      ? t(plainKeyOf(d.marker))
                      : d.marker.name}
                  </span>
                  <span
                    style={{
                      marginLeft: "auto",
                      ...T.num,
                      fontSize: 12,
                      color: C.faint,
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
                  style={{ ...T.micro, color: C.faintest, marginTop: 3 }}
                >
                  {d.marker.name} · {t(windowKeyOf(d.marker))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
