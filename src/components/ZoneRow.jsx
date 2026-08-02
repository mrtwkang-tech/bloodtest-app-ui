import Pressable from "./Pressable";
import { Collapse } from "./Collapse";
import Icon from "./Icon";
import { C, DIVIDER, EASE, LEVEL_COLOR, T } from "../tokens";

/**
 * One body system, as a single row.
 *
 * The same move the mind scales made, for the same reason. Body used to render
 * every flagged system as a ~300px panel: heading, specialty, condition list,
 * out-of-range summary, the panel's own explanation, this reader's note, a
 * marker bar per finding, a disclosure that added another few hundred pixels,
 * and an action. Four of those made a screen 3,400px long, and because clear
 * systems were not shown at all, the ten never scanned as ten of the same
 * thing — you saw four essays and a legend.
 *
 * So: one shape, all ten, about 54px each — and the detail OPENS IN PLACE.
 *
 * It was a sheet first, mirroring the mind scales, and that was wrong here for
 * a reason specific to this screen: the figure is the context. A sheet slides
 * up over the one thing that says WHERE the liver is, at the moment you tapped
 * the liver. Opening in place keeps them on screen together, and tapping a row
 * also lights that organ in the figure above, so the row and the body are
 * visibly the same object. Only one row is open at a time, so the list can
 * never go back to being a wall of essays.
 *
 * The second line is the row's actual content and changes with state: what is
 * out of range when something is, and what the panel screens for when nothing
 * is. That is the one place the two cases genuinely differ, so it is the only
 * place the row differs.
 */
export default function ZoneRow({
  icon,
  name,
  level,
  score,
  detail,
  statusLabel,
  onOpen,
  open = false,
  last,
  children,
}) {
  return (
    <div style={{ boxShadow: last && !open ? "none" : DIVIDER }}>
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
          background: open ? C.surfaceHover : "transparent",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <Icon name={icon} level={level} size={24} />
          <span style={{ ...T.label, color: C.ink, flex: 1, minWidth: 0 }}>
            {name}
          </span>
          {level > 0 && (
            <span
              style={{ ...T.caption, color: LEVEL_COLOR[level], flex: "none" }}
            >
              {statusLabel}
            </span>
          )}
          {/* The score, in a column of its own so eleven of them can be read
              DOWN rather than one at a time — which is the whole reason it
              exists. "관찰 필요" is a threshold word: it says the same thing
              one per cent past the line as forty per cent past it, so a list
              of eleven panels cannot be ranked by it, and ranking them is the
              question the list actually asks. Mono at tabular width, like
              every other measured number here, so the digits line up. */}
          {score != null && (
            <span
              style={{
                ...T.num,
                fontSize: 13,
                color: level > 0 ? C.body : C.faint,
                flex: "none",
                minWidth: 21,
                textAlign: "right",
              }}
            >
              {score}
            </span>
          )}
          {/* The caret turns rather than pointing away, because the detail
            arrives here rather than somewhere else. */}
          <span
            aria-hidden="true"
            style={{
              display: "flex",
              flex: "none",
              color: C.faintest,
              transform: open ? "rotate(90deg)" : "none",
              transition: `transform 260ms ${EASE}`,
            }}
          >
            <svg
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9.5 5.5 16 12l-6.5 6.5" />
            </svg>
          </span>
        </div>
        <div
          style={{
            ...T.caption,
            color: level > 0 ? C.body : C.faint,
            margin: "4px 0 0 33px",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {detail}
        </div>
      </Pressable>
      <Collapse open={open}>
        <div style={{ padding: "2px 16px 18px" }}>{children}</div>
      </Collapse>
    </div>
  );
}
