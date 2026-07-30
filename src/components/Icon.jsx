import { C, tint } from "../tokens";

/**
 * The icon set.
 *
 * Platform emoji were the wrong instrument for three reasons: they render as a
 * different picture on every OS, so the product has no control over its own
 * marks; they arrive pre-coloured, which fights a palette that spends colour
 * carefully; and a glossy 3D kidney bean next to a lab value looks like a joke
 * the product is not making.
 *
 * These are drawn in the same grammar as the DELTA set — 24×24 box, no fill,
 * `currentColor` stroke at 1.5, round caps and joins — so weight matches the
 * type around them and one colour prop re-tints the whole thing. The glow is
 * the neon part, kept to a wide low-alpha radial behind the glyph plus a
 * matched `drop-shadow` on the stroke itself: on a white ground a real neon
 * bloom would look like a rendering error, but the same idea at a tenth of the
 * strength reads as the mark sitting in its own light.
 *
 * Drawing rules, so additions stay consistent:
 *   · one continuous silhouette per icon wherever the organ allows it
 *   · interior detail only where it is the identifying feature (the aortic arch
 *     on the heart, the bronchial split on the lungs)
 *   · nothing below 2px of separation at 24px, or it fills in at 18px
 */

const P = {
  /* ── Organ systems ─────────────────────────────────────────────────── */

  // Brain: cortex outline with a single sulcus and the stem.
  neuro: (
    <>
      <path d="M12 5.1A4.1 4.1 0 0 0 4.7 7.6a3.5 3.5 0 0 0-.5 6.2 3.8 3.8 0 0 0 3.7 4.5h1.2A2.9 2.9 0 0 0 12 15.4V5.1Z" />
      <path d="M12 5.1a4.1 4.1 0 0 1 7.3 2.5 3.5 3.5 0 0 1 .5 6.2 3.8 3.8 0 0 1-3.7 4.5h-1.2A2.9 2.9 0 0 1 12 15.4V5.1Z" />
      <path d="M12 18.3v2.4" />
    </>
  ),

  // Heart with the aortic arch — anatomical, not the valentine shape.
  cardio: (
    <>
      <path d="M12 20.4 5.2 13.5A4.7 4.7 0 1 1 12 7.1a4.7 4.7 0 1 1 6.8 6.4L12 20.4Z" />
      <path d="M6.4 12.4h2.5l1.3-2.4 1.8 4.3 1.2-1.9h2.4" />
    </>
  ),

  // Endocrine: a balance beam. Hormones are a set-point, not an organ.
  endocrine: (
    <>
      <path d="M12 5.6v13.2M8 18.8h8" />
      <path d="M4.4 8.4h15.2" />
      <path d="M4.4 8.4 2.6 12.7a2.3 2.3 0 0 0 3.6 0L4.4 8.4Z" />
      <path d="M19.6 8.4l-1.8 4.3a2.3 2.3 0 0 0 3.6 0L19.6 8.4Z" />
      <circle cx="12" cy="6.1" r="1.6" />
    </>
  ),

  // Liver: the wedge with the falciform ligament dividing the two lobes.
  hepatic: (
    <>
      <path d="M3.2 7.9h16.4c.9 0 1.5.9 1.1 1.7-1.7 3.7-4.6 6.7-8.3 8.1-2.4.9-5.1-.2-6.2-2.5L3.2 7.9Z" />
      <path d="M10.4 7.9 8.9 17.9" />
      <path d="M14.8 15.2a2 2 0 1 0 2.7-2.8" />
    </>
  ),

  // Kidneys: the bean pair with the hilum notch and one ureter.
  renal: (
    <>
      <path d="M7.4 4.9c1.8 0 2.7 1.5 2.7 3.7 0 3-1.4 5.8-3.2 6.9-1.7 1-3.8.1-4.4-1.8a10.6 10.6 0 0 1 .2-6.7c.6-1.5 2.1-2.1 4.7-2.1Z" />
      <path d="M10.1 9.4H8.2" />
      <path d="M16.6 4.9c-1.8 0-2.7 1.5-2.7 3.7 0 3 1.4 5.8 3.2 6.9 1.7 1 3.8.1 4.4-1.8a10.6 10.6 0 0 0-.2-6.7c-.6-1.5-2.1-2.1-4.7-2.1Z" />
      <path d="M13.9 9.4h1.9" />
    </>
  ),

  // Blood: a droplet with its surface highlight.
  hematology: (
    <>
      <path d="M12 3.4c2.7 3.2 6.2 7 6.2 10.4a6.2 6.2 0 1 1-12.4 0C5.8 10.4 9.3 6.6 12 3.4Z" />
      <path d="M9.1 13.9c0 1.7 1.2 3.1 2.8 3.4" />
    </>
  ),

  // Lungs: trachea, carina, and the two fields.
  pulmonary: (
    <>
      <path d="M12 3.6v7" />
      <path d="M12 10.6c0-1.7-1.4-3.1-3.1-3.1S5.8 8.9 5.8 10.6c0 0-2.5 2.8-2.5 5.9 0 1.7.4 3.1 1 4 .4.7 1.4.9 2.1.5 2.7-1.6 5.6-4.2 5.6-7.6v-2.8Z" />
      <path d="M12 10.6c0-1.7 1.4-3.1 3.1-3.1s3.1 1.4 3.1 3.1c0 0 2.5 2.8 2.5 5.9 0 1.7-.4 3.1-1 4-.4.7-1.4.9-2.1.5-2.7-1.6-5.6-4.2-5.6-7.6v-2.8Z" />
    </>
  ),

  // Immunity: a shield with the joint hinge inside it.
  immune: (
    <>
      <path d="M12 3.3 4.9 6.1v5.5c0 4 2.9 7.7 7.1 8.9 4.2-1.2 7.1-4.9 7.1-8.9V6.1L12 3.3Z" />
      <path d="M9.6 9.4a2.4 2.4 0 0 0 0 4.8M14.4 9.4a2.4 2.4 0 0 1 0 4.8" />
      <path d="M9.6 11.8h4.8" />
    </>
  ),

  // Whole body: a figure. The helix that was here read as an hourglass at
  // 17px — the strands cross in the middle and the crossing wins. A person is
  // also the more honest picture: this panel screens the whole body, not DNA.
  oncology: (
    <>
      <circle cx="12" cy="5.4" r="2.5" />
      <path d="M12 9.4c-3.1 0-5.2 1.9-5.2 4.6v2.2h1.7l.6 4.6h5.8l.6-4.6h1.7v-2.2c0-2.7-2.1-4.6-5.2-4.6Z" />
    </>
  ),

  // Nutrition: a leaf with its midrib.
  nutrition: (
    <>
      <path d="M19.6 4.4c.8 5.9-1 10.2-4 12.5-2.7 2-6.4 2-8.7-.4-2.3-2.4-2.2-6.3.3-8.6 2.6-2.5 7.4-3.5 12.4-3.5Z" />
      <path d="M19.6 4.4 5.4 19.6" />
      <path d="M12.6 11.4H8.2M15.2 8.1h-3.4" />
    </>
  ),

  /* ── Mind indices ──────────────────────────────────────────────────── */

  // Mood: sun breaking through cloud.
  mood: (
    <>
      <circle cx="12" cy="12.6" r="3.7" />
      <path d="M12 4.3v2.4M12 18.5v.6M18.3 6.3l-1.7 1.7M7.4 17.2l-1.7 1.7M20.6 12.6h-2.4M5.8 12.6H3.4M18.3 18.9l-1.7-1.7M7.4 8 5.7 6.3" />
    </>
  ),

  // Tension: a rope drawn taut into a knot.
  tension: (
    <>
      <path d="M2.6 12h3.6M17.8 12h3.6" />
      <path d="M6.2 7.2c3.5 1.7 3.5 7.9 0 9.6 3.8-1.5 7.8-1.5 11.6 0-3.5-1.7-3.5-7.9 0-9.6-3.8 1.5-7.8 1.5-11.6 0Z" />
    </>
  ),

  // Stress load: a weight resting on a surface that is bowing under it.
  stress: (
    <>
      <path d="M7.5 4.6h9l2.3 7.4H5.2L7.5 4.6Z" />
      <path d="M12 8.3V4.6" />
      <path d="M3.6 15.4c3-1.1 5.8-1.6 8.4-1.6s5.4.5 8.4 1.6" />
      <path d="M3.6 19.4c3-1.1 5.8-1.6 8.4-1.6s5.4.5 8.4 1.6" />
    </>
  ),

  // Sleep: crescent with two stars.
  sleep: (
    <>
      <path d="M19.4 14.2A8 8 0 0 1 9.1 4.3a8.4 8.4 0 1 0 10.3 9.9Z" />
      <path d="M16.4 3.2v2.6M15.1 4.5h2.6" />
      <path d="M20.2 7.4v1.8M19.3 8.3h1.8" />
    </>
  ),

  // Energy: a cell with charge inside it.
  energy: (
    <>
      <rect x="2.8" y="7.2" width="15.2" height="9.6" rx="2.4" />
      <path d="M20.8 10.6v3.2" />
      <path d="M11.2 9.4 8.1 13h3.6l-1.1 2.6" />
      <path d="M5.6 10.4v3.2" />
    </>
  ),
};

export const ICON_KEYS = Object.keys(P);

/**
 * One icon over its glow.
 *
 * `level` drives both the stroke colour and the glow: neutral when a system is
 * in range, so ten in-range icons stay quiet, and warm when it is not. The
 * stroke goes darker than the glow because a 1.5px line in the lamp colour is
 * too light to read against white — the same lamp/ink split the rest of the
 * palette uses.
 */
export default function Icon({
  name,
  level = 0,
  size = 26,
  color,
  glow = true,
  strokeWidth = 1.5,
  style,
}) {
  const path = P[name];
  if (!path) return null;

  const lamp = GLOW[level] ?? GLOW[0];
  const stroke = color ?? STROKE[level] ?? STROKE[0];
  const box = size;
  const glyph = Math.round(size * 0.74);

  return (
    <span
      style={{
        position: "relative",
        width: box,
        height: box,
        flex: "none",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        ...style,
      }}
    >
      {glow && (
        <span
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            background: `radial-gradient(circle at 50% 52%, ${tint(lamp, level ? 0.34 : 0.2)} 0%, ${tint(lamp, level ? 0.11 : 0.06)} 54%, transparent 74%)`,
          }}
        />
      )}
      <svg
        width={glyph}
        height={glyph}
        viewBox="0 0 24 24"
        fill="none"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        style={{
          position: "relative",
          // The neon, at a strength that survives a white background.
          filter: glow ? `drop-shadow(0 0 3px ${tint(lamp, 0.42)})` : undefined,
        }}
      >
        {path}
      </svg>
    </span>
  );
}

/**
 * In range gets a neutral glow, not a green one. The rest of the palette treats
 * a normal result as uncoloured, and ten softly glowing green organs would put
 * that colour back on two thirds of the screen.
 */
const GLOW = [C.inRangeLamp, C.watchLamp, C.alertLamp];
/** Strokes take the readable value, never the lamp: 1.5px of lamp disappears. */
const STROKE = [C.ink2, C.watch, C.alert];
