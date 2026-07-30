import Pressable from "./Pressable";
import { C, CARD, R, SURFACE, T, backlight, tint } from "../tokens";
import { SESSIONS } from "../data/sessions";
import { useT } from "../i18n";

/** Round picker, shared by mind and body so the selection carries across tabs. */
export default function SessionChips({ sel, onPick }) {
  const t = useT();
  return (
    // Six rounds will not fit as equal columns, and squeezing them turns the
    // labels into abbreviations nobody can read. A rail scrolls instead.
    <div
      style={{
        display: "flex",
        gap: 6,
        marginTop: 13,
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "1px 18px",
        margin: "13px -18px 0",
      }}
    >
      {SESSIONS.map((s, i) => {
        const on = sel === i;
        return (
          <Pressable
            key={s.round}
            as="button"
            type="button"
            aria-pressed={on}
            onClick={() => onPick(i)}
            pressScale={0.96}
            style={{
              flex: "none",
              minWidth: 62,
              padding: "8px 10px",
              borderRadius: R.control,
              cursor: "pointer",
              background: on
                ? `linear-gradient(180deg, ${tint("#ffffff", 0.16)} 0%, transparent 58%), ${C.accent}`
                : SURFACE,
              color: on ? C.onAccent : C.muted,
              boxShadow: on
                ? `inset 0 1px 0 rgba(255,255,255,.22), ${backlight(C.accent, 0.9)}`
                : CARD,
              border: "none",
            }}
          >
            <div style={{ ...T.monoSm, fontWeight: 500 }}>
              {t("round.n", { n: s.round })}
            </div>
            <div style={{ ...T.micro, opacity: 0.62, marginTop: 2 }}>
              {s.date}
            </div>
          </Pressable>
        );
      })}
    </div>
  );
}
