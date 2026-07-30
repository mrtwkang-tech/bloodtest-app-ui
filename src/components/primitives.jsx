import Pressable from "./Pressable";
import {
  C,
  CARD,
  CARET,
  DIVIDER,
  EASE,
  INSET,
  R,
  SURFACE,
  T,
  backlight,
  dot,
  fadeUp,
  tint,
} from "../tokens";

/**
 * Surface card: lit top edge, shaded foot, one soft ambient cast.
 *
 * `glow` tints the upper-right of the panel with a status hue, which is how a
 * card carrying a warning announces itself without being wrapped in a coloured
 * border or a tinted block.
 */
export function Card({ children, style, delay, glow, ...rest }) {
  return (
    <section
      style={{
        background: glow ? `${glow}, ${SURFACE}` : SURFACE,
        borderRadius: R.card,
        boxShadow: CARD,
        ...(delay != null ? fadeUp(delay) : null),
        ...style,
      }}
      {...rest}
    >
      {children}
    </section>
  );
}

/**
 * A status dot, area-compensated against square neighbours and lit with its
 * own colour so it reads as an indicator lamp rather than a printed circle.
 */
export function Dot({ color, size = 6, lit = true, style }) {
  return <span style={{ ...dot(size, color, lit), ...style }} />;
}

/** Disclosure chevron, nudged off mathematical centre. */
export function Caret({ color = C.faintest, size = 15, style }) {
  return (
    <span
      aria-hidden="true"
      style={{ ...CARET, fontSize: size, color, lineHeight: 1, ...style }}
    >
      ›
    </span>
  );
}

/**
 * Uppercase monospace section label, optionally with a right-side value.
 * This pairing — tracked label left, measured value right — is the spine of
 * the whole layout.
 */
export function SectionLabel({ children, value, style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        gap: 12,
        ...style,
      }}
    >
      <span style={{ ...T.micro, color: C.faint }}>{children}</span>
      {value != null && (
        <span style={{ ...T.micro, color: C.muted }}>{value}</span>
      )}
    </div>
  );
}

/** Heading above a group of cards. */
export function SectionTitle({ children, value, style }) {
  return (
    <SectionLabel value={value} style={{ margin: "22px 2px 9px", ...style }}>
      {children}
    </SectionLabel>
  );
}

/**
 * A status marker: a dot and a word, sitting directly on the surface.
 *
 * Deliberately not a tinted capsule. Wrapping every value in a pill flattens
 * the hierarchy — everything shouts equally — and is the single most obvious
 * generated-layout tell. Capsules are reserved for `Badge`.
 */
export function Status({ color, children, mono = true, style }) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: 6, ...style }}
    >
      <Dot color={color} />
      <span style={{ ...(mono ? T.monoSm : T.label), color: C.body }}>
        {children}
      </span>
    </span>
  );
}

/** Genuine status badge — rare by design. */
export function Badge({
  children,
  color = C.muted,
  tint: fill = C.chipIdle,
  style,
}) {
  return (
    <span
      style={{
        ...T.micro,
        background: fill,
        color,
        borderRadius: R.control,
        // Optical padding: uppercase sits high in its box, so the top pad is
        // shaved and the bottom carries the difference.
        padding: "2.5px 7px 3.5px",
        boxShadow: `inset 0 0 0 1px ${tint(color, 0.16)}, inset 0 1px 0 rgba(255,255,255,.6)`,
        whiteSpace: "nowrap",
        ...style,
      }}
    >
      {children}
    </span>
  );
}

/** Segmented control: track plus one raised active segment. */
export function Segmented({ items, value, onChange, style }) {
  return (
    <div
      style={{
        display: "inline-flex",
        gap: 2,
        background: C.surfaceSunken,
        borderRadius: R.control + 2,
        boxShadow: INSET,
        padding: 2,
        ...style,
      }}
    >
      {items.map((item) => {
        const on = item.key === value;
        return (
          <Pressable
            key={item.key}
            as="button"
            type="button"
            aria-pressed={on}
            onClick={() => onChange(item.key)}
            pressScale={0.96}
            style={{
              ...T.monoSm,
              border: "none",
              cursor: "pointer",
              borderRadius: R.control,
              padding: "6px 11px",
              whiteSpace: "nowrap",
              background: on ? SURFACE : "transparent",
              color: on ? C.ink : C.faint,
              boxShadow: on
                ? "inset 0 1px 0 rgba(255,255,255,.9), 0 1px 2px rgba(23,24,26,.14), 0 4px 10px -6px rgba(23,24,26,.28)"
                : "none",
              transition: `background 180ms ${EASE}, color 180ms ${EASE}`,
            }}
          >
            {item.label}
          </Pressable>
        );
      })}
    </div>
  );
}

/** A selected chip casts its own colour, not a grey shadow. */
const backlightAccent = backlight(C.accent, 0.9);

/** Horizontal scrolling chip rail for switching subject. */
export function ChipRail({ items, value, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 6,
        overflowX: "auto",
        scrollbarWidth: "none",
        padding: "2px 18px",
        margin: "0 -18px",
        ...style,
      }}
    >
      {items.map((item) => {
        const on = item.key === value;
        return (
          <Pressable
            key={item.key}
            as="button"
            type="button"
            aria-pressed={on}
            onClick={() => onChange(item.key)}
            pressScale={0.96}
            style={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 11px",
              borderRadius: R.control,
              border: "none",
              cursor: "pointer",
              background: on
                ? `linear-gradient(180deg, ${tint("#ffffff", 0.16)} 0%, transparent 55%), ${C.accent}`
                : SURFACE,
              color: on ? C.onAccent : C.body,
              boxShadow: on
                ? `inset 0 1px 0 rgba(255,255,255,.22), ${backlightAccent}`
                : CARD,
              whiteSpace: "nowrap",
              ...T.monoSm,
            }}
          >
            {item.dot && (
              <Dot
                color={item.dot}
                lit={!on}
                style={
                  on ? { boxShadow: "0 0 0 1.5px rgba(255,255,255,.45)" } : null
                }
              />
            )}
            {item.label}
          </Pressable>
        );
      })}
    </div>
  );
}

/**
 * Count strip: four measured numbers over one proportional bar.
 * The bar restates the numbers as widths, so the ratio is legible without
 * doing arithmetic.
 */
export function CountStrip({ counts, labels }) {
  const { total, optimal, inRange, out } = counts;
  const seg = [
    { n: optimal, color: C.optimal },
    { n: inRange, color: C.inRange },
    { n: out, color: C.alert },
  ].filter((s) => s.n > 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 4 }}>
        <Count value={total} label={labels.total} />
        <Count value={optimal} label={labels.optimal} color={C.optimal} />
        <Count value={inRange} label={labels.inRange} />
        <Count
          value={out}
          label={labels.out}
          color={out > 0 ? C.alert : undefined}
        />
      </div>
      {/* The bar sits in a shallow trough, and each segment is lit along its
          top edge — so the proportions read as inlaid, not painted on. */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginTop: 13,
          height: 5,
          borderRadius: 2.5,
          background: C.surfaceSunken,
          boxShadow: INSET,
          padding: 0,
        }}
      >
        {seg.map((s, i) => (
          <div
            key={i}
            style={{
              flex: s.n,
              background: `linear-gradient(180deg, ${tint("#ffffff", 0.34)} 0%, transparent 70%), ${s.color}`,
              borderRadius: 2.5,
              boxShadow: `0 0 6px ${tint(s.color, 0.4)}`,
              transition: `flex 520ms ${EASE}`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

function Count({ value, label, color }) {
  return (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ ...T.title2, ...T.num, color: color || C.ink }}>
        {value}
      </div>
      <div
        style={{
          ...T.micro,
          color: C.faint,
          marginTop: 3,
          // Wraps rather than truncating: a clipped "OUT OF RA…" is worse
          // than two lines.
          lineHeight: 1.25,
          minHeight: 24,
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** Compact trend line for a list row. */
export function Sparkline({ series, color, width = 52, height = 20 }) {
  if (!series?.length) return null;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  const pts = series.map((v, i) => {
    const x = (i / (series.length - 1 || 1)) * width;
    const y = height - 3 - ((v - lo) / span) * (height - 6);
    return [x, y];
  });
  const last = pts[pts.length - 1];
  const id = `spark-${Math.round(pts[0][1] * 100)}-${width}`;
  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ flex: "none", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* The area wash gives the line a body; without it a 1.4px stroke on a
          light panel is the thinnest thing on screen and reads as debris. */}
      <polygon
        points={`0,${height} ${pts.map((p) => p.join(",")).join(" ")} ${width},${height}`}
        fill={`url(#${id})`}
      />
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* The head of the line is the live value: it gets the lamp. */}
      <circle cx={last[0]} cy={last[1]} r="4" fill={color} opacity="0.22" />
      <circle cx={last[0]} cy={last[1]} r="2.1" fill={color} />
    </svg>
  );
}

/** A row in a list: rank, name, measured value, optional trend. */
export function DataRow({
  rank,
  name,
  sub,
  value,
  unit,
  color,
  series,
  last,
  onClick,
}) {
  return (
    <Pressable
      as={onClick ? "button" : "div"}
      type={onClick ? "button" : undefined}
      onClick={onClick}
      pressScale={0.995}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 11,
        width: "100%",
        padding: "12px 15px",
        boxShadow: last ? "none" : DIVIDER,
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      {rank != null && (
        <span
          style={{ ...T.micro, color: C.faintest, flex: "none", width: 16 }}
        >
          {String(rank).padStart(2, "0")}
        </span>
      )}
      {color && <Dot color={color} />}
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...T.label, color: C.ink, display: "block" }}>
          {name}
        </span>
        {sub && (
          <span
            style={{
              ...T.monoSm,
              color: C.faint,
              display: "block",
              marginTop: 2,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {sub}
          </span>
        )}
      </span>
      <span style={{ textAlign: "right", flex: "none" }}>
        <span style={{ ...T.label, ...T.num, color: C.ink, display: "block" }}>
          {value}
        </span>
        {unit && (
          <span style={{ ...T.micro, color: C.faintest, display: "block" }}>
            {unit}
          </span>
        )}
      </span>
      {series && <Sparkline series={series} color={color || C.faint} />}
    </Pressable>
  );
}

/**
 * Large tabular figure.
 *
 * The negative left margin is optical overhang: a digit's left sidebearing
 * pushes the glyph in from the text box, so at 58px the number would sit a
 * couple of pixels right of the label stacked above it. Pulling the box left
 * by a fraction of the size lines the two up to the eye.
 */
export function Display({ children, color = C.ink, size = 52, glowColor }) {
  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      {glowColor && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: `${-size * 0.3}px`,
            background: `radial-gradient(closest-side, ${tint(glowColor, 0.2)}, transparent 72%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div
        style={{
          ...T.display,
          fontSize: size,
          color,
          position: "relative",
          marginLeft: -size * 0.028,
        }}
      >
        {children}
      </div>
    </div>
  );
}
