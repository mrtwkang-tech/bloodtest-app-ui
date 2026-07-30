import Pressable from "./Pressable";
import { C, CARD, DIVIDER, EASE, R, T, fadeUp } from "../tokens";

/** Surface card. Hairline ring, small radius, no shadow. */
export function Card({ children, style, delay, ...rest }) {
  return (
    <section
      style={{
        background: C.surface,
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
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: color,
          flex: "none",
        }}
      />
      <span style={{ ...(mono ? T.monoSm : T.label), color: C.body }}>
        {children}
      </span>
    </span>
  );
}

/** Genuine status badge — rare by design. */
export function Badge({ children, color = C.muted, tint = C.chipIdle, style }) {
  return (
    <span
      style={{
        ...T.micro,
        background: tint,
        color,
        borderRadius: R.control,
        padding: "3px 7px",
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
              background: on ? C.surfaceRaised : "transparent",
              color: on ? C.ink : C.faint,
              boxShadow: on ? "0 1px 2px rgba(23,24,26,.12)" : "none",
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
              background: on ? C.accent : C.surface,
              color: on ? C.onAccent : C.body,
              boxShadow: on ? "none" : CARD,
              whiteSpace: "nowrap",
              ...T.monoSm,
            }}
          >
            {item.dot && (
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: item.dot,
                  flex: "none",
                  boxShadow: on ? "0 0 0 1.5px rgba(255,255,255,.35)" : "none",
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
      <div style={{ display: "flex", gap: 2, marginTop: 13, height: 4 }}>
        {seg.map((s, i) => (
          <div
            key={i}
            style={{
              flex: s.n,
              background: s.color,
              borderRadius: 1,
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
  return (
    <svg
      width={width}
      height={height}
      aria-hidden="true"
      style={{ flex: "none" }}
    >
      <polyline
        points={pts.map((p) => p.join(",")).join(" ")}
        fill="none"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.2" fill={color} />
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
      {color && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: color,
            flex: "none",
          }}
        />
      )}
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

/** Large tabular figure. */
export function Display({ children, color = C.ink, size = 52 }) {
  return <div style={{ ...T.display, fontSize: size, color }}>{children}</div>;
}
