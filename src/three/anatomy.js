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
  elbowL: [-0.225, 0.5, 0.005],
  elbowR: [0.225, 0.5, 0.005],
  wristL: [-0.255, 0.265, 0.02],
  wristR: [0.255, 0.265, 0.02],
  handL: [-0.263, 0.18, 0.028],
  handR: [0.263, 0.18, 0.028],

  hipL: [-0.082, 0.185, 0],
  hipR: [0.082, 0.185, 0],
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
    opacity: 0.5,
    depthWrite: false,
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

/** The translucent figure, articulated at every major joint. */
export function buildBody() {
  const mat = makeBodyMaterial();
  const group = new THREE.Group();
  const parts = [];
  const push = (m) => {
    group.add(m);
    parts.push(m);
    return m;
  };

  // Head and neck.
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.101, SEG, 18), mat);
  head.position.set(0, 0.958, 0.004);
  head.scale.set(0.94, 1.2, 1.02);
  push(head);
  const jaw = new THREE.Mesh(new THREE.SphereGeometry(0.062, SEG, 14), mat);
  jaw.position.set(0, 0.888, 0.022);
  jaw.scale.set(0.96, 0.78, 1.0);
  push(jaw);
  push(bone(mat, J.neck, J.c7, 0.038, 0.052));

  push(new THREE.Mesh(torsoGeometry(), mat));

  // Clavicles tie the arms into the chest instead of leaving them floating.
  push(bone(mat, [0, 0.752, 0.03], J.shoulderL, 0.016, 0.026));
  push(bone(mat, [0, 0.752, 0.03], J.shoulderR, 0.016, 0.026));

  // Arms: shoulder → elbow → wrist → hand, with a cap at each hinge.
  [
    ["L", -1],
    ["R", 1],
  ].forEach(([s]) => {
    push(joint(mat, J[`shoulder${s}`], 0.049));
    push(bone(mat, J[`shoulder${s}`], J[`elbow${s}`], 0.042, 0.033));
    push(joint(mat, J[`elbow${s}`], 0.034));
    push(bone(mat, J[`elbow${s}`], J[`wrist${s}`], 0.032, 0.023));
    push(joint(mat, J[`wrist${s}`], 0.023));
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.032, 16, 12), mat);
    hand.position.copy(v3(J[`hand${s}`]));
    hand.scale.set(0.72, 1.35, 0.42);
    push(hand);
  });

  // Pelvis, then legs: hip → knee → ankle → foot.
  const pelvis = new THREE.Mesh(new THREE.SphereGeometry(0.105, SEG, 14), mat);
  pelvis.position.set(0, 0.185, 0);
  pelvis.scale.set(1.42, 0.62, 0.94);
  push(pelvis);

  [["L"], ["R"]].forEach(([s]) => {
    push(joint(mat, J[`hip${s}`], 0.055));
    push(bone(mat, J[`hip${s}`], J[`knee${s}`], 0.062, 0.044));
    push(joint(mat, J[`knee${s}`], 0.046));
    push(bone(mat, J[`knee${s}`], J[`ankle${s}`], 0.043, 0.029));
    push(joint(mat, J[`ankle${s}`], 0.028));
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), mat);
    foot.position.copy(v3(J[`toe${s}`]));
    foot.scale.set(0.62, 0.38, 1.5);
    push(foot);
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
    depthWrite: false,
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
  return {
    neuro: buildNeuro(0xd98f5a),
    cardio: buildCardio(0xd1614f),
    endocrine: buildEndocrine(0xc9a13f),
    hepatic: buildHepatic(0xa8763f),
    renal: buildRenal(0x8f7fc4),
    hematology: buildHematology(0xc25f7a),
    pulmonary: buildPulmonary(0x6fa3c4),
    immune: buildImmune(0x64a88f),
    oncology: buildSystemic(0x7f9fd1, bodyParts),
    nutrition: buildNutrition(0x9aa84f),
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
