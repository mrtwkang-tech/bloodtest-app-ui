import Pressable from "../components/Pressable";
import StatusBar from "../components/StatusBar";
import { C, EASE, T } from "../tokens";
import { useT } from "../i18n";

const CORNER = 44;
const corner = (v, h) => ({
  position: "absolute",
  [v]: 0,
  [h]: 0,
  width: CORNER,
  height: CORNER,
  [`border${v === "top" ? "Top" : "Bottom"}`]: `3px solid ${C.optimal}`,
  [`border${h === "left" ? "Left" : "Right"}`]: `3px solid ${C.optimal}`,
  borderRadius:
    v === "top"
      ? h === "left"
        ? "26px 0 0 0"
        : "0 26px 0 0"
      : h === "left"
        ? "0 0 0 26px"
        : "0 0 26px 0",
});

export default function ScanFlow({ onClose, onRecognized }) {
  const t = useT();
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        background: C.scanBg,
        animation: `fadeUp 300ms ${EASE} both`,
        zIndex: 20,
      }}
    >
      <StatusBar dark />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "6px 20px 0",
          flex: "none",
        }}
      >
        <Pressable
          as="button"
          type="button"
          onClick={onClose}
          aria-label={t("common.close")}
          pressScale={0.88}
          style={{
            fontSize: 20,
            color: "#fff",
            cursor: "pointer",
            lineHeight: 1,
            background: "none",
            border: "none",
            padding: 6,
          }}
        >
          ✕
        </Pressable>
        <span style={{ ...T.title3, color: "#fff" }}>{t("scan.title")}</span>
        <span style={{ ...T.micro, color: "rgba(255,255,255,.5)", padding: 6 }}>
          {t("scan.help")}
        </span>
      </div>

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 30px",
        }}
      >
        <div
          style={{
            position: "relative",
            width: 224,
            height: 224,
            borderRadius: 26,
            background: "rgba(255,255,255,.05)",
            overflow: "hidden",
          }}
        >
          <div style={corner("top", "left")} />
          <div style={corner("top", "right")} />
          <div style={corner("bottom", "left")} />
          <div style={corner("bottom", "right")} />
          <div
            style={{
              position: "absolute",
              left: "8%",
              right: "8%",
              top: 0,
              height: 2,
              background: `linear-gradient(90deg,transparent,${C.optimal},transparent)`,
              animation: "scanline 2.6s cubic-bezier(.77,0,.175,1) infinite",
            }}
          />
        </div>

        <div
          style={{
            ...T.bodyText,
            color: "rgba(255,255,255,.72)",
            textAlign: "center",
            marginTop: 26,
            textWrap: "pretty",
            maxWidth: 250,
          }}
        >
          {t("scan.instruction")}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginTop: 14,
            ...T.micro,
            color: C.optimal,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: C.optimal,
              animation: "breathe 1.6s ease-in-out infinite",
            }}
          />
          {t("scan.waiting")}
        </div>
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
          onClick={onRecognized}
          pressScale={0.97}
          style={{
            background: C.optimal,
            color: "#04160D",
            borderRadius: 14,
            padding: 16,
            textAlign: "center",
            ...T.title3,
            cursor: "pointer",
            boxShadow: "0 10px 24px -12px rgba(76,122,51,.7)",
            border: "none",
            width: "100%",
          }}
        >
          {t("scan.recognized")}
        </Pressable>
        <div
          style={{
            ...T.micro,
            color: "rgba(255,255,255,.4)",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          {t("scan.demoNote")}
        </div>
      </div>
    </div>
  );
}
