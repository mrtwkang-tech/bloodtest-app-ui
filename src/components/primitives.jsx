import Pressable from "./Pressable";
import { C, CARD, DIVIDER, EASE, T, fadeUp } from "../tokens";
import { useLang } from "../i18n";

/** Plain surface card. */
export function Card({ children, style, delay, ...rest }) {
  return (
    <section
      style={{
        background: C.surface,
        borderRadius: 20,
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

/** Section heading above a group of cards. */
export function SectionTitle({ children, action, style }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "baseline",
        justifyContent: "space-between",
        margin: "22px 4px 10px",
        ...style,
      }}
    >
      <h2 style={{ ...T.callout, color: C.faint, margin: 0 }}>{children}</h2>
      {action}
    </div>
  );
}

/**
 * Horizontal chip rail — the pattern for switching between summary and each
 * organ system without leaving the screen.
 */
export function ChipRail({ items, value, onChange, style }) {
  return (
    <div
      style={{
        display: "flex",
        gap: 8,
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
            pressScale={0.95}
            style={{
              flex: "none",
              display: "flex",
              alignItems: "center",
              gap: 7,
              padding: "9px 14px",
              borderRadius: 999,
              border: "none",
              cursor: "pointer",
              background: on ? C.accent : C.surface,
              color: on ? C.onAccent : C.body,
              boxShadow: on ? "none" : CARD,
              whiteSpace: "nowrap",
              ...T.callout,
            }}
          >
            {item.dot && (
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: item.dot,
                  flex: "none",
                }}
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
 * The biomarker count strip: four numbers over one segmented bar.
 * The bar is the same data as the numbers, which is the point — it turns a
 * count into a proportion without a second reading.
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
      <div style={{ display: "flex", gap: 3, marginTop: 14, height: 5 }}>
        {seg.map((s, i) => (
          <div
            key={i}
            style={{
              flex: s.n,
              background: s.color,
              borderRadius: 999,
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
      <div style={{ ...T.title2, ...T.mono, color: color || C.ink }}>
        {value}
      </div>
      <div
        style={{
          ...T.micro,
          color: C.faint,
          marginTop: 2,
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {label}
      </div>
    </div>
  );
}

/** Compact trend line for a list row. */
export function Sparkline({ series, color, width = 56, height = 22 }) {
  if (!series?.length) return null;
  const lo = Math.min(...series);
  const hi = Math.max(...series);
  const span = hi - lo || 1;
  const pts = series
    .map((v, i) => {
      const x = (i / (series.length - 1 || 1)) * width;
      const y = height - 3 - ((v - lo) / span) * (height - 6);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const last = pts.split(" ").pop().split(",");
  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.6" fill={color} />
    </svg>
  );
}

/** A row in a marker list: name, value, status dot, sparkline. */
export function MarkerRow({
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
      pressScale={0.99}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "13px 16px",
        boxShadow: last ? "none" : DIVIDER,
        background: "transparent",
        border: "none",
        textAlign: "left",
        cursor: onClick ? "pointer" : "default",
      }}
    >
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: "50%",
          background: color,
          flex: "none",
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ ...T.body, color: C.ink, display: "block" }}>
          {name}
        </span>
        {sub && (
          <span
            style={{
              ...T.micro,
              color: C.faint,
              display: "block",
              marginTop: 1,
            }}
          >
            {sub}
          </span>
        )}
      </span>
      <span style={{ textAlign: "right", flex: "none" }}>
        <span
          style={{ ...T.callout, ...T.mono, color: C.ink, display: "block" }}
        >
          {value}
        </span>
        {unit && (
          <span style={{ ...T.micro, color: C.faintest, display: "block" }}>
            {unit}
          </span>
        )}
      </span>
      {series && <Sparkline series={series} color={color} />}
    </Pressable>
  );
}

/** Status pill. */
export function Pill({ children, color, tint }) {
  return (
    <span
      style={{
        ...T.micro,
        background: tint,
        color,
        borderRadius: 999,
        padding: "4px 9px",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

/** Numeric display that respects Korean's tighter tracking at large sizes. */
export function Display({ children, color = C.ink, size = 56 }) {
  const { lang } = useLang();
  return (
    <div
      style={{
        fontSize: size,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: lang === "ko" ? "-0.02em" : "-0.035em",
        fontVariantNumeric: "tabular-nums",
        color,
      }}
    >
      {children}
    </div>
  );
}
