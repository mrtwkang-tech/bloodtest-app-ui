import { useCallback, useMemo, useState } from "react";
import { Collapse, DisclosureButton } from "../components/Collapse";
import BodyScene from "../three/BodyScene";
import Icon from "../components/Icon";
import Clamp from "../components/Clamp";
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
  deviationOf,
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
import { plainKeyOf } from "../data/plainNames";
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
        icon: zone.icon,
        level,
      })),
    ],
    [summary.zones, t],
  );

  const activeEntry = summary.zones.find((z) => z.zone.key === active);
  const shown = activeEntry ? [activeEntry] : summary.flagged;

  const pickMetric = BODY_METRICS[metric];
  // The trend chart picker listed assay names too — the same wall, in a control.
  const plainName = (mk) => {
    const k = plainKeyOf(mk);
    return k ? t(k) : mk.name;
  };
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
        variant="group"
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

      <Card pad="md" delay={120}>
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
            <Status key={zone.key} icon={zone.icon} level={level}>
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
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
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
        title={plainName(pickMetric.marker)}
        unit={pickMetric.marker.unit}
        series={series}
        labels={rounds.map((s) => t("round.n", { n: s.round }))}
        reference={pickMetric.marker.ref}
        referenceLabel={t(
          pickMetric.marker.dir === "low" ? "body.refLower" : "body.refUpper",
        )}
        sel={sel}
        color={LEVEL_COLOR[markerLevel(pickMetric.marker, currentValue)]}
        options={BODY_METRICS.map((m) => ({
          key: `${m.zone}-${m.mi}`,
          label: plainName(m.marker),
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
    .filter((p) => markerLevel(p.marker, p.value) > 0)
    // Worst first. Four out-of-range markers listed in panel order said nothing
    // about which one to care about.
    .sort(
      (a, b) =>
        deviationOf(b.marker, b.value).ratio - deviationOf(a.marker, a.value).ratio,
    );

  return (
    <Card
      variant="group"
      style={{
        overflow: "hidden",
        padding: 0,
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Icon name={zone.icon} level={level} size={28} />
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
        {/* The specialty is the actionable part: it names the clinic. It used
            to carry a tracked "SPECIALTY" label and a separate "N MARKERS"
            counter — three typographic voices for one line of fact. */}
        <div style={{ ...T.caption, color: C.body, marginTop: 8 }}>
          {t(zone.specialtyKey)}
        </div>
        <div style={{ ...T.caption, color: C.faint, marginTop: 4 }}>
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
              names: over
                .map((p) => {
                  const k = plainKeyOf(p.marker);
                  const name = k ? t(k) : p.marker.name;
                  return `${name} ${deviationOf(p.marker, p.value).pct}%`;
                })
                .join(" · "),
            })}
          </div>
        )}
      </Pressable>

      <div style={{ padding: "0 17px 15px" }}>
        {/* What the panel is for, then what this reader's result means. The
            two used to be introduced by tracked headings; they are a general
            sentence and a personal one, and they already read that way. The
            second heading also rendered over nothing whenever a zone had no
            note of its own. */}
        <div
          style={{ paddingTop: 12, boxShadow: `inset 0 1px 0 ${C.hairline}` }}
        >
          <Clamp lines={2}>{t(zone.noteKey)}</Clamp>
        </div>

        {(note || over.length === 0) && (
          <Clamp lines={2} tone={C.ink} style={{ marginTop: 10 }}>
            {note || t("body.clearAll")}
          </Clamp>
        )}

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

/**
 * One biomarker, read as distance from its limit rather than as a raw value.
 *
 * "33.2 μmol/mmol" asks the reader to know that the limit is 30 and to do the
 * subtraction, and it cannot be compared to the "178 10³/μL" two rows down. A
 * proportion of the limit is unitless, so every marker in the panel is suddenly
 * on one scale — which is the whole reason this is the headline number now and
 * the assay value sits underneath with the name.
 *
 * The copy deliberately never says "높음" or "낮음". For a `dir: "low"` marker
 * the reference is a floor, so eGFR at 98.7 against a limit of 90 is 9% of
 * headroom while being numerically higher. Safe-side versus past-the-limit is
 * the only framing that survives both directions.
 */
function MarkerBar({ marker, value }) {
  const t = useLang().t;
  const level = markerLevel(marker, value);
  const plain = plainKeyOf(marker);
  const dev = deviationOf(marker, value);
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
        <span style={{ minWidth: 0 }}>
          <span style={{ ...T.label, color: C.ink, display: "block" }}>
            {plain ? t(plain) : marker.name}
          </span>
          <span
            style={{
              ...T.micro,
              color: C.faintest,
              display: "block",
              marginTop: 2,
            }}
          >
            {plain ? `${marker.name} · ` : ""}
            {formatValue(value, marker.dp)}
            {marker.unit ? ` ${marker.unit}` : ""}
          </span>
        </span>
        <span
          style={{
            ...T.label,
            fontWeight: 600,
            color: LEVEL_COLOR[level],
            flex: "none",
            textAlign: "right",
          }}
        >
          {dev.pct === 0
            ? t("body.dev.at")
            : t(dev.over ? "body.dev.over" : "body.dev.under", {
                pct: dev.pct,
              })}
        </span>
      </div>
      {/* Same grammar as the mind scale: the band, where the limit is, and
          where you are. The separate reference tick sat one pixel from the
          colour change it was already marking. */}
      <div
        style={{
          position: "relative",
          height: 5,
          borderRadius: 2,
          background: markerBand(marker),
          margin: "9px 0 5px",
        }}
      >
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
            boxShadow: `0 0 0 2px ${C.bg}`,
          }}
        />
      </div>
      <div style={{ ...T.caption, color: C.faintest }}>
        {t(marker.dir === "low" ? "body.referenceMin" : "body.reference", {
          v: formatValue(marker.ref, marker.dp),
        })}
      </div>
    </div>
  );
}
