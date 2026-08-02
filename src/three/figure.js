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
  k -= (0.05 + 0.02 * g(y, 0.4, 0.09)) *
    g(dTheta(a, (3 * Math.PI) / 2), 0, 0.3) *
    smooth(0.78, 0.7, y) * smooth(0.16, 0.24, y);

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
    { y: 0.776, rx: 0.044, rz: 0.04 },
    { y: 0.768, rx: 0.076, rz: 0.058 },
    { y: 0.762, rx: 0.1, rz: 0.07 },
    { y: 0.758, rx: 0.118, rz: 0.08 },
    { y: 0.744, rx: 0.158, rz: 0.091 },
    { y: 0.728, rx: 0.176, rz: 0.099 },
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
      [0.06, 0.052],
      [0.24, 0.042], // upper arm
      [0.45, 0.033], // elbow — the narrowing IS the joint
      [0.57, 0.037], // forearm belly
      [0.84, 0.023], // wrist
      [0.9, 0.03], // palm
      [1, 0.013], // fingers
    ]);
    made[`arm${s}`] = push(
      sweep(
        mat,
        [
          [k * 0.166, 0.786, -0.002],
          [k * 0.178, 0.752, 0.0],
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
          const rr = r(t) * domeStart(t, 0.075);
          // The hand flattens: thin across the palm, wider front to back.
          const flat = smooth(0.86, 0.96, t);
          return ellipse(th, rr * (1 + 0.5 * flat), rr * (1 - 0.42 * flat));
        },
        { stations: 70, radial: 26, seed: new THREE.Vector3(0, 0, 1) },
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
      [0.52, 0.046], // knee
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
        (t, th) => {
          const rr = r(t) * domeStart(t, 0.055);
          return ellipse(th, rr * 0.96, rr);
        },
        { stations: 56, radial: 26, seed: new THREE.Vector3(0, 0, 1) },
      ),
    );

    // Foot, starting at the ankle radius so the join has no silhouette.
    const fr = taper([
      [0, 0.027],
      [0.3, 0.032],
      [0.8, 0.03],
      [1, 0.016],
    ]);
    made[`foot${s}`] = push(
      sweep(
        mat,
        [
          J[`ankle${s}`],
          [k * 0.092, -0.506, 0.014],
          [k * 0.092, -0.522, 0.05],
          J[`toe${s}`],
        ],
        (t, th) => {
          // Wide and shallow: a foot is flat, and a round one reads as a hoof.
          const spread = 0.55 + 0.75 * smooth(0, 0.5, t);
          return ellipse(th, fr(t) * spread, fr(t) * 0.62);
        },
        { stations: 26, radial: 20, seed: new THREE.Vector3(0, 1, 0) },
      ),
    );
  });

  // ---- rig -----------------------------------------------------------
  //
  // Five hinges, which is all a figure this size needs to read as alive: the
  // head nods, each arm swings from its shoulder, each leg from its hip. The
  // foot rides with its leg, so it is parented into the same pivot rather than
  // given one of its own.
  //
  // Rotations stay small on purpose. These surfaces meet by overlapping — the
  // arm's domed top is buried inside the shoulder yoke — and a large rotation
  // would drag it out into the open and reopen the seam the last pass closed.
  const rig = {
    head: pivotAt(group, [0, 0.855, -0.004], [made.head, made.neck], "head"),
    armL: pivotAt(group, J.shoulderL, [made.armL], "armL"),
    armR: pivotAt(group, J.shoulderR, [made.armR], "armR"),
    legL: pivotAt(group, J.hipL, [made.legL, made.footL], "legL"),
    legR: pivotAt(group, J.hipR, [made.legR, made.footR], "legR"),
  };

  return { group, material: mat, parts, rig };
}

export { v3 };
