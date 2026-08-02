import { C, EASE, STATUS_LAMP, T, tint } from "../tokens";
import { SCALE_META } from "../data/scales";
import { useT } from "../i18n";

/**
 * The mind panel as a mid-sagittal section, with each axis drawn as a PATH.
 *
 * WHY A PATH AND NOT A PLACE. The body screen is a map of places: a liver is
 * one object, in one location, and "where is it" has a picture answer. Not one
 * of the five mind axes is an object. Stress recovery is not the hypothalamus —
 * it is whether the loop from the hypothalamus down to the adrenal and back up
 * again still switches itself off, which is why `scales.js` calls the axis
 * "whether the axis still switches off" rather than naming a gland. So the
 * grammar here is different on purpose: body = places, mind = loops.
 *
 * WHERE THE ANATOMY COMES FROM. Not from this file. Five markers in
 * `epigenetics.js` already name the structure they are read from — the
 * paraventricular nucleus, the subgenual anterior cingulate, the
 * suprachiasmatic nucleus, the oligodendrocytes of the white matter — and that
 * file states the mapping as the argument for the whole panel: "the region has
 * to be the one the index is actually about, or this is astrology with a
 * sequencer". This picture draws that claim. It does not invent one.
 *
 * TWO THINGS THE PICTURE MAKES VISIBLE, both of which are true and neither of
 * which was:
 *
 *   1. NEURAL SUBSTRATE HAS NO PLACE IN THE HEAD. Its markers are tryptophan,
 *      B12, ferritin, folate, vitamin D and omega-3 — every one of them
 *      absorbed in the gut and stored in the liver. Its path is the only one
 *      that leaves the skull, and it enters through the blood-brain barrier
 *      rather than starting inside.
 *   2. THE AMYGDALA IS MEASURED AND WIRED TO NOTHING. `cfDNA amygdala
 *      (GAD1-CpG)` exists, has a window, has a plain name, and feeds no index.
 *      It is drawn unlit and unlabelled-by-axis, because that is its state.
 *
 * The section is drawn once, at a fixed 320×236, and scaled. Structures are
 * placed by eye against a standard mid-sagittal plate rather than by any
 * stereotactic frame — this is a diagram, and it says so by being a diagram.
 */

// Mid-sagittal outline. Nose to the LEFT, occiput to the right, the way every
// plate in every textbook draws it — a brain facing right reads as a brain,
// facing left it reads as a shape.
//
// The first attempt was one freehand bezier and came out a lumpy oval. What
// makes this silhouette recognisable is four things and no more: a frontal
// pole lower than the vertex, a vertex forward of centre, an occipital pole
// that overhangs, and a notch under it where the cerebellum sits.
const CORTEX =
  "M58 124 C58 86 94 52 142 46 C196 39 246 62 259 101 C268 129 258 153 236 161 " +
  "C219 167 201 169 187 167 L173 177 C165 180 158 178 152 172 " +
  "C119 165 82 151 66 139 C60 134 58 129 58 124 Z";
// The corpus callosum, as the crescent it is on a section: thick genu at the
// front, thin body, splenium curling under at the back.
const CALLOSUM =
  "M104 126 C112 100 140 88 172 90 C204 92 224 104 231 120 " +
  "C222 111 200 101 172 100 C142 99 115 108 104 126 Z";
const STEM =
  "M146 158 C148 176 154 192 164 208 L180 204 C170 188 165 174 164 158 Z";
const CEREBELLUM =
  "M190 164 C216 158 242 166 250 182 C256 197 245 209 225 211 " +
  "C204 213 187 202 184 187 C182 176 184 168 190 164 Z";

// Interior texture, and the whole argument for having any. A blank outline
// reads as a bean; three sulci and four folia read as a brain, and they cost
// seven paths. The frequencies differ on purpose — cerebral gyri are coarse
// and irregular, cerebellar folia are fine and parallel, and that difference
// is how the two are told apart on any plate.
const SULCI = [
  "M96 92 C110 104 124 108 138 104",
  "M140 62 C150 78 152 92 148 106",
  "M186 56 C192 76 190 96 180 110",
  "M228 74 C230 92 224 108 212 118",
  "M246 116 C236 126 222 132 208 132",
];
const FOLIA = [
  "M192 172 C210 168 228 172 240 182",
  "M190 182 C208 178 228 182 242 192",
  "M191 192 C208 189 226 193 238 201",
  "M196 201 C210 199 224 202 232 207",
];

/** The structures, and which axis each one belongs to. */
const NODES = [
  { id: "sgacc", axis: "inflammation", at: [100, 141], r: 6.5, nameKey: "brain.sgacc" },
  { id: "pvn", axis: "recovery", at: [147, 145], r: 5.5, nameKey: "brain.pvn" },
  { id: "scn", axis: "circadian", at: [137, 152], r: 4.2, nameKey: "brain.scn" },
  { id: "pituitary", axis: "recovery", at: [142, 167], r: 5, nameKey: "brain.pituitary" },
  { id: "pineal", axis: "circadian", at: [197, 131], r: 4.2, nameKey: "brain.pineal" },
  // Lateral structures, projected onto the midline the way an orientation
  // plate does — they are not on a true mid-sagittal cut and never lit here,
  // because nothing in the panel scores them.
  { id: "amygdala", axis: null, at: [126, 161], r: 5, nameKey: "brain.amygdala" },
  { id: "hippocampus", axis: null, at: [152, 165], r: 5, nameKey: "brain.hippocampus" },
];

/** Each axis as an ordered walk. `out` marks a leg that leaves the head. */
const PATHS = {
  recovery: {
    // PVN → pituitary → down the neck, out of frame to the adrenal.
    points: [[147, 145], [142, 167], [156, 214], [184, 226]],
    loop: true,
  },
  circadian: {
    // Retina → chiasm → SCN → pineal. Light in at the front, melatonin at the
    // back, which is why this path crosses the whole section.
    points: [[56, 146], [132, 156], [137, 152], [197, 131]],
  },
  inflammation: {
    // Through the vessels of the frontal pole into the subgenual cingulate.
    points: [[70, 160], [84, 150], [100, 141]],
  },
  metabolic: {
    // White matter — a property of the whole hemisphere rather than a route
    // between two places, so it is dotted and it goes nowhere in particular.
    points: [[108, 116], [150, 96], [196, 100], [230, 120]],
    diffuse: true,
  },
  substrate: {
    // The one that starts outside. Gut → liver → blood-brain barrier → brain.
    points: [[224, 228], [184, 222], [112, 196], [84, 162], [98, 145]],
    out: true,
  },
};

export default function BrainMap({ scores, statuses, active, onPick }) {
  const t = useT();
  const activeIdx = SCALE_META.findIndex((m) => m.key === active);
  const lit = (axis) => {
    const i = SCALE_META.findIndex((m) => m.key === axis);
    if (i < 0) return null;
    if (active) return axis === active ? statuses[i] : null;
    return statuses[i] === "good" ? null : statuses[i];
  };
  const colourOf = (status) => (status ? STATUS_LAMP[status] : C.ink2);

  return (
    <svg
      viewBox="0 0 320 236"
      width="100%"
      style={{ display: "block", touchAction: "pan-y" }}
      role="img"
      aria-label={SCALE_META.map((m, i) => `${t(m.axisKey)} ${scores[i]}`).join(
        ", ",
      )}
    >
      {/* The section itself, held right back. It is the room the axes are in,
          not the subject — the same job the translucent mannequin does. */}
      <path
        d={CORTEX}
        fill={C.surfaceSunken}
        stroke={C.hairlineStrong}
        strokeWidth="1.25"
      />
      <path d={CALLOSUM} fill={C.surface} stroke={C.hairline} strokeWidth="1" />
      <path d={STEM} fill={C.surface} stroke={C.hairline} strokeWidth="1" />
      <path
        d={CEREBELLUM}
        fill={C.surface}
        stroke={C.hairline}
        strokeWidth="1"
      />
      {SULCI.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={C.hairline}
          strokeWidth="1"
          strokeLinecap="round"
        />
      ))}
      {FOLIA.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={C.hairline}
          strokeWidth="0.7"
          strokeLinecap="round"
        />
      ))}

      {/* Below the skull line: everything the substrate and stress axes need
          that is not in the head. Deliberately schematic — a gut drawn in full
          here would claim this is an anatomical section of a whole body. */}
      <line
        x1="52"
        y1="206"
        x2="268"
        y2="206"
        stroke={C.hairline}
        strokeWidth="1"
        strokeDasharray="2 4"
      />
      <text x="56" y="220" style={{ ...T.micro, fill: C.faintest }}>
        {t("brain.belowNeck")}
      </text>

      {SCALE_META.map((m) => {
        const spec = PATHS[m.key];
        if (!spec) return null;
        const status = lit(m.key);
        const on = status != null || m.key === active;
        const d = spec.points
          .map(([x, y], i) => `${i ? "L" : "M"}${x} ${y}`)
          .join(" ");
        return (
          <g
            key={m.key}
            style={{ cursor: "pointer" }}
            onClick={() => onPick(m.key)}
          >
            {/* A fat invisible hit target — the visible stroke is 2px and a
                2px tap target is not a tap target. */}
            <path
              d={d}
              fill="none"
              stroke="transparent"
              strokeWidth="22"
              strokeLinecap="round"
            />
            {/* An arrowhead at the far end. A path drawn as a line says two
                places are connected; it does not say which way anything goes,
                and on this screen which way is the entire point. */}
            {on && (() => {
              const p = spec.points;
              const [ax, ay] = p[p.length - 2];
              const [bx, by] = p[p.length - 1];
              const a = (Math.atan2(by - ay, bx - ax) * 180) / Math.PI;
              return (
                <path
                  d="M0 0 L-7 3.4 L-5.2 0 L-7 -3.4 Z"
                  fill={colourOf(status)}
                  transform={`translate(${bx} ${by}) rotate(${a})`}
                />
              );
            })()}
            <path
              d={d}
              fill="none"
              stroke={on ? colourOf(status) : C.hairlineStrong}
              strokeWidth={on ? 2.4 : 1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray={
                spec.diffuse ? "1 5" : spec.out ? "6 4" : undefined
              }
              style={{ transition: `all 320ms ${EASE}` }}
            />
            {/* The stress axis is the only one that closes on itself, and the
                closing is the measurement: the index asks whether the loop
                still switches off. Drawn as the return leg it is. */}
            {spec.loop && (
              <path
                d="M176 226 C210 214 206 168 156 148"
                fill="none"
                stroke={on ? colourOf(status) : C.hairlineStrong}
                strokeWidth={on ? 1.6 : 1}
                strokeDasharray="3 4"
                style={{ transition: `all 320ms ${EASE}` }}
              />
            )}
          </g>
        );
      })}

      {NODES.map((n) => {
        const status = n.axis ? lit(n.axis) : null;
        const on = n.axis != null && (n.axis === active || (!active && status));
        return (
          <g
            key={n.id}
            style={{ cursor: n.axis ? "pointer" : "default" }}
            onClick={() => n.axis && onPick(n.axis)}
          >
            <circle cx={n.at[0]} cy={n.at[1]} r={n.r + 8} fill="transparent" />
            {on && (
              <circle
                cx={n.at[0]}
                cy={n.at[1]}
                r={n.r + 5}
                fill={tint(colourOf(status), 0.18)}
              />
            )}
            <circle
              cx={n.at[0]}
              cy={n.at[1]}
              r={n.r}
              fill={on ? colourOf(status) : C.surface}
              stroke={on ? colourOf(status) : C.hairlineStrong}
              strokeWidth="1.25"
              style={{ transition: `all 320ms ${EASE}` }}
            />
          </g>
        );
      })}

      {/* The two structures nothing scores, labelled whether or not anything
          is selected. This is the one thing on the screen that is worth
          reading when you have not asked a question: the panel measures the
          amygdala and wires it to no index, and a picture that drew it and
          said nothing would be hiding that rather than showing it. */}
      {/* ONE label, not two. Both unwired structures sit within 26px of each
          other, so labelling both put two lines of type across the temporal
          lobe and across each other. The amygdala is the one that carries the
          point — it is MEASURED and scored by nothing — so it gets the label
          and the hippocampus, which nothing measures at all, gets a dot. */}
      {!active && (
        <>
          <line
            x1="106"
            y1="161"
            x2="120"
            y2="161"
            stroke={C.hairline}
            strokeWidth="1"
          />
          <text
            x="102"
            y="164.5"
            textAnchor="end"
            style={{ ...T.micro, fill: C.faintest }}
          >
            {t("brain.amygdala")}
          </text>
        </>
      )}

      {/* One label at a time when something IS selected. Five names on a
          320-wide section is a diagram of labels with a brain behind it. */}
      {activeIdx >= 0 &&
        NODES.filter((n) => n.axis === active).map((n) => (
          <text
            key={n.id}
            x={n.at[0] + n.r + 7}
            y={n.at[1] + 3.5}
            style={{ ...T.micro, fill: C.body }}
          >
            {t(n.nameKey)}
          </text>
        ))}
    </svg>
  );
}
