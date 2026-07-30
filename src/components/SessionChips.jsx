import Pressable from "./Pressable";
import { C, EASE, R, T } from "../tokens";
import { SESSIONS } from "../data/sessions";
import { useT } from "../i18n";

/**
 * Round picker, shared by mind, body and signals so the selection carries
 * across tabs.
 *
 * It began as a scrolling rail of six 62px chips, became a full-width bar with
 * a position readout, and is now the stepper alone, sitting inside the
 * masthead. Every step took something out for the same reason: stepping is the
 * actual behaviour. You compare this round to the one before it, not round 2
 * to round 9.
 *
 * The position count went with the move into one line. `12/12` and `07.03` are
 * the same fact twice, and for a monthly series the date is the better half —
 * "07.03" places you in the year, where "12/12" only places you in a list.
 * Where the ends are is still visible: an arrow disables when there is nothing
 * past it.
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
        gap: 1,
        flex: "none",
        // The arrows carry their own padding; pull the trailing one back so
        // the row optically ends on the glyph and not on its hit area.
        marginRight: -7,
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
          marginLeft: 5,
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
  );
}

/** One arrow. Disabled at the ends rather than hidden, so the row never jumps. */
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
        width: 28,
        height: 28,
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
        width="16"
        height="16"
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
