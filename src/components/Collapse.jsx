import { useEffect, useRef, useState } from "react";
import Pressable from "./Pressable";
import { C, CARET, EASE, INSET, R, T } from "../tokens";

/**
 * Height-animated disclosure.
 *
 * Animating to a measured height rather than toggling `display` is what makes
 * it feel like the panel opens rather than teleports; switching to `auto`
 * once the transition lands means later content changes are not clipped.
 */
export function Collapse({ open, children }) {
  const innerRef = useRef(null);
  const mounted = useRef(false);
  const [height, setHeight] = useState(open ? "auto" : 0);

  useEffect(() => {
    const el = innerRef.current;
    if (!el) return undefined;

    // On the first run a closed panel is already at 0. Measuring it and
    // animating back down would flash the whole panel open on mount.
    if (!mounted.current) {
      mounted.current = true;
      if (!open) return undefined;
    }

    if (open) {
      setHeight(el.scrollHeight);
      const id = setTimeout(() => setHeight("auto"), 320);
      return () => clearTimeout(id);
    }
    // From 'auto' the browser has nothing to animate from, so pin the
    // measured height for a frame before collapsing.
    setHeight(el.scrollHeight);
    const raf = requestAnimationFrame(() => setHeight(0));
    return () => cancelAnimationFrame(raf);
  }, [open]);

  return (
    <div
      aria-hidden={!open}
      style={{
        height,
        overflow: "hidden",
        opacity: open ? 1 : 0,
        transition: `height 300ms ${EASE}, opacity 220ms ${EASE}`,
      }}
    >
      <div ref={innerRef}>{children}</div>
    </div>
  );
}

/** The row that toggles a Collapse: label left, state right, caret. */
export function DisclosureButton({ open, label, hint, onClick, style }) {
  return (
    <Pressable
      as="button"
      type="button"
      aria-expanded={open}
      onClick={onClick}
      pressScale={0.99}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        width: "100%",
        padding: "9px 11px",
        borderRadius: R.control,
        background: C.surfaceSunken,
        boxShadow: INSET,
        border: "none",
        cursor: "pointer",
        textAlign: "left",
        ...style,
      }}
    >
      <span style={{ ...T.monoSm, color: C.body, flex: 1 }}>{label}</span>
      {hint && <span style={{ ...T.micro, color: C.faintest }}>{hint}</span>}
      <span
        style={{
          ...T.monoSm,
          ...CARET,
          color: C.faint,
          transform: open
            ? "translateX(.6px) rotate(90deg)"
            : "translateX(.6px)",
          transition: `transform 260ms ${EASE}`,
          lineHeight: 1,
        }}
      >
        ›
      </span>
    </Pressable>
  );
}
