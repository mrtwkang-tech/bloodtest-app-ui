import * as THREE from "three";
import {
  dTheta,
  domeStart,
  ellipse,
  ellipsoid,
  smooth,
  sweep,
  v3,
} from "./geometry";

/**
 * The translucent mannequin the organs sit inside.
 *
 * WHY IT WAS REBUILT. Every limb used to be a stack of separate primitives — a
 * tapered cylinder for the bone, then a SPHERE at each articulation, and the
 * sphere was wider than the cylinder it joined. On an opaque body you would
 * barely notice. On this one you notice everything: the material is
 * transmissive with `depthWrite` off, so every intersection between two solids
 * draws its own silhouette, and each joint became a visible ball with two
 * seams round it. The figure read as a ball-jointed doll, and where the balls
 * met at the hip and shoulder the overlapping outlines looked like damage.
 *
 * A joint is not a ball added to a limb; it is a place where the limb is
 * narrow and the muscle either side of it is not. So each limb is now ONE
 * swept surface whose radius is interpolated through control points — deltoid,
 * elbow, forearm belly, wrist — with no seam anywhere along it, and the joints
 * read because of the pinch, not because of a sphere. Nine surfaces instead of
 * twenty-two, and the ones that do still overlap (arm into torso, foot into
 * ankle) are matched in radius where they meet, so the intersection has no
 * silhouette to draw.
 *
 * It stays deliberately undetailed. It is a container: light passes through it
 * so the organs read as being within a body rather than beside one, and every
 * surface it has is one the organs must fit inside. Detail here would compete
 * with the thing the screen is actually about.
 *
 * AXES. +y is up and +z is anterior — the figure faces the camera. That fixes
 * the third axis: someone facing +z with +y up has their right hand toward −x,
 * so the subject's right is NEGATIVE x, and a viewer sees it on their own left
 * exactly as an anatomical plate does.
 */

/** Named articulations. Everything else is derived from these. */
export const J = {
  crown: [0, 1.045, 0],
  skull: [0, 0.955, 0],
  jaw: [0, 0.885, 0.015],
  neck: [0, 0.845, 0],
  c7: [0, 0.775, -0.01],
  t6: [0, 0.6, -0.005],
  l1: [0, 0.44, 0],
  l5: [0, 0.28, 0],
  pelvis: [0, 0.2, 0],

  shoulderL: [0.175, 0.735, 0],
  shoulderR: [-0.175, 0.735, 0],
  elbowL: [0.225, 0.5, 0.005],
  elbowR: [-0.225, 0.5, 0.005],
  wristL: [0.255, 0.265, 0.02],
  wristR: [-0.255, 0.265, 0.02],
  handL: [0.263, 0.18, 0.028],
  handR: [-0.263, 0.18, 0.028],

  hipL: [0.082, 0.185, 0],
  hipR: [-0.082, 0.185, 0],
  kneeL: [0.088, -0.145, 0.012],
  kneeR: [-0.088, -0.145, 0.012],
  ankleL: [0.092, -0.475, -0.005],
  ankleR: [-0.092, -0.475, -0.005],
  toeL: [0.092, -0.525, 0.075],
  toeR: [-0.092, -0.525, 0.075],
};

/**
 * The five hinges the figure moves on.
 *
 * Exported because the organs have to hang off the SAME points. A femur that
 * swings about a hip 2 mm from the mannequin's hip walks out through the skin
 * within a few degrees, and the only way to be sure the two agree is for there
 * to be one table rather than two sets of numbers that look alike.
 *
 * The head pivot is not a joint in `J`: nodding happens at the atlanto-
 * occipital joint, which is inside the skull base rather than at the neck's
 * midpoint, and putting it at `J.neck` swung the chin through the sternum.
 */
export const PIVOTS = {
  head: [0, 0.855, -0.004],
  armL: J.shoulderL,
  armR: J.shoulderR,
  legL: J.hipL,
  legR: J.hipR,
};

/**
 * The same hinges, as a chain.
 *
 * WHAT THE FLAT TABLE COULD NOT SAY. `PIVOTS` is five independent groups, so
 * every distal bone was a direct child of a proximal one: the ulna rotated
 * about the SHOULDER and the tibia about the HIP. A forearm that cannot bend
 * at the elbow is not a rig with a missing feature, it is a mannequin, and the
 * elbow is one of the two joints a reader can name without being taught.
 *
 * `parent` is what makes it a skeleton rather than a list. A child's group sits
 * at its offset FROM ITS PARENT JOINT, so rotating the shoulder carries the
 * elbow with it and rotating the elbow does not move the shoulder — which is
 * the whole of forward kinematics and all this product needs.
 *
 * `PIVOTS` stays because the five roots are still the only things the organ
 * systems without limb structures care about, and because deleting a public
 * name to rename a concept is churn. This table is a superset of it.
 */
export const CHAIN = {
  head: { at: PIVOTS.head, parent: null },
  armL: { at: J.shoulderL, parent: null },
  elbowL: { at: J.elbowL, parent: "armL" },
  wristL: { at: J.wristL, parent: "elbowL" },
  armR: { at: J.shoulderR, parent: null },
  elbowR: { at: J.elbowR, parent: "armR" },
  wristR: { at: J.wristR, parent: "elbowR" },
  legL: { at: J.hipL, parent: null },
  kneeL: { at: J.kneeL, parent: "legL" },
  ankleL: { at: J.ankleL, parent: "kneeL" },
  legR: { at: J.hipR, parent: null },
  kneeR: { at: J.kneeR, parent: "legR" },
  ankleR: { at: J.ankleR, parent: "kneeR" },
};

/**
 * How far a joint may travel, in radians, and which way.
 *
 * Nothing enforced a range before because nothing bent. An elbow that opens
 * past straight or a knee that bends forwards is not a stylised pose, it is an
 * injury, and a reader spots it instantly even when they could not say why.
 *
 * Flexion is positive for the elbow and negative for the knee because that is
 * the direction each actually goes: an arm folds forwards, a leg folds back.
 */
export const LIMITS = {
  elbow: [0, 2.6],
  knee: [-2.4, 0],
  ankle: [-0.5, 0.35],
  wrist: [-1.2, 1.2],
};

/** Clamp to a joint's range. */
export const flex = (joint, x) => {
  const [lo, hi] = LIMITS[joint];
  return x < lo ? lo : x > hi ? hi : x;
};

/** Frosted-mannequin surface — light passes through so organs read inside. */
export function makeBodyMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.58,
    metalness: 0,
    transmission: 0.5,
    thickness: 0.6,
    ior: 1.24,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    clearcoat: 0.45,
    clearcoatRoughness: 0.55,
  });
}

/**
 * A radius that runs smoothly through control points.
 *
 * `[[t, r], …]`, eased between each pair. The ease matters: it arrives at every
 * control point with zero slope, so a swell blends into the taper either side
 * instead of meeting it at a crease. This is what lets a joint be a narrowing
 * rather than an object.
 */
function taper(stops) {
  return (t) => {
    for (let i = 0; i < stops.length - 1; i++) {
      const [t0, r0] = stops[i];
      const [t1, r1] = stops[i + 1];
      if (t <= t1) return r0 + (r1 - r0) * smooth(t0, t1, t);
    }
    return stops[stops.length - 1][1];
  };
}

/**
 * Surface anatomy of the trunk, as a radial multiplier on (height, angle).
 *
 * WHY THIS IS THE PIECE THAT WAS MISSING. The figure had correct proportions,
 * joints that narrowed properly and a seamless skin, and still read as a shop
 * mannequin — because a real trunk is not a smooth loft. What tells you you
 * are looking at a body is a short list of landmarks, and at 340px tall only
 * the ones that change the SILHOUETTE or catch a highlight survive. These
 * five do; pores and pectorals would not.
 *
 * Angles follow the loft's own parameter: 0 is +x, π/2 is anterior (+z), π is
 * −x, 3π/2 is posterior. Since +x is the subject's LEFT here, "lateral" is
 * |cos a| on either side.
 */
function trunkDetail(y, a) {
  const front = Math.max(0, Math.sin(a));
  const back = Math.max(0, -Math.sin(a));
  const lateral = Math.abs(Math.cos(a));
  const g = (x, mu, sigma) => Math.exp(-(((x - mu) / sigma) ** 2));
  let k = 1;

  // 1. STERNAL NOTCH — the hollow between the collarbones. Tiny, and the
  //    single fastest way to say "this is a neck meeting a chest".
  k -= 0.075 * g(y, 0.7485, 0.008) * g(dTheta(a, Math.PI / 2), 0, 0.34);

  // 2. CLAVICLES — a paired ridge running from the notch out to each acromion.
  //    They read at this size because they sit on the shoulder's top edge, so
  //    they alter the outline rather than only the shading.
  k += 0.055 * g(y, 0.7525, 0.0075) * Math.max(0, Math.sin(a) + 0.45);

  // 3. COSTAL MARGIN — the inverted V under the ribs, lowest at the xiphoid
  //    and rising as it runs laterally. This is the most recognisable landmark
  //    on a bare trunk and the one whose absence made the torso a tube.
  const margin = 0.503 + 0.045 * lateral;
  k += 0.042 * g(y - margin, 0, 0.015) * (front * 0.85 + lateral * 0.5);
  //    Just below it the abdominal wall falls away from the rib line.
  k -= 0.03 * g(y - margin + 0.035, 0, 0.022) * front;

  // 4. SPINAL FURROW — the groove over the spinous processes. Present the
  //    whole length of the back and deepest over the lumbar curve.
  k -=
    (0.05 + 0.02 * g(y, 0.4, 0.09)) *
    g(dTheta(a, (3 * Math.PI) / 2), 0, 0.3) *
    smooth(0.78, 0.7, y) *
    smooth(0.16, 0.24, y);

  // 5. ILIAC CREST — the shelf you rest your hands on. It is what stops the
  //    waist-to-hip transition reading as an upholstered curve.
  k += 0.038 * g(y, 0.226, 0.017) * (lateral * 0.9 + back * 0.4);

  // Detail stops before the neck junction. Above this the trunk is a narrow
  // cone rising INTO the neck, and an indent there pulls its surface inside
  // the neck's — which opened a black slot under the chin, because what you
  // then see through the gap is the inside of a back face.
  return 1 + (k - 1) * smooth(0.772, 0.756, y);
}

/**
 * Surface anatomy of a limb, as a radial multiplier on (path fraction, angle).
 *
 * SAME ARGUMENT AS `trunkDetail`, ONE STEP OUT. The trunk got its landmarks
 * last round and the limbs did not, and the mismatch was worse than the
 * original fault: a chest with a costal margin above two smooth tubes reads as
 * a body wearing sleeves. A limb at this size is 10 px across, so what
 * survives is not muscle definition — it is the four or five places where the
 * outline stops being a taper. Those are all here and nothing else is.
 *
 * THE FRAME. Both limbs are swept with the seed (0,0,1), and a probe through
 * `transportFrames` puts θ = 0 on +z and θ = π/2 on −x, on both sides. So
 * anterior and posterior are side-independent, and medial/lateral flip with
 * the side — hence the `k`.
 */
const gauss = (x, mu, sigma) => Math.exp(-(((x - mu) / sigma) ** 2));

/** A ridge in angle — the positive counterpart of `groove`. */
const ridgeAt = (th, at, width) => Math.exp(-((dTheta(th, at) / width) ** 2));

/** Which way a point on the section faces. −x is medial on the LEFT limb. */
function facing(th, k) {
  const c = Math.cos(th);
  const s = Math.sin(th);
  return {
    ant: Math.max(0, c),
    post: Math.max(0, -c),
    med: Math.max(0, k * s),
    lat: Math.max(0, -k * s),
  };
}

/**
 * Where the arm's landmarks fall along its own path, as arc fractions.
 *
 * Measured, not guessed. `sweep` parameterises by ARC LENGTH, so the fraction
 * a joint sits at is the running distance along the control polygon over its
 * total — and it moves whenever the path does. The taper and the surface
 * detail both key off this table so that an edit to the path cannot leave the
 * elbow's pinch three centimetres above the elbow, which is what happened when
 * the two carried their own copies of the numbers.
 */
export const ARM_AT = {
  shoulder: 0.126,
  elbow: 0.5,
  wrist: 0.867,
  palm: 0.915,
};
export const LEG_AT = { hip: 0.04, knee: 0.52, ankle: 1 };

/**
 * Arm surface, from the buried apex (t = 0) to the fingertip (t = 1).
 *
 * The deltoid is the one that matters most. It is not a swelling that fades —
 * it ENDS, at its insertion a third of the way down the humerus, and that
 * abrupt lower edge is the single line that tells a shoulder from a hinge. A
 * Gaussian could not do it, so the cap is a plateau with a fast fall.
 */
function armDetail(t, th, k) {
  const { ant, post, med, lat } = facing(th, k);
  const E = ARM_AT.elbow;
  let d = 0;

  // DELTOID — over the top of the shoulder, heaviest laterally, cut off short.
  d +=
    0.1 *
    smooth(0.06, 0.12, t) *
    smooth(0.36, 0.27, t) *
    (lat * 0.95 + post * 0.45 + ant * 0.3);
  // BICEPS anterior, TRICEPS posterior and longer, ending in a flat tendon.
  d += 0.05 * gauss(t, 0.32, 0.072) * ant;
  d += 0.045 * gauss(t, 0.29, 0.095) * post;
  d -= 0.022 * gauss(t, E - 0.065, 0.034) * post;
  // ELBOW — olecranon behind as a hard point, cubital fossa hollow in front,
  // epicondyles making the joint WIDE. A round elbow is the giveaway of a
  // mannequin; a real one is a flat triangle from behind.
  d += 0.07 * gauss(t, E + 0.008, 0.025) * post;
  d -= 0.032 * gauss(t, E, 0.033) * ant;
  d += 0.042 * gauss(t, E - 0.003, 0.029) * (lat + med);
  // FOREARM — the flexor and extensor mass just below the elbow, then the
  // subcutaneous ulnar border running flat all the way to the wrist.
  d += 0.042 * gauss(t, 0.58, 0.072) * (ant * 0.65 + lat * 0.8 + post * 0.5);
  d -= 0.026 * gauss(t, 0.685, 0.095) * med;
  // WRIST — the two styloid processes, and the joint is flat front to back.
  d += 0.045 * gauss(t, ARM_AT.wrist, 0.018) * (lat * 0.8 + med * 0.6);
  // THENAR pad at the base of the thumb. The arm hangs palm-inward, so the
  // thumb — and its pad — face forward.
  d += 0.055 * gauss(t, 0.918, 0.026) * Math.max(0, ant - 0.25);
  // KNUCKLES, across the metacarpal heads.
  d += 0.03 * gauss(t, 0.935, 0.017) * (ant * 0.6 + post * 0.4);

  return 1 + d;
}

/**
 * Leg: hip at t ≈ 0.04, knee 0.52, ankle 1.
 *
 * Three landmarks carry a leg. The vastus medialis teardrop above the inside
 * of the knee; the two calf bellies, of which the MEDIAL one hangs lower — the
 * asymmetry is the fact, a symmetrical calf reads as a sock; and the malleoli,
 * where again the medial one sits higher than the lateral. Get those three
 * right and the shin can look after itself.
 */
function legDetail(t, th, k) {
  const { ant, post, med, lat } = facing(th, k);
  const K = LEG_AT.knee;
  let d = 0;

  // QUADRICEPS mass, the iliotibial flattening down the outside, and the
  // vastus medialis teardrop just above the knee.
  d += 0.036 * gauss(t, 0.26, 0.13) * ant;
  d += 0.026 * gauss(t, 0.34, 0.1) * lat;
  d += 0.05 * gauss(t, K - 0.08, 0.045) * (med * 0.95 + ant * 0.3);
  // KNEE — condyles make it wide, the patella is a flat plate on the front,
  // and the popliteal fossa is a hollow behind. Wide-and-flat, never round.
  d += 0.042 * gauss(t, K + 0.005, 0.032) * (lat + med);
  d += 0.028 * gauss(t, K - 0.008, 0.026) * Math.max(0, ant - 0.5);
  d -= 0.03 * gauss(t, K + 0.028, 0.032) * post;
  // CALF — lateral head higher, medial head lower and larger.
  d += 0.055 * gauss(t, 0.632, 0.058) * (post * 0.85 + lat * 0.55);
  d += 0.07 * gauss(t, 0.672, 0.062) * (post * 0.85 + med * 0.65);
  // TIBIAL BORDER — the shin. A subcutaneous ridge a little medial of the
  // front, with the flat of the bone beside it; this is why a lower leg is
  // triangular in section and not a cylinder.
  const shin = smooth(0.58, 0.68, t) * smooth(1.02, 0.9, t);
  d += 0.022 * ridgeAt(th, k * 0.3, 0.26) * shin;
  d -= 0.018 * ridgeAt(th, k * 0.95, 0.4) * shin;
  // ACHILLES — the leg narrows hard side to side above the heel and the
  // tendon stands proud behind it.
  d -= 0.05 * gauss(t, 0.885, 0.07) * (lat + med) * 0.75;
  d += 0.028 * gauss(t, 0.885, 0.07) * post;
  // MALLEOLI. Medial higher, lateral lower — every plate shows this and it is
  // the cheapest ankle there is.
  d += 0.055 * gauss(t, 0.962, 0.02) * med;
  d += 0.05 * gauss(t, 0.993, 0.02) * lat;

  return 1 + d;
}

/**
 * Torso lofted through ellipse rings keyed to the spine joints, then given a
 * surface.
 *
 * The control rings set the mass — the shoulder-to-waist-to-hip taper that
 * makes the figure a person rather than a pill. They are RESAMPLED before the
 * detail is applied: the thirteen control rings jump 10cm at a time through
 * the chest, and a costal margin 1.5cm wide cannot exist on a mesh whose rows
 * are further apart than the feature is tall.
 */
function torsoGeometry() {
  const control = [
    // The first ring is NARROWER than the neck at the same height (~0.047), so
    // the trunk emerges from inside it instead of punching through its wall.
    // A wider ring here left a lens-shaped hole under the chin: the cone came
    // out of the neck, went back in, and you saw the inside of it through the
    // gap between the two surfaces.
    // THE TRAPEZIUS SLOPE. These used to jump 0.044 → 0.118 → 0.158 over two
    // centimetres, which left the trunk narrower than the arm all the way from
    // the neck root down to the acromion — so the top of each arm stood out in
    // open air beside the neck and read as a WING. It is a slope, not a step:
    // roughly 19° from the neck root out to the shoulder tip, which is what a
    // shoulder actually is, and it has to be sampled often enough to curve.
    { y: 0.776, rx: 0.044, rz: 0.04 },
    { y: 0.77, rx: 0.074, rz: 0.056 },
    { y: 0.764, rx: 0.102, rz: 0.069 },
    { y: 0.757, rx: 0.13, rz: 0.079 },
    { y: 0.75, rx: 0.152, rz: 0.086 },
    { y: 0.742, rx: 0.17, rz: 0.092 },
    { y: 0.73, rx: 0.18, rz: 0.099 },
    { y: 0.715, rx: 0.183, rz: 0.103 },
    { y: 0.63, rx: 0.176, rz: 0.108 },
    { y: 0.53, rx: 0.158, rz: 0.1 },
    { y: 0.43, rx: 0.139, rz: 0.093 },
    { y: 0.34, rx: 0.133, rz: 0.092 },
    { y: 0.25, rx: 0.152, rz: 0.101 },
    { y: 0.17, rx: 0.163, rz: 0.104 },
    { y: 0.135, rx: 0.152, rz: 0.098 },
    { y: 0.105, rx: 0.126, rz: 0.084 },
  ];

  /** Linear interpolation down the control profile. */
  const at = (y) => {
    for (let i = 0; i < control.length - 1; i++) {
      const a = control[i];
      const b = control[i + 1];
      if (y <= a.y && y >= b.y) {
        const u = (a.y - y) / (a.y - b.y);
        return { rx: a.rx + (b.rx - a.rx) * u, rz: a.rz + (b.rz - a.rz) * u };
      }
    }
    return y > control[0].y ? control[0] : control[control.length - 1];
  };

  const ROWS = 68;
  const radial = 44;
  const top = control[0].y;
  const bottom = control[control.length - 1].y;
  const rings = [];
  for (let r = 0; r < ROWS; r++) {
    const y = top - ((top - bottom) * r) / (ROWS - 1);
    rings.push({ y, ...at(y) });
  }

  const positions = [];
  const indices = [];
  rings.forEach((ring) => {
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      const k = trunkDetail(ring.y, a);
      // Slight front/back asymmetry: chest forward, back flatter.
      const z = Math.sin(a) * ring.rz * (Math.sin(a) > 0 ? 1.06 : 0.92) * k;
      positions.push(Math.cos(a) * ring.rx * k, ring.y, z);
    }
  });

  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < radial; i++) {
      const a = r * radial + i;
      const b = r * radial + ((i + 1) % radial);
      const c = (r + 1) * radial + i;
      const d = (r + 1) * radial + ((i + 1) % radial);
      // Rings run top to bottom and θ runs +x toward +z, so winding round θ
      // first is what puts the normal on the OUTSIDE.
      indices.push(a, b, c, b, d, c);
    }
  }

  const topC = positions.length / 3;
  // The apex sits INSIDE the neck, so the torso rises out of it as a cone —
  // which is the trapezius. Stopping short left a flat annulus round the neck
  // with a dark rim, and the rim read as a collar.
  positions.push(0, rings[0].y + 0.016, 0);
  for (let i = 0; i < radial; i++) indices.push(topC, (i + 1) % radial, i);

  const botC = positions.length / 3;
  const last = (rings.length - 1) * radial;
  positions.push(0, rings[rings.length - 1].y - 0.022, 0);
  for (let i = 0; i < radial; i++)
    indices.push(botC, last + i, last + ((i + 1) % radial));

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * Hangs meshes off a pivot so they can be rotated at a joint.
 *
 * The sweeps are built in world coordinates — a forearm's vertices are where
 * the forearm is. Rotating that mesh spins it about the origin, somewhere
 * around the subject's knees. Translating the GEOMETRY back by the joint and
 * putting the group AT the joint means `rotation.x` on the group is the
 * shoulder flexing, which is the only thing that lets this figure move.
 *
 * Meshes stay in the same array and the same material, so nothing downstream
 * has to know a hierarchy appeared.
 */
function pivotAt(parent, at, meshes, name) {
  const g = new THREE.Group();
  // Named so a clone of this hierarchy can be driven by the same pose.
  g.name = name;
  g.position.set(at[0], at[1], at[2]);
  meshes.forEach((m) => {
    m.geometry.translate(-at[0], -at[1], -at[2]);
    g.add(m);
  });
  parent.add(g);
  return g;
}

/**
 * The chain as actual THREE.Bones, plus the Skeleton bound to them.
 *
 * SKINNING IS `pivotAt` WITH A WEIGHT, and the maths is identical. There, the
 * geometry is translated back by the joint and the group put at the joint, so
 * the rest pose is unchanged and `rotation` becomes a rotation about that
 * joint. Here the bone sits at the joint in world space with a rest rotation of
 * zero, so its bind-time inverse is exactly `translate(-joint)` and its bone
 * matrix at rest is the identity — the same change of basis, except a vertex
 * can now belong partly to two of them.
 *
 * Which is the whole reason to do it. A limb is ONE swept surface on purpose:
 * splitting it at the elbow would put two solids end to end on a material where
 * every intersection draws its own silhouette, and that seam is what the
 * single-sweep skin was built to remove. Blending does not split anything.
 *
 * `bindMatrix` is therefore the identity, which is only true because every
 * surface in this file is authored in world coordinates.
 */
function buildRigBones() {
  const bones = {};
  const order = [];
  // The head is rigid and keeps its own `pivotAt` group, so it gets no bone —
  // and must not get one, because two objects called "head" under the same
  // parent make `getObjectByName` a coin toss, and the oncology shell recovers
  // its whole rig that way.
  Object.entries(CHAIN)
    .filter(([name]) => name !== "head")
    .forEach(([name, { at, parent }]) => {
      const b = new THREE.Bone();
      b.name = name;
      const p = parent ? CHAIN[parent].at : [0, 0, 0];
      // Local offset from the parent joint — this is what makes rotating the
      // shoulder carry the elbow and rotating the elbow leave the shoulder.
      b.position.set(at[0] - p[0], at[1] - p[1], at[2] - p[2]);
      bones[name] = b;
      order.push(name);
    });
  order.forEach((name) => {
    const { parent } = CHAIN[name];
    if (parent) bones[parent].add(bones[name]);
  });
  const list = order.map((n) => bones[n]);
  return {
    bones,
    list,
    index: Object.fromEntries(order.map((n, i) => [n, i])),
  };
}

/**
 * A weight function for one limb: which two bones a point at arc fraction `t`
 * belongs to, and how much of the second.
 *
 * `joints` is `[[at, band], …]` in order down the limb, using the same arc
 * fractions `ARM_AT`/`LEG_AT` already carry — so a change to a limb's path
 * moves the pinch, the surface detail and the skin weight together, which is
 * the reason those fractions live in one table.
 */
let RIG_INDEX = null;
function skinChain(root, joints) {
  const chain = [root, ...joints.map((_, i) => CHAIN_OF[root][i])];
  return (t) => {
    for (let i = 0; i < joints.length; i++) {
      const [at, band] = joints[i];
      if (t < at + band) {
        const w = smooth(at - band, at + band, t);
        return [RIG_INDEX[chain[i]], RIG_INDEX[chain[i + 1]], w];
      }
    }
    const last = chain[chain.length - 1];
    return [RIG_INDEX[last], RIG_INDEX[last], 0];
  };
}

/** Root → the joints below it, in order. Derived from CHAIN so it cannot drift. */
const CHAIN_OF = Object.fromEntries(
  Object.keys(CHAIN)
    .filter((n) => CHAIN[n].parent === null)
    .map((root) => {
      const out = [];
      let cur = root;
      for (;;) {
        const next = Object.keys(CHAIN).find((n) => CHAIN[n].parent === cur);
        if (!next) break;
        out.push(next);
        cur = next;
      }
      return [root, out];
    }),
);

/** The translucent figure. Nine surfaces, no visible joins, and a rig. */
export function buildBody() {
  const mat = makeBodyMaterial();
  const group = new THREE.Group();
  const parts = [];
  const made = {};
  const push = (m, name) => {
    group.add(m);
    parts.push(m);
    if (name) made[name] = m;
    return m;
  };
  // Built before any surface, because `skinChain` closes over the bone indices
  // and the limb sweeps ask for them while they are being generated.
  const bones = buildRigBones();
  RIG_INDEX = bones.index;

  // Head as one mass. It used to be a cranium sphere with a jaw sphere pushed
  // into it, and the seam between them ran straight across the face.
  made.head = push(
    ellipsoid(
      mat,
      [0, 0.951, 0.006],
      [0.094, 0.107, 0.1],
      (v, d) => {
        // Below the cheekbone the skull narrows to a jaw. Gently: pushing the
        // chin forward as well folded the surface back through itself and left
        // a crease across the face.
        const low = smooth(0.15, -0.9, d.y);
        v.x *= 1 - 0.26 * low;
        v.z *= 1 - 0.14 * low;
        // The cranium is deeper behind than the face is in front.
        v.z += 0.007 * Math.max(0, -d.z);
      },
      44,
    ),
  );

  // Neck, widening into the shoulders instead of ending at them.
  made.neck = push(
    sweep(
      mat,
      [
        [0, 0.884, 0.004],
        [0, 0.845, 0.0],
        [0, 0.806, -0.005],
        // Ends well below where the torso cone overtakes it, so the join is
        // a crease rather than a rim.
        [0, 0.752, -0.008],
      ],
      (() => {
        const r = taper([
          [0, 0.037],
          [0.55, 0.042],
          [1, 0.05],
        ]);
        return (t, th) => ellipse(th, r(t) * 0.94, r(t));
      })(),
      { stations: 26, radial: 26 },
    ),
  );

  made.torso = push(new THREE.Mesh(torsoGeometry(), mat));

  // Arms: one surface each, shoulder to fingertip. The path starts INSIDE the
  // torso so the deltoid grows out of the chest wall rather than being parked
  // against it.
  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    const r = taper([
      [0, 0.052], // deltoid
      [0.1, 0.053],
      [0.28, 0.042], // upper arm
      [ARM_AT.elbow, 0.033], // elbow — the narrowing IS the joint
      [0.6, 0.037], // forearm belly
      [ARM_AT.wrist, 0.023], // wrist
      [ARM_AT.palm, 0.03], // palm
      [1, 0.013], // fingers
    ]);
    made[`arm${s}`] = push(
      sweep(
        mat,
        [
          // The arm starts INSIDE the trapezius, not above it. It used to
          // begin at y 0.786 — five centimetres higher than the shoulder joint
          // and 12 cm out from the midline, at a height where the trunk is
          // only 4 cm wide — so its domed top had nothing around it and the
          // figure grew a pair of wings. Now the dome is buried and what
          // emerges below the shoulder line is the deltoid.
          [k * 0.096, 0.754, -0.002],
          [k * 0.148, 0.742, 0.0],
          J[`shoulder${s}`],
          [k * 0.202, 0.616, 0.003],
          J[`elbow${s}`],
          [k * 0.242, 0.382, 0.013],
          J[`wrist${s}`],
          [k * 0.261, 0.213, 0.026],
          J[`hand${s}`],
        ],
        (t, th) => {
          // The top of the arm is DOMED, not capped. A sweep's end cap is a
          // flat disc, and a flat disc at the top of a shoulder stands off the
          // body like a cut. Taking the radius to zero with a vertical tangent
          // closes it as a hemisphere, which is the deltoid.
          const rr = r(t) * domeStart(t, 0.075) * armDetail(t, th, k);
          // The hand flattens: thin across the palm, wider front to back.
          const flat = smooth(ARM_AT.wrist, 0.965, t);
          return ellipse(th, rr * (1 + 0.5 * flat), rr * (1 - 0.42 * flat));
        },
        // Resolution set by the smallest feature that has to survive, which is
        // the styloid at σ = 0.019 of the path and the shin ridge at 0.26 rad.
        // The old 70 × 26 put fewer than three rows across the first and one
        // segment across the second, and a landmark narrower than the mesh
        // does not exist however carefully it is written.
        {
          stations: 104,
          radial: 40,
          seed: new THREE.Vector3(0, 0, 1),
          // Shoulder → elbow → wrist, blended across each joint's own arc
          // fraction. The band is ±0.055 of the path, about 4 cm, which is
          // roughly the width of the crease a real elbow makes; narrower and
          // the bend creases like paper, wider and it bows like a hose.
          skin: skinChain(`arm${s}`, [
            [ARM_AT.elbow, 0.055],
            [ARM_AT.wrist, 0.045],
          ]),
        },
      ),
    );
  });

  // Legs: hip to ankle as one surface, with the calf belly sitting just below
  // the knee where it actually is.
  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    const r = taper([
      [0, 0.062],
      // Upper thigh. Any wider and the two legs pass through each other at the
      // midline — the hips are only 0.082 either side of it — which is what put
      // a notch in the crotch that read as damage rather than as anatomy.
      [0.12, 0.059],
      [0.4, 0.051], // above the knee
      [LEG_AT.knee, 0.046], // knee
      [0.62, 0.051], // calf
      [0.88, 0.031],
      [1, 0.027], // ankle
    ]);
    made[`leg${s}`] = push(
      sweep(
        mat,
        [
          [k * 0.079, 0.212, 0.0],
          J[`hip${s}`],
          [k * 0.086, 0.03, 0.008],
          J[`knee${s}`],
          [k * 0.09, -0.31, 0.0],
          J[`ankle${s}`],
        ],
        // Domed at the top, like the shoulder, and the dome sits deep inside
        // the pelvis where nothing can see it. A flat end cap here stood off
        // the hip as a plate.
        // A LONGER dome than the arm's. The whole hip cap is buried in the
        // pelvis, and on a surface with `depthWrite` off a buried surface
        // still draws its own silhouette — a short cap put a hard equator
        // ring across each hip that read as a pair of shorts. Stretching the
        // cap over a tenth of the leg gives it no edge to draw.
        (t, th) => {
          const rr = r(t) * domeStart(t, 0.1) * legDetail(t, th, k);
          return ellipse(th, rr * 0.96, rr);
        },
        {
          stations: 96,
          radial: 40,
          seed: new THREE.Vector3(0, 0, 1),
          skin: skinChain(`leg${s}`, [[LEG_AT.knee, 0.05]]),
        },
      ),
    );

    // Foot. Starts inside the ankle so the join has no silhouette.
    //
    // TWO THINGS WERE WRONG WITH IT, and they compounded.
    //
    // FIRST, IT WAS 9 cm LONG. The path ran from the ankle down and forward
    // to a point 8 cm ahead of it, with nothing at all behind — so the figure
    // had no heel, and a foot as wide as it was long reads as a paddle. A
    // 176 cm person's foot is about 25 cm. The path is now a HOOK: back and
    // down to the heel, then forward under the arch to the toes, which is the
    // shape of the thing and is also what lets one surface carry both ends.
    //
    // SECOND, the profile put the wide axis on the frame's first vector and
    // the narrow one on the second, and a probe through `transportFrames`
    // says the first is the dorsal direction and the second is ±x. So "wide
    // and shallow" was being applied to the wrong pair, and the foot came out
    // 3.7 cm across and 8 cm tall — standing on its edge.
    const fr = taper([
      [0, 0.026], // inside the ankle
      [0.2, 0.033], // heel
      [0.45, 0.031], // midfoot
      [0.74, 0.031], // ball
      [1, 0.014], // toes
    ]);
    made[`foot${s}`] = push(
      sweep(
        mat,
        [
          [k * 0.092, -0.479, -0.008],
          [k * 0.092, -0.513, -0.032], // heel
          [k * 0.092, -0.5295, -0.004], // under the heel
          [k * 0.0925, -0.5325, 0.05], // midfoot, over the arch
          [k * 0.093, -0.5335, 0.104], // ball
          [k * 0.0935, -0.5345, 0.15], // toes
        ],
        (t, th) => {
          // Wide across, flat through: a foot is a plate, and a round one
          // reads as a hoof. The heel is the exception — it is deep rather
          // than wide, which is why `through` starts high.
          const across = 0.78 + 0.55 * smooth(0.08, 0.55, t);
          const through = 0.98 - 0.52 * smooth(0.12, 0.78, t);
          // The transported frame turns over as the path rounds the heel: a
          // probe puts θ = 0 up-and-back at the heel and straight DOWN from
          // the midfoot on, with θ = π/2 on +x throughout. So along the part
          // of the foot that has an arch, the sole is +cos and not −cos —
          // which is the opposite of the dorsum-first reading the arm and leg
          // use, and getting it backwards hollows out the instep.
          const sole = Math.max(0, Math.cos(th));
          const med = Math.max(0, -k * Math.sin(th));
          // THE ARCH. The instep lifts off the ground on the inside, and the
          // hollow under it is the one thing that stops a foot being a wedge.
          let d = -0.24 * gauss(t, 0.47, 0.13) * sole * (0.3 + 0.7 * med);
          // The ball of the foot, under the metatarsal heads.
          d += 0.1 * gauss(t, 0.76, 0.1) * sole;
          const rr = fr(t) * (1 + d);
          return ellipse(th, rr * through, rr * across);
        },
        { stations: 52, radial: 28, seed: new THREE.Vector3(0, 1, 0) },
      ),
    );
  });

  // ---- rig -----------------------------------------------------------
  //
  // TWO KINDS OF RIG, because the figure has two kinds of surface.
  //
  // The head, neck and feet are rigid: they belong to exactly one joint and
  // move with it whole, so they go on groups, and `pivotAt` is unchanged.
  //
  // The arms and legs are SKINNED, because each is one uninterrupted sweep from
  // shoulder to fingertip and from hip to ankle. That was a deliberate choice —
  // the joints read from the pinch in the taper, not from a ball dropped in —
  // and it is what removed the joint seams. A group rig cannot bend a single
  // mesh, so the elbow and the knee did not exist and the forearm rotated about
  // the shoulder. Blending each vertex between two bones bends the surface
  // without cutting it.
  //
  // Rotations stay small on purpose. These surfaces meet by overlapping — the
  // arm's domed top is buried inside the shoulder yoke — and a large rotation
  // would drag it out into the open and reopen the seam the last pass closed.
  const rig = {
    head: pivotAt(group, PIVOTS.head, [made.head, made.neck], "head"),
    footL: null,
    footR: null,
  };

  // ORDER MATTERS HERE AND IT IS THE ONE THING THAT IS EASY TO GET WRONG.
  //
  // `new THREE.Skeleton(bones)` computes each bone's inverse from its
  // `matrixWorld`. A bone that has never been in the scene graph has an
  // identity `matrixWorld`, so building the skeleton first gives every bone an
  // identity inverse — and then each bone matrix is its full world transform
  // instead of a delta from rest, which detaches every limb and scatters it.
  //
  // So: parent the bones, update their world matrices while the figure is still
  // at rest, and only then take the inverses.
  ["armL", "armR", "legL", "legR"].forEach((n) => group.add(bones.bones[n]));
  group.updateMatrixWorld(true);
  const skeleton = new THREE.Skeleton(bones.list);

  // `bindMatrix` is the identity because every surface in this file is authored
  // in WORLD coordinates and the mesh's own local transform is identity. Under
  // the default attached bind mode three recomputes `bindMatrixInverse` from
  // the mesh's current world matrix each frame, so the group's sway applies
  // exactly once — the same cancellation `pivotAt` gets for free.
  [made.armL, made.armR, made.legL, made.legR].forEach((m) => {
    m.bind(skeleton, new THREE.Matrix4());
  });

  // The feet stay rigid and ride the ankle bone, which is the distal end of the
  // chain the shank is skinned to — so a foot follows a bending knee without
  // being deformed by it, which is what a foot does.
  [
    ["L", made.footL],
    ["R", made.footR],
  ].forEach(([s, foot]) => {
    const at = CHAIN[`ankle${s}`].at;
    foot.geometry.translate(-at[0], -at[1], -at[2]);
    bones.bones[`ankle${s}`].add(foot);
    rig[`foot${s}`] = foot;
  });

  // Every joint in the chain is addressable by name, so `pose()` can write to
  // an elbow the same way it writes to a shoulder, and the oncology shell —
  // which recovers its rig by name from a clone — finds all of them.
  Object.keys(CHAIN).forEach((n) => {
    if (!rig[n]) rig[n] = bones.bones[n];
  });

  return { group, material: mat, parts, rig, skeleton };
}

export { v3 };
