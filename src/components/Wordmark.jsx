import { C, FONT_DISPLAY } from "../tokens";

/**
 * The product's mark.
 *
 * WHY THERE IS ONE NOW. The name never appeared anywhere in the interface. The
 * top of the home screen said "지호님, 안녕하세요" — a greeting, which carries
 * no information and is what a screen puts there when it has nothing to say.
 * A wordmark in that slot costs the same pixels and says whose instrument this
 * is.
 *
 * THE SYMBOL is drawn in `Icon.jsx`'s grammar — 24×24 box, no fill,
 * `currentColor` at 1.5, round caps and joins — so it sits beside the organ
 * set without looking imported, re-tints from one colour prop, and can be
 * lifted straight out as a favicon.
 *
 * `strata` is the one in use: a drop whose interior is ruled into layers. One
 * draw, read at several depths, which is the whole product; and `-pedia` is a
 * body of knowledge with entries, which the rules also carry. The alternates
 * are kept rather than deleted because the choice is a taste call and swapping
 * `MARK` is cheaper than redrawing.
 *
 * At 16px the interior rules sit 2px apart and fill in, so `plain` drops them.
 * That is the same constraint the organ icons are drawn under.
 */

const MARKS = {
  // A drop, ruled into layers.
  strata: {
    body: "M12 3.4c0 0-5.7 6.9-5.7 11.1a5.7 5.7 0 0 0 11.4 0C17.7 10.3 12 3.4 12 3.4Z",
    // Shorter above, longer below: the rules follow the drop's own taper, so
    // they read as strata rather than as a lid laid across it.
    detail: ["M9.5 11.8h5", "M8.1 15.5h7.8"],
  },
  // Three arcs closing on a point: the same sample at three resolutions.
  arcs: {
    body: "M16.8 5.6A8.2 8.2 0 1 0 16.8 18.4",
    detail: [
      "M15.5 8.4A5.1 5.1 0 1 0 15.5 15.6",
      "M13.5 12a1.5 1.5 0 1 1-3 0 1.5 1.5 0 1 1 3 0",
    ],
  },
  // A drop above a reference line — the grammar every screen in this app uses.
  reference: {
    body: "M12 2.8c0 0-4.7 5.7-4.7 9a4.7 4.7 0 0 0 9.4 0C16.7 8.5 12 2.8 12 2.8Z",
    detail: ["M4.2 20h15.6"],
  },
  // An iris: the act of looking closely.
  iris: {
    body: "M20 12a8 8 0 1 1-16 0 8 8 0 1 1 16 0",
    detail: [
      "M16.4 10.9a3.3 3.3 0 1 1-6.6 0 3.3 3.3 0 1 1 6.6 0",
      "M6.2 16.6a7.4 7.4 0 0 0 3.6 2.6",
    ],
  },
};

/** Swap this to try another. Everything downstream follows. */
export const MARK = "strata";

export function Mark({ size = 22, plain = false, style }) {
  const glyph = MARKS[MARK];
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ display: "block", flex: "none", ...style }}
    >
      <path d={glyph.body} />
      {!plain && glyph.detail.map((d) => <path key={d} d={d} />)}
    </svg>
  );
}

/**
 * Mark plus logotype.
 *
 * The logotype is Fraunces — the display serif the health score is set in.
 * That is now the rule for the face rather than "numerals only": the serif is
 * the product speaking, either its own name or the one figure everything
 * resolves to. Tab titles stay in the grotesque, so the distinction holds.
 *
 * `opsz` tracks the actual size. The score runs at 144 because it is 60px and
 * wants hairline serifs; a 20px logotype set the same way would fall apart.
 */
export default function Wordmark({ size = 20, color = C.ink }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: size * 0.34,
        color,
      }}
    >
      <Mark size={size * 1.12} />
      <span
        style={{
          fontFamily: FONT_DISPLAY,
          fontSize: size,
          fontWeight: 600,
          letterSpacing: "-0.015em",
          lineHeight: 1,
          fontVariationSettings: `'opsz' ${Math.round(size * 1.2)}, 'SOFT' 30, 'WONK' 0`,
        }}
      >
        Pedia
      </span>
    </span>
  );
}
