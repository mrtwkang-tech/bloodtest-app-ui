import Pressable from "./Pressable";
import { Caret } from "./primitives";
import Icon from "./Icon";
import { C, DIVIDER, LEVEL_COLOR, T } from "../tokens";

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
 * So: one shape, all ten, about 54px each. Everything that was in the panel is
 * in the sheet, which arrives over the page instead of shoving it and leaves
 * the reader where they were.
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
  detail,
  statusLabel,
  onOpen,
  last,
}) {
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
        <Caret />
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
  );
}
