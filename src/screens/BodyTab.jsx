import { useCallback, useMemo, useState } from "react";
import { Collapse, DisclosureButton } from "../components/Collapse";
import BodyScene from "../three/BodyScene";
import Pressable from "../components/Pressable";
import SessionChips from "../components/SessionChips";
import TrendChart from "../components/TrendChart";
import {
  Card,
  ChipRail,
  SectionLabel,
  SectionTitle,
  Status,
} from "../components/primitives";
import {
  C,
  CARD,
  LEVEL_COLOR,
  LEVEL_LAMP,
  LEVEL_TINT,
  R,
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
 * about. The chip rail, a tap on the mesh, and a tap on a card all drive the
 * same piece of state, so the model and the list can never disagree.
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
        dot: LEVEL_LAMP[level],
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
        <div style={{ ...T.caption, color: C.faint, marginTop: 5 }}>
          {t("body.subtitle")}
        </div>
        <SessionChips sel={sel} onPick={onPickSession} />
      </header>

      <div style={{ marginTop: 13, ...fadeUp(40) }}>
        <ChipRail
          items={railItems}
          value={active ?? "__all"}
          onChange={(k) => setActive(k === "__all" ? null : k)}
        />
      </div>

      <Card
        style={{ marginTop: 10, padding: "4px 0 11px", overflow: "hidden" }}
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
            ...T.caption,
            color: C.faintest,
            textAlign: "center",
            padding: "0 18px",
          }}
        >
          {summary.flagged.length === 0 && !active
            ? t("body.allInRange")
            : t("body.tapOrgan")}
        </div>
      </Card>

      <Card style={{ padding: "16px 18px", marginTop: 10 }} delay={120}>
        <SectionLabel value={`${summary.okConditions}/${summary.total}`}>
          {t("body.summary")}
        </SectionLabel>
        <div style={{ ...T.title3, color: C.ink, marginTop: 9 }}>
          {summary.flagged.length === 0
            ? t("body.allClear", { n: summary.total })
            : t("body.someFlagged", {
                ok: summary.okConditions,
                total: summary.total,
                n: summary.flagged.length,
              })}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "9px 12px",
            marginTop: 13,
          }}
        >
          {summary.zones.map(({ zone, level }) => (
            <Status key={zone.key} color={LEVEL_COLOR[level]}>
              {t(zone.nameKey)}
            </Status>
          ))}
        </div>
      </Card>

      {shown.length > 0 && (
        <>
          <SectionTitle
            value={shown.length > 1 ? String(shown.length) : undefined}
          >
            {activeEntry ? t(activeEntry.zone.nameKey) : t("body.watch")}
          </SectionTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
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
          ...T.caption,
          color: C.faintest,
          margin: "13px 4px 0",
          textWrap: "pretty",
        }}
      >
        {t("body.disclaimer")}
      </p>

      <SectionTitle>{t("mind.trendLabel")}</SectionTitle>
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
      />
    </div>
  );
}

function ZonePanel({ zone, values, level, note, action, onSelect, selected }) {
  const t = useLang().t;
  const [showAll, setShowAll] = useState(false);
  const over = zone.markers
    .map((m, i) => ({ marker: m, value: values[i] }))
    .filter((p) => markerLevel(p.marker, p.value) > 0);

  return (
    <Card
      style={{
        overflow: "hidden",
        boxShadow: selected
          ? `inset 0 0 0 1.5px ${LEVEL_COLOR[level]}55`
          : CARD,
      }}
    >
      <Pressable
        as="button"
        type="button"
        onClick={onSelect}
        pressScale={0.995}
        style={{
          display: "block",
          width: "100%",
          textAlign: "left",
          padding: "15px 17px 11px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: LEVEL_COLOR[level],
              flex: "none",
            }}
          />
          <span style={{ ...T.title3, color: C.ink }}>{t(zone.nameKey)}</span>
          <span
            style={{
              marginLeft: "auto",
              ...T.micro,
              color: LEVEL_COLOR[level],
            }}
          >
            {t(BODY_STATUS_KEY[level])}
          </span>
        </div>
        {/* The specialty is the actionable part: it names the clinic. */}
        <div
          style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 9 }}
        >
          <span style={{ ...T.micro, color: C.faintest }}>
            {t("body.specialty")}
          </span>
          <span style={{ ...T.caption, color: C.body }}>
            {t(zone.specialtyKey)}
          </span>
          <span style={{ marginLeft: "auto", ...T.micro, color: C.faintest }}>
            {t("body.markerCount", { n: zone.markers.length })}
          </span>
        </div>
        <div style={{ ...T.caption, color: C.faint, marginTop: 6 }}>
          {zone.conditionKeys.map((k) => t(k)).join(" · ")}
        </div>
        {over.length > 0 && (
          <div
            style={{
              ...T.caption,
              color: C.body,
              marginTop: 7,
              textWrap: "pretty",
            }}
          >
            {t("body.outOfRange", {
              names: over.map((p) => p.marker.name).join(" · "),
            })}
          </div>
        )}
      </Pressable>

      <div style={{ padding: "0 17px 15px" }}>
        {/* What the panel is for, then what this reader's result means. */}
        <div style={{ paddingTop: 12, boxShadow: `inset 0 1px 0 ${C.hairline}` }}>
          <div style={{ ...T.micro, color: C.faintest }}>
            {t("body.whatThisIs")}
          </div>
          <p
            style={{
              ...T.bodyText,
              color: C.body,
              margin: "5px 0 0",
              textWrap: "pretty",
            }}
          >
            {t(zone.noteKey)}
          </p>
        </div>

        <div style={{ marginTop: 14 }}>
          <div style={{ ...T.micro, color: C.faintest }}>
            {t("body.whatItMeans")}
          </div>
          <p
            style={{
              ...T.bodyText,
              color: C.ink,
              margin: "5px 0 0",
              textWrap: "pretty",
            }}
          >
            {note || (over.length === 0 ? t("body.clearAll") : "")}
          </p>
        </div>

        {level > 0 && action && (
          <div
            style={{
              background: LEVEL_TINT[level],
              borderRadius: R.inner,
              padding: "11px 13px",
              marginTop: 13,
            }}
          >
            <div style={{ ...T.micro, color: LEVEL_COLOR[level] }}>
              {level === 2 ? t("body.consultNow") : t("body.watchNext")}
            </div>
            <p
              style={{
                ...T.caption,
                color: C.body,
                margin: "6px 0 0",
                textWrap: "pretty",
              }}
            >
              {action}
            </p>
          </div>
        )}

        {/* Out-of-range markers stay visible; the rest fold away. */}
        {over.length > 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 13,
              marginTop: 15,
            }}
          >
            {over.map(({ marker, value }) => (
              <MarkerBar key={marker.name} marker={marker} value={value} />
            ))}
          </div>
        )}

        <div style={{ marginTop: 13 }}>
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
                gap: 13,
                padding: "13px 2px 2px",
              }}
            >
              {zone.markers.map((m, i) => (
                <MarkerBar key={m.name} marker={m} value={values[i]} />
              ))}
            </div>
          </Collapse>
        </div>
      </div>
    </Card>
  );
}

/** One biomarker against its reference range, on the same axis grammar. */
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
          gap: 10,
        }}
      >
        <span style={{ ...T.label, color: C.ink }}>{marker.name}</span>
        <span>
          <span
            style={{
              ...T.num,
              fontSize: 13.5,
              fontWeight: 600,
              color: LEVEL_COLOR[level],
            }}
          >
            {formatValue(value, marker.dp)}
          </span>
          {marker.unit && (
            <span style={{ ...T.unit, color: C.faintest, marginLeft: 4 }}>
              {marker.unit}
            </span>
          )}
        </span>
      </div>
      <div
        style={{
          position: "relative",
          height: 5,
          borderRadius: 2,
          background: markerBand(marker),
          margin: "10px 0 4px",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: -1,
            left: markerLeft(marker.ref, marker.max),
            width: 1,
            height: 7,
            background: "rgba(23,24,26,.45)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: -3.5,
            left: markerLeft(value, marker.max),
            width: 3,
            height: 12,
            marginLeft: -1.5,
            borderRadius: 1.5,
            background: C.ink,
            boxShadow: `0 0 0 2px ${C.surface}`,
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
