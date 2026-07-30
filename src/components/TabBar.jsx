import { useEffect, useRef } from "react";
import Pressable from "./Pressable";
import { C, EASE, T } from "../tokens";
import { useT } from "../i18n";

const stroke = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

const HomeIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" {...stroke}>
    <path d="M3.6 10.4 12 3.6l8.4 6.8" />
    <path d="M5.9 9.6V20h12.2V9.6" />
  </svg>
);

const MindIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" {...stroke}>
    <path d="M15.4 20.4v-2.3a5.5 5.5 0 0 0 3.9-5.2c0-3.9-3.2-7.1-7.1-7.1S5.1 9 5.1 12.9c0 1.2.4 2.1 1 2.9l-1 1.7h2v2.9h8.3Z" />
    <circle cx="12" cy="12.6" r="2.3" />
  </svg>
);

const BodyIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" {...stroke}>
    <circle cx="12" cy="4.9" r="2.5" />
    <path d="M8.5 20.2v-4.6H7V11a2.4 2.4 0 0 1 2.4-2.4h5.2A2.4 2.4 0 0 1 17 11v4.6h-1.5v4.6" />
  </svg>
);

const MoreIcon = () => (
  <svg width="23" height="23" viewBox="0 0 24 24" {...stroke}>
    <circle cx="5.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.4" fill="currentColor" stroke="none" />
  </svg>
);

const ScanIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" {...stroke} stroke="#fff">
    <path d="M3.8 8.4V4.6a.9.9 0 0 1 .9-.9h3.7" />
    <path d="M20.2 8.4V4.6a.9.9 0 0 0-.9-.9h-3.7" />
    <path d="M3.8 15.6v3.8a.9.9 0 0 0 .9.9h3.7" />
    <path d="M20.2 15.6v3.8a.9.9 0 0 1-.9.9h-3.7" />
    <path d="M3.8 12h16.4" />
  </svg>
);

const TABS = [
  { key: "home", labelKey: "tab.home", Icon: HomeIcon },
  { key: "mind", labelKey: "tab.mind", Icon: MindIcon },
  { key: "body", labelKey: "tab.body", Icon: BodyIcon },
  { key: "more", labelKey: "tab.more", Icon: MoreIcon },
];

/**
 * Progressive blur: several backdrop-filter layers, each masked to a lower
 * band with a stronger radius. One flat blur reads as frosted plastic; a ramp
 * from ~0 at the content boundary to heavy at the bottom is what makes the
 * bar read as optical glass — content approaches the edge sharp, then melts.
 */
const BLUR_STACK = [
  { blur: 2, sat: 1.05, from: 0, to: 32 },
  { blur: 6, sat: 1.2, from: 18, to: 58 },
  { blur: 14, sat: 1.5, from: 38, to: 100 },
  { blur: 26, sat: 1.8, from: 62, to: 100 },
];

function TabItem({ tab, current, onSelect, dot }) {
  const t = useT();
  const on = current === tab.key;
  const { Icon } = tab;
  return (
    <Pressable
      as="button"
      type="button"
      aria-current={on ? "page" : undefined}
      aria-label={t(tab.labelKey)}
      onClick={() => onSelect(tab.key)}
      pressScale={0.9}
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 3,
        cursor: "pointer",
        color: on ? C.ink : "rgba(78,82,90,.66)",
        transition: `color 200ms ${EASE}`,
        background: "none",
        border: "none",
        padding: "2px 0",
        minHeight: 44,
      }}
    >
      <span style={{ position: "relative", display: "flex" }}>
        <Icon />
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
 * Glass tab bar.
 *
 * The material is live, not painted: it tracks the scroller underneath and
 * (a) firms up its tint and separation shadow only while there is content
 * left to pass under it, relaxing to near-clear at the end of the page, and
 * (b) slides a faint specular band as content moves, the way light shifts
 * across real glass when what is behind it moves. All of it is driven through
 * CSS custom properties from one rAF-throttled scroll handler — no re-renders.
 */
export default function TabBar({
  tab,
  onSelect,
  onScan,
  mindDot,
  bodyDot,
  scrollerRef,
}) {
  const t = useT();
  const navRef = useRef(null);
  const dots = { mind: mindDot, body: bodyDot };

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
        `${-(scroller.scrollTop * 0.18) % 260}px`,
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
        // Floats over the scroller instead of ending it — the approach zone
        // in the top padding is where content melts into the material.
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 10,
        padding: "40px 6px calc(14px + var(--safe-bottom))",
        display: "flex",
        alignItems: "flex-end",
        pointerEvents: "none",
        "--glass-presence": 1,
        "--glass-shift": "0px",
      }}
    >
      {/* Optical stack — everything below the content row is the material. */}
      <div
        aria-hidden="true"
        style={{ position: "absolute", inset: "30px 0 0", overflow: "hidden" }}
      >
        {/* Progressive blur ramp. */}
        {BLUR_STACK.map((l, i) => (
          <div
            key={i}
            className="glassbar-layer"
            style={{
              position: "absolute",
              inset: 0,
              backdropFilter: `blur(${l.blur}px) saturate(${l.sat})`,
              WebkitBackdropFilter: `blur(${l.blur}px) saturate(${l.sat})`,
              maskImage: `linear-gradient(to bottom, transparent ${l.from}%, #000 ${l.to}%)`,
              WebkitMaskImage: `linear-gradient(to bottom, transparent ${l.from}%, #000 ${l.to}%)`,
            }}
          />
        ))}

        {/* Tint — firmer while content runs underneath, near-clear at page end. */}
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(246,246,243,0) 0%, rgba(246,246,243,.46) 34%, rgba(246,246,243,.72) 100%)",
            opacity: "calc(.55 + .45 * var(--glass-presence))",
            transition: `opacity 260ms ${EASE}`,
          }}
        />

        {/* Specular band — drifts with scroll, like light across moving glass. */}
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            inset: "-40% -60%",
            background:
              "linear-gradient(112deg, transparent 34%, rgba(255,255,255,.55) 46%, rgba(255,255,255,.14) 52%, transparent 62%)",
            transform: "translate3d(var(--glass-shift), 0, 0)",
            opacity: "calc(.16 + .22 * var(--glass-presence))",
            willChange: "transform",
          }}
        />

        {/* Top edge: light catching the lip of the material, then a hairline. */}
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,.85) 30%, rgba(255,255,255,.85) 70%, rgba(255,255,255,0))",
            opacity: "calc(.4 + .6 * var(--glass-presence))",
          }}
        />
        <div
          className="glassbar-layer"
          style={{
            position: "absolute",
            top: -1,
            left: 0,
            right: 0,
            height: 1,
            background: "rgba(23,24,26,.09)",
            opacity: "var(--glass-presence)",
          }}
        />
      </div>

      {/* Content row sits above the optics and takes the pointer back. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flex: 1,
          pointerEvents: "auto",
        }}
      >
        <TabItem
          tab={TABS[0]}
          current={tab}
          onSelect={onSelect}
          dot={dots[TABS[0].key]}
        />
        <TabItem
          tab={TABS[1]}
          current={tab}
          onSelect={onSelect}
          dot={dots[TABS[1].key]}
        />
        <div style={{ flex: 1 }} />
        <TabItem
          tab={TABS[2]}
          current={tab}
          onSelect={onSelect}
          dot={dots[TABS[2].key]}
        />
        <TabItem
          tab={TABS[3]}
          current={tab}
          onSelect={onSelect}
          dot={dots[TABS[3].key]}
        />

        <Pressable
          as="button"
          type="button"
          onClick={onScan}
          aria-label={t("tab.scan")}
          pressScale={0.9}
          style={{
            position: "absolute",
            left: "50%",
            top: -14,
            marginLeft: -27,
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: C.accent,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            border: "none",
            cursor: "pointer",
            boxShadow:
              "inset 0 1px 0 rgba(255,255,255,.16), 0 0 0 4px rgba(246,246,243,.7), 0 10px 24px -8px rgba(23,24,26,.5)",
          }}
        >
          <ScanIcon />
        </Pressable>
      </div>
    </nav>
  );
}
