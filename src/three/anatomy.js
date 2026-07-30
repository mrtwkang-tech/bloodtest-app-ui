import * as THREE from "three";

/**
 * A procedural anatomy.
 *
 * Built from primitives and curves rather than a loaded model: the app ships
 * no binary assets, works offline, and every organ stays individually
 * addressable so a system can light exactly its own structures.
 *
 * The figure is driven by a joint map rather than a stack of floating
 * capsules. Limbs are tapered bones drawn between named joints, with a
 * sphere at each articulation, so the elbow, knee and wrist read as places
 * the body actually bends instead of as seams between two pills.
 *
 * Units are metres-ish; the figure is about 1.8 tall, centred on the origin.
 */

const SEG = 20;

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

  shoulderL: [-0.175, 0.735, 0],
  shoulderR: [0.175, 0.735, 0],
  elbowL: [-0.243, 0.498, 0.006],
  elbowR: [0.243, 0.498, 0.006],
  wristL: [-0.272, 0.262, 0.022],
  wristR: [0.272, 0.262, 0.022],
  handL: [-0.263, 0.18, 0.028],
  handR: [0.263, 0.18, 0.028],

  hipL: [-0.086, 0.185, 0],
  hipR: [0.086, 0.185, 0],
  kneeL: [-0.088, -0.145, 0.012],
  kneeR: [0.088, -0.145, 0.012],
  ankleL: [-0.092, -0.475, -0.005],
  ankleR: [0.092, -0.475, -0.005],
  toeL: [-0.092, -0.525, 0.075],
  toeR: [0.092, -0.525, 0.075],
};

const v3 = (a) => new THREE.Vector3(a[0], a[1], a[2]);

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
    opacity: 0.38,
    // Writing depth is what stops overlapping body surfaces from compounding
    // into bright seams at the shoulders and hips.
    depthWrite: true,
    clearcoat: 0.45,
    clearcoatRoughness: 0.55,
  });
}

/** A tapered bone spanning two joints. */
function bone(mat, a, b, rA, rB = rA) {
  const va = v3(a);
  const vb = v3(b);
  const dir = new THREE.Vector3().subVectors(vb, va);
  const len = dir.length();
  const geo = new THREE.CylinderGeometry(rB, rA, len, SEG, 1, false);
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.copy(va).addScaledVector(dir, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    dir.clone().normalize(),
  );
  return mesh;
}

/** A sphere at an articulation, so the limb reads as hinged rather than fused. */
function joint(mat, p, r, squash = 1) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(r, SEG, 14), mat);
  mesh.position.copy(v3(p));
  mesh.scale.set(1, squash, 1);
  return mesh;
}


/**
 * A limb swept as one continuous surface.
 *
 * The previous build was a cylinder per bone plus a sphere per joint. On a
 * translucent material every one of those intersections shows as a bright
 * lens of doubled density — which is what made the elbows and knees look
 * unpleasant. Sweeping a single varying-radius tube along a smooth spline
 * removes the intersections entirely, and rounding the caps means the limb
 * ends without a visible lid.
 */
function limb(mat, nodes, { segments = 44, radial = 22, capStart = true, capEnd = true } = {}) {
  const curve = new THREE.CatmullRomCurve3(
    nodes.map((n) => v3(n.p)),
    false,
    "catmullrom",
    0.4,
  );
  const frames = curve.computeFrenetFrames(segments, false);
  const positions = [];
  const indices = [];

  // Radius is interpolated across the node list, eased so the taper reads as
  // muscle rather than as a cone.
  const radiusAt = (t) => {
    const x = t * (nodes.length - 1);
    const i = Math.min(nodes.length - 2, Math.floor(x));
    const f = x - i;
    const e = f * f * (3 - 2 * f);
    return nodes[i].r * (1 - e) + nodes[i + 1].r * e;
  };

  const ring = (centre, normal, binormal, r) => {
    const base = positions.length / 3;
    for (let j = 0; j < radial; j++) {
      const a = (j / radial) * Math.PI * 2;
      positions.push(
        centre.x + (normal.x * Math.cos(a) + binormal.x * Math.sin(a)) * r,
        centre.y + (normal.y * Math.cos(a) + binormal.y * Math.sin(a)) * r,
        centre.z + (normal.z * Math.cos(a) + binormal.z * Math.sin(a)) * r,
      );
    }
    return base;
  };

  const rings = [];
  const CAP = 5;

  // Rounded start cap: rings that shrink back along the tangent.
  if (capStart) {
    const p0 = curve.getPointAt(0);
    const t0 = curve.getTangentAt(0);
    const r0 = radiusAt(0);
    for (let k = CAP; k >= 1; k--) {
      const a = (k / CAP) * (Math.PI / 2);
      const c = p0.clone().addScaledVector(t0, -Math.sin(a) * r0);
      rings.push(ring(c, frames.normals[0], frames.binormals[0], Math.cos(a) * r0));
    }
  }

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    rings.push(ring(curve.getPointAt(t), frames.normals[i], frames.binormals[i], radiusAt(t)));
  }

  if (capEnd) {
    const p1 = curve.getPointAt(1);
    const t1 = curve.getTangentAt(1);
    const r1 = radiusAt(1);
    for (let k = 1; k <= CAP; k++) {
      const a = (k / CAP) * (Math.PI / 2);
      const c = p1.clone().addScaledVector(t1, Math.sin(a) * r1);
      rings.push(ring(c, frames.normals[segments], frames.binormals[segments], Math.cos(a) * r1));
    }
  }

  for (let r = 0; r < rings.length - 1; r++) {
    for (let j = 0; j < radial; j++) {
      const a = rings[r] + j;
      const b = rings[r] + ((j + 1) % radial);
      const c = rings[r + 1] + j;
      const d = rings[r + 1] + ((j + 1) % radial);
      indices.push(a, c, b, b, c, d);
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat);
}

/** Midpoint between two joints, nudged along an axis. */
function mid(a, b, lift = 0) {
  return [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 + lift, (a[2] + b[2]) / 2];
}

/**
 * Torso lofted through ellipse rings keyed to the spine joints. A capsule
 * reads as a pill; the shoulder-to-waist-to-hip taper is what makes the
 * figure read as a person.
 */
function torsoGeometry() {
  const rings = [
    { y: 0.755, rx: 0.155, rz: 0.088 },
    { y: 0.715, rx: 0.183, rz: 0.103 },
    { y: 0.63, rx: 0.176, rz: 0.108 },
    { y: 0.53, rx: 0.158, rz: 0.1 },
    { y: 0.43, rx: 0.139, rz: 0.093 },
    { y: 0.34, rx: 0.133, rz: 0.092 },
    { y: 0.25, rx: 0.152, rz: 0.101 },
    { y: 0.17, rx: 0.158, rz: 0.104 },
    { y: 0.12, rx: 0.143, rz: 0.098 },
  ];
  const radial = 30;
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
      indices.push(a, c, b, b, c, d);
    }
  }

  const topC = positions.length / 3;
  positions.push(0, rings[0].y + 0.02, 0);
  for (let i = 0; i < radial; i++) indices.push(topC, i, (i + 1) % radial);

  const botC = positions.length / 3;
  const last = (rings.length - 1) * radial;
  positions.push(0, rings[rings.length - 1].y - 0.03, 0);
  for (let i = 0; i < radial; i++)
    indices.push(botC, last + ((i + 1) % radial), last + i);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/**
 * The figure: smooth, continuous, android rather than anatomical.
 *
 * Each limb is one swept surface through its joint chain, so an elbow is a
 * change in curvature and radius rather than two solids pushed into each
 * other. The body writes depth and renders after the organs, which stops
 * translucent surfaces from stacking into bright patches where they overlap.
 */
export function buildBody() {
  const mat = makeBodyMaterial();
  const group = new THREE.Group();
  const parts = [];
  const push = (m) => {
    m.renderOrder = 2;
    group.add(m);
    parts.push(m);
    return m;
  };

  // Head: one smooth ovoid, with the jaw as a swept continuation rather than
  // a second ball pressed into the skull.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.098, 40, 30), mat);
  head.position.set(0, 0.952, 0.006);
  head.scale.set(0.95, 1.17, 1.04);
  push(head);

  // Neck flows out of the jaw line and widens into the shoulders.
  push(
    limb(mat, [
      { p: [0, 0.9, 0.012], r: 0.043 },
      { p: [0, 0.858, 0.004], r: 0.041 },
      { p: [0, 0.8, -0.004], r: 0.05 },
    ], { segments: 20, capStart: false, capEnd: false }),
  );

  push(new THREE.Mesh(torsoGeometry(), mat));

  // Shoulder caps: a single sphere blended into the deltoid start of the arm.
  [["L", -1], ["R", 1]].forEach(([s, sign]) => {
    const sh = new THREE.Mesh(new THREE.SphereGeometry(0.056, 26, 20), mat);
    sh.position.set(sign * 0.163, 0.723, 0.004);
    sh.scale.set(1.05, 0.98, 1.0);
    push(sh);

    // One surface, shoulder → elbow → wrist → hand.
    push(
      limb(mat, [
        { p: [sign * 0.162, 0.726, 0.004], r: 0.05 },
        { p: mid(J[`shoulder${s}`], J[`elbow${s}`], 0.012), r: 0.043 },
        { p: J[`elbow${s}`], r: 0.036 },
        { p: mid(J[`elbow${s}`], J[`wrist${s}`], -0.004), r: 0.031 },
        { p: J[`wrist${s}`], r: 0.024 },
        { p: [sign * 0.282, 0.162, 0.032], r: 0.026 },
        { p: [sign * 0.286, 0.126, 0.036], r: 0.014 },
      ]),
    );
  });

  // Pelvis blends the torso base into both legs.
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.1, 30, 22), mat);
  pelvis.position.set(0, 0.188, 0.002);
  pelvis.scale.set(1.4, 0.68, 0.96);
  push(pelvis);

  [["L", -1], ["R", 1]].forEach(([s, sign]) => {
    push(
      limb(mat, [
        { p: [sign * 0.078, 0.212, 0.002], r: 0.066 },
        { p: mid(J[`hip${s}`], J[`knee${s}`], 0.02), r: 0.061 },
        { p: J[`knee${s}`], r: 0.049 },
        { p: mid(J[`knee${s}`], J[`ankle${s}`], 0.03), r: 0.045 },
        { p: J[`ankle${s}`], r: 0.029 },
        { p: [sign * 0.094, -0.512, 0.012], r: 0.03 },
        { p: [sign * 0.094, -0.529, 0.062], r: 0.02 },
      ]),
    );
  });

  return { group, material: mat, parts };
}

/* ------------------------------------------------------------------ organs */

function organMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0,
    roughness: 0.34,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: true,
  });
}

function blob(mat, p, r, scale, rot = 0) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 22, 16), mat);
  m.position.set(p[0], p[1], p[2]);
  m.scale.set(scale[0], scale[1], scale[2]);
  m.rotation.z = rot;
  return m;
}

function tube(mat, pts, radius, group) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => v3(p)));
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(curve, 42, radius, 8, false),
    mat,
  );
  group.add(m);
  return m;
}

/** Brain with a lobed surface, brainstem, and the cord down the spine. */
function buildNeuro(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  const geo = new THREE.SphereGeometry(0.079, 40, 30);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const gyri =
      Math.sin(v.x * 48) * Math.cos(v.z * 42) * 0.0034 +
      Math.sin(v.y * 36) * 0.0021;
    const midline = 1 - Math.exp(-Math.abs(v.x) * 28) * 0.17;
    v.multiplyScalar(1 + gyri);
    v.x *= midline;
    v.y *= v.y < 0 ? 0.8 : 1;
    v.z *= 1.13;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  const brain = new THREE.Mesh(geo, mat);
  brain.position.set(0, 0.972, 0.004);
  group.add(brain);

  // Cerebellum.
  group.add(blob(mat, [0, 0.912, -0.045], 0.034, [1.25, 0.66, 0.86]));
  // Brainstem into the cord, then the cord down to L1.
  tube(mat, [[0, 0.925, -0.012], J.neck, J.c7, J.t6, J.l1], 0.011, group);
  // A few nerve roots so "nerves" is visible, not just "brain".
  [0.66, 0.54, 0.42].forEach((y, i) => {
    const w = 0.075 + i * 0.012;
    tube(
      mat,
      [
        [0, y, -0.01],
        [-w * 0.6, y - 0.01, 0],
        [-w, y - 0.03, 0.01],
      ],
      0.0045,
      group,
    );
    tube(
      mat,
      [
        [0, y, -0.01],
        [w * 0.6, y - 0.01, 0],
        [w, y - 0.03, 0.01],
      ],
      0.0045,
      group,
    );
  });

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.95, 0) };
}

/** Heart, chambers, and the great-vessel tree. */
function buildCardio(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  const heart = blob(mat, [-0.02, 0.6, 0.04], 0.056, [1, 1.18, 0.84], -0.2);
  group.add(heart);
  const apex = new THREE.Mesh(new THREE.ConeGeometry(0.046, 0.07, 22), mat);
  apex.position.set(-0.038, 0.532, 0.04);
  apex.rotation.z = 0.32;
  group.add(apex);
  // Atria, so the heart is not one lump.
  group.add(blob(mat, [-0.048, 0.646, 0.03], 0.026, [1, 0.85, 0.9]));
  group.add(blob(mat, [0.012, 0.648, 0.028], 0.024, [1, 0.85, 0.9]));

  tube(
    mat,
    [
      [-0.008, 0.625, 0.03],
      [0.002, 0.702, 0.018],
      [0.022, 0.732, -0.008],
      [0.031, 0.684, -0.032],
      [0.028, 0.52, -0.036],
      [0.02, 0.36, -0.03],
      [0.012, 0.215, -0.02],
    ],
    0.0135,
    group,
  );
  tube(
    mat,
    [
      [0.014, 0.722, -0.006],
      [0.032, 0.8, 0.004],
      [0.037, 0.888, 0.012],
    ],
    0.0078,
    group,
  );
  tube(
    mat,
    [
      [0.006, 0.722, -0.006],
      [-0.026, 0.8, 0.004],
      [-0.033, 0.888, 0.012],
    ],
    0.0078,
    group,
  );
  tube(
    mat,
    [[0.022, 0.727, -0.005], [0.1, 0.732, 0], J.shoulderR, J.elbowR],
    0.0062,
    group,
  );
  tube(
    mat,
    [[0.0, 0.727, -0.005], [-0.1, 0.732, 0], J.shoulderL, J.elbowL],
    0.0062,
    group,
  );
  tube(
    mat,
    [[0.012, 0.215, -0.02], [0.05, 0.16, -0.01], J.hipR, J.kneeR],
    0.0072,
    group,
  );
  tube(
    mat,
    [[0.012, 0.215, -0.02], [-0.05, 0.16, -0.01], J.hipL, J.kneeL],
    0.0072,
    group,
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.6, 0.05) };
}

/** Lungs with lobes, trachea and main bronchi. */
function buildPulmonary(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Right lung: three lobes. Left: two, notched for the heart.
  group.add(blob(mat, [0.075, 0.685, 0.005], 0.049, [1, 0.72, 0.92]));
  group.add(blob(mat, [0.082, 0.612, 0.008], 0.052, [1, 0.78, 0.95]));
  group.add(blob(mat, [0.078, 0.535, 0.004], 0.047, [1, 0.8, 0.9]));
  group.add(blob(mat, [-0.078, 0.685, 0.004], 0.047, [1, 0.72, 0.9]));
  group.add(blob(mat, [-0.086, 0.588, 0.0], 0.05, [0.94, 0.95, 0.9]));

  tube(
    mat,
    [
      [0, 0.83, 0.012],
      [0, 0.762, 0.008],
      [0, 0.716, 0.006],
    ],
    0.011,
    group,
  );
  tube(
    mat,
    [
      [0, 0.716, 0.006],
      [0.042, 0.688, 0.005],
      [0.07, 0.664, 0.005],
    ],
    0.007,
    group,
  );
  tube(
    mat,
    [
      [0, 0.716, 0.006],
      [-0.042, 0.688, 0.005],
      [-0.07, 0.664, 0.005],
    ],
    0.007,
    group,
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.63, 0.04) };
}

/** Liver, gallbladder and bile duct. */
function buildHepatic(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  group.add(blob(mat, [0.052, 0.452, 0.03], 0.072, [1.28, 0.62, 0.78], -0.14));
  group.add(blob(mat, [-0.028, 0.442, 0.028], 0.045, [1.05, 0.52, 0.7], 0.1));
  group.add(blob(mat, [0.038, 0.402, 0.052], 0.019, [0.8, 1.25, 0.8]));
  tube(
    mat,
    [
      [0.038, 0.392, 0.05],
      [0.022, 0.368, 0.038],
      [0.006, 0.352, 0.022],
    ],
    0.005,
    group,
  );
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.43, 0.05) };
}

/** Kidneys, ureters and bladder. */
function buildRenal(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  [-1, 1].forEach((s) => {
    group.add(
      blob(
        mat,
        [s * 0.062, 0.395 + (s > 0 ? 0 : 0.012), -0.038],
        0.031,
        [0.72, 1.35, 0.78],
        s * 0.12,
      ),
    );
  });
  tube(
    mat,
    [
      [0.06, 0.365, -0.036],
      [0.05, 0.3, -0.026],
      [0.026, 0.245, -0.014],
    ],
    0.0045,
    group,
  );
  tube(
    mat,
    [
      [-0.06, 0.377, -0.036],
      [-0.05, 0.3, -0.026],
      [-0.026, 0.245, -0.014],
    ],
    0.0045,
    group,
  );
  group.add(blob(mat, [0, 0.222, 0.005], 0.03, [1.1, 0.82, 0.92]));
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.35, 0.02) };
}

/** Thyroid, adrenals and pancreas — the endocrine trio. */
function buildEndocrine(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  // Thyroid lobes either side of the trachea.
  group.add(blob(mat, [-0.022, 0.812, 0.03], 0.019, [0.78, 1.3, 0.78], 0.2));
  group.add(blob(mat, [0.022, 0.812, 0.03], 0.019, [0.78, 1.3, 0.78], -0.2));
  tube(
    mat,
    [
      [-0.016, 0.8, 0.034],
      [0, 0.798, 0.036],
      [0.016, 0.8, 0.034],
    ],
    0.005,
    group,
  );
  // Adrenals, capping the kidneys.
  group.add(blob(mat, [0.06, 0.432, -0.038], 0.016, [1.1, 0.62, 0.9]));
  group.add(blob(mat, [-0.06, 0.444, -0.038], 0.016, [1.1, 0.62, 0.9]));
  // Pancreas.
  const p = new THREE.Mesh(new THREE.CapsuleGeometry(0.019, 0.11, 6, 16), mat);
  p.rotation.z = Math.PI / 2 - 0.22;
  p.position.set(-0.012, 0.372, -0.005);
  group.add(p);
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.55, 0.03) };
}

/** Marrow through the axial skeleton and long bones, plus the spleen. */
function buildHematology(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  tube(mat, [J.c7, J.t6, J.l1, J.l5], 0.017, group);
  // Ribs read as marrow-bearing bone.
  [0.7, 0.655, 0.61, 0.565].forEach((y, i) => {
    const w = 0.13 + i * 0.008;
    tube(
      mat,
      [
        [0, y, -0.02],
        [-w * 0.75, y - 0.008, 0.04],
        [-w * 0.35, y - 0.03, 0.085],
      ],
      0.0055,
      group,
    );
    tube(
      mat,
      [
        [0, y, -0.02],
        [w * 0.75, y - 0.008, 0.04],
        [w * 0.35, y - 0.03, 0.085],
      ],
      0.0055,
      group,
    );
  });
  group.add(blob(mat, [-0.088, 0.472, -0.02], 0.028, [0.86, 1.15, 0.66], 0.2)); // spleen
  tube(mat, [J.hipL, J.kneeL], 0.013, group);
  tube(mat, [J.hipR, J.kneeR], 0.013, group);
  tube(mat, [J.shoulderL, J.elbowL], 0.01, group);
  tube(mat, [J.shoulderR, J.elbowR], 0.01, group);
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.5, 0) };
}

/** Joints and lymph nodes — what a rheumatology panel is actually about. */
function buildImmune(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  [
    "shoulderL",
    "shoulderR",
    "elbowL",
    "elbowR",
    "wristL",
    "wristR",
    "hipL",
    "hipR",
    "kneeL",
    "kneeR",
    "ankleL",
    "ankleR",
  ].forEach((k) => {
    group.add(blob(mat, J[k], 0.03, [1, 1, 1]));
  });
  // Cervical, axillary and inguinal node clusters.
  [
    [-0.045, 0.79, 0.02],
    [0.045, 0.79, 0.02],
    [-0.155, 0.7, 0.01],
    [0.155, 0.7, 0.01],
    [-0.07, 0.215, 0.03],
    [0.07, 0.215, 0.03],
  ].forEach((p) => {
    group.add(blob(mat, p, 0.013, [1, 1, 1]));
  });
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.45, 0) };
}

/** Stomach, small bowel and colon — where nutrients are actually absorbed. */
function buildNutrition(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  group.add(blob(mat, [-0.045, 0.418, 0.022], 0.04, [1.05, 0.85, 0.72], 0.35));
  // Colon frame.
  tube(
    mat,
    [
      [0.072, 0.29, 0.018],
      [0.078, 0.375, 0.02],
      [0.05, 0.408, 0.022],
      [0, 0.415, 0.024],
      [-0.05, 0.405, 0.022],
      [-0.076, 0.36, 0.02],
      [-0.07, 0.285, 0.018],
      [-0.02, 0.258, 0.016],
    ],
    0.0125,
    group,
  );
  // Small bowel coils.
  for (let i = 0; i < 4; i++) {
    const y = 0.355 - i * 0.028;
    const w = 0.048 - i * 0.004;
    const s = i % 2 ? -1 : 1;
    tube(
      mat,
      [
        [-w * s, y, 0.03],
        [0, y - 0.012, 0.038],
        [w * s, y - 0.024, 0.03],
      ],
      0.0088,
      group,
    );
  }
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.36, 0.05) };
}

/**
 * Whole-body shell. Cancer has no single organ, so the systemic view is the
 * figure itself rather than an anchor point.
 */
function buildSystemic(color, bodyParts) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  mat.side = THREE.BackSide;
  bodyParts.forEach((part) => {
    const shell = new THREE.Mesh(part.geometry, mat);
    shell.position.copy(part.position);
    shell.rotation.copy(part.rotation);
    shell.quaternion.copy(part.quaternion);
    shell.scale.copy(part.scale).multiplyScalar(1.055);
    group.add(shell);
  });
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.35, 0) };
}

/** Organ systems keyed to the ten specialty panels. */
export function buildOrgans(bodyParts) {
  // Hues are spread around the wheel rather than clustered in earth tones:
  // with ten systems, "which organ am I looking at" has to survive being
  // answered by colour alone.
  return {
    neuro: buildNeuro(0x7c5cd6),      // violet
    cardio: buildCardio(0xdc3f3f),    // red
    endocrine: buildEndocrine(0xe8a01a), // amber
    hepatic: buildHepatic(0xc2622a),  // burnt orange
    renal: buildRenal(0x17a2a2),      // teal
    hematology: buildHematology(0xd42a72), // magenta
    pulmonary: buildPulmonary(0x2f8fd6),   // sky
    immune: buildImmune(0x3fae55),    // green
    oncology: buildSystemic(0x5f6bd8, bodyParts), // indigo shell
    nutrition: buildNutrition(0x9ec219),  // lime
  };
}

/** Soft additive halo behind an organ. */
export function buildGlow(color) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.4, "rgba(255,255,255,0.35)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);

  const texture = new THREE.CanvasTexture(canvas);
  const mat = new THREE.SpriteMaterial({
    map: texture,
    color,
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
  });
  const sprite = new THREE.Sprite(mat);
  sprite.scale.set(0.5, 0.5, 1);
  return { sprite, material: mat };
}
