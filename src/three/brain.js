import * as THREE from "three";
import { cm, ellipsoid, smooth, tube, v3 } from "./geometry";


/**
 * The structures the mind panel is actually about, and the circuits between
 * them.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM anatomy.js. `buildNeuro` there draws a
 * nervous SYSTEM — a cerebrum, a cerebellum, a brainstem, a cord and the two
 * great peripheral nerves — and it has no interior at all. No ventricles, no
 * thalamus, no hypothalamus, no hippocampus, no amygdala, no pineal. That is
 * the right amount of brain for a screen answering "which specialty is flagged";
 * it is none of the brain for a screen whose five markers are named after five
 * specific nuclei.
 *
 * THE ANATOMY IS NOT INVENTED HERE. Five markers in `epigenetics.js` already
 * name the structure they are read from, and that file states the mapping as
 * the argument for the entire panel: "ONE REGION PER INDEX, and the mapping is
 * the argument: the region has to be the one the index is actually about, or
 * this is astrology with a sequencer." This module draws that claim.
 *
 * BODY IS A MAP OF PLACES; THIS IS A MAP OF LOOPS. A liver is an object in a
 * location. Stress recovery is not the hypothalamus — `scales.js` defines the
 * axis as "whether the axis still switches off", which is a property of a
 * circuit and not of any organ in it. So every axis here is a PATH, and the
 * stress path is the only closed one, because the closing is the measurement.
 *
 * COORDINATES are the body's own, in centimetres, so everything lands in the
 * same world as the figure and the endocrine glands it connects to. `AT` is the
 * small landmark table `LEVEL` is for the spine — placed against a standard
 * mid-sagittal plate by eye, which is what a diagram at 340 px can honestly
 * claim.
 *
 * SIZES ARE NOT. The positions are anatomical; the calibres are not, and the
 * exaggeration is stated rather than hidden. The suprachiasmatic nucleus is
 * about half a millimetre across. At this framing that is a fifth of a pixel —
 * drawn true to size, the entire mind panel renders as an empty room. So `MAG`
 * multiplies every radius and every tube, and nothing else: a structure is
 * still exactly where it is, it is simply drawn at the size a diagram has to
 * draw it. The moment the figure gets a zoom this number should come down.
 */

/** How much bigger than life. See the note above — positions are unaffected. */
const MAG = 3.2;

/** Named landmarks. Everything else is placed relative to these. */
export const AT = {
  // The brain sits centred on [0, 0.969, 0.004] with radii 6.9 × 4.6 × 8.1 cm
  // (anatomy.js buildNeuro), so these all live inside that ellipsoid.
  thalamus: [0, 0.951, -0.004],
  hypothalamus: [0, 0.9365, 0.002],
  pvn: [0, 0.9395, -0.001],
  chiasm: [0, 0.9335, 0.014],
  scn: [0, 0.9345, 0.009],
  pituitary: [0, 0.928, 0.006], // matches buildEndocrine exactly
  pineal: [0, 0.9455, -0.019],
  sgacc: [0, 0.9455, 0.041],
  amygdalaL: [0.024, 0.9345, 0.017],
  amygdalaR: [-0.024, 0.9345, 0.017],
  hippoL: [0.028, 0.9315, -0.004],
  hippoR: [-0.028, 0.9315, -0.004],
  // Where the circuits leave the head.
  adrenalL: [0.046, 0.484, -0.048],
  adrenalR: [-0.05, 0.468, -0.048],
  gut: [0.01, 0.36, 0.012],
  liver: [-0.07, 0.505, 0.01],
  eye: [0, 0.955, 0.088],
};

/**
 * A structure, and the axis it belongs to.
 *
 * `axis: null` is not an oversight and must not be tidied away. The amygdala
 * marker `cfDNA amygdala (GAD1-CpG)` is real in the panel — it has a window, a
 * plain name and a mechanism sentence — and it feeds no index. Drawing it unlit
 * is the honest rendering of that state, and it is how anyone looking at this
 * picture will notice.
 */
const NODES = [
  { id: "pvn", axis: "recovery", at: AT.pvn, r: [cm(0.7), cm(0.5), cm(0.6)] },
  {
    id: "hypothalamus",
    axis: "recovery",
    at: AT.hypothalamus,
    r: [cm(1.5), cm(0.9), cm(1.3)],
  },
  {
    id: "scn",
    axis: "circadian",
    at: AT.scn,
    r: [cm(0.45), cm(0.4), cm(0.45)],
  },
  {
    id: "chiasm",
    axis: "circadian",
    at: AT.chiasm,
    r: [cm(1.4), cm(0.35), cm(0.7)],
  },
  {
    id: "pineal",
    axis: "circadian",
    at: AT.pineal,
    r: [cm(0.5), cm(0.45), cm(0.6)],
  },
  {
    id: "sgacc",
    axis: "inflammation",
    at: AT.sgacc,
    r: [cm(0.9), cm(1.4), cm(0.7)],
  },
  {
    id: "amygdalaL",
    axis: null,
    at: AT.amygdalaL,
    r: [cm(1.0), cm(0.8), cm(1.0)],
  },
  {
    id: "amygdalaR",
    axis: null,
    at: AT.amygdalaR,
    r: [cm(1.0), cm(0.8), cm(1.0)],
  },
  { id: "hippoL", axis: null, at: AT.hippoL, r: [cm(0.7), cm(0.7), cm(2.2)] },
  { id: "hippoR", axis: null, at: AT.hippoR, r: [cm(0.7), cm(0.7), cm(2.2)] },
  // The retina. Light is where the circadian circuit starts, and a path that
  // begins in mid-air in front of the face begins nowhere.
  {
    id: "eyeL",
    axis: "circadian",
    at: [0.031, 0.9535, 0.079],
    // Exempt from MAG. An eye is 2.4 cm and already legible; magnified it
    // becomes the largest object on the screen and the head grows insect eyes.
    r: [cm(1.2) / MAG, cm(1.2) / MAG, cm(1.2) / MAG],
  },
  {
    id: "eyeR",
    axis: "circadian",
    at: [-0.031, 0.9535, 0.079],
    r: [cm(1.2) / MAG, cm(1.2) / MAG, cm(1.2) / MAG],
  },
];

/**
 * The circuits. Each is an ordered walk; `r` is the calibre.
 *
 * NEURAL SUBSTRATE IS THE ONE THAT STARTS OUTSIDE THE HEAD, and it is the most
 * informative thing this picture says. Its markers are tryptophan, B12,
 * ferritin, folate, vitamin D and omega-3 — every one absorbed in the gut and
 * stored in the liver. It has no brain region because it is not a brain
 * measurement; it is a supply line, and it enters through the barrier rather
 * than starting behind it.
 */
const PATHS = {
  recovery: [
    // PVN → pituitary → adrenal cortex, and then cortisol back up to the PVN.
    // The return leg is drawn because the return leg IS the index: the axis
    // asks whether the loop still switches itself off.
    { pts: [AT.pvn, AT.pituitary], r: cm(0.28) },
    {
      pts: [
        AT.pituitary,
        [0.014, 0.86, -0.006],
        [0.03, 0.68, -0.03],
        [0.042, 0.55, -0.044],
        AT.adrenalL,
      ],
      r: cm(0.24),
    },
    {
      pts: [
        AT.adrenalR,
        [-0.052, 0.62, -0.05],
        [-0.038, 0.8, -0.02],
        [-0.014, 0.912, 0.004],
        AT.pvn,
      ],
      r: cm(0.16),
      feedback: true,
    },
  ],
  circadian: [
    // Retina → optic chiasm → SCN → (multisynaptic, drawn as one) → pineal.
    { pts: [[0.031, 0.9535, 0.079], [0.016, 0.947, 0.05], AT.chiasm], r: cm(0.2) },
    { pts: [[-0.031, 0.9535, 0.079], [-0.016, 0.947, 0.05], AT.chiasm], r: cm(0.2) },
    { pts: [AT.chiasm, AT.scn], r: cm(0.22) },
    { pts: [AT.scn, [0, 0.9405, -0.006], AT.pineal], r: cm(0.2) },
  ],
  inflammation: [
    // Cytokines arriving through the circulation, into the subgenual cingulate.
    { pts: [[0, 0.9, 0.05], [0, 0.925, 0.05], AT.sgacc], r: cm(0.24) },
  ],
  metabolic: [
    // White-matter maintenance. Diffuse by nature: four tracts standing for a
    // property of the whole hemisphere rather than a route between two places.
    {
      pts: [
        [0.03, 0.96, 0.05],
        [0.05, 0.972, 0],
        [0.03, 0.962, -0.05],
      ],
      r: cm(0.2),
    },
    {
      pts: [
        [-0.03, 0.96, 0.05],
        [-0.05, 0.972, 0],
        [-0.03, 0.962, -0.05],
      ],
      r: cm(0.2),
    },
    {
      pts: [
        [0.02, 0.978, 0.03],
        [0, 0.982, 0],
        [-0.02, 0.978, 0.03],
      ],
      r: cm(0.18),
    },
  ],
  substrate: [
    { pts: [AT.gut, [-0.03, 0.43, 0.014], AT.liver], r: cm(0.26) },
    {
      pts: [
        AT.liver,
        [-0.04, 0.62, 0.006],
        [-0.02, 0.78, 0.01],
        [0, 0.9, 0.04],
        AT.sgacc,
      ],
      r: cm(0.2),
      barrier: true,
    },
  ],
};

/** Which structures each axis owns, for the lit/unlit decision. */
export const AXIS_NODES = NODES.reduce((acc, n) => {
  if (!n.axis) return acc;
  (acc[n.axis] ??= []).push(n.id);
  return acc;
}, {});

function mindMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0,
    roughness: 0.34,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
}

/**
 * One axis, as a group of meshes sharing one material.
 *
 * Same contract the organ systems use — `{ group, materials, focus }` — so the
 * scene's easing loop does not have to know it is looking at a circuit rather
 * than an organ.
 */
function buildAxis(key, color) {
  const group = new THREE.Group();
  const mat = mindMaterial(color);

  NODES.filter((n) => n.axis === key).forEach((n) => {
    group.add(
      ellipsoid(
        mat,
        n.at,
        n.r.map((v) => v * MAG),
        null,
        16,
      ),
    );
  });

  // The curves are handed back as well as drawn. A circuit is a thing with a
  // DIRECTION, and a static tube cannot say which way — so the scene runs
  // small markers along these, and the stress loop is the one where they
  // arrive back where they started. That is the whole grammatical difference
  // between this screen and the body screen, and it is worth the fifteen
  // spheres it costs.
  const curves = [];
  (PATHS[key] ?? []).forEach((seg) => {
    group.add(
      tube(mat, seg.pts, seg.r * MAG, {
        radial: 7,
        stations: Math.max(10, seg.pts.length * 8),
        caps: false,
      }),
    );
    if (!seg.diffuse) {
      curves.push(new THREE.CatmullRomCurve3(seg.pts.map(v3)));
    }
  });

  // The focus point is where the glow sits and where the camera would look.
  const first = NODES.find((n) => n.axis === key) ?? { at: [0, 0.95, 0] };
  return {
    group,
    materials: [mat],
    curves,
    pulseColor: color,
    focus: new THREE.Vector3(first.at[0], first.at[1], first.at[2]),
  };
}

/**
 * A brain to put the circuits inside.
 *
 * The first version relied on the mannequin alone at 16% opacity, and the
 * result was five coloured cables floating in a fog — nothing said "this is
 * the inside of a head". `buildNeuro` in anatomy.js has a cerebrum with the
 * right dimensions but it belongs to the neuro SYSTEM and comes with a spinal
 * cord and two peripheral nerves attached. So this is the same ellipsoid,
 * alone, in the mannequin's own frosted material: a container, not a subject.
 */
export function buildShell() {
  // NOT the mannequin's transmissive material. Transmission renders the volume
  // behind the surface, and with five emissive circuits inside a closed shell
  // the accumulation goes muddy grey — the first attempt turned the head into
  // a dark blob. A plain translucent standard material has no such interaction:
  // it is a pane of glass, which is all a container needs to be.
  const mat = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.5,
    metalness: 0,
    transparent: true,
    opacity: 0.15,
    depthWrite: false,
  });
  const group = new THREE.Group();

  group.add(
    ellipsoid(
      mat,
      [0, 0.969, 0.004],
      [cm(6.9), cm(4.6), cm(8.1)],
      (v, d) => {
        const taper =
          1 - 0.24 * Math.max(0, d.z) ** 2 - 0.16 * Math.max(0, -d.z) ** 2;
        v.x *= taper;
        const syl = d.y + 0.34 * d.z + 0.08;
        v.y -=
          cm(1.7) *
          Math.exp(-((syl / 0.36) ** 2)) *
          Math.min(1, Math.abs(d.x) * 2.4);
        v.x *=
          1 - 0.38 * smooth(-0.1, 0.4, d.y) * Math.exp(-Math.abs(d.x) / 0.17);
        if (v.y < 0) v.y *= 0.8;
      },
      40,
    ),
  );
  group.add(
    ellipsoid(
      mat,
      [0, 0.917, -0.052],
      [cm(5.2), cm(2.4), cm(2.9)],
      (v, d) => {
        v.x *= 1 - 0.22 * Math.exp(-Math.abs(d.x) / 0.2);
        if (v.y > 0) v.y *= 0.82;
      },
      24,
    ),
  );
  return { group, material: mat };
}

/**
 * The structures that belong to no axis, drawn once and never lit.
 *
 * Two of them, both real, both measured, neither wired: the amygdala, whose
 * cfDNA marker feeds nothing, and the hippocampus, which nothing in the panel
 * reads at all. They are here because a brain with the amygdala missing would
 * be a brain edited to make the product look complete.
 */
function buildUnwired() {
  const group = new THREE.Group();
  const mat = mindMaterial(0x8d8b96);
  NODES.filter((n) => !n.axis).forEach((n) => {
    group.add(ellipsoid(mat, n.at, n.r.map((v) => v * MAG), null, 14));
  });
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.934, 0.006) };
}

/**
 * Each axis's own hue, and why this picture needs them where the body figure
 * does not.
 *
 * On the body screen colour carries STATUS and identity comes from position:
 * a liver is unmistakable because it is where a liver is. That does not
 * transfer here. Three of the five circuits live inside a skull three
 * centimetres across, overlapping, and rendered in one status colour they are
 * a single green blob. So hue carries identity, and a flagged axis takes the
 * status colour on top of it — clear circuits stay distinguishable, and the
 * one asking for something is still the one that changes.
 */
export const AXIS_HUE = {
  recovery: 0xd39525,
  inflammation: 0xc9553a,
  substrate: 0x3fae55,
  circadian: 0x5f6bd8,
  metabolic: 0x17a2a2,
};

/** The five circuits, plus the measured-but-unwired structures. */
export function buildCircuits() {
  return {
    recovery: buildAxis("recovery", AXIS_HUE.recovery),
    inflammation: buildAxis("inflammation", AXIS_HUE.inflammation),
    substrate: buildAxis("substrate", AXIS_HUE.substrate),
    circadian: buildAxis("circadian", AXIS_HUE.circadian),
    metabolic: buildAxis("metabolic", AXIS_HUE.metabolic),
    unwired: buildUnwired(),
  };
}
