import Pressable from "./Pressable";
import { Caret } from "./primitives";
import Icon from "./Icon";
import { C, DIVIDER, EASE, STATUS_COLOR, STATUS_LAMP, T } from "../tokens";

// Where the peer average and the referral threshold fall on the 0–100 index.
// These are load scales: 50 is the peer average AND the point at which
// `statusOf` in data/scales.js starts calling a result "watch". Being at the
// average is already the beginning of a concern.
const AVG_AT = 50;
const WATCH_AT = 66;

/**
 * The index, as a comparison rather than a number.
 *
 * The cut points have to be `statusOf`'s own, or the sentence contradicts the
 * badge beside it — an index of 52 read as "about the same as your peers" while
 * the badge said 주의, because 50 is the average and the threshold at once.
 */
export function band(index) {
  if (index >= WATCH_AT) return "high";
  if (index >= AVG_AT) return "aboveAvg";
  if (index >= AVG_AT - 10) return "avg";
  return "low";
}

/**
 * One mind index, as a single row.
 *
 * This replaces a card that had two shapes: a one-line row when the index was
 * fine, and a ~175px panel when it was not — heading, comparison sentence,
 * ruler, lead driver, and a disclosure that pushed the page down by another
 * 400px when opened. Two shapes meant the five scales never scanned as five of
 * the same thing, and the disclosure cost the reader their place on the page.
 *
 * So: one shape, about 56px, for all five. The detail lives in a sheet, which
 * is the right container for it — it arrives over the page instead of shoving
 * it, and leaves the reader exactly where they were.
 *
 * The bar is 3px and carries two facts, the same two the taller ruler carried:
 * where you are, and where the average is.
 */
export default function ScaleRow({ meta, index, status, onOpen, last }) {
  const color = STATUS_COLOR[status];
  // An index that is fine gets a neutral bar. Five green bars down the screen
  // read as decoration; the amber one then has to shout to be noticed at all.
  const lamp = status === "good" ? C.ink2 : STATUS_LAMP[status];

  return (
    <Pressable
      as="button"
      type="button"
      onClick={onOpen}
      pressScale={0.995}
      hoverStyle={{ background: C.surfaceHover }}
      style={{
        display: "block",
        width: "100%",
        padding: "11px 16px 12px",
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: "pointer",
        boxShadow: last ? "none" : DIVIDER,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Icon
          name={meta.icon}
          level={status === "alert" ? 2 : status === "watch" ? 1 : 0}
          size={24}
        />
        <span style={{ ...T.label, color: C.ink, flex: "none" }}>
          {meta.label}
        </span>
        <span
          style={{
            ...T.caption,
            color: C.faint,
            flex: 1,
            minWidth: 0,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {meta.comparison}
        </span>
        <span style={{ ...T.caption, color, flex: "none" }}>
          {meta.statusLabel}
        </span>
        <Caret />
      </div>

      <div
        style={{
          position: "relative",
          height: 3,
          borderRadius: 1.5,
          background: C.surfaceSunken,
          margin: "9px 0 0 33px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: "0 auto 0 0",
            width: `${index}%`,
            background: lamp,
            borderRadius: 1.5,
            transition: `width 520ms ${EASE}, background 240ms ${EASE}`,
          }}
        />
        {/* The peer average, notched through the fill. */}
        <span
          style={{
            position: "absolute",
            top: -1.5,
            left: `${AVG_AT}%`,
            width: 2,
            marginLeft: -1,
            height: 6,
            borderRadius: 1,
            background: C.bg,
            boxShadow: `0 0 0 1px ${C.hairlineStrong}`,
          }}
        />
      </div>
    </Pressable>
  );
}
