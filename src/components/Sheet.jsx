import { useEffect, useRef, useState } from "react";
import Pressable from "./Pressable";
import { C, EASE, MATERIAL_CHROME, T } from "../tokens";
import { createVelocityTracker, project, rubberband } from "../motion/physics";
import { useT } from "../i18n";

const DISMISS_FRACTION = 0.32;

/**
 * Draggable sheet.
 *
 * The grab is tracked 1:1, upward drag rubber-bands rather than stopping dead,
 * and on release the resting point is projected from the flick velocity — so a
 * fast short flick dismisses while a slow long drag does not. Grabbing a
 * closing sheet catches it again, because the transform is read live.
 */
export default function Sheet({
  title,
  subtitle,
  onClose,
  children,
  headerRight,
}) {
  const [y, setY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const sheetRef = useRef(null);
  const tracker = useRef(createVelocityTracker()).current;
  const grab = useRef(null);
  const t = useT();

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const height = () => sheetRef.current?.offsetHeight || 800;

  const onPointerDown = (e) => {
    // Only the grab area starts a drag; the body needs to scroll.
    grab.current = { startY: e.clientY, baseY: y };
    setDragging(true);
    tracker.reset();
    tracker.add(y);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!grab.current) return;
    const raw = grab.current.baseY + (e.clientY - grab.current.startY);
    // Past the top edge there is nothing more to reveal — resist instead of stop.
    const next = raw < 0 ? rubberband(raw, height()) : raw;
    setY(next);
    tracker.add(next);
  };

  const onPointerUp = () => {
    if (!grab.current) return;
    grab.current = null;
    setDragging(false);
    const v = tracker.velocity();
    // Land where the gesture was going, not where the finger left off.
    const projected = y + project(v);
    if (projected > height() * DISMISS_FRACTION) onClose();
    else setY(0);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      style={{ position: "absolute", inset: 0, zIndex: 30 }}
    >
      {/* Scrim dims the parent to signal a modal task rather than a side panel. */}
      <div
        onClick={onClose}
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(11,11,12,.28)",
          opacity: Math.max(0, 1 - y / (height() * 0.9)),
          transition: dragging ? "none" : `opacity 320ms ${EASE}`,
        }}
      />

      <div
        ref={sheetRef}
        style={{
          position: "absolute",
          inset: "44px 0 0",
          background: C.bg,
          borderRadius: "22px 22px 0 0",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transform: `translate3d(0, ${y}px, 0)`,
          // No transition while dragging: the sheet must not lag the finger.
          transition: dragging ? "none" : `transform 380ms ${EASE}`,
          animation: dragging ? "none" : `sheetRise 420ms ${EASE} both`,
          boxShadow: "0 -14px 40px -12px rgba(11,11,12,.28)",
          willChange: "transform",
        }}
      >
        <div
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            flex: "none",
            padding: "10px 16px 12px",
            cursor: dragging ? "grabbing" : "grab",
            touchAction: "none",
            ...MATERIAL_CHROME,
          }}
          className="material"
        >
          <div
            style={{
              width: 38,
              height: 5,
              borderRadius: 999,
              background: C.disabled,
              margin: "0 auto 12px",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Pressable
              as="button"
              type="button"
              onClick={onClose}
              aria-label={t("common.close")}
              pressScale={0.88}
              style={{
                width: 30,
                height: 30,
                borderRadius: "50%",
                background: C.chipIdle,
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: C.body,
                fontSize: 15,
                flex: "none",
              }}
            >
              ✕
            </Pressable>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ ...T.title3, color: C.ink }}>{title}</div>
              {subtitle && (
                <div style={{ ...T.micro, color: C.faint, marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
            {headerRight}
          </div>
        </div>

        <div
          className="scroller"
          style={{ padding: "14px 18px calc(32px + var(--safe-bottom))" }}
        >
          {children}
        </div>
      </div>

      <style>{`@keyframes sheetRise { from { transform: translate3d(0,100%,0);} to { transform: translate3d(0,0,0);} }`}</style>
    </div>
  );
}
