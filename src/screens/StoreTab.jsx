import Pressable from "../components/Pressable";
import { Card, Pill, SectionTitle } from "../components/primitives";
import { C, DIVIDER, T, fadeUp } from "../tokens";
import { PLANS } from "../data/sessions";
import { useT } from "../i18n";

const PLAN_KEYS = ["single", "quarter", "half"];
const INCLUDED_KEYS = [
  "store.incl1",
  "store.incl2",
  "store.incl3",
  "store.incl4",
  "store.incl5",
];

export default function StoreTab({ plan, onPickPlan }) {
  const t = useT();
  return (
    <div>
      <Card style={{ overflow: "hidden" }} delay={0}>
        <div
          style={{
            height: 140,
            background: C.surfaceSunken,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "rgba(11,11,12,.08)",
            }}
          />
          <div style={{ ...T.micro, color: C.faint }}>{t("store.kit")}</div>
        </div>
        <div style={{ padding: "16px 18px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              justifyContent: "space-between",
            }}
          >
            <div style={{ ...T.title3, color: C.ink }}>{t("store.kit")}</div>
            <span style={{ ...T.micro, color: C.optimal }}>
              {t("store.inStock")}
            </span>
          </div>
          <p
            style={{
              ...T.caption,
              color: C.muted,
              margin: "7px 0 0",
              textWrap: "pretty",
            }}
          >
            {t("store.kitDesc")}
          </p>
        </div>
      </Card>

      <SectionTitle>{t("store.choosePlan")}</SectionTitle>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          ...fadeUp(40),
        }}
      >
        {PLAN_KEYS.map((key) => {
          const p = PLANS[key];
          const on = plan === key;
          return (
            <Pressable
              key={key}
              as="button"
              type="button"
              aria-pressed={on}
              onClick={() => onPickPlan(key)}
              pressScale={0.985}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 13,
                width: "100%",
                textAlign: "left",
                background: C.surface,
                borderRadius: 18,
                padding: "15px 17px",
                border: "none",
                cursor: "pointer",
                boxShadow: on
                  ? `inset 0 0 0 1.5px ${C.accent}, 0 1px 2px rgba(11,11,12,.04)`
                  : "0 0 0 1px rgba(11,11,12,.06), 0 1px 2px rgba(11,11,12,.04)",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flex: "none",
                  boxShadow: on
                    ? `inset 0 0 0 5.5px ${C.accent}`
                    : "inset 0 0 0 1.6px rgba(11,11,12,.2)",
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ ...T.callout, color: C.ink }}>
                    {t(p.labelKey)}
                  </span>
                  {p.badge && (
                    <Pill color={C.optimal} tint={C.optimalTint}>
                      {t("store.recommended")}
                    </Pill>
                  )}
                </span>
                <span
                  style={{
                    ...T.micro,
                    color: C.faint,
                    display: "block",
                    marginTop: 2,
                  }}
                >
                  {t(p.noteKey)}
                </span>
              </span>
              <span style={{ textAlign: "right", flex: "none" }}>
                <span
                  style={{
                    ...T.title3,
                    ...T.mono,
                    color: C.ink,
                    display: "block",
                  }}
                >
                  ₩{p.price.toLocaleString()}
                </span>
                {key !== "single" && (
                  <span style={{ ...T.micro, color: C.faintest }}>
                    {t("store.perTest")}
                  </span>
                )}
              </span>
            </Pressable>
          );
        })}
      </div>

      <SectionTitle>{t("store.included")}</SectionTitle>
      <Card style={{ overflow: "hidden" }} delay={80}>
        {INCLUDED_KEYS.map((k, i) => (
          <div
            key={k}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "13px 16px",
              boxShadow: i < INCLUDED_KEYS.length - 1 ? DIVIDER : "none",
            }}
          >
            <span
              style={{
                width: 17,
                height: 17,
                borderRadius: "50%",
                background: C.optimalTint,
                color: C.optimal,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 9,
                fontWeight: 700,
                flex: "none",
              }}
            >
              ✓
            </span>
            <span style={{ ...T.caption, color: C.body }}>{t(k)}</span>
          </div>
        ))}
      </Card>

      <Pressable
        as="button"
        type="button"
        pressScale={0.98}
        style={{
          display: "block",
          width: "100%",
          background: C.accent,
          color: C.onAccent,
          borderRadius: 16,
          padding: 17,
          textAlign: "center",
          border: "none",
          cursor: "pointer",
          marginTop: 16,
          ...T.title3,
        }}
      >
        {t(PLANS[plan].ctaKey)}
      </Pressable>
    </div>
  );
}
