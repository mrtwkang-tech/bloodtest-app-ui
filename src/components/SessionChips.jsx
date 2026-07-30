import Pressable from "./Pressable";
import { C, DIVIDER, EASE, R, T } from "../tokens";
import { SESSIONS } from "../data/sessions";
import { useT } from "../i18n";

/**
 * Round picker, shared by mind, body and signals so the selection carries
 * across tabs.
 *
 * It used to be a scrolling rail of six 62px chips — a horizontally-scrolling
 * strip inside a vertically-scrolling page, which is a gesture conflict for
 * something you use to step one round at a time. It is also the same six
 * buttons on three screens, taking a card's worth of height on each.
 *
 * A thin bar instead: the round you are on, and an arrow in each direction.
 * Stepping is the actual behaviour — you compare this round to the one before —
 * and jumping to round 2 of 6 is rare enough to be worth a tap on the dots.
 */
export default function SessionChips({ sel, onPick }) {
  const t = useT();
  const s = SESSIONS[sel];
  // SESSIONS run newest-first, so "previous round" is a HIGHER index.
  const older = sel + 1 < SESSIONS.length ? sel + 1 : null;
  const newer = sel > 0 ? sel - 1 : null;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        margin: "12px 0 0",
        paddingBottom: 9,
        boxShadow: DIVIDER,
      }}
    >
      {/* The arrows flank the label rather than the bar. Pinned to the edges
          they read as "page back / page forward" for the whole screen; against
          the label it is obvious they step the round. */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 2,
          flex: 1,
          minWidth: 0,
        }}
      >
        <Step
          dir="prev"
          label={t("round.older")}
          onClick={older != null ? () => onPick(older) : null}
        />
        <span style={{ ...T.label, color: C.ink, whiteSpace: "nowrap" }}>
          {t("round.n", { n: s.round })}
        </span>
        <span
          style={{
            ...T.caption,
            color: C.faintest,
            marginLeft: 6,
            whiteSpace: "nowrap",
          }}
        >
          {s.date}
        </span>
        <Step
          dir="next"
          label={t("round.newer")}
          onClick={newer != null ? () => onPick(newer) : null}
        />
      </div>

      {/* Direct access, at the size the feature deserves: six dots. Position in
          the series is worth showing — it is the thing the arrows cannot say. */}
      <div style={{ display: "flex", gap: 4, flex: "none" }}>
        {SESSIONS.map((r, i) => (
          <Pressable
            key={r.round}
            as="button"
            type="button"
            aria-label={t("round.n", { n: r.round })}
            aria-current={i === sel ? "true" : undefined}
            onClick={() => onPick(i)}
            pressScale={0.9}
            style={{
              width: 14,
              height: 22,
              padding: 0,
              border: "none",
              background: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span
              style={{
                width: i === sel ? 7 : 5,
                height: i === sel ? 7 : 5,
                borderRadius: "50%",
                background: i === sel ? C.ink : C.hairlineStrong,
                transition: `all 220ms ${EASE}`,
              }}
            />
          </Pressable>
        ))}
      </div>
    </div>
  );
}

/** One arrow. Disabled at the ends rather than hidden, so the bar never jumps. */
function Step({ dir, label, onClick }) {
  const off = !onClick;
  return (
    <Pressable
      as="button"
      type="button"
      aria-label={label}
      disabled={off}
      onClick={onClick ?? undefined}
      pressScale={off ? 1 : 0.88}
      hoverStyle={off ? null : { background: C.surface }}
      style={{
        width: 30,
        height: 30,
        flex: "none",
        borderRadius: R.control,
        border: "none",
        background: "none",
        cursor: off ? "default" : "pointer",
        color: off ? C.faintest : C.body,
        opacity: off ? 0.35 : 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: `opacity 200ms ${EASE}`,
      }}
    >
      <svg
        width="17"
        height="17"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.9"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d={
            dir === "prev"
              ? "M14.5 5.5 8 12l6.5 6.5"
              : "M9.5 5.5 16 12l-6.5 6.5"
          }
        />
      </svg>
    </Pressable>
  );
}
