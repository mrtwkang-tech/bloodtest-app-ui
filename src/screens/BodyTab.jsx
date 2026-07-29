import { useCallback, useMemo, useState } from "react";
import BodyScene from "../three/BodyScene";
import Pressable from "../components/Pressable";
import SessionChips from "../components/SessionChips";
import TrendChart from "../components/TrendChart";
import { Card, ChipRail, Pill, SectionTitle } from "../components/primitives";
import {
  C,
  CARD,
  DIVIDER_TOP,
  LEVEL_COLOR,
  LEVEL_TINT,
  T,
  fadeUp,
} from "../tokens";
import {
  BODY_STATUS_KEY,
  formatValue,
  markerBand,
  markerLeft,
  markerLevel,
} from "../data/body";
import {
  BODY_METRICS,
  SESSIONS,
  bodySeries,
  bodySummary,
  pick,
} from "../data/sessions";
import { useLang } from "../i18n";

/**
 * The body screen is the 3D figure plus whatever the current selection is
 * about. Selecting an organ system in the rail, tapping the mesh, or tapping a
 * card all drive the same piece of state, so the model and the list can never
 * disagree about what is being looked at.
 */
export default function BodyTab({ sel, onPickSession }) {
  const { t, lang } = useLang();
  const [active, setActive] = useState(null);
  const [metric, setMetric] = useState(0);

  const session = SESSIONS[sel];
  const summary = bodySummary(session);

  const pickZone = useCallback((key) => {
    setActive((cur) => (cur === key ? null : key));
  }, []);

  const railItems = useMemo(
    () => [
      { key: "__all", label: t("body.summary") },
      ...summary.zones.map(({ zone, level }) => ({
        key: zone.key,
        label: t(zone.nameKey),
        dot: LEVEL_COLOR[level],
      })),
    ],
    [summary.zones, t],
  );

  const activeEntry = summary.zones.find((z) => z.zone.key === active);
  const shown = activeEntry ? [activeEntry] : summary.flagged;

  const pickMetric = BODY_METRICS[metric];
  const series = bodySeries(pickMetric.zone, pickMetric.mi);
  const rounds = [...SESSIONS].reverse();
  const currentValue = series[series.length - 1 - sel];

  return (
    <div>
      <header style={fadeUp(0)}>
        <h1 style={{ ...T.title1, color: C.ink, margin: 0 }}>
          {t("body.title")}
        </h1>
        <div style={{ ...T.caption, color: C.faint, marginTop: 3 }}>
          {t("body.subtitle")}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>

      <div style={{ marginTop: 14, ...fadeUp(40) }}>
        <ChipRail
          items={railItems}
          value={active ?? "__all"}
          onChange={(k) => setActive(k === "__all" ? null : k)}
        />
      </div>

      {/* The figure. Organs light by level; a selection brings one forward. */}
      <Card
        style={{ marginTop: 12, padding: "6px 0 12px", overflow: "hidden" }}
        delay={80}
      >
        <BodyScene
          zones={summary.zones}
          activeZone={active}
          onPickZone={pickZone}
          height={340}
        />
        <div
          style={{
            ...T.micro,
            color: C.faintest,
            textAlign: "center",
            padding: "0 18px",
          }}
        >
          {summary.flagged.length === 0 && !active
            ? t("body.allInRange")
            : t("body.tapOrgan")}
          {" · "}
          {t("body.rotateHint")}
        </div>
      </Card>

      <Card style={{ padding: "16px 18px", marginTop: 12 }} delay={120}>
        <div style={{ ...T.micro, color: C.faint }}>{t("body.summary")}</div>
        <div style={{ ...T.title3, color: C.ink, marginTop: 6 }}>
          {summary.flagged.length === 0
            ? t("body.allClear", { n: summary.total })
            : t("body.someFlagged", {
                ok: summary.okConditions,
                total: summary.total,
                n: summary.flagged.length,
              })}
        </div>
        {summary.flagged.length > 0 && (
          <div
            style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}
          >
            {summary.flagged.map(({ zone, level }) => (
              <Pill
                key={zone.key}
                color={LEVEL_COLOR[level]}
                tint={LEVEL_TINT[level]}
              >
                {t(zone.nameKey)}
              </Pill>
            ))}
          </div>
        )}
      </Card>

      {shown.length > 0 && (
        <>
          <SectionTitle>
            {activeEntry ? t(activeEntry.zone.nameKey) : t("body.watch")}
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {shown.map(({ zone, values, level }) => (
              <ZonePanel
                key={zone.key}
                zone={zone}
                values={values}
                level={level}
                note={pick(session.bodyNote?.[zone.key], lang)}
                action={pick(session.bodyAction?.[zone.key], lang)}
                onSelect={() => pickZone(zone.key)}
                selected={active === zone.key}
              />
            ))}
          </div>
        </>
      )}

      <p
        style={{
          ...T.micro,
          color: C.faintest,
          margin: "14px 6px 0",
          lineHeight: 1.6,
          textWrap: "pretty",
        }}
      >
        {t("body.disclaimer")}
      </p>

      <div style={{ marginTop: 16 }}>
        <TrendChart
          title={pickMetric.marker.name}
          unit={pickMetric.marker.unit}
          series={series}
          labels={rounds.map((s) => t("round.n", { n: s.round }))}
          reference={pickMetric.marker.ref}
          referenceLabel={t("body.refUpper")}
          sel={sel}
          color={LEVEL_COLOR[markerLevel(pickMetric.marker, currentValue)]}
          options={BODY_METRICS.map((m) => ({
            key: `${m.zone}-${m.mi}`,
            label: m.marker.name,
          }))}
          selectedOption={metric}
          onPickOption={setMetric}
          formatValue={(v) => formatValue(v, pickMetric.marker.dp)}
          delay={0}
        />
      </div>
    </div>
  );
}

function ZonePanel({ zone, values, level, note, action, onSelect, selected }) {
  const t = useLang().t;
  const over = zone.markers
    .map((m, i) => ({ marker: m, value: values[i] }))
    .filter((p) => markerLevel(p.marker, p.value) > 0);

  return (
    <Card
      style={{
        overflow: "hidden",
        boxShadow: selected
          ? `0 0 0 1.5px ${LEVEL_COLOR[level]}44, ${CARD}`
          : CARD,
      }}
    >
      <Pressable
        as="button"
        type="button"
        onClick={onSelect}
        pressScale={0.99}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "16px 18px 12px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: LEVEL_COLOR[level],
              flex: "none",
            }}
          />
          <span style={{ ...T.title3, color: C.ink }}>{t(zone.nameKey)}</span>
          <span style={{ marginLeft: "auto" }}>
            <Pill color={LEVEL_COLOR[level]} tint={LEVEL_TINT[level]}>
              {t(BODY_STATUS_KEY[level])}
            </Pill>
          </span>
        </div>
        <div
          style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 10 }}
        >
          {zone.conditionKeys.map((k) => (
            <span
              key={k}
              style={{
                ...T.micro,
                color: C.muted,
                background: C.surfaceSunken,
                borderRadius: 999,
                padding: "3px 8px",
              }}
            >
              {t(k)}
            </span>
          ))}
        </div>
        {over.length > 0 && (
          <div
            style={{
              ...T.caption,
              color: C.body,
              marginTop: 10,
              textWrap: "pretty",
            }}
          >
            {t("body.outOfRange", {
              names: over.map((p) => p.marker.name).join(" · "),
            })}
          </div>
        )}
      </Pressable>

      <div style={{ padding: "0 18px 16px" }}>
        <p
          style={{
            ...T.caption,
            color: C.muted,
            margin: "2px 0 0",
            paddingTop: 12,
            boxShadow: DIVIDER_TOP,
            textWrap: "pretty",
          }}
        >
          {note || t(zone.noteKey)}
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
            marginTop: 16,
          }}
        >
          {zone.markers.map((m, i) => (
            <MarkerBar key={m.name} marker={m} value={values[i]} />
          ))}
        </div>

        {level > 0 && (
          <div
            style={{
              background: LEVEL_TINT[level],
              borderRadius: 14,
              padding: "12px 14px",
              marginTop: 16,
            }}
          >
            <div style={{ ...T.micro, color: LEVEL_COLOR[level] }}>
              {level === 2 ? t("body.consultNow") : t("body.watchNext")}
            </div>
            <p
              style={{
                ...T.caption,
                color: C.body,
                margin: "5px 0 0",
                textWrap: "pretty",
              }}
            >
              {action || ""}
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

function MarkerBar({ marker, value }) {
  const t = useLang().t;
  const level = markerLevel(marker, value);
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <span style={{ ...T.callout, color: C.ink }}>
          {marker.name}{" "}
          {marker.unit && (
            <span style={{ ...T.micro, color: C.faintest }}>{marker.unit}</span>
          )}
        </span>
        <span style={{ ...T.callout, ...T.mono, color: LEVEL_COLOR[level] }}>
          {formatValue(value, marker.dp)}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 6,
          borderRadius: 999,
          background: markerBand(marker),
          margin: "10px 0 5px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -4,
            left: markerLeft(value, marker.max),
            width: 4,
            height: 14,
            borderRadius: 999,
            background: C.ink,
            transform: "translateX(-2px)",
            boxShadow: "0 0 0 2px #fff",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -2,
            left: markerLeft(marker.ref, marker.max),
            width: 1.5,
            height: 10,
            background: "rgba(11,11,12,.45)",
          }}
        />
      </div>
      <div style={{ ...T.micro, color: C.faintest }}>
        {t("body.reference", { v: formatValue(marker.ref, marker.dp) })}
        {level > 0 ? ` · ${t("body.over")}` : ""}
      </div>
    </div>
  );
}
