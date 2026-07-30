import { useEffect, useRef } from "react";
import Pressable from "./Pressable";
import { NavIcon } from "./Icon";
import { C, EASE, T } from "../tokens";
import { useT } from "../i18n";

const TABS = [
  { key: "home", labelKey: "tab.home" },
  { key: "mind", labelKey: "tab.mind" },
  { key: "body", labelKey: "tab.body" },
  { key: "signal", labelKey: "tab.signal" },
  { key: "more", labelKey: "tab.more" },
];

/** One cell per tab, so the sliding capsule stays exact as the count changes. */
const CELL = `${100 / TABS.length}%`;

/**
 * The capsule settles with a small overshoot. A pure ease reads as a rectangle
 * being repositioned; the overshoot is what makes it read as a physical thing
 * that was thrown and caught.
 */
const SLIDE = "cubic-bezier(.34,1.32,.5,1)";

function TabItem({ tab, current, onSelect, dot }) {
  const t = useT();
  const on = current === tab.key;
  return (
    <Pressable
      as="button"
      type="button"
      aria-current={on ? "page" : undefined}
      aria-label={t(tab.labelKey)}
      onClick={() => onSelect(tab.key)}
      pressScale={0.92}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 3,
        cursor: "pointer",
        color: on ? C.ink : "rgba(78,82,90,.7)",
        // Faster than the capsule on purpose: the label lights up before the
        // glass arrives, which is the order Apple's own bars resolve in.
        transition: `color 190ms ${EASE}`,
        background: "none",
        border: "none",
        padding: 0,
        minHeight: 46,
      }}
    >
      <span style={{ position: "relative", display: "flex" }}>
        <NavIcon name={tab.key} />
        {dot && (
          <span
            style={{
              position: "absolute",
              top: -1,
              right: -3,
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: dot,
              boxShadow: "0 0 0 2px rgba(255,255,255,.9)",
            }}
          />
        )}
      </span>
      <span style={{ ...T.micro, fontWeight: on ? 700 : 600 }}>
        {t(tab.labelKey)}
      </span>
    </Pressable>
  );
}

/**
 * Floating glass tab bar.
 *
 * Two changes from the full-width slab this replaces, and they depend on each
 * other. The bar is now an inset capsule, so the glass is an *object* sitting
 * over the page rather than a wall drawn across it — which is what made the
 * heavy material read as excessive before. And because it is one object with
 * four equal cells, the selection can be a second piece of glass that slides
 * between them, so switching tabs has a physical result instead of only a
 * colour change.
 *
 * The material inside the capsule is a single uniform blur, not the progressive
 * ramp the slab used. A ramp exists to melt content into an edge that spans the
 * screen; a capsule has no such edge, and blurring its own top more than its
 * bottom just looks like a gradient.
 *
 * Presence still tracks the scroller — tint and shadow firm up while there is
 * content passing underneath and relax at the end of the page — driven through
 * CSS custom properties from one rAF-throttled handler, so scrolling never
 * re-renders React.
 */
export default function TabBar({
  tab,
  onSelect,
  mindDot,
  bodyDot,
  scrollerRef,
}) {
  const navRef = useRef(null);
  const dots = { mind: mindDot, body: bodyDot };
  const index = Math.max(
    0,
    TABS.findIndex((x) => x.key === tab),
  );

  useEffect(() => {
    const scroller = scrollerRef?.current;
    const nav = navRef.current;
    if (!scroller || !nav) return undefined;

    let raf = 0;
    const update = () => {
      raf = 0;
      const under =
        scroller.scrollHeight - scroller.clientHeight - scroller.scrollTop;
      // 0 when the page end has surfaced, 1 while content still runs under.
      const presence = Math.max(0, Math.min(1, under / 72));
      nav.style.setProperty("--glass-presence", presence.toFixed(3));
      // Specular drift: light travels opposite to content, slow and bounded.
      nav.style.setProperty(
        "--glass-shift",
        `${-(scroller.scrollTop * 0.16) % 220}px`,
      );
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    scroller.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(scroller);
    return () => {
      scroller.removeEventListener("scroll", onScroll);
      ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
    // Re-measure when the tab changes: content height changes with it.
  }, [scrollerRef, tab]);

  return (
    <nav
      ref={navRef}
      className="glassbar"
      style={{
        position: "absolute",
        left: 14,
        right: 14,
        bottom: "calc(12px + var(--safe-bottom))",
        zIndex: 10,
        height: 62,
        borderRadius: 31,
        "--glass-presence": 1,
        "--glass-shift": "0px",
        boxShadow: `0 8px 30px -10px rgba(23,24,26,calc(.30 * var(--glass-presence))), 0 1px 2px rgba(23,24,26,.06)`,
      }}
    >
      {/* Optical stack. Clipped to the capsule so the blur cannot leak. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          overflow: "hidden",
        }}
      >
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            inset: 0,
            backdropFilter: "blur(24px) saturate(1.35)",
            WebkitBackdropFilter: "blur(24px) saturate(1.35)",
          }}
        />
        {/* The tint has to carry most of the body. At a lower opacity the
            accent button passing underneath tinted the whole bar violet — glass
            that takes on the colour of one element behind it reads as a bug,
            not as a material. */}
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(251,251,249,.84)",
            opacity: "calc(.86 + .14 * var(--glass-presence))",
            transition: `opacity 260ms ${EASE}`,
          }}
        />
        {/* Specular band — drifts with scroll, like light across moving glass. */}
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            inset: "-70% -60%",
            background:
              "linear-gradient(112deg, transparent 34%, rgba(255,255,255,.6) 46%, rgba(255,255,255,.16) 52%, transparent 62%)",
            transform: "translate3d(var(--glass-shift), 0, 0)",
            opacity: "calc(.2 + .24 * var(--glass-presence))",
            willChange: "transform",
          }}
        />
      </div>

      {/* Rim: a lit top lip and a hairline all the way round, outside the
          clip so it stays crisp at the curve. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          pointerEvents: "none",
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,.9), inset 0 0 0 .5px rgba(23,24,26,.1)",
        }}
      />

      {/* The selection, as a second piece of glass. One cell-wide box slides
          across the track; the pill is inset inside it, so translating by a
          whole cell width lands it exactly over the next tab. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: "6px 6px",
          pointerEvents: "none",
        }}
      >
        <div
          className="tab-cell"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: CELL,
            transform: `translate3d(${index * 100}%, 0, 0)`,
            transition: `transform 420ms ${SLIDE}`,
            willChange: "transform",
          }}
        >
          <div
            className="tab-pill"
            style={{
              position: "absolute",
              inset: "0 3px",
              borderRadius: 22,
              background: "rgba(255,255,255,.58)",
              backdropFilter: "blur(8px) saturate(1.6)",
              WebkitBackdropFilter: "blur(8px) saturate(1.6)",
              boxShadow:
                "inset 0 1px 0 rgba(255,255,255,.95), inset 0 0 0 .5px rgba(23,24,26,.07), 0 2px 8px -2px rgba(23,24,26,.22)",
            }}
          />
        </div>
      </div>

      <div style={{ position: "relative", display: "flex", height: "100%" }}>
        {TABS.map((item) => (
          <TabItem
            key={item.key}
            tab={item}
            current={tab}
            onSelect={onSelect}
            dot={dots[item.key]}
          />
        ))}
      </div>
    </nav>
  );
}
