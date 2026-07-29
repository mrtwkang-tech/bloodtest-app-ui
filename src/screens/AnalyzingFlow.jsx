import Pressable from "../components/Pressable";
import StatusBar from "../components/StatusBar";
import { Card } from "../components/primitives";
import { C, DIVIDER, EASE, T } from "../tokens";
import { useT } from "../i18n";

export default function AnalyzingFlow({ onBackground }) {
  const t = useT();
  const steps = [
    { key: "analyzing.step1", state: "done", noteKey: "analyzing.justNow" },
    { key: "analyzing.step2", state: "active", noteKey: "analyzing.running" },
    { key: "analyzing.step3", state: "todo", noteKey: "analyzing.waiting" },
  ];

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: C.bg,
        animation: `fadeUp 300ms ${EASE} both`,
        zIndex: 20,
      }}
    >
      <StatusBar />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 26px",
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            animation: "spin 900ms linear infinite",
          }}
        >
          <svg width="72" height="72" viewBox="0 0 76 76">
            <circle
              cx="38"
              cy="38"
              r="30"
              fill="none"
              stroke={C.hairline}
              strokeWidth="6"
            />
            <circle
              cx="38"
              cy="38"
              r="30"
              fill="none"
              stroke={C.accent}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="52 137"
              transform="rotate(-90 38 38)"
            />
          </svg>
        </div>

        <div style={{ ...T.title1, color: C.ink, marginTop: 26 }}>
          {t("analyzing.title")}
        </div>
        <p
          style={{
            ...T.body,
            color: C.muted,
            textAlign: "center",
            margin: "8px 0 0",
            textWrap: "pretty",
            maxWidth: 260,
          }}
        >
          {t("analyzing.body")}
        </p>

        <Card style={{ width: "100%", padding: "6px 4px", marginTop: 26 }}>
          {steps.map((s, i) => (
            <div
              key={s.key}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 11,
                padding: "12px 16px",
                boxShadow: i < steps.length - 1 ? DIVIDER : "none",
              }}
            >
              <span
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flex: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fff",
                  background: s.state === "done" ? C.optimal : "transparent",
                  boxShadow:
                    s.state === "done"
                      ? "none"
                      : s.state === "active"
                        ? `inset 0 0 0 2.5px ${C.accent}`
                        : `inset 0 0 0 2.5px ${C.hairlineStrong}`,
                  animation:
                    s.state === "active"
                      ? "breathe 1.6s ease-in-out infinite"
                      : "none",
                }}
              >
                {s.state === "done" ? "✓" : ""}
              </span>
              <span
                style={{
                  flex: 1,
                  ...T.callout,
                  color: s.state === "todo" ? C.faintest : C.ink,
                  fontWeight: s.state === "active" ? 700 : 600,
                }}
              >
                {t(s.key)}
              </span>
              <span
                style={{
                  ...T.micro,
                  color: s.state === "active" ? C.ink : C.faintest,
                }}
              >
                {t(s.noteKey)}
              </span>
            </div>
          ))}
        </Card>
      </div>

      <div
        style={{
          flex: "none",
          padding: "0 22px calc(30px + var(--safe-bottom))",
        }}
      >
        <Pressable
          as="button"
          type="button"
          onClick={onBackground}
          pressScale={0.97}
          style={{
            width: "100%",
            borderRadius: 16,
            padding: 15,
            textAlign: "center",
            ...T.callout,
            color: C.body,
            cursor: "pointer",
            background: "transparent",
            border: "none",
            boxShadow: `0 0 0 1px ${C.hairlineStrong}`,
          }}
        >
          {t("analyzing.background")}
        </Pressable>
      </div>
    </div>
  );
}
