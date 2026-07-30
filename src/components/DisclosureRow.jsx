import { useState } from "react";
import Pressable from "./Pressable";
import { Caret, Dot } from "./primitives";
import { Collapse } from "./Collapse";
import { C, DIVIDER, LEVEL_LAMP, T } from "../tokens";

/**
 * One finding, collapsed to a line until it is asked for.
 *
 * The Signals screen holds twelve of these and used to render every one as a
 * fully-open card — two hundred pixels each, first and twelfth alike. The data
 * is already ranked (`interactionsFor` sorts by severity, `riskEstimates`
 * filters by posterior); the screen just was not showing it. A reader arrives
 * with three questions in order — is anything serious, what is it, what else is
 * there — and an unranked wall of cards answers the third one twelve times
 * before it answers the first.
 *
 * So: a line each, and the most severe one open on arrival.
 *
 * The open/closed grammar is deliberately the same as the collapsed mind scales
 * in `ScaleCard` — press the row, it expands in place. Not a sheet: a sheet
 * breaks the reading position, and moving detail into sheets is exactly what
 * Home was just relieved of.
 */
export default function DisclosureRow({
  level = 0,
  title,
  meta,
  count,
  defaultOpen = false,
  last = false,
  children,
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div style={{ boxShadow: last && !open ? "none" : DIVIDER }}>
      <Pressable
        as="button"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        pressScale={0.995}
        hoverStyle={{ background: C.surfaceHover }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          width: "100%",
          padding: "13px 16px",
          background: "transparent",
          border: "none",
          textAlign: "left",
          cursor: "pointer",
        }}
      >
        {/* In range gets no mark at all. A neutral dot on eight of twelve rows
            is eight marks that mean "nothing here". */}
        <span style={{ width: 7, flex: "none", display: "flex" }}>
          {level > 0 && <Dot color={LEVEL_LAMP[level]} size={7} />}
        </span>
        <span style={{ flex: 1, minWidth: 0 }}>
          <span style={{ ...T.label, color: C.ink, display: "block" }}>
            {title}
          </span>
          {meta && (
            <span
              style={{
                ...T.caption,
                color: C.faintest,
                display: "block",
                marginTop: 2,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {meta}
            </span>
          )}
        </span>
        {count != null && (
          <span style={{ ...T.num, fontSize: 12, color: C.faint }}>
            {count}
          </span>
        )}
        <Caret
          style={{
            transform: open
              ? "translateX(.6px) rotate(90deg)"
              : "translateX(.6px)",
            transition: "transform 260ms cubic-bezier(.23,1,.32,1)",
          }}
        />
      </Pressable>

      <Collapse open={open}>
        <div style={{ padding: "0 16px 15px" }}>{children}</div>
      </Collapse>
    </div>
  );
}
