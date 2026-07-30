import * as THREE from "three";
import { v3 } from "./geometry";

/**
 * The translucent mannequin the organs sit inside.
 *
 * Deliberately not detailed. It is a container: light passes through it so the
 * organs read as being *within* a body rather than floating beside one, and
 * every surface it has is one the organs have to fit inside. Detail here would
 * compete with the thing the screen is actually about.
 *
 * AXES. +y is up and +z is anterior — the figure faces the camera. That fixes
 * the third axis: someone facing +z with +y up has their right hand toward −x,
 * so the subject's right is NEGATIVE x, and a viewer sees it on their own left
 * exactly as an anatomical plate does. The L/R pairs below were the other way
 * round, which put every asymmetric organ built against them on the wrong side.
 *
 * The figure is driven by a joint map rather than a stack of floating
 * capsules. Limbs are tapered bones drawn between named joints, with a sphere
 * at each articulation, so the elbow, knee and wrist read as places the body
 * bends instead of as seams between two pills.
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
  [["L"], ["R"]].forEach(([s]) => {
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
