import * as THREE from "three";

/**
 * A procedural anatomy.
 *
 * Everything here is built from primitives and curves rather than a loaded
 * model: the app ships no binary assets, works offline, and the organ meshes
 * stay individually addressable so a zone can light exactly its own anatomy.
 *
 * Units are metres-ish; the figure is about 1.8 tall and centred on the origin.
 */

const SEG = 24;

/** Frosted-mannequin body — light passes through it so organs read inside. */
export function makeBodyMaterial() {
  return new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    roughness: 0.62,
    metalness: 0,
    transmission: 0.55,
    thickness: 0.7,
    ior: 1.25,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    clearcoat: 0.5,
    clearcoatRoughness: 0.6,
  });
}

function capsule(radius, length, mat) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(radius, length, 8, SEG), mat);
}

/**
 * Torso as a lofted stack of ellipse rings — a capsule reads as a pill, and
 * the shoulder-to-waist taper is what makes the figure read as a person.
 */
function torsoGeometry() {
  const rings = [
    { y: 0.72, rx: 0.19, rz: 0.11 }, // shoulders
    { y: 0.58, rx: 0.185, rz: 0.115 },
    { y: 0.42, rx: 0.16, rz: 0.105 },
    { y: 0.26, rx: 0.145, rz: 0.1 }, // waist
    { y: 0.12, rx: 0.165, rz: 0.11 }, // hips
    { y: 0.02, rx: 0.16, rz: 0.11 },
  ];
  const radial = 32;
  const positions = [];
  const indices = [];

  rings.forEach((ring) => {
    for (let i = 0; i < radial; i++) {
      const a = (i / radial) * Math.PI * 2;
      positions.push(Math.cos(a) * ring.rx, ring.y, Math.sin(a) * ring.rz);
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

  // Caps, so the torso is a closed solid and transmission behaves.
  const topCentre = positions.length / 3;
  positions.push(0, rings[0].y + 0.03, 0);
  for (let i = 0; i < radial; i++) indices.push(topCentre, i, (i + 1) % radial);

  const bottomCentre = positions.length / 3;
  const last = (rings.length - 1) * radial;
  positions.push(0, rings[rings.length - 1].y - 0.03, 0);
  for (let i = 0; i < radial; i++)
    indices.push(bottomCentre, last + ((i + 1) % radial), last + i);

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geo.setIndex(indices);
  geo.computeVertexNormals();
  return geo;
}

/** The translucent figure. Returns the group plus its meshes for later tinting. */
export function buildBody() {
  const mat = makeBodyMaterial();
  const group = new THREE.Group();
  const parts = [];

  const add = (mesh, x, y, z, rot) => {
    mesh.position.set(x, y, z);
    if (rot) mesh.rotation.z = rot;
    group.add(mesh);
    parts.push(mesh);
    return mesh;
  };

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.115, SEG, SEG), mat);
  head.scale.set(1, 1.18, 1.02);
  add(head, 0, 0.95, 0);

  add(capsule(0.05, 0.06, mat), 0, 0.82, 0); // neck

  const torso = new THREE.Mesh(torsoGeometry(), mat);
  group.add(torso);
  parts.push(torso);

  // Arms hang slightly out from the body so the silhouette stays readable.
  add(capsule(0.045, 0.26, mat), -0.235, 0.5, 0, 0.09);
  add(capsule(0.04, 0.24, mat), -0.28, 0.19, 0, 0.06);
  add(capsule(0.045, 0.26, mat), 0.235, 0.5, 0, -0.09);
  add(capsule(0.04, 0.24, mat), 0.28, 0.19, 0, -0.06);

  add(capsule(0.07, 0.28, mat), -0.085, -0.2, 0);
  add(capsule(0.055, 0.28, mat), -0.085, -0.56, 0);
  add(capsule(0.07, 0.28, mat), 0.085, -0.2, 0);
  add(capsule(0.055, 0.28, mat), 0.085, -0.56, 0);

  return { group, material: mat, parts };
}

/** Organ material: unlit-ish core that can be driven purely by emissive. */
function organMaterial(color) {
  return new THREE.MeshStandardMaterial({
    color,
    emissive: new THREE.Color(color),
    emissiveIntensity: 0,
    roughness: 0.35,
    metalness: 0,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
}

/** Brain — a sphere pushed around so it reads as lobed rather than a ball. */
function buildBrain(color) {
  const geo = new THREE.SphereGeometry(0.088, 40, 30);
  const pos = geo.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const gyri =
      Math.sin(v.x * 46) * Math.cos(v.z * 40) * 0.0035 +
      Math.sin(v.y * 34) * 0.0022;
    // Flatten the underside and deepen the midline fissure.
    const midline = 1 - Math.exp(-Math.abs(v.x) * 26) * 0.16;
    v.multiplyScalar(1 + gyri);
    v.x *= midline;
    v.y *= v.y < 0 ? 0.82 : 1;
    v.z *= 1.14;
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();

  const group = new THREE.Group();
  const mat = organMaterial(color);
  const brain = new THREE.Mesh(geo, mat);
  group.add(brain);

  // Brain stem, so the neuro zone visibly connects to the spine.
  const stem = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.018, 0.07, 6, 14),
    mat,
  );
  stem.position.set(0, -0.085, -0.01);
  group.add(stem);

  group.position.set(0, 0.965, 0.005);
  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.96, 0) };
}

/** Heart plus the great vessels, so "cardiovascular" looks vascular. */
function buildCardio(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  const heart = new THREE.Mesh(new THREE.SphereGeometry(0.062, 28, 24), mat);
  heart.scale.set(1, 1.22, 0.86);
  heart.rotation.z = -0.22;
  heart.position.set(-0.022, 0.58, 0.035);
  group.add(heart);

  const apex = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.075, 24), mat);
  apex.position.set(-0.04, 0.505, 0.035);
  apex.rotation.z = 0.3;
  group.add(apex);

  // Vessel tree: aorta over the arch, carotids up the neck, iliacs down.
  const vessel = (points, radius) => {
    const curve = new THREE.CatmullRomCurve3(
      points.map((p) => new THREE.Vector3(...p)),
    );
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(curve, 48, radius, 10, false),
      mat,
    );
    group.add(tube);
    return tube;
  };

  // Aortic arch and descending aorta.
  vessel(
    [
      [-0.01, 0.6, 0.03],
      [0.0, 0.68, 0.02],
      [0.02, 0.71, -0.005],
      [0.03, 0.66, -0.03],
      [0.028, 0.5, -0.035],
      [0.02, 0.34, -0.03],
      [0.012, 0.2, -0.02],
    ],
    0.014,
  );
  // Carotids.
  vessel(
    [
      [0.012, 0.7, -0.005],
      [0.03, 0.78, 0.005],
      [0.035, 0.87, 0.012],
    ],
    0.008,
  );
  vessel(
    [
      [0.005, 0.7, -0.005],
      [-0.025, 0.78, 0.005],
      [-0.032, 0.87, 0.012],
    ],
    0.008,
  );
  // Subclavians out to the shoulders.
  vessel(
    [
      [0.02, 0.705, -0.005],
      [0.1, 0.71, 0.0],
      [0.19, 0.66, 0.0],
    ],
    0.007,
  );
  vessel(
    [
      [0.0, 0.705, -0.005],
      [-0.1, 0.71, 0.0],
      [-0.19, 0.66, 0.0],
    ],
    0.007,
  );
  // Iliac / femoral split.
  vessel(
    [
      [0.012, 0.2, -0.02],
      [0.05, 0.12, -0.01],
      [0.085, -0.05, 0.0],
      [0.085, -0.3, 0.0],
    ],
    0.008,
  );
  vessel(
    [
      [0.012, 0.2, -0.02],
      [-0.03, 0.12, -0.01],
      [-0.085, -0.05, 0.0],
      [-0.085, -0.3, 0.0],
    ],
    0.008,
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.58, 0.05) };
}

/** Pancreas and liver — the metabolic pair. */
function buildMetabolic(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  const pancreas = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.024, 0.13, 6, 18),
    mat,
  );
  pancreas.rotation.z = Math.PI / 2 - 0.24;
  pancreas.position.set(-0.01, 0.35, 0.0);
  group.add(pancreas);

  const liver = new THREE.Mesh(new THREE.SphereGeometry(0.075, 26, 20), mat);
  liver.scale.set(1.25, 0.62, 0.72);
  liver.position.set(0.05, 0.42, 0.028);
  liver.rotation.z = -0.16;
  group.add(liver);

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.38, 0.04) };
}

/**
 * Systemic — the lymphatic-ish network plus a whole-figure shell.
 * Cancer has no single organ, so the entire body is the anatomy here.
 */
function buildSystemic(color, bodyParts) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  mat.side = THREE.BackSide;

  bodyParts.forEach((part) => {
    const shell = new THREE.Mesh(part.geometry, mat);
    shell.position.copy(part.position);
    shell.rotation.copy(part.rotation);
    shell.scale.copy(part.scale).multiplyScalar(1.06);
    group.add(shell);
  });

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.3, 0) };
}

/**
 * Organ systems keyed to the four screening zones.
 * `bodyParts` is only needed by the systemic shell.
 */
export function buildOrgans(bodyParts) {
  return {
    neuro: buildBrain(0xff8a5c),
    cardio: buildCardio(0xff6b6b),
    metab: buildMetabolic(0xffc14d),
    systemic: buildSystemic(0x8ab4ff, bodyParts),
  };
}

/** Soft additive halo behind an organ — the "glow blob" over the region. */
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
