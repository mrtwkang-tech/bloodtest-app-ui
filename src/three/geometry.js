import * as THREE from "three";

/**
 * The geometry kit the anatomy is built from.
 *
 * WHY THIS FILE EXISTS. Every organ in the first version of this app was a
 * sphere with a non-uniform scale — `blob(mat, [x,y,z], r, [1.28,.62,.78])`
 * was a liver, and a slightly different one was a kidney. A scaled sphere has
 * one axis of symmetry and no way to bend, so it can produce neither the wedge
 * of a liver nor the bean of a kidney nor the twist of a heart. Ten organs
 * built that way all read as the same object in ten colours.
 *
 * Two primitives fix that and between them cover the whole body:
 *
 *   `sweep`     a surface along a centreline whose cross-section is free to
 *               change shape as it goes. Nearly everything is this: gut,
 *               vessels, airway, cord, ribs, and also the solids whose
 *               silhouette is a stack of changing sections — heart, lung,
 *               kidney, spleen, pancreas.
 *   `ellipsoid` a sphere whose vertices are then displaced by a named
 *               function. For organs that are a mass with features cut into
 *               it rather than a tube: brain, liver, bladder.
 *
 * DIMENSIONS ARE IN CENTIMETRES. This is the point of `CM`. A liver written
 * as 24 cm across and 15 cm tall can be checked against a textbook by anyone
 * reading the code; `scale: [1.28, 0.62, 0.78]` can only be checked by
 * rendering it and squinting. Every organ below is written in the units its
 * source is written in.
 *
 * Axes: +x is the subject's right, +y up, +z anterior. The camera sits on +z,
 * so the subject faces the viewer and their right hand falls on the viewer's
 * left — the convention every anatomical plate uses.
 */

/** The figure is 1.587 units from crown to sole, drawn at 176 cm. */
export const CM = 0.00902;
export const cm = (n) => n * CM;

/**
 * Vertebral levels, interpolated between the joints the figure is posed from.
 *
 * Anatomy is described by level, not by height — the diaphragm is at T8, the
 * renal hila at L1, the aortic bifurcation at L4. Naming them once means an
 * organ can be placed where its description puts it, and means two organs
 * that share a landmark cannot drift apart when one of them is edited.
 */
export const LEVEL = {
  C1: 0.885,
  C4: 0.83,
  C7: 0.775,
  T1: 0.746,
  T2: 0.717,
  T3: 0.688,
  T4: 0.658,
  T5: 0.629,
  T6: 0.6,
  T7: 0.577,
  T8: 0.554,
  T9: 0.531,
  T10: 0.509,
  T11: 0.486,
  T12: 0.463,
  L1: 0.44,
  L2: 0.4,
  L3: 0.36,
  L4: 0.32,
  L5: 0.28,
  sacrum: 0.242,
  pubis: 0.174,
};

/**
 * The vertebral curve, as one shared spline.
 *
 * The column is not a straight line: cervical lordosis forward, thoracic
 * kyphosis back, lumbar lordosis forward again. Three structures hang off it
 * at fixed offsets — the vertebrae themselves, the cord behind them, the aorta
 * in front — so defining it once is what keeps them from separating.
 */
export const SPINE = [
  [0, 0.885, 0.006],
  [0, 0.845, 0.001],
  [0, 0.775, -0.012],
  [0, 0.7, -0.024],
  [0, 0.6, -0.029],
  [0, 0.5, -0.024],
  [0, 0.44, -0.013],
  [0, 0.36, -0.004],
  [0, 0.3, -0.008],
  [0, 0.242, -0.026],
];

export const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

/** Hermite ease, used wherever one region has to blend into the next. */
export const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** Signed angular distance, wrapped to ±π. */
export const dTheta = (a, b) => {
  let d = (a - b) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/** An elliptical cross-section, as an offset in the frame's own plane. */
export const ellipse = (th, a, b) => [Math.cos(th) * a, Math.sin(th) * b];

/**
 * Rounding factors for the ends of a sweep.
 *
 * The end cap is a fan from the last ring to a single point, so a profile that
 * still has radius when it gets there produces a cone. That is wrong for
 * almost everything in the body: a kidney's poles, a lung's apex, the apex of
 * the heart and the fundus of the gallbladder are all domes. Multiplying the
 * profile by one of these takes the radius to zero with a vertical tangent,
 * which is what a dome is.
 */
export const domeEnd = (t, w = 0.14) =>
  Math.sqrt(Math.max(0, 1 - smooth(1 - w, 1, t) ** 2));
export const domeStart = (t, w = 0.14) =>
  Math.sqrt(Math.max(0, 1 - smooth(w, 0, t) ** 2));
/** Both ends at once, staying full through the middle. */
export const capsule = (t, p = 3.4, q = 0.42) =>
  (1 - Math.abs(2 * t - 1) ** p) ** q;

/**
 * A soft channel centred on `at`. Fissures, sulci and the grooves that mark
 * out chambers are all this: a local reduction in radius rather than a cut,
 * because a groove is what reads at this scale and a cut costs a second mesh.
 */
export const groove = (x, at, width, depth) =>
  1 - depth * Math.exp(-(((x - at) / width) ** 2));

/** The same, in angle, so it wraps correctly around a cross-section. */
export const grooveAt = (th, at, width, depth) =>
  1 - depth * Math.exp(-((dTheta(th, at) / width) ** 2));

/**
 * Parallel-transport frames along a curve.
 *
 * Three.js ships Frenet frames, which flip at inflection points — on a curve
 * like the duodenal C-loop or the aortic arch that shows up as the surface
 * suddenly wringing itself round. Transporting one seed normal along the curve
 * instead gives a frame that never flips, and — more useful here — one whose
 * θ = 0 direction is a fact you chose. Aiming the seed medially is how the
 * kidney's hilum ends up facing the midline instead of wherever the maths put
 * it.
 */
function transportFrames(curve, stations, seed) {
  const T = [];
  for (let i = 0; i <= stations; i++) {
    T.push(curve.getTangentAt(i / stations).normalize());
  }
  const N = [];
  const B = [];
  const n = seed.clone().normalize();
  if (Math.abs(n.dot(T[0])) > 0.98) n.set(0, 0, 1);
  n.addScaledVector(T[0], -n.dot(T[0])).normalize();

  for (let i = 0; i <= stations; i++) {
    if (i > 0) {
      n.applyQuaternion(
        new THREE.Quaternion().setFromUnitVectors(T[i - 1], T[i]),
      );
      n.addScaledVector(T[i], -n.dot(T[i]));
      if (n.lengthSq() < 1e-9) n.set(0, 0, 1).addScaledVector(T[i], -T[i].z);
      n.normalize();
    }
    N.push(n.clone());
    B.push(new THREE.Vector3().crossVectors(T[i], n).normalize());
  }
  return { N, B };
}

/**
 * A surface swept along a centreline.
 *
 * `profile(t, theta)` returns `[u, v]` — the offset from the centreline in the
 * frame's own plane — so a cross-section can be elliptical, notched, flattened
 * on one side, rippled, or all four, without any new primitive. An ellipse is
 * `[a·cos θ, b·sin θ]` and reads as one; a colon's haustra are that times a
 * ripple in `t`; a lung's oblique fissure is a groove whose angle moves as `t`
 * descends, which is exactly how the fissure runs.
 */
export function sweep(mat, pts, profile, opts = {}) {
  const {
    stations = 40,
    radial = 18,
    seed = new THREE.Vector3(1, 0, 0),
    caps = true,
    tension = 0.5,
  } = opts;

  const curve = new THREE.CatmullRomCurve3(
    pts.map(v3),
    false,
    "catmullrom",
    tension,
  );
  const { N, B } = transportFrames(curve, stations, seed);

  const position = [];
  const index = [];
  const p = new THREE.Vector3();

  for (let i = 0; i <= stations; i++) {
    const t = i / stations;
    curve.getPointAt(t, p);
    for (let j = 0; j < radial; j++) {
      const th = (j / radial) * Math.PI * 2;
      const [u, v] = profile(t, th);
      position.push(
        p.x + N[i].x * u + B[i].x * v,
        p.y + N[i].y * u + B[i].y * v,
        p.z + N[i].z * u + B[i].z * v,
      );
    }
  }

  for (let i = 0; i < stations; i++) {
    for (let j = 0; j < radial; j++) {
      const a = i * radial + j;
      const b = i * radial + ((j + 1) % radial);
      const c = (i + 1) * radial + j;
      const d = (i + 1) * radial + ((j + 1) % radial);
      // (N, B, T) is right-handed, so winding round θ first and along the
      // path second is what puts the face normal on the outside.
      index.push(a, b, c, b, d, c);
    }
  }

  if (caps) {
    const head = position.length / 3;
    const p0 = curve.getPointAt(0);
    position.push(p0.x, p0.y, p0.z);
    for (let j = 0; j < radial; j++) index.push(head, (j + 1) % radial, j);

    const tail = position.length / 3;
    const p1 = curve.getPointAt(1);
    position.push(p1.x, p1.y, p1.z);
    const last = stations * radial;
    for (let j = 0; j < radial; j++) {
      index.push(tail, last + j, last + ((j + 1) % radial));
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(position, 3));
  geo.setIndex(index);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

/** A plain round tube. Vessels, ducts and nerves are all this. */
export function tube(mat, pts, r, opts = {}) {
  return sweep(mat, pts, (_, th) => ellipse(th, r, r), {
    radial: 10,
    stations: 30,
    ...opts,
  });
}

/**
 * A sphere scaled to `radii`, then displaced by `warp(v, dir)`.
 *
 * `v` arrives already scaled and is edited in place; `dir` is the original
 * unit direction, which is what a warp actually wants to test — "is this
 * vertex on the anterior surface", "how far round to the left is it" — since
 * the scaled position confounds direction with size.
 */
export function ellipsoid(mat, centre, radii, warp, seg = 34) {
  const geo = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.72));
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  const dir = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    dir.fromBufferAttribute(pos, i);
    v.set(dir.x * radii[0], dir.y * radii[1], dir.z * radii[2]);
    if (warp) warp(v, dir);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const m = new THREE.Mesh(geo, mat);
  m.position.set(centre[0], centre[1], centre[2]);
  return m;
}

/** A string of nodes along a path — every lymphatic chain in the body. */
export function chain(mat, group, pts, count, r) {
  const curve = new THREE.CatmullRomCurve3(pts.map(v3));
  for (let i = 0; i < count; i++) {
    const p = curve.getPointAt(count === 1 ? 0.5 : i / (count - 1));
    group.add(ellipsoid(mat, [p.x, p.y, p.z], [r, r * 1.45, r], null, 12));
  }
}

/** A point on the vertebral curve, offset anteriorly (+) or posteriorly (−). */
export function onSpine(y, dz = 0, dx = 0) {
  const curve = new THREE.CatmullRomCurve3(SPINE.map(v3));
  // The spline runs top to bottom, so search it for the requested level.
  let lo = 0;
  let hi = 1;
  for (let i = 0; i < 24; i++) {
    const mid = (lo + hi) / 2;
    if (curve.getPointAt(mid).y > y) lo = mid;
    else hi = mid;
  }
  const p = curve.getPointAt((lo + hi) / 2);
  return [p.x + dx, p.y, p.z + dz];
}
