import { useLayoutEffect, useRef, useState } from "react";
import { C, EASE, T } from "../tokens";
import { useT } from "../i18n";

/**
 * Long copy, folded to a few lines with a way in.
 *
 * The explanations in this product are the honest part — a number without its
 * mechanism is worse than no number — but a screen of four-line paragraphs is
 * a screen nobody reads, so the honesty stops working. Clamping gives the
 * first two lines, which is enough to decide whether you want the rest, and
 * keeps the full text one tap away rather than deleted.
 *
 * The toggle only renders when the text actually overflows: a "more" link on a
 * one-line paragraph is noise, and it is measured rather than guessed because
 * the same sentence wraps differently in Korean and English.
 */
export default function Clamp({ lines = 2, children, style, tone = C.body }) {
  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () =>
      setOverflows(el.scrollHeight - el.clientHeight > 2 || open);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
    // `open` is deliberately out of the deps: once we know it overflowed, the
    // toggle must not vanish when the text expands.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [children]);

  return (
    <div style={style}>
      <p
        ref={ref}
        style={{
          ...T.bodyText,
          color: tone,
          margin: 0,
          display: open ? "block" : "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: open ? "none" : lines,
          overflow: "hidden",
          textWrap: "pretty",
        }}
      >
        {children}
      </p>
      {overflows && (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          style={{
            ...T.micro,
            color: C.faint,
            background: "none",
            border: "none",
            padding: "5px 0 0",
            cursor: "pointer",
            transition: `color 160ms ${EASE}`,
          }}
        >
          {open ? <ClampLabel less /> : <ClampLabel />}
        </button>
      )}
    </div>
  );
}

function ClampLabel({ less }) {
  const t = useT();
  return <>{less ? t("common.less") : t("common.more")}</>;
}
