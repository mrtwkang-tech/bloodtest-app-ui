import { withEmphasis } from "../components/Emphasis";
import { Dot } from "../components/primitives";
import { C, DIVIDER_TOP, EASE, STATUS_COLOR, STATUS_LAMP, T } from "../tokens";
import { formatValue } from "../data/body";
import { plainKeyOf } from "../data/plainNames";
import { SCALE_META, scaleDrivers } from "../data/scales";
import { windowKeyOf } from "../data/window";
import { SESSIONS } from "../data/sessions";
import { scalePercentile } from "../data/cohorts";
import { useT } from "../i18n";

/**
 * One mind index in full, opened inside its row.
 *
 * It was a sheet, and the reason it was a sheet has expired. The argument in
 * `BodyTab` ran: Body opens in place because the figure is the context and a
 * sheet would cover the one thing that says where the liver is, while "a mind
 * scale has no picture to stay next to". Mind now has a picture. So the sheet
 * would cover the same thing here that it would have covered there, and the
 * two screens converge — not because one was copied, but because the reason
 * they diverged stopped being true.
 *
 * The chain is the point of the screen. A score of 54 is not interpretable on
 * its own, and the honest answer to "why 54?" is a list of measurements and
 * what each one does — so that list is the body, not a disclosure inside it.
 *
 * NOTE THE UNITS SHIFT HALFWAY DOWN, deliberately. The headline is a SCORE,
 * oriented like the rest of the product: higher is better. Everything from the
 * driver list on is stated in LOAD, because load is what `markerLoad` actually
 * computes and what each mechanism sentence describes. Printing the model in
 * the reader's units would mean rewriting what the model does.
 */
export default function ScaleDetail({ scaleKey, sel }) {
  const t = useT();
  const meta = SCALE_META.find((m) => m.key === scaleKey);
  const session = SESSIONS[sel];
  const i = SCALE_META.indexOf(meta);
  const index = session.indices[i];
  const score = session.scores[i];
  const status = session.status[i];
  const drivers = scaleDrivers(meta, session.roundIndex);
  // The window rule, made visible. A marker slower than the interval is still
  // worth reading — it just cannot say what changed this month, and the sheet
  // is the place to be honest about which is which.
  const counted = drivers.filter((d) => d.counted);
  const context = drivers.filter((d) => !d.counted);

  return (
    <div>
      {/* The peer band used to lead this panel, in the row's own words, ~20px
          under the row still rendered above — the same dict key with the same
          argument, twice. The percentile below says the same thing exactly
          rather than in four buckets, so the band is gone from the tab.

          The status word stays, and moved down to sit with the score. It is
          NOT redundant: `PanelRow` only prints a status when the level is above
          zero, so across the fixture 43 of 60 open-row states are "good" and
          this is the only place the word appears at all. */}
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
            width: `${score}%`,
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
      {/* The whole ruler, not a third of it. `mind.peerMark` said only what the
          notch was; two other strings elsewhere each said another third of the
          same scale. This one string states all three anchors and the
          direction, and it is the last thing read before the panel switches
          from score units to load units below. */}
      <div style={{ ...T.caption, color: C.faintest }}>
        {t("mind.indexNote")}
      </div>

      {/* The score, spelled out. The row above carries the bare numeral so the
          list can be scanned; this is the one place with room to say what it is
          and what it is being compared against. */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          marginTop: 12,
        }}
      >
        <span style={{ ...T.num, fontSize: 21, color: C.ink }}>
          {t("body.score", { n: score })}
        </span>
        <span style={{ ...T.caption, color: C.faint }}>
          {t("mind.scoreLabel")} ·{" "}
          {t("body.scoreVsPeers", {
            pct: scalePercentile(score, meta.drivers.length),
          })}
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
                <div
                  style={{ display: "flex", alignItems: "baseline", gap: 8 }}
                >
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
                <div style={{ ...T.micro, color: C.faintest, marginTop: 3 }}>
                  {d.marker.name} · {t(windowKeyOf(d.marker))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* THE ASSAY CAVEAT, HERE, AND ONLY THE ASSAY CAVEAT.
          This is the only surface in the app that prints cfDNA sgACC, FKBP5,
          SLC6A4 and the rest with a value, a unit and a sentence asserting
          biology, so the sentence about whether those assays are validated
          belongs on it and nowhere else.
          "Not a diagnosis" used to be appended here as well. That is a claim
          about the panel, not about these numbers, and the tab states it — so
          the reader was getting the identical two sentences twice, once here
          and once 600px further down. */}
      <p
        style={{
          ...T.caption,
          color: C.faintest,
          margin: "20px 0 0",
          paddingTop: 12,
          boxShadow: DIVIDER_TOP,
          textWrap: "pretty",
        }}
      >
        {t("epi.hypothetical")}
      </p>
    </div>
  );
}
