import * as THREE from "three";
import { domeStart, ellipse, ellipsoid, smooth, sweep, v3 } from "./geometry";

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
 * Torso lofted through ellipse rings keyed to the spine joints. A capsule
 * reads as a pill; the shoulder-to-waist-to-hip taper is what makes the
 * figure read as a person.
 */
function torsoGeometry() {
  const rings = [
    // Narrow at the neck, then out to the shoulder line in one step. The yoke
    // is what the arms grow out of; without it they had to be buried in the
    // chest, and burying them meant the sweep started sideways and its end cap
    // stood off the shoulder as a flat disc.
    { y: 0.772, rx: 0.072, rz: 0.06 },
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
    // Closes over the hips rather than stopping above them: the legs now start
    // inside this surface, so there is no pelvis sphere to overlap it.
    { y: 0.135, rx: 0.152, rz: 0.098 },
    { y: 0.105, rx: 0.126, rz: 0.084 },
  ];
  const radial = 34;
  const positions = [];
  const indices = [];

  rings.forEach((ring) => {
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      // Slight front/back asymmetry: chest forward, back flatter.
      const z = Math.sin(a) * ring.rz * (Math.sin(a) > 0 ? 1.06 : 0.92);
      positions.push(Math.cos(a) * ring.rx, ring.y, z);
    }
  });

  for (let r = 0; r < rings.length - 1; r++) {
    for (let i = 0; i < radial; i++) {
      const a = r * radial + i;
      const b = r * radial + ((i + 1) % radial);
      const c = (r + 1) * radial + i;
      const d = (r + 1) * radial + ((i + 1) % radial);
      // Rings run top to bottom and θ runs +x toward +z, so winding round θ
      // first is what puts the normal on the OUTSIDE. It was the other way
      // round, which meant the torso had been rendering inside-out since it
      // was written — invisible while the material was transmissive, and the
      // reason the chest read as a flat dark slab the moment it was not.
      indices.push(a, b, c, b, d, c);
    }
  }

  const topC = positions.length / 3;
  // The apex sits INSIDE the neck, so the torso rises out of it as a cone —
  // which is the trapezius. Stopping short left a flat annulus round the neck
  // with a dark rim, and the rim read as a collar.
  positions.push(0, rings[0].y + 0.032, 0);
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
