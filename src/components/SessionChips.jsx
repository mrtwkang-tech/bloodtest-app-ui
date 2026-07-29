import Pressable from "./Pressable";
import { C, CARD, T } from "../tokens";
import { SESSIONS } from "../data/sessions";
import { useT } from "../i18n";

/** Round picker, shared by mind and body so the selection carries across tabs. */
export default function SessionChips({ sel, onPick }) {
  const t = useT();
  return (
    <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
      {SESSIONS.map((s, i) => {
        const on = sel === i;
        return (
          <Pressable
            key={s.round}
            as="button"
            type="button"
            aria-pressed={on}
            onClick={() => onPick(i)}
            pressScale={0.95}
            style={{
              flex: 1,
              padding: "9px 4px",
              borderRadius: 14,
              cursor: "pointer",
              background: on ? C.accent : C.surface,
              color: on ? C.onAccent : C.muted,
              boxShadow: on ? "none" : CARD,
              border: "none",
            }}
          >
            <div style={{ ...T.callout }}>{t("round.n", { n: s.round })}</div>
            <div style={{ ...T.micro, opacity: 0.62, marginTop: 1 }}>
              {s.date}
            </div>
          </Pressable>
        );
      })}
    </div>
  );
}
