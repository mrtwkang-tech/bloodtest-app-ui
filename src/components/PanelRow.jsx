import Pressable from "./Pressable";
import { Collapse } from "./Collapse";
import Icon from "./Icon";
import { C, DIVIDER, EASE, LEVEL_COLOR, T } from "../tokens";

/**
 * One panel — a body system or a mind scale — as a single row that opens.
 *
 * WHY THERE IS NOW ONE OF THESE INSTEAD OF TWO. `ScaleRow` and `ZoneRow` were
 * written eight months apart and converged on the same object without either
 * knowing: same `Pressable`, same 11/16/12 padding, same 9px gap, same 24px
 * icon, same second line inset 33px to clear it. They differed in two ways that
 * mattered — Zone had a score column and opened in place, Scale had neither —
 * and in one that did not: Zone drew its own rotating chevron, Scale used the
 * static `Caret`. Keeping two copies meant every improvement had to be made
 * twice, and the score column and the in-place open are exactly the two
 * improvements Mind was waiting on.
 *
 * THE SECOND LINE IS THE ONLY THING THAT VARIES BY TAB, and it varies because
 * the subjects do: a body system says what is out of range, a mind scale says
 * how it compares to peers. Both are one line of `detail`, passed in.
 *
 * `level` is the 0/1/2 contract `Icon` and `LEVEL_COLOR` already share, so a
 * mind status has to be converted at the call site rather than here — there is
 * no sensible default mapping and guessing one is how a "watch" ends up drawn
 * as an "alert".
 */
export default function PanelRow({
  icon,
  name,
  level = 0,
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
          {level > 0 && statusLabel && (
            <span
              style={{ ...T.caption, color: LEVEL_COLOR[level], flex: "none" }}
            >
              {statusLabel}
            </span>
          )}
          {/* The score, in a column of its own so a list of them can be read
              DOWN rather than one at a time — which is the whole reason it
              exists. "관찰 필요" is a threshold word: it says the same thing
              one per cent past the line as forty per cent past it, so a list
              cannot be ranked by it, and ranking is the question the list
              actually asks. Mono at tabular width so the digits line up.

              It means the same thing on both tabs: higher is better. Getting
              that wrong across two adjacent screens is the reason
              `scaleScore` exists at all. */}
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
        {detail && (
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
        )}
      </Pressable>
      <Collapse open={open}>
        <div style={{ padding: "2px 16px 18px" }}>{children}</div>
      </Collapse>
    </div>
  );
}
