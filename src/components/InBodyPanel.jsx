import { useState } from "react";
import { Card, SectionLabel, Status, Badge } from "./primitives";
import { Collapse, DisclosureButton } from "./Collapse";
import Pressable from "./Pressable";
import { C, EASE, LEVEL_COLOR, LEVEL_LAMP, R, T } from "../tokens";
import { formatValue } from "../data/body";
import {
  COMPOSITION,
  DEVICE,
  SEGMENTS,
  compositionAt,
  inbodyLinksFor,
  metricLevel,
} from "../data/inbody";
import { useT } from "../i18n";

/**
 * Imported body composition, and the places it changes how a blood value
 * should be read.
 *
 * The cross-reference block is the reason this is here at all. Composition on
 * its own is a bathroom scale with opinions; paired with the same person's
 * blood, over the same rounds, it resolves readings that either panel alone
 * would get wrong.
 */
export default function InBodyPanel({ roundIndex, delay = 0, show = "all" }) {
  const t = useT();
  const [openSegments, setOpenSegments] = useState(false);
  const metrics = compositionAt(roundIndex);
  const links = inbodyLinksFor(roundIndex);
  const prev = roundIndex > 0 ? roundIndex - 1 : null;

  return (
    <>
      {show !== "links" && (
      <Card style={{ padding: "16px 18px" }} delay={delay}>
        <SectionLabel value={`${DEVICE.brand} ${DEVICE.model}`}>
          {t("ib.title")}
        </SectionLabel>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 10,
          }}
        >
          <Status color={DEVICE.connected ? C.optimalLamp : C.faintest}>
            {DEVICE.connected ? t("ib.connected") : t("ib.notConnected")}
          </Status>
          <span style={{ marginLeft: "auto" }}>
            <Pressable
              as="button"
              type="button"
              pressScale={0.96}
              style={{
                ...T.micro,
                background: C.surfaceSunken,
                color: C.body,
                border: "none",
                borderRadius: R.control,
                padding: "5px 9px",
                cursor: "pointer",
              }}
            >
              {t("ib.resync")}
            </Pressable>
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "13px 14px",
            marginTop: 15,
          }}
        >
          {metrics.map((m) => {
            const level = metricLevel(m, m.value);
            const before = prev !== null ? m.demo[prev] : null;
            const delta = before !== null ? m.value - before : null;
            return (
              <div key={m.key}>
                <div style={{ ...T.micro, color: C.faintest }}>
                  {t(m.nameKey)}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "baseline",
                    gap: 5,
                    marginTop: 4,
                  }}
                >
                  <span
                    style={{
                      ...T.num,
                      fontSize: 17,
                      fontWeight: 600,
                      // A metric with no target band has no verdict to give.
                      // Painting weight green because it is "level 0" would
                      // claim the loss below was a good thing.
                      color: m.band ? LEVEL_COLOR[level] : C.ink,
                    }}
                  >
                    {formatValue(m.value, m.dp)}
                  </span>
                  <span style={{ ...T.unit, color: C.faintest }}>{m.unit}</span>
                  {delta !== null &&
                    Math.abs(delta) >= Math.pow(10, -m.dp) / 2 && (
                      <span
                        style={{
                          marginLeft: "auto",
                          ...T.unit,
                          color: C.faint,
                        }}
                      >
                        {delta > 0 ? "+" : "−"}
                        {formatValue(Math.abs(delta), m.dp)}
                      </span>
                    )}
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 15 }}>
          <DisclosureButton
            open={openSegments}
            onClick={() => setOpenSegments((v) => !v)}
            label={t("ib.segmental")}
            hint={t("ib.ofExpected")}
          />
          <Collapse open={openSegments}>
            <div
              style={{
                padding: "12px 2px 2px",
                display: "flex",
                flexDirection: "column",
                gap: 9,
              }}
            >
              {SEGMENTS.map((seg) => {
                const v = seg.demo[roundIndex];
                return (
                  <div
                    key={seg.key}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <span
                      style={{
                        ...T.caption,
                        color: C.body,
                        width: 74,
                        flex: "none",
                      }}
                    >
                      {t(seg.nameKey)}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        height: 5,
                        borderRadius: 2.5,
                        background: C.surfaceSunken,
                        position: "relative",
                      }}
                    >
                      {/* 100% is the expected value for this body, not a maximum. */}
                      <span
                        style={{
                          position: "absolute",
                          inset: "0 auto 0 0",
                          width: `${Math.min(100, (v / 120) * 100)}%`,
                          background: v >= 95 ? C.optimalLamp : C.watchLamp,
                          borderRadius: 2.5,
                          transition: `width 520ms ${EASE}`,
                        }}
                      />
                      <span
                        style={{
                          position: "absolute",
                          left: `${(100 / 120) * 100}%`,
                          top: -2,
                          width: 1,
                          height: 9,
                          background: "rgba(23,24,26,.4)",
                        }}
                      />
                    </span>
                    <span
                      style={{
                        ...T.num,
                        fontSize: 12,
                        color: C.ink,
                        width: 34,
                        textAlign: "right",
                      }}
                    >
                      {v}%
                    </span>
                  </div>
                );
              })}
            </div>
          </Collapse>
        </div>
      </Card>
      )}

      {show !== "panel" && links.length > 0 && (
        <div
          style={{
            marginTop: 10,
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              gap: 7,
              margin: "4px 2px 0",
            }}
          >
            <Badge color={C.accent} tint={C.accentSoft}>
              {t("ib.crossRead")}
            </Badge>
            <span
              style={{
                ...T.caption,
                color: C.faintest,
                flex: 1,
                lineHeight: 1.6,
                textWrap: "pretty",
              }}
            >
              {t("ib.crossReadNote")}
            </span>
          </div>
          {links.map((link) => (
            <LinkCard key={link.key} link={link} />
          ))}
        </div>
      )}
    </>
  );
}

function LinkCard({ link }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  return (
    <Card style={{ padding: "14px 16px 12px" }}>
      <div style={{ ...T.title3, color: C.ink }}>{t(link.titleKey)}</div>
      <p
        style={{
          ...T.bodyText,
          color: C.body,
          margin: "8px 0 0",
          textWrap: "pretty",
        }}
      >
        {t(link.bodyKey)}
      </p>
      <div style={{ marginTop: 11 }}>
        <DisclosureButton
          open={open}
          onClick={() => setOpen((v) => !v)}
          label={t("ix.evidence")}
          hint={`${link.blood.length + link.composition.length}`}
        />
        <Collapse open={open}>
          <div style={{ padding: "11px 2px 2px" }}>
            {link.composition.map(({ metric, value }) => (
              <Row
                key={metric.key}
                name={t(metric.nameKey)}
                value={formatValue(value, metric.dp)}
                unit={metric.unit}
                tag={t("ib.fromDevice")}
              />
            ))}
            {link.blood.map(({ marker, value }) => (
              <Row
                key={marker.name}
                name={marker.name}
                value={formatValue(value, marker.dp)}
                unit={marker.unit}
                tag={t("ib.fromBlood")}
              />
            ))}
          </div>
        </Collapse>
      </div>
    </Card>
  );
}

function Row({ name, value, unit, tag }) {
  return (
    <div
      style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 6 }}
    >
      <span style={{ ...T.caption, color: C.ink }}>{name}</span>
      <span style={{ ...T.micro, color: C.faintest }}>{tag}</span>
      <span
        style={{ marginLeft: "auto", ...T.num, fontSize: 12, color: C.body }}
      >
        {value}
      </span>
      <span
        style={{ ...T.unit, color: C.faintest, width: 46, textAlign: "right" }}
      >
        {unit}
      </span>
    </div>
  );
}
