import * as THREE from "three";
import { CHAIN, J } from "./figure";
import {
  LEVEL,
  capsule,
  chain,
  cm,
  domeEnd,
  domeStart,
  ellipse,
  ellipsoid,
  dTheta,
  groove,
  grooveAt,
  onSpine,
  smooth,
  sweep,
  tube,
} from "./geometry";

export { J, buildBody, makeBodyMaterial } from "./figure";

/**
 * The eleven organ systems, one per specialty panel.
 *
 * REFERENCE. The proportions, levels and lobar structure here were taken from
 * the open anatomy atlases — BodyParts3D (DBCLS, CC BY-SA 2.1 JP), which is
 * segmented from a real MRI, and Z-Anatomy, which is built on it. They were
 * used as a reference and not as an asset: BodyParts3D is a 930 MB corpus of
 * STL under a share-alike licence, and this app deliberately ships no binary
 * geometry, so every surface below is generated at runtime from the two
 * primitives in `geometry.js` with its dimensions written in centimetres.
 *
 * WHAT "ACCURATE" MEANS AT THIS SIZE. The figure is 340 px tall on a phone, so
 * a liver is about 30 px across. At that size an organ is recognised by its
 * silhouette and by two or three landmarks, not by its surface. So the effort
 * goes into the things that survive being small — the obliquity of the heart,
 * the wedge of the liver and its oblique inferior border, the bean of the
 * kidney with its hilum facing the midline, five lung lobes with the fissures
 * between them, the downward slope of the ribs, the colon's haustra — and not
 * into detail that would be sub-pixel. Where a structure is famous enough that
 * a reader would notice its absence (the splenic notch, the cardiac notch, the
 * appendix, the three arch branches) it is there even when it is small.
 */

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

const round = (th, r) => ellipse(th, r, r);

/**
 * An articular surface: the radius r(cos ψ) about a joint's centre, where ψ is
 * the angle from the joint's own axis.
 *
 * WHY IT HAS TO BE WRITTEN THIS WAY. `ellipsoid` can only DISPLACE vertices, so
 * a socket is a displacement field and not a subtraction, and two properties
 * are what make this field produce a socket rather than a dent:
 *
 *   RADIAL ABOUT THE MATING BONE'S CENTRE OF CURVATURE. Every carved vertex
 *   lands at a chosen distance from that one point, so the carved patch is
 *   exactly a sphere concentric with the head that sits in it. A warp written
 *   `v.x -= depth * max(0, d.x)` instead pushes along a COORDINATE axis: its
 *   deepest point is at the primitive's own +x pole and its floor is a
 *   paraboloid tangent to the surface there. That is a dimple in whatever
 *   direction the sphere happened to be built, not a socket.
 *
 *   MASKED BY A CONE, not by a box or a gaussian in `d.x`. cos ψ is constant on
 *   a cone about the axis, so easing on it puts the rim on a CIRCLE at a chosen
 *   wrap angle, wherever the axis points. The sphere's poles are irrelevant —
 *   which is why the test is on `dir` and never on `v`.
 *
 * And it cannot fold: r(ψ) is single-valued, so the surface is a radial graph
 * and no depth can push it through itself. Additive displacement has no such
 * guarantee, and at these depths it would need one.
 *
 * `radii` is the unit sphere so `|v| = 1` on entry and `setLength` is exact.
 */
function socket(mat, centre, axis, r, seg = 20) {
  const a = new THREE.Vector3(...axis).normalize();
  return ellipsoid(
    mat,
    centre,
    [1, 1, 1],
    (v, d) => v.setLength(r(d.dot(a), d)),
    seg,
  );
}

/* ------------------------------------------------------------------- rig */

/**
 * Marks a mesh as belonging to a limb, so it swings when that limb does.
 *
 * WHY THIS IS NEEDED AT ALL. The figure grew a rig last round and the organs
 * did not. The result was a body that shifted its weight and swung its arms
 * around a skeleton nailed to the floor — the humerus stayed put while the arm
 * containing it moved, and at any real amplitude the bone came out through the
 * skin. Worse than not animating: an organ that ignores the body it is in
 * stops reading as being inside it, which is the one thing this view exists to
 * say.
 *
 * Only structures that are ENTIRELY within a limb are marked. Anything that
 * crosses a joint — a nerve, an artery — is split into two meshes at the joint
 * instead, and the two share that exact point, so the swing puts a bend in it
 * rather than a gap. A nerve bending at the shoulder is what a nerve does.
 */
function rides(name, mesh) {
  mesh.userData.rides = name;
  return mesh;
}

/**
 * Hangs every marked mesh off its joint and hands back the pivots.
 *
 * Same trick as the mannequin's own `pivotAt`: the geometry is written in
 * world coordinates, so it is translated back by the joint and the group is
 * put AT the joint. Every system gets all five pivots whether it uses them or
 * not, so the frame loop can drive any system with one piece of code.
 */
function rigify(group) {
  const rig = {};
  // NESTED, not five siblings. A group per joint, each positioned at its offset
  // FROM ITS PARENT JOINT — which is what makes rotating a shoulder carry the
  // elbow with it, and rotating an elbow leave the shoulder alone. While the
  // table was flat every distal bone was a direct child of a proximal pivot, so
  // the ulna turned about the shoulder and the tibia about the hip.
  Object.entries(CHAIN).forEach(([name, { at, parent }]) => {
    const g = new THREE.Group();
    g.name = name;
    const p = parent ? CHAIN[parent].at : [0, 0, 0];
    g.position.set(at[0] - p[0], at[1] - p[1], at[2] - p[2]);
    rig[name] = g;
  });
  Object.entries(CHAIN).forEach(([name, { parent }]) => {
    (parent ? rig[parent] : group).add(rig[name]);
  });
  // Copy first: re-parenting mutates `children` underneath the iteration.
  group.children
    .filter((o) => o.userData.rides)
    .forEach((m) => {
      const at = CHAIN[m.userData.rides].at;
      // Still the WORLD joint, not the local offset: the geometry is authored
      // in world coordinates and has to come back to the joint it turns about,
      // whatever that joint's parent happens to be.
      m.geometry.translate(-at[0], -at[1], -at[2]);
      rig[m.userData.rides].add(m);
    });
  return rig;
}

/* ------------------------------------------------------------------- neuro */

/** Brain, cerebellum, brainstem, cord and the two great peripheral nerves. */
function buildNeuro(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Cerebrum: 16 × 14 × 9.5 cm, sitting on the floor of the skull rather than
  // centred in it. Three features carry a brain at thumbnail size — the
  // longitudinal fissure, the temporal lobe slung below the Sylvian fissure,
  // and gyri that run in tracts. An isotropic bump map instead of tracts reads
  // as damage, not as convolution.
  //
  // It nods with the head. Its centre is 11 cm above the pivot, so a head that
  // drops 12° and a brain that does not part company by nearly 2 cm — the
  // brain would sit outside the skull it is drawn inside.
  group.add(
    rides(
      "head",
      ellipsoid(
        mat,
        [0, 0.969, 0.004],
        [cm(6.9), cm(4.6), cm(8.1)],
        (v, d) => {
          const taper =
            1 - 0.24 * Math.max(0, d.z) ** 2 - 0.16 * Math.max(0, -d.z) ** 2;
          v.x *= taper;
          // Sylvian fissure runs anteroinferior to posterosuperior; the temporal
          // lobe hangs below it, and only on the lateral surface.
          const syl = d.y + 0.34 * d.z + 0.08;
          v.y -=
            cm(1.7) *
            Math.exp(-((syl / 0.36) ** 2)) *
            Math.min(1, Math.abs(d.x) * 2.4);
          // Deep above, fused below at the corpus callosum.
          v.x *=
            1 - 0.38 * smooth(-0.1, 0.4, d.y) * Math.exp(-Math.abs(d.x) / 0.17);
          if (v.y < 0) v.y *= 0.8;
          const g =
            Math.sin(d.x * 23 + d.z * 8) * Math.cos(d.y * 15 + d.z * 11);
          v.multiplyScalar(1 + g * 0.021);
        },
        54,
      ),
    ),
  );

  // Cerebellum. Its folia are finer and far more regular than cerebral gyri;
  // that difference is how the two are told apart in a plate.
  group.add(
    rides(
      "head",
      ellipsoid(
        mat,
        [0, 0.917, -0.052],
        [cm(5.2), cm(2.4), cm(2.9)],
        (v, d) => {
          v.x *= 1 - 0.22 * Math.exp(-Math.abs(d.x) / 0.2);
          v.multiplyScalar(1 + Math.sin(d.y * 40) * 0.028);
          if (v.y > 0) v.y *= 0.82;
        },
        32,
      ),
    ),
  );

  // Brainstem: midbrain, then the pons bulging forward, then the medulla
  // narrowing into the cord. Rides the head with the rest of the contents of
  // the skull; the cord below is extended up inside it (see next) so the bend
  // between the two happens where nothing can see it.
  group.add(
    rides(
      "head",
      sweep(
        mat,
        [
          [0, 0.949, -0.004],
          [0, 0.934, -0.003],
          [0, 0.919, -0.008],
          [0, 0.901, -0.013],
          [0, 0.886, -0.016],
        ],
        (t, th) => {
          const pons = Math.exp(-(((t - 0.42) / 0.22) ** 2));
          const r = cm(1.15) * (1 - 0.28 * t) + cm(0.55) * pons;
          return ellipse(th, r, r * (1 + 0.4 * pons));
        },
        { stations: 26, radial: 14 },
      ),
    ),
  );

  // Spinal cord, in the canal behind the vertebral bodies. Two enlargements
  // where the limb plexuses take off, and then it STOPS at L1 as the conus —
  // running it to the sacrum is the commonest error in a spine drawing.
  //
  // It starts 2 cm higher than the foramen magnum, INSIDE the medulla. That
  // overlap is what lets the head nod: the medulla swings with the skull and
  // the cord does not, and without the overlap the join would open as a step
  // on a tube 7 px wide.
  group.add(
    sweep(
      mat,
      [
        [0, 0.906, -0.014],
        ...[0.884, 0.83, 0.775, 0.7, 0.6, 0.52, 0.47, 0.442].map((y) =>
          onSpine(y, -cm(1.9)),
        ),
      ],
      (t, th) => {
        const cerv = Math.exp(-(((t - 0.18) / 0.13) ** 2));
        const lumb = Math.exp(-(((t - 0.8) / 0.1) ** 2));
        const r =
          (cm(0.55) + cm(0.18) * (cerv + lumb)) *
          (1 - 0.85 * smooth(0.9, 1, t));
        return ellipse(th, r * 1.3, r);
      },
      { stations: 44, radial: 12 },
    ),
  );

  // Cauda equina — the roots that carry on below the conus.
  for (let i = -2; i <= 2; i++) {
    group.add(
      tube(
        mat,
        [
          onSpine(0.44, -cm(1.9), i * cm(0.22)),
          onSpine(0.38, -cm(1.6), i * cm(0.7)),
          onSpine(0.302, -cm(1.1), i * cm(0.85)),
        ],
        cm(0.11),
        { radial: 6, stations: 14, caps: false },
      ),
    );
  }

  // Segmental nerve roots, so the system reads as nerves and not only brain.
  for (let i = 0; i < 12; i++) {
    const y = 0.792 - i * 0.036;
    const root = onSpine(y, -cm(1.5));
    [-1, 1].forEach((k) => {
      group.add(
        tube(
          mat,
          [
            root,
            [k * cm(2.4), y - cm(0.5), root[2] + cm(0.9)],
            [k * cm(5.6), y - cm(1.9), root[2] + cm(2.8)],
          ],
          cm(0.15),
          { radial: 6, stations: 12, caps: false },
        ),
      );
    });
  }

  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    // Brachial plexus, converging into the arm.
    //
    // CUT AT THE SHOULDER. A nerve that runs from the spine to the wrist is
    // half in the trunk and half in a limb that swings 28°, and neither
    // answer works for the whole of it. So it is two meshes meeting at exactly
    // the joint the arm turns about: the swing then puts a BEND in the nerve
    // rather than a gap, which is also what a shoulder does to a real one.
    group.add(
      tube(
        mat,
        [
          onSpine(0.772, -cm(1.3)),
          [k * 0.06, 0.752, 0.006],
          [k * 0.13, 0.741, 0.005],
          J[`shoulder${s}`],
        ],
        cm(0.3),
        { radial: 7, stations: 16, caps: false },
      ),
    );
    // CUT AGAIN AT THE ELBOW, for the same reason it is cut at the shoulder.
    // The elbow bends now, and a single run from shoulder to wrist would keep
    // the forearm's half straight while the forearm turned away from it — so
    // the nerve would leave the arm through the skin. Two meshes sharing the
    // joint centre exactly means the bend lands in the nerve, which is what an
    // elbow does to a real one.
    group.add(
      rides(
        `arm${s}`,
        tube(
          mat,
          [J[`shoulder${s}`], [k * 0.202, 0.618, 0.005], J[`elbow${s}`]],
          cm(0.3),
          { radial: 7, stations: 14, caps: false },
        ),
      ),
    );
    group.add(
      rides(
        `elbow${s}`,
        tube(
          mat,
          [J[`elbow${s}`], [k * 0.242, 0.382, 0.013], J[`wrist${s}`]],
          cm(0.3),
          { radial: 7, stations: 14, caps: false },
        ),
      ),
    );
    // Sciatic — the largest nerve in the body, and the one a reader has heard
    // of. It divides above the knee, so it is drawn in two runs, and it is cut
    // once more at the hip for the reason the brachial is cut at the shoulder.
    group.add(
      tube(
        mat,
        [
          onSpine(0.3, -cm(1.1)),
          [k * 0.05, 0.246, -cm(1.7)],
          [k * 0.072, 0.206, -0.019],
          J[`hip${s}`],
        ],
        cm(0.4),
        { radial: 7, stations: 18, caps: false },
      ),
    );
    group.add(
      rides(
        `leg${s}`,
        tube(
          mat,
          [
            J[`hip${s}`],
            // Straight back behind the joint: the nerve leaves the pelvis
            // through the sciatic notch, well posterior to the hip, and the
            // shared point at the joint centre is a splicing requirement rather
            // than a claim about where it runs.
            [k * 0.084, 0.152, -0.019],
            [k * 0.088, 0.04, -0.012],
            [k * 0.088, -0.104, -0.006],
          ],
          cm(0.4),
          { radial: 7, stations: 22, caps: false },
        ),
      ),
    );
    group.add(
      rides(
        `leg${s}`,
        tube(
          mat,
          [
            [k * 0.088, -0.104, -0.006],
            [k * 0.088, -0.13, -0.002],
            J[`knee${s}`],
          ],
          cm(0.23),
          { radial: 6, stations: 8, caps: false },
        ),
      ),
    );
    // And the shank's share of it, on the knee — same cut, same reason.
    group.add(
      rides(
        `knee${s}`,
        tube(
          mat,
          [
            J[`knee${s}`],
            [k * 0.084, -0.2, 0.002],
            [k * 0.09, -0.38, -0.004],
            J[`ankle${s}`],
          ],
          cm(0.23),
          { radial: 6, stations: 14, caps: false },
        ),
      ),
    );
  });

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.95, 0) };
}

/* ------------------------------------------------------------------ cardio */

/** Heart, coronaries and the arterial tree. */
function buildCardio(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Everything that makes a heart read is its obliquity: the base high, right
  // and posterior; the apex low, left and anterior in the 5th intercostal
  // space at the midclavicular line. Drawn upright — which is what a scaled
  // sphere forces — it stops being a heart and becomes a lump mid-chest.
  group.add(
    sweep(
      mat,
      [
        [-0.028, 0.653, -0.01],
        [-0.012, 0.631, 0.014],
        [0.022, 0.607, 0.037],
        [0.053, 0.583, 0.053],
        [0.079, 0.558, 0.062],
      ],
      (t, th) => {
        // Broadest a third of the way down, then rounding into the apex. A
        // cone gives a point; the heart has none.
        let k = Math.sin(Math.PI * (0.33 + 0.62 * t)) ** 0.62 * domeEnd(t, 0.2);
        // Anterior interventricular groove — the line between the ventricles
        // on the front of the heart, with the LAD lying in it.
        k *= grooveAt(th, 0, 0.42, 0.13);
        // Coronary sulcus, encircling between atria and ventricles.
        k *= groove(t, 0.07, 0.055, 0.19);
        return ellipse(th, cm(3.1) * k, cm(4.3) * k);
      },
      { stations: 42, radial: 26, seed: new THREE.Vector3(0, 0, 1) },
    ),
  );

  // Atria. The left atrium is the most posterior chamber in the body — a fact
  // worth being visibly true, since it is why it presses on the oesophagus.
  group.add(
    ellipsoid(
      mat,
      [-0.053, 0.661, 0.007],
      [cm(2.4), cm(2.1), cm(2.2)],
      null,
      20,
    ),
  );
  group.add(
    ellipsoid(
      mat,
      [0.007, 0.665, -0.03],
      [cm(2.5), cm(2.0), cm(2.0)],
      null,
      20,
    ),
  );
  group.add(
    ellipsoid(
      mat,
      [-0.057, 0.647, 0.031],
      [cm(1.5), cm(0.9), cm(1.0)],
      null,
      14,
    ),
  );
  group.add(
    ellipsoid(
      mat,
      [0.031, 0.653, 0.023],
      [cm(1.4), cm(0.8), cm(0.9)],
      null,
      14,
    ),
  );

  // The coronaries, in the grooves cut for them above.
  group.add(
    tube(
      mat,
      [
        [0.005, 0.639, 0.031],
        [0.031, 0.613, 0.05],
        [0.057, 0.587, 0.062],
        [0.075, 0.564, 0.064],
      ],
      cm(0.2),
      { radial: 6, stations: 18, caps: false },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [0.005, 0.639, 0.031],
        [0.037, 0.639, 0.007],
        [0.045, 0.629, -0.021],
      ],
      cm(0.18),
      { radial: 6, stations: 14, caps: false },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [-0.015, 0.641, 0.03],
        [-0.043, 0.633, 0.014],
        [-0.051, 0.617, -0.014],
      ],
      cm(0.18),
      { radial: 6, stations: 14, caps: false },
    ),
  );

  // Aorta: root, arch, descending thoracic, through the hiatus at T12, down
  // to the bifurcation at L4. Tapers 3 cm → 1.8 cm as it goes.
  group.add(
    sweep(
      mat,
      [
        [-0.006, 0.637, 0.022],
        [-0.019, 0.669, 0.013],
        [-0.014, 0.701, -0.007],
        [0.013, 0.703, -0.025],
        [0.02, 0.665, -0.033],
        [0.018, 0.6, -0.036],
        [0.012, 0.51, -0.036],
        [0.008, LEVEL.T12, -0.034],
        [0.004, 0.4, -0.032],
        [0, LEVEL.L4, -0.03],
      ],
      (t, th) => round(th, cm(1.5) - cm(0.6) * smooth(0, 1, t)),
      { stations: 56, radial: 14 },
    ),
  );

  // Three branches off the arch, in order: brachiocephalic (which then splits
  // into right carotid and right subclavian), left common carotid, left
  // subclavian. That order is the arch every plate draws.
  group.add(
    tube(
      mat,
      [
        [-0.017, 0.695, -0.003],
        [-0.03, 0.72, 0.004],
        [-0.034, 0.74, 0.007],
      ],
      cm(0.6),
      { radial: 8, stations: 12 },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [-0.034, 0.74, 0.007],
        [-0.032, 0.8, 0.015],
        [-0.03, 0.872, 0.019],
      ],
      cm(0.4),
      { radial: 8, stations: 14 },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [-0.002, 0.703, -0.013],
        [0.014, 0.782, 0.007],
        [0.028, 0.872, 0.019],
      ],
      cm(0.4),
      { radial: 8, stations: 16 },
    ),
  );

  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    // Subclavian, then brachial. Cut at the shoulder and at the hip below for
    // the reason the nerves are: the proximal half belongs to the trunk, the
    // distal half swings with the limb, and the two share the joint centre so
    // the swing bends the vessel instead of breaking it. Each half carries the
    // slice of the taper it used to have, so the calibre is still continuous
    // across the join.
    group.add(
      sweep(
        mat,
        [
          [k * 0.024, 0.727, -0.004],
          [k * 0.1, 0.743, 0.004],
          J[`shoulder${s}`],
        ],
        (t, th) => round(th, cm(0.62) - cm(0.07) * t),
        { radial: 8, stations: 14, caps: false },
      ),
    );
    // Cut at the elbow as well as the shoulder, now that the elbow bends. Each
    // half carries its own slice of the taper — brachial above, radial-ulnar
    // below — so the calibre is still continuous across the join.
    group.add(
      rides(
        `arm${s}`,
        sweep(
          mat,
          [J[`shoulder${s}`], [k * 0.202, 0.618, 0.006], J[`elbow${s}`]],
          (t, th) => round(th, cm(0.55) - cm(0.145) * t),
          { radial: 8, stations: 14, caps: false },
        ),
      ),
    );
    group.add(
      rides(
        `elbow${s}`,
        sweep(
          mat,
          [J[`elbow${s}`], [k * 0.242, 0.382, 0.014], J[`wrist${s}`]],
          (t, th) => round(th, cm(0.405) - cm(0.145) * t),
          { radial: 8, stations: 14, caps: false },
        ),
      ),
    );
    group.add(
      sweep(
        mat,
        [
          [0, LEVEL.L4, -0.03],
          [k * 0.03, 0.292, -0.026],
          [k * 0.056, 0.246, -0.008],
          J[`hip${s}`],
        ],
        (t, th) => round(th, cm(0.85) - cm(0.16) * t),
        { radial: 8, stations: 18, caps: false },
      ),
    );
    group.add(
      rides(
        `leg${s}`,
        sweep(
          mat,
          [J[`hip${s}`], [k * 0.086, 0.022, 0.004], J[`knee${s}`]],
          (t, th) => round(th, cm(0.69) - cm(0.195) * t),
          { radial: 8, stations: 14, caps: false },
        ),
      ),
    );
    group.add(
      rides(
        `knee${s}`,
        sweep(
          mat,
          [J[`knee${s}`], [k * 0.09, -0.3, -0.002], J[`ankle${s}`]],
          (t, th) => round(th, cm(0.495) - cm(0.195) * t),
          { radial: 8, stations: 14, caps: false },
        ),
      ),
    );
  });

  // Pulmonary trunk, crossing in front of the aorta and bifurcating.
  group.add(
    tube(
      mat,
      [
        [0.025, 0.643, 0.041],
        [0.012, 0.673, 0.025],
        [0.002, 0.687, 0.004],
      ],
      cm(1.35),
      { radial: 12, stations: 12 },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [0.002, 0.687, 0.004],
        [-0.03, 0.679, -0.004],
        [-0.056, 0.673, -0.006],
      ],
      cm(0.8),
      { radial: 8, stations: 12 },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [0.002, 0.687, 0.004],
        [0.03, 0.685, -0.013],
        [0.054, 0.679, -0.018],
      ],
      cm(0.8),
      { radial: 8, stations: 12 },
    ),
  );

  // Superior and inferior vena cava, the second entering through the
  // diaphragm at T8.
  group.add(
    tube(
      mat,
      [
        [-0.03, 0.752, 0.006],
        [-0.035, 0.702, 0.004],
        [-0.043, 0.669, 0.004],
      ],
      cm(1.0),
      { radial: 10, stations: 14 },
    ),
  );
  group.add(
    sweep(
      mat,
      [
        [-0.012, 0.3, -0.028],
        [-0.024, 0.36, -0.03],
        [-0.03, LEVEL.L1, -0.03],
        [-0.03, 0.52, -0.024],
        [-0.032, LEVEL.T8, -0.016],
        [-0.04, 0.63, -0.004],
        [-0.047, 0.655, 0.0],
      ],
      (t, th) => round(th, cm(0.9) + cm(0.35) * t),
      { stations: 30, radial: 10 },
    ),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.61, 0.03) };
}

/* --------------------------------------------------------------- pulmonary */

/**
 * Five lobes and the airway.
 *
 * The lobes are grooved rather than split. A fissure is a line at this size,
 * and a groove costs one term in the profile where five separate solids would
 * cost five meshes and a gap that reads as damage.
 *
 * With seed +z the frame is the same on both sides: θ = 0 anterior, π/2 left,
 * π posterior, 3π/2 right. So "medial" and "lateral" are opposite angles on
 * opposite lungs, which is written out below rather than mirrored, because a
 * mirrored mesh turns its faces inside out.
 */
function buildPulmonary(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);
  const seed = new THREE.Vector3(0, 0, 1);

  // Apices rise a good 2 cm above the clavicle, into the root of the neck.
  // Bases sit on the diaphragm, the right higher because the liver is under
  // it — the reason the two lungs are not the same size.
  const shape = (t) =>
    (0.36 + 0.64 * smooth(-0.05, 0.5, t)) *
    domeStart(t, 0.11) *
    domeEnd(t, 0.1);

  group.add(
    sweep(
      mat,
      [
        [-0.036, 0.783, -0.004],
        [-0.062, 0.731, 0.005],
        [-0.08, 0.671, 0.008],
        [-0.089, 0.611, 0.008],
        [-0.088, 0.566, 0.004],
      ],
      (t, th) => {
        let k = shape(t);
        // Hilum: the root of the lung, a dent in the medial surface. The right
        // lung sits at −x, so its medial side faces +x, which is 3π/2 in this
        // frame — anterior is 0 and π/2 points at −x.
        k *= grooveAt(
          th,
          (3 * Math.PI) / 2,
          0.6,
          0.4 * Math.exp(-(((t - 0.44) / 0.2) ** 2)),
        );
        // Oblique fissure — posterior and high, sweeping round the LATERAL
        // surface to end anteroinferiorly at the 6th costal cartilage. On this
        // side lateral is π/2, so the sweep runs π → 0.
        const ob = Math.PI * (1 - smooth(0.18, 0.96, t));
        k *= grooveAt(th, ob, 0.15, 0.11);
        // Horizontal fissure, anterolateral only, cutting off the middle lobe.
        // The right lung is the only one with three.
        const front = Math.exp(-((dTheta(th, Math.PI / 4) / 1.1) ** 2));
        k *= groove(t, 0.44, 0.028, 0.11 * front);
        return ellipse(th, cm(6.4) * k, cm(7.4) * k);
      },
      { stations: 46, radial: 30, seed },
    ),
  );

  group.add(
    sweep(
      mat,
      [
        [0.036, 0.783, -0.004],
        [0.062, 0.731, 0.005],
        [0.079, 0.671, 0.008],
        [0.086, 0.611, 0.007],
        [0.085, 0.552, 0.003],
      ],
      (t, th) => {
        let k = shape(t);
        k *= grooveAt(
          th,
          Math.PI / 2,
          0.6,
          0.4 * Math.exp(-(((t - 0.44) / 0.2) ** 2)),
        );
        // The same fissure, running the other way round: lateral on this side
        // is 3π/2, so the sweep runs π → 2π. There is no horizontal fissure —
        // the left lung has two lobes, not three.
        const ob = Math.PI * (1 + smooth(0.18, 0.96, t));
        k *= grooveAt(th, ob, 0.15, 0.11);
        // Cardiac notch: the bite the heart takes out of the anteromedial
        // border, with the lingula below it. This is why the left lung is the
        // smaller of the two, and it has to be on the side the heart is.
        const notch =
          Math.exp(-(((t - 0.6) / 0.19) ** 2)) *
          Math.exp(-((dTheta(th, Math.PI / 4) / 0.7) ** 2));
        k *= 1 - 0.46 * notch;
        return ellipse(th, cm(6.2) * k, cm(7.0) * k);
      },
      { stations: 46, radial: 30, seed },
    ),
  );

  // Trachea, ridged with its cartilage rings, ending at the carina at T4.
  group.add(
    sweep(
      mat,
      [
        [0, 0.802, 0.02],
        [0, 0.741, 0.012],
        [0, 0.697, 0.004],
        [0, LEVEL.T4, 0.0],
      ],
      (t, th) => {
        const r = cm(1.05) * (1 + 0.085 * Math.sin(t * 44));
        return ellipse(th, r, r * 0.92);
      },
      { stations: 48, radial: 12 },
    ),
  );

  // Main bronchi. The right is wider and much more vertical than the left,
  // which is why an inhaled object goes right — the asymmetry is the reason
  // to draw them at all.
  group.add(
    tube(
      mat,
      [
        [0, LEVEL.T4, 0.0],
        [-0.026, 0.646, 0.002],
        [-0.045, 0.632, 0.004],
      ],
      cm(0.7),
      { radial: 8, stations: 12 },
    ),
  );
  group.add(
    tube(
      mat,
      [
        [0, LEVEL.T4, 0.0],
        [0.03, 0.654, 0.001],
        [0.057, 0.647, 0.001],
      ],
      cm(0.55),
      { radial: 8, stations: 12 },
    ),
  );

  // Lobar bronchi: three on the right, two on the left.
  [
    [
      [-0.045, 0.632, 0.004],
      [-0.062, 0.665, 0.006],
      [-0.072, 0.686, 0.006],
    ],
    [
      [-0.045, 0.632, 0.004],
      [-0.068, 0.622, 0.014],
      [-0.082, 0.607, 0.02],
    ],
    [
      [-0.045, 0.632, 0.004],
      [-0.066, 0.6, -0.002],
      [-0.079, 0.575, -0.006],
    ],
    [
      [0.057, 0.647, 0.001],
      [0.07, 0.672, 0.004],
      [0.078, 0.694, 0.004],
    ],
    [
      [0.057, 0.647, 0.001],
      [0.072, 0.612, -0.001],
      [0.08, 0.583, -0.004],
    ],
  ].forEach((pts) =>
    group.add(tube(mat, pts, cm(0.4), { radial: 6, stations: 12 })),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.66, 0.03) };
}

/* ----------------------------------------------------------------- hepatic */

/** Liver, gallbladder, biliary tree and portal vein. */
function buildHepatic(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // 24 cm across, 15 cm tall on the right, 12 cm front to back. The outline
  // that identifies it is a wedge: deep on the right, tapering to a thin
  // tongue that crosses the midline, with a straight oblique inferior border
  // running up to the left. A symmetric blob has none of that.
  group.add(
    ellipsoid(
      mat,
      [-0.014, 0.474, 0.022],
      [cm(12.2), cm(8.2), cm(6.4)],
      (v, d) => {
        // The right lobe carries the bulk; the left crosses the midline as a
        // thinner tongue and ends in a blunt edge, not a spike.
        const s = smooth(-1.02, 0.28, -d.x);
        v.y *= 0.46 + 0.54 * s;
        v.z *= 0.6 + 0.4 * s;
        // The inferior surface is cut flat along a plane that rises to the
        // left. This is the liver's signature, and the thing a scaled sphere
        // can never have: a domed top and a straight oblique lower border
        // meeting along a sharp edge.
        const floor = -cm(5.2) + cm(3.7) * (1 - s);
        if (v.y < floor) v.y = floor - (floor - v.y) * 0.14;
        // Scooped behind, where it wraps the vertebral column and carries the
        // groove for the inferior vena cava.
        v.z +=
          cm(2.6) * Math.exp(-(((d.x + 0.06) / 0.32) ** 2)) * Math.max(0, -d.z);
        // Falciform ligament, dividing the lobes across the anterosuperior
        // surface.
        v.multiplyScalar(
          1 -
            0.13 *
              Math.exp(-(((d.x - 0.14) / 0.09) ** 2)) *
              Math.max(0, d.z * 0.6 + d.y * 0.8),
        );
      },
      46,
    ),
  );

  // Gallbladder, in its fossa under the right lobe with the fundus projecting
  // past the inferior border — which is where it can be felt.
  group.add(
    sweep(
      mat,
      [
        [-0.059, 0.412, 0.052],
        [-0.05, 0.428, 0.045],
        [-0.04, 0.442, 0.034],
        [-0.031, 0.452, 0.024],
      ],
      (t, th) =>
        round(
          th,
          cm(1.75) * (1 - 0.7 * smooth(0.3, 1, t)) * domeStart(t, 0.24),
        ),
      { stations: 22, radial: 12 },
    ),
  );

  // Cystic duct into the common bile duct, down behind the duodenum to the
  // head of the pancreas.
  group.add(
    tube(
      mat,
      [
        [-0.031, 0.452, 0.024],
        [-0.022, 0.44, 0.008],
        [-0.026, 0.418, -0.004],
        [-0.032, 0.398, -0.012],
      ],
      cm(0.28),
      { radial: 6, stations: 16 },
    ),
  );
  // Portal vein, arriving at the porta hepatis from the confluence below.
  group.add(
    tube(
      mat,
      [
        [-0.012, 0.386, -0.014],
        [-0.014, 0.412, -0.006],
        [-0.014, 0.44, 0.006],
      ],
      cm(0.6),
      { radial: 8, stations: 14 },
    ),
  );

  return {
    group,
    materials: [mat],
    focus: new THREE.Vector3(-0.01, 0.46, 0.04),
  };
}

/* ------------------------------------------------------------------- renal */

/** Kidneys, adrenal-free: ureters and bladder. */
function buildRenal(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // 11 × 6 × 3 cm, retroperitoneal, long axis tilted so the upper pole sits
  // closer to the midline. The right is lower than the left because the liver
  // is above it. The hilum is a notch in the medial border — seeding the
  // frame medially is what puts it there instead of wherever the maths lands.
  const kidney = (upper, lower, medial) =>
    sweep(
      mat,
      [
        upper,
        [
          (upper[0] + lower[0]) / 2,
          (upper[1] + lower[1]) / 2,
          (upper[2] + lower[2]) / 2 + cm(0.3),
        ],
        lower,
      ],
      (t, th) => {
        // Full through the middle, domed at both poles — the shape stays a
        // bean rather than becoming a lemon.
        const k =
          capsule(t, 3.6, 0.4) *
          grooveAt(th, 0, 0.55, 0.48 * Math.exp(-(((t - 0.5) / 0.3) ** 2)));
        return ellipse(th, cm(3.0) * k, cm(2.2) * k);
      },
      { stations: 34, radial: 22, seed: medial },
    );

  group.add(
    kidney(
      [-0.048, 0.452, -0.05],
      [-0.068, 0.358, -0.043],
      new THREE.Vector3(1, 0, 0.4),
    ),
  );
  group.add(
    kidney(
      [0.048, 0.468, -0.05],
      [0.068, 0.374, -0.043],
      new THREE.Vector3(-1, 0, 0.4),
    ),
  );

  // Ureters: down over the psoas, crossing the pelvic brim at the iliac
  // bifurcation, then back to the bladder.
  [1, -1].forEach((k) => {
    group.add(
      tube(
        mat,
        [
          [k * 0.044, 0.404 + (k < 0 ? 0 : 0.016), -0.044],
          [k * 0.046, 0.35, -0.036],
          [k * 0.05, 0.3, -0.028],
          [k * 0.042, 0.252, -0.016],
          [k * 0.02, 0.216, -0.004],
        ],
        cm(0.28),
        { radial: 6, stations: 22 },
      ),
    );
  });

  // Bladder, behind the pubic symphysis. Flattened above when empty.
  group.add(
    ellipsoid(
      mat,
      [0, 0.202, 0.021],
      [cm(4.4), cm(3.5), cm(3.6)],
      (v, d) => {
        if (v.y > 0) v.y *= 0.7 + 0.3 * Math.abs(d.x);
      },
      24,
    ),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.36, 0) };
}

/* --------------------------------------------------------------- endocrine */

/** Pituitary, thyroid, parathyroids, adrenals and pancreas. */
function buildEndocrine(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // The master gland, in the sella under the brain. Small enough to be almost
  // a dot, but an endocrine plate without it is missing its subject. It sits
  // in the skull, so it nods with it — the thyroid below does not, because the
  // thyroid is on the trachea and the trachea does not nod.
  group.add(
    rides(
      "head",
      ellipsoid(mat, [0, 0.928, 0.006], [cm(0.7), cm(0.5), cm(0.6)], null, 12),
    ),
  );

  // Thyroid: two lobes flanking the trachea, joined by an isthmus across the
  // second to fourth rings. Each lobe tapers upward — the shape is a shield,
  // which is what the name means.
  [1, -1].forEach((k) => {
    group.add(
      sweep(
        mat,
        [
          [k * 0.02, 0.762, 0.016],
          [k * 0.022, 0.785, 0.017],
          [k * 0.018, 0.812, 0.017],
        ],
        (t, th) => {
          const r = cm(1.1) * (1 - 0.55 * smooth(0.45, 1, t));
          return ellipse(th, r, r * 0.85);
        },
        { stations: 18, radial: 12 },
      ),
    );
    // Parathyroids, on the back of each lobe — four in all.
    [0.774, 0.802].forEach((y) => {
      group.add(
        ellipsoid(
          mat,
          [k * 0.021, y, 0.009],
          [cm(0.35), cm(0.5), cm(0.25)],
          null,
          10,
        ),
      );
    });
  });
  group.add(
    tube(
      mat,
      [
        [0.016, 0.774, 0.023],
        [0, 0.773, 0.026],
        [-0.016, 0.774, 0.023],
      ],
      cm(0.5),
      { radial: 8, stations: 12 },
    ),
  );

  // Adrenals, capping the kidneys: the right pyramidal, the left crescentic
  // and slung down the medial border rather than sitting on top.
  group.add(
    ellipsoid(
      mat,
      [-0.05, 0.468, -0.048],
      [cm(1.6), cm(1.0), cm(0.9)],
      (v, d) => {
        v.x *= 1 - 0.4 * Math.max(0, d.y);
        v.z *= 1 - 0.35 * Math.max(0, d.y);
      },
      18,
    ),
  );
  group.add(
    ellipsoid(
      mat,
      [0.046, 0.484, -0.048],
      [cm(1.8), cm(1.1), cm(0.9)],
      (v, d) => {
        v.y -= cm(0.5) * Math.max(0, d.x);
      },
      18,
    ),
  );

  // Pancreas: head in the C of the duodenum, neck at the transpyloric plane,
  // body crossing the midline and rising to a tail at the splenic hilum. It
  // is 15 cm long and prism-shaped, not a sausage.
  group.add(
    sweep(
      mat,
      [
        [-0.041, 0.395, -0.012],
        [-0.022, 0.409, -0.014],
        [-0.004, LEVEL.L1 - 0.018, -0.017],
        [0.032, 0.432, -0.024],
        [0.062, 0.444, -0.031],
        [0.081, 0.452, -0.036],
      ],
      (t, th) => {
        const bulk =
          (1 - 0.55 * smooth(0.12, 1, t)) * (1 - 0.3 * smooth(0.86, 1, t));
        const r = cm(1.7) * bulk;
        // Flattened front to back, with a soft ridge along the top.
        return ellipse(th, r, r * (0.62 + 0.2 * Math.abs(Math.sin(th))));
      },
      { stations: 34, radial: 16 },
    ),
  );
  // Uncinate process, hooking behind the mesenteric vessels.
  group.add(
    ellipsoid(
      mat,
      [-0.03, 0.386, -0.02],
      [cm(1.5), cm(0.9), cm(1.0)],
      null,
      14,
    ),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.56, 0) };
}

/* ---------------------------------------------------------------- skeletal */

/**
 * The skeleton.
 *
 * IT USED TO BE DRAWN UNDER HAEMATOLOGY, and that was a category error with a
 * visible consequence: tapping "혈액" lit up a whole skeleton, which tells a
 * reader their blood count is a statement about their bones. Marrow lives in
 * bone the way a tenant lives in a building. Haematology now draws the tenant
 * — see `buildHematology` below — and the building is here, with its own
 * panel of bone-turnover markers behind it.
 *
 * Ribs by table rather than by formula. The two facts that make a rib cage
 * read as one are that the ribs slope down from spine to sternum — steeply in
 * the middle of the cage, barely at all at the top — and that the cage is
 * widest around ribs 7 to 9 and narrows at both ends. A formula smooth enough
 * to be worth writing gets the second and loses the first.
 */
const RIBS = [
  // half-width, fall from vertebral to sternal end, and where the front ends
  { wide: cm(5.4), fall: cm(1.4), front: "sternum" },
  { wide: cm(8.4), fall: cm(2.6), front: "sternum" },
  { wide: cm(10.6), fall: cm(3.8), front: "sternum" },
  { wide: cm(12.0), fall: cm(4.9), front: "sternum" },
  { wide: cm(13.0), fall: cm(6.0), front: "sternum" },
  { wide: cm(13.6), fall: cm(7.1), front: "sternum" },
  { wide: cm(13.9), fall: cm(8.2), front: "sternum" },
  { wide: cm(13.8), fall: cm(8.4), front: "margin" },
  { wide: cm(13.2), fall: cm(8.0), front: "margin" },
  { wide: cm(12.0), fall: cm(7.2), front: "margin" },
  { wide: cm(9.6), fall: cm(3.0), front: "float" },
  { wide: cm(6.8), fall: cm(2.2), front: "float" },
];

/**
 * Everything distal to the elbow and the knee.
 *
 * WHAT WAS MISSING AND WHY IT SHOWED. The skeleton had a humerus and a femur
 * and then stopped. Half a limb is worse than none: the eye reads the gap as
 * an amputation rather than as an omission, and the two joints it stops at are
 * the two a reader can name. So the forearm, the hand, the shank and the foot
 * are all here.
 *
 * The facts that make each pair read as a pair rather than as two sticks:
 *
 *   FOREARM  the ulna is the thick bone at the elbow and the thin one at the
 *            wrist; the radius is the other way round. That crossover is the
 *            whole silhouette of a forearm skeleton.
 *   SHANK    the tibia carries the weight and the fibula carries none — it is
 *            a splint, its head sits BELOW the knee joint and takes no part in
 *            it, and its malleolus reaches LOWER than the tibia's. Ankles are
 *            asymmetric and every plate shows it.
 *   HAND     five rays that fan, with two waists each where the knuckles are.
 *            At 18 px tall separate phalanges would be one-pixel gaps; the
 *            waists say "jointed" and the gaps would only say "noisy".
 *
 * The arm hangs palm-inward, so the hand's spread is anteroposterior and the
 * thumb points forward — which is why the digits fan in z and not in x, and
 * the toes, on a foot that points forward, fan in x.
 */
function limbBones(group, mat, s, k) {
  const el = J[`elbow${s}`];
  const wr = J[`wrist${s}`];
  const kn = J[`knee${s}`];
  const an = J[`ankle${s}`];
  // NAMED IN BUILD ORDER, because a bone that cannot be addressed cannot be
  // regression-tested. The joint work is a set of claims about DISTANCES —
  // "the talus sits 2 mm under the plafond" — and checking one means finding
  // two named meshes. Before this the probe had to identify bones by vertex
  // count, which went stale the moment a bone was edited, which is the moment
  // you most need the measurement.
  //
  // Order-coupled, and the throw below is the guard: a mesh added without a
  // name, or a name without a mesh, fails the build rather than mislabelling.
  const ORDER = [
    "ulna",
    "radius",
    "carpus",
    "carpusDistal",
    "digit2",
    "digit3",
    "digit4",
    "digit5",
    "thumb",
    "patella",
    "tibia",
    "medialMalleolus",
    "fibula",
    "calcaneus",
    "talus",
    "navicular",
    "toe1",
    "toe2",
    "toe3",
    "toe4",
    "toe5",
  ];
  // WHICH JOINT EACH BONE TURNS ABOUT, now that there is more than one per
  // limb. Everything here used to ride the shoulder or the hip, because those
  // were the only pivots that existed — so a forearm swung from the shoulder
  // and a shin from the hip, which is a mannequin's arm and not an arm.
  const RIDES = {
    ulna: "elbow",
    radius: "elbow",
    carpus: "wrist",
    carpusDistal: "wrist",
    digit2: "wrist",
    digit3: "wrist",
    digit4: "wrist",
    digit5: "wrist",
    thumb: "wrist",
    patella: "knee",
    tibia: "knee",
    medialMalleolus: "knee",
    fibula: "knee",
    calcaneus: "ankle",
    talus: "ankle",
    navicular: "ankle",
    toe1: "ankle",
    toe2: "ankle",
    toe3: "ankle",
    toe4: "ankle",
    toe5: "ankle",
  };
  let nth = 0;
  const add = (limb, mesh) => {
    if (nth >= ORDER.length) {
      throw new Error(`limbBones: mesh #${nth} has no name in ORDER`);
    }
    const name = ORDER[nth++];
    mesh.name = `${name}${s}`;
    return group.add(rides(RIDES[name] ? `${RIDES[name]}${s}` : limb, mesh));
  };
  const arm = `arm${s}`;
  const leg = `leg${s}`;
  // Medial is toward the midline, which is −x on the left and +x on the right;
  // multiplying an x already carrying `k` by a signed offset does that for
  // both sides at once.
  const med = (x, cmv) => k * (x - cm(cmv));
  const lat = (x, cmv) => k * (x + cm(cmv));
  // THE HAND DOUBLED IN LENGTH, so every bone in it moves. Each is placed by
  // scaling its old position away from the wrist rather than by re-deriving
  // twenty triples by hand — which keeps the fan, the thumb's opposition and
  // the carpal step exactly as they were and only changes the scale they were
  // drawn at. `x` is unsigned; the mirror is applied here.
  const HAND = 2.0;
  // Girth grows less than length. A hand twice as long is not twice as thick —
  // doubling the ray radius put the fingers 1.3 mm outside the skin, and a
  // 1.8 cm knuckle on a 19 cm hand is what the plates show.
  const HAND_R = 1.5;
  // `fan` is the ray's spread across the palm and is added AFTER the scaling,
  // because a hand twice as long is not a hand twice as wide — doubling it too
  // put the outer two rays 6 mm outside the skin.
  const hand = (x, y, z, fan = 0) => [
    k * (0.255 + (x - 0.255) * HAND),
    wr[1] + (y - wr[1]) * HAND,
    wr[2] + (z - wr[2]) * HAND + fan,
  ];

  // ---- forearm --------------------------------------------------------
  add(
    arm,
    sweep(
      mat,
      [
        // Olecranon: the point of the elbow, behind and above the joint.
        [med(0.225, 0.4), el[1] + cm(1.9), el[2] - cm(1.5)],
        [med(0.227, 0.5), el[1] - cm(0.6), el[2] - cm(0.6)],
        [med(0.248, 1.4), 0.34, 0.016],
        [med(0.255, 1.5), wr[1] + cm(0.3), wr[2]],
      ],
      (t, th) =>
        round(
          th,
          (cm(1.25) -
            cm(0.75) * smooth(0.06, 0.5, t) +
            cm(0.3) * Math.exp(-(((t - 0.96) / 0.06) ** 2))) *
            domeStart(t, 0.06) *
            domeEnd(t, 0.05),
        ),
      { stations: 22, radial: 10 },
    ),
  );
  add(
    arm,
    sweep(
      mat,
      [
        // Radial head: a small disc against the capitellum, laterally.
        [lat(0.225, 1.3), el[1] + cm(0.2), el[2] + cm(0.5)],
        [lat(0.232, 1.0), 0.42, 0.011],
        [lat(0.252, 0.9), 0.31, 0.018],
        [lat(0.255, 1.0), wr[1] + cm(0.2), wr[2]],
      ],
      (t, th) =>
        round(
          th,
          (cm(0.52) +
            cm(0.24) * Math.exp(-((t / 0.07) ** 2)) +
            cm(0.72) * smooth(0.62, 1, t)) *
            domeStart(t, 0.05) *
            domeEnd(t, 0.06),
        ),
      { stations: 22, radial: 10 },
    ),
  );

  // ---- carpus and hand -------------------------------------------------
  // TWO ROWS, because the carpus was one undifferentiated lump standing in for
  // eight bones and reading as a pebble. The step between the rows is what
  // says "two rows"; a gap between them would be 0.4 px and would say nothing.
  // The distal row is wider and deeper, so the carpus is a trapezoid in
  // silhouette rather than an oval — which is the shape of a wrist.
  add(
    arm,
    ellipsoid(
      mat,
      [k * 0.256, 0.26225, 0.0195],
      [cm(1.0), cm(0.78), cm(1.95)],
      null,
      14,
    ),
  );
  add(
    arm,
    ellipsoid(
      mat,
      [k * 0.2585, 0.25145, 0.0225],
      [cm(1.05), cm(0.72), cm(2.35)],
      null,
      14,
    ),
  );
  for (let i = 0; i < 4; i++) {
    // Index most anterior, little finger most posterior. The outer two rays
    // used to end 1.7 cm OUTSIDE the hand's skin, because the fan was drawn
    // at the spread of a real hand on a hand this figure draws at half size.
    const near = (1.5 - i) * cm(1.7);
    const far = (1.5 - i) * cm(1.05);
    add(
      arm,
      sweep(
        mat,
        [
          hand(0.2575, 0.2465, 0.0205, near * 0.7),
          hand(0.2605, 0.221, 0.0245, near),
          hand(0.2625, 0.2, 0.0265, far * 0.96),
          hand(0.2635, 0.184, 0.0275, far),
        ],
        (t, th) => {
          // FOUR BONES AND THREE JOINTS IN FOURTEEN PIXELS.
          //
          // What reads at that size is not the gap between two bones — half a
          // pixel, which appears and disappears with the sample position as
          // the figure turns, and flicker reads as damage. It is that a
          // phalanx is a DUMBBELL: a head, a shaft thinner than the head, a
          // base. So the ray is a ripple and the knuckles are its crests. A
          // crest turns the surface normal and shading integrates over the
          // pixel; a gap is a coverage event and does not.
          const bump = (at, w, h) => 1 + h * Math.exp(-(((t - at) / w) ** 2));
          return round(
            th,
            cm(0.44) * HAND_R *
              (1 - 0.34 * smooth(0.1, 1, t)) *
              bump(0.24, 0.13, -0.16) *
              bump(0.45, 0.055, 0.42) *
              bump(0.57, 0.07, -0.2) *
              bump(0.67, 0.045, 0.3) *
              bump(0.755, 0.05, -0.17) *
              bump(0.84, 0.038, 0.24) *
              bump(0.94, 0.05, 0.1) *
              domeEnd(t, 0.075),
          );
        },
        // The narrowest crest is σ = 0.038 of the path. At 20 stations that is
        // 0.76 rows per σ and the ripple would not exist at all.
        { stations: 28, radial: 8 },
      ),
    );
  }
  // Thumb: shorter, thicker, and pointing forward out of the palm.
  add(
    arm,
    sweep(
      mat,
      [
        hand(0.2545, 0.2495, 0.0265),
        hand(0.2515, 0.2325, 0.0425),
        hand(0.2495, 0.2185, 0.0525),
      ],
      (t, th) => round(th, cm(0.52) * HAND_R * (1 - 0.3 * t) * domeEnd(t, 0.16)),
      { stations: 14, radial: 8 },
    ),
  );

  // ---- patella, tibia, fibula -----------------------------------------
  add(
    leg,
    ellipsoid(
      mat,
      [k * 0.088, -0.132, 0.0355],
      [cm(2.2), cm(2.4), cm(0.7)],
      (v, d) => {
        // Flat behind, domed in front, and pointed at the bottom — a patella
        // is a triangle, not a coin.
        v.z += cm(0.3) * Math.max(0, d.z);
        v.x *= 1 - 0.4 * Math.max(0, -d.y) ** 1.6;
      },
      18,
    ),
  );
  // THE TIBIA ENDS IN TWO FLAT SURFACES, AND BOTH ARE DELIBERATE.
  //
  // A `sweep` cap is a triangle fan in the frame plane at the endpoint, so with
  // a near-vertical tangent it is a horizontal disc. That is a defect at the
  // shaft of a bone and it is exactly right at the two ends of this one: the
  // tibial plateau and the tibial plafond are both flat to within about 3 mm,
  // which at this scale is half a pixel. So neither end gets a dome — they get
  // an ELLIPTICAL cap instead, wide medio-laterally and shallower front to
  // back, and the flatness that was wrong everywhere else becomes the joint.
  //
  // This is also where the shank's 3.7 cm hole gets closed. The bone used to
  // taper to a POINT at y −0.479 with the talus 3.7 cm below it, because the
  // whole tarsus was drawn down at toe level. The plafond now stops at the
  // ankle joint line and the talus has come up to meet it.
  add(
    leg,
    sweep(
      mat,
      [
        [med(0.088, 0.7), kn[1] + cm(0.6), kn[2] - cm(0.3)],
        [med(0.09, 0.6), -0.3, 0.004],
        [med(0.0895, 0.55), -0.44, -0.001],
        [med(0.0895, 0.45), an[1] - cm(0.3), -0.002],
      ],
      (t, th) => {
        const r =
          cm(1.95) -
          cm(0.85) * smooth(0.06, 0.45, t) +
          cm(0.45) * smooth(0.82, 1, t);
        // THE SHIN, and it used to point the wrong way. `sweep`'s default seed
        // makes N ≈ +x̂, so θ = 0 is lateral-ish and the old `dTheta(th, k*0.3)`
        // put the subcutaneous crest 17° off +x — on the OUTSIDE of the left
        // leg. Anterior is θ = π/2; a shin faces forward and slightly medial.
        const crest =
          1 +
          0.16 *
            smooth(0.1, 0.3, t) *
            Math.exp(-((dTheta(th, Math.PI / 2 + k * 0.35) / 0.5) ** 2));
        // Plateau above, plafond below: the flare is medio-lateral, so the
        // cap is an ellipse rather than a circle.
        const flare = smooth(0.09, 0, t);
        return [
          Math.cos(th) * (r + cm(1.7) * flare) * crest,
          Math.sin(th) * (r + cm(0.65) * flare) * crest,
        ];
      },
      { stations: 34, radial: 14 },
    ),
  );
  // MEDIAL MALLEOLUS — the prong the tibia sends down the inside of the ankle,
  // and half of what makes an ankle read as a mortise rather than as a stump.
  // It rolls over anisotropically: `domeEnd` takes a radius to ZERO, so the
  // width is domed late and the depth early, and the bone stays broad
  // front-to-back all the way to a closed tip.
  add(
    leg,
    sweep(
      mat,
      [
        [med(0.0895, 1.05), an[1] + cm(0.9), -0.0025],
        [med(0.0895, 1.5), an[1] - cm(0.4), -0.0028],
        [med(0.0895, 1.6), an[1] - cm(1.3), -0.003],
      ],
      (t, th) => {
        const r = cm(0.95) - cm(0.4) * smooth(0.3, 1, t);
        return [
          Math.cos(th) * r * domeEnd(t, 0.14),
          Math.sin(th) * r * 1.35 * domeEnd(t, 0.34),
        ];
      },
      { stations: 10, radial: 8 },
    ),
  );
  add(
    leg,
    sweep(
      mat,
      [
        // The head sits below the knee joint: the fibula takes no share of
        // the body's weight, and the gap is the point.
        [lat(0.088, 1.7), kn[1] - cm(2.4), kn[2] - cm(0.9)],
        [lat(0.09, 1.6), -0.32, -0.002],
        // …and its malleolus hangs lower than the tibia's. Every plate shows
        // that asymmetry and it is the one thing a reader can check.
        [lat(0.092, 1.35), an[1] - cm(2.4), -0.0065],
      ],
      (t, th) => {
        const r =
          cm(0.42) +
          cm(0.3) * Math.exp(-((t / 0.09) ** 2)) +
          cm(0.4) * smooth(0.86, 1, t);
        return [
          Math.cos(th) * r * domeStart(t, 0.06) * domeEnd(t, 0.1),
          Math.sin(th) * r * domeStart(t, 0.06) * domeEnd(t, 0.3),
        ];
      },
      { stations: 24, radial: 10 },
    ),
  );

  // ---- tarsus and foot --------------------------------------------------
  // Calcaneus: the heel, and the largest bone below the knee. It projects
  // BEHIND the ankle, which is the whole reason a foot is a lever.
  add(
    leg,
    sweep(
      mat,
      [
        // The tuberosity reaches back into the heel. It used to stop 3 cm
        // short of the skin behind it, so the heel was hollow.
        [k * 0.0905, -0.5075, -0.0345],
        [k * 0.0905, -0.524, -0.008],
        [k * 0.0905, -0.5265, 0.018],
      ],
      (t, th) =>
        round(
          th,
          cm(1.55) * (1 - 0.22 * t) * domeStart(t, 0.16) * domeEnd(t, 0.16),
        ),
      { stations: 16, radial: 10, seed: new THREE.Vector3(0, 1, 0) },
    ),
  );
  // TALUS, lifted 2.6 cm to sit under the plafond where it belongs.
  //
  // The whole tarsus used to be drawn near `J.toe`, which left 3.7 cm of open
  // air between the shank and the foot — the largest hole in the skeleton, and
  // the reason the ankle read as an amputation. The dome now sits 2.5 mm under
  // the tibia and between the two malleoli, which is a mortise.
  add(
    leg,
    ellipsoid(
      mat,
      [k * 0.0895, -0.4965, 0.0035],
      [cm(1.25), cm(1.85), cm(2.4)],
      (v, d) => {
        // The head reaches forward to the navicular, and the neck between the
        // two is the only thing that stops a talus reading as a pebble.
        v.z += cm(1.1) * Math.max(0, d.z) ** 2;
        v.multiplyScalar(1 - 0.14 * Math.exp(-(((d.z - 0.55) / 0.28) ** 2)));
      },
      16,
    ),
  );
  // Navicular and the cuneiform block, bridging the talar head down and
  // forward to the toe rays — which start 3 cm below the talus and had
  // nothing between them and it.
  add(
    leg,
    ellipsoid(
      mat,
      [k * 0.0905, -0.5155, 0.0345],
      [cm(1.5), cm(1.0), cm(1.3)],
      null,
      12,
    ),
  );
  for (let i = 0; i < 5; i++) {
    // Big toe medial, little toe lateral, and the big toe two-thirds thicker
    // than the rest — the two facts that keep a foot from reading as a comb.
    // They converge slightly toward the tips because the foot they are inside
    // narrows there; splaying them the way real toes do would put the outer
    // two through the skin.
    const near = (i - 2) * cm(0.95);
    const mid = (i - 2) * cm(1.35);
    const far = (i - 2) * cm(1.25);
    const big = i === 0 ? 1.65 : 1;
    add(
      leg,
      sweep(
        mat,
        [
          [k * (0.092 + near), -0.5245, 0.036],
          [k * (0.092 + mid), -0.5285, 0.102],
          [k * (0.092 + far), -0.5295, 0.126],
          [k * (0.092 + far), -0.5305, 0.14],
        ],
        (t, th) =>
          round(
            th,
            cm(0.34) *
              big *
              (1 - 0.28 * t) *
              (1 - 0.3 * Math.exp(-(((t - 0.66) / 0.09) ** 2))) *
              domeEnd(t, 0.14),
          ),
        { stations: 24, radial: 8, seed: new THREE.Vector3(0, 1, 0) },
      ),
    );
  }
  if (nth !== ORDER.length) {
    throw new Error(`limbBones: ${nth} meshes for ${ORDER.length} names`);
  }
}

function buildSkeletal(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Vertebral bodies, drum-shaped, growing as they descend — with the discs
  // between them and a spinous process pointing down and back.
  const levels = [
    LEVEL.C1,
    0.862,
    0.846,
    0.83,
    0.815,
    0.795,
    LEVEL.C7,
    LEVEL.T1,
    LEVEL.T2,
    LEVEL.T3,
    LEVEL.T4,
    LEVEL.T5,
    LEVEL.T6,
    LEVEL.T7,
    LEVEL.T8,
    LEVEL.T9,
    LEVEL.T10,
    LEVEL.T11,
    LEVEL.T12,
    LEVEL.L1,
    LEVEL.L2,
    LEVEL.L3,
    LEVEL.L4,
    LEVEL.L5,
  ];
  levels.forEach((y, i) => {
    // Each body is sized to the gap below it, so the column closes up instead
    // of reading as a string of beads — and it widens as it descends, because
    // a lumbar body carries the whole trunk and a cervical one carries a head.
    const gap = i < levels.length - 1 ? y - levels[i + 1] : 0.04;
    const r = cm(1.3) + cm(1.5) * (i / levels.length);
    const c = onSpine(y);
    group.add(
      ellipsoid(
        mat,
        c,
        [r, gap * 0.42, r * 0.78],
        // Drum-shaped. Pushing the sides back out to full width holds them
        // there right up to the flat end plates, instead of letting the body
        // round off into a bead the way an ellipsoid would.
        (v, d) => {
          const k = 1 / Math.max(0.64, Math.sqrt(1 - d.y * d.y));
          v.x *= k;
          v.z *= k;
        },
        16,
      ),
    );
    group.add(
      tube(
        mat,
        [
          [0, y - cm(0.2), c[2] - r * 0.7],
          [0, y - cm(1.1), c[2] - r * 0.7 - cm(3.2)],
        ],
        cm(0.4),
        { radial: 6, stations: 6 },
      ),
    );
  });
  // SACRUM. It was 9.2 cm across, and a real one with its alae is 11–12 —
  // which was most of the 1.6 cm hole between it and the ilia. A sacrum is a
  // wedge with two shoulders, and the shoulders ARE the joint: the auricular
  // surface sits on them. Widening it and growing the alae closes the
  // sacro-iliac gap for the price of one extra term in a warp already here.
  const sacrum = ellipsoid(
    mat,
    onSpine(0.252, -cm(0.5)),
    [cm(5.4), cm(3.4), cm(1.9)],
    (v, d) => {
      v.x *= 1 - 0.45 * smooth(0, -1, d.y);
      v.x +=
        Math.sign(d.x) *
        cm(1.3) *
        Math.abs(d.x) ** 0.6 *
        smooth(-0.85, -0.05, d.y);
      v.z -= cm(1.1) * Math.max(0, d.y) * Math.abs(d.x) ** 2;
    },
    20,
  );
  sacrum.name = "sacrum";
  group.add(sacrum);

  // Sternum: manubrium, body, xiphoid.
  group.add(
    sweep(
      mat,
      [
        [0, 0.758, cm(7.4)],
        [0, 0.716, cm(8.4)],
        [0, 0.66, cm(8.6)],
        [0, 0.606, cm(8.0)],
        [0, 0.586, cm(7.2)],
      ],
      (t, th) => {
        // Manubrium wide, body narrower, xiphoid a point. Flat front to back:
        // it is a plate, and it is what the ribs run to.
        //
        // THE MANUBRIUM IS WIDER THAN ANATOMY ALONE WOULD ASK FOR, and it is a
        // rig problem wearing a bone's clothes. The clavicle rides the arm
        // pivot and the sternum is trunk, so at full swing the clavicle's
        // sternal end travels 3.4 cm THROUGH the manubrium. No bone geometry
        // fixes that — the two are on different parents and always will be —
        // so the manubrium is made broad enough to swallow the travel. The
        // sterno-clavicular joint really is a saddle with a disc in it and
        // really does slide, so this is the honest version of a compromise.
        const w = cm(4.2) - cm(3.2) * smooth(0.1, 1, t);
        return ellipse(th, w, cm(0.5));
      },
      { stations: 22, radial: 12, seed: new THREE.Vector3(-1, 0, 0) },
    ),
  );

  RIBS.forEach((rib, i) => {
    const yBack = LEVEL.T1 - (i / 11) * (LEVEL.T1 - LEVEL.T12);
    const yFront = yBack - rib.fall;
    [1, -1].forEach((k) => {
      const pts = [
        [k * cm(1.6), yBack, -cm(2.2)],
        // The rib angle: ribs run BACKWARDS before they turn, and the angle is
        // the most posterior point of the whole trunk.
        [k * cm(5.0), yBack - rib.fall * 0.12, -cm(6.4)],
        [k * rib.wide, yBack - rib.fall * 0.42, -cm(1.4)],
        [k * rib.wide * 0.82, yFront + rib.fall * 0.26, cm(3.4)],
      ];
      if (rib.front === "sternum") {
        pts.push([k * cm(2.4), yFront, cm(7.2)]);
      } else if (rib.front === "margin") {
        // Ribs 8–10 do not reach the sternum: their cartilages turn up and
        // join the seventh, and the line they make is the costal margin.
        pts.push([k * cm(7.6 - (i - 7) * 0.8), yFront + cm(1.4), cm(5.6)]);
      }
      group.add(
        sweep(
          mat,
          pts,
          (t, th) => ellipse(th, cm(0.55) * (1 - 0.25 * t), cm(0.3)),
          {
            stations: 26,
            radial: 8,
            seed: new THREE.Vector3(0, 1, 0),
          },
        ),
      );
    });
  });

  // Costal cartilages, closing ribs 8–10 onto the seventh.
  [1, -1].forEach((k) => {
    group.add(
      tube(
        mat,
        [
          [k * cm(7.6), LEVEL.T8 - cm(6.6), cm(5.6)],
          [k * cm(4.6), 0.532, cm(6.8)],
          [k * cm(2.4), 0.548, cm(7.2)],
        ],
        cm(0.34),
        { radial: 6, stations: 14, caps: false },
      ),
    );
  });

  // Pelvis. Drawn as a ring rather than as two lumps: the iliac wings flare
  // up and out from the sacrum, and the pubic rami close it in front. The
  // bowl, and the gap left inside the rami, are what make it read as a pelvis.
  [1, -1].forEach((k) => {
    const side = k > 0 ? "L" : "R";
    const put = (name, mesh) => {
      mesh.name = name + side;
      group.add(mesh);
      return mesh;
    };
    put(
      "ilium",
      ellipsoid(
        mat,
        [k * 0.058, 0.228, -0.008],
        [cm(1.5), cm(5.6), cm(6.2)],
        (v, d) => {
          v.x += k * cm(3.6) * Math.max(0, d.y) ** 1.4;
          v.z -= cm(1.8) * Math.max(0, -d.y);
          v.y *= 1 - 0.34 * Math.max(0, -d.z);
          // ASIS — the bump at the front of the crest, the landmark a pelvis
          // is measured from and the one a reader can find on themselves.
          v.z +=
            cm(2.2) *
            Math.max(0, d.z) ** 2 *
            Math.exp(-(((d.y - 0.52) / 0.34) ** 2));
          // The crest is an S: it turns back on itself behind, at the PSIS.
          v.z -=
            cm(1.1) *
            Math.max(0, -d.z) ** 2 *
            Math.exp(-(((d.y - 0.62) / 0.3) ** 2));
        },
        24,
      ),
    );
    // ACETABULUM. The femur used to end in a flat disc beside a flat plate
    // with nothing between them — no socket anywhere in the skeleton.
    //
    // It is drawn as a RIM. The cup floor sits at 2.15 cm, inside the 2.40 cm
    // head, so none of it renders and the head is bare where the socket opens
    // — which is what an AP hip film looks like: a ball with one hard edge
    // across it. Sinking the floor inside the head rather than deleting it is
    // what keeps the mesh closed.
    //
    // Unrigged, so it stays with the trunk while the head rides the leg. That
    // division is the joint: the ball turns inside a socket that does not.
    put(
      "acetabulum",
      socket(
        mat,
        J[`hip${side}`],
        [k * 0.72, -0.65, 0.24],
        (c) =>
          cm(2.15) +
          cm(1.2) * smooth(0.64, 0.44, c) -
          cm(0.2) * smooth(0.1, -0.75, c),
        24,
      ),
    );
    // PUBIC BODY. The two superior rami both ended at x = ±0.007 with a radius
    // of 0.85 cm, so their flat caps passed through each other and the
    // "symphysis" was that accident. Each side gets a body, the rami stop
    // inside it, and the 4 mm between them is the joint — which is what the
    // symphysial disc actually measures.
    put(
      "pubicBody",
      ellipsoid(
        mat,
        [k * cm(1.0), 0.1735, 0.0505],
        [cm(0.78), cm(1.85), cm(1.25)],
        null,
        12,
      ),
    );
    // ISCHIAL TUBEROSITY — what you actually sit on.
    put(
      "ischium",
      ellipsoid(
        mat,
        [k * 0.052, 0.1495, -0.0295],
        [cm(2.1), cm(2.9), cm(2.5)],
        null,
        14,
      ),
    );
    put(
      "superiorRamus",
      tube(
        mat,
        [
          [k * 0.05, 0.194, 0.012],
          [k * 0.034, 0.182, 0.042],
          [k * 0.0135, 0.174, 0.0505],
        ],
        cm(0.85),
        { radial: 8, stations: 14 },
      ),
    );
    put(
      "ischiopubicRamus",
      tube(
        mat,
        [
          [k * 0.0135, 0.174, 0.0505],
          [k * 0.03, 0.154, 0.03],
          [k * 0.0505, 0.1555, -0.018],
        ],
        cm(0.75),
        { radial: 8, stations: 14 },
      ),
    );
  });

  // Long bones, and the girdle they hang from. The skeleton has to be a whole
  // skeleton: it used to stop at the elbow and the knee, and it had no
  // shoulder girdle at all, so each arm floated beside a rib cage it was not
  // attached to.
  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    shoulderGirdle(group, mat, s, k);
    limbBones(group, mat, s, k);
    const named = (limb, name, mesh) => {
      mesh.name = `${name}${s}`;
      group.add(rides(limb, mesh));
      return mesh;
    };

    // THE TWO LONG BONES USED TO BE SYMMETRIC SWELLS WITH FLAT CAPS, so a
    // femoral head and a pair of femoral condyles were literally the same
    // shape — a sawn disc of 2.7 cm radius — and the same was true of the
    // humerus at the shoulder and the elbow. A long bone's two ends are the
    // most different things about it, and they carry the joints.
    //
    // Each shaft now ENDS INSIDE its own epiphysis, which is the cheapest of
    // the three ways to lose a flat cap: a cap buried in another solid is not
    // a defect and costs nothing to hide.

    // FEMORAL HEAD. Centred exactly on J.hip — which IS the leg pivot — so
    // rotating the leg maps the sphere to itself and the joint space is
    // preserved to floating point at every pose, with no rig change at all.
    named(
      `leg${s}`,
      "femoralHead",
      ellipsoid(mat, J[`hip${s}`], [cm(2.4), cm(2.4), cm(2.4)], null, 16),
    );
    // GREATER TROCHANTER — the lever the hip abductors pull on, and the bump
    // you feel on the side of your hip.
    named(
      `leg${s}`,
      "trochanter",
      ellipsoid(
        mat,
        [k * 0.1215, 0.159, -cm(0.45)],
        [cm(1.55), cm(2.35), cm(1.9)],
        null,
        16,
      ),
    );
    // FEMUR. A femur does not run from the hip joint; it runs from a head, up
    // and medial, down a NECK to a shaft that starts 3 cm lateral to it. The
    // old straight path from J.hip is why the bone appeared to grow out of the
    // side of the pelvis.
    named(
      `leg${s}`,
      "femur",
      sweep(
        mat,
        [
          J[`hip${s}`],
          [k * 0.10332, 0.17009, 0.00262],
          [k * 0.1145, 0.143, 0.0042],
          [k * 0.101, 0.07, 0.0072],
          [k * 0.093, -0.01, 0.0086],
          [k * 0.0885, -0.09, 0.0064],
          [k * 0.088, -0.1215, 0.0122],
        ],
        (t, th) =>
          round(
            th,
            (cm(1.58) -
              cm(0.3) * Math.exp(-(((t - 0.085) / 0.05) ** 2)) +
              cm(0.58) * smooth(0.74, 1, t)) *
              domeStart(t, 0.045),
          ),
        { stations: 36, radial: 14 },
      ),
    );
    // DISTAL FEMUR — the condyles, as a block rather than the end of a tube.
    //
    // A sweep cannot make this. Its surface converges on the centreline at the
    // cap, so the lowest point of the bone would be ON the midline, which is
    // exactly where the intercondylar notch has to be: the bilobe and the
    // roll-over fight each other. So it is an ellipsoid centred on the
    // condyles' centre of curvature, 2 cm above the joint line, which is what
    // makes its inferior surface the articular surface.
    //
    // `seg` MUST be a multiple of 4. The notch and the trochlear groove are
    // both sagittal-midline features and SphereGeometry only puts vertices on
    // d.x = 0 when it is — otherwise both render off-centre and too shallow.
    named(
      `knee${s}`,
      "condyles",
      ellipsoid(
        mat,
        [k * 0.088, -0.1285, 0.0125],
        [cm(3.9), cm(2.05), cm(3.1)],
        (v, d) => {
          // Intercondylar notch: one block becomes two lobes by RAISING the
          // floor in the midline over the inferior and posterior surfaces. A
          // groove cut from outside would only dimple it.
          v.y +=
            cm(1.55) *
            Math.exp(-((d.x / 0.22) ** 2)) *
            smooth(-0.15, -0.8, d.y + 0.85 * d.z);
          // Trochlea: the patellar groove, anterior, deepest above the line.
          v.z -=
            cm(1.9) *
            Math.exp(-((d.x / 0.26) ** 2)) *
            Math.max(0, d.z) ** 1.4 *
            smooth(-0.75, 0.1, d.y);
          v.x +=
            Math.sign(d.x) *
            cm(0.5) *
            Math.abs(d.x) ** 6 *
            Math.exp(-((d.y / 0.5) ** 2));
          // The MEDIAL condyle hangs lower. This is why a femur is handed.
          v.y -= cm(0.4) * Math.max(0, -k * d.x) ** 2 * Math.max(0, -d.y);
        },
        24,
      ),
    );

    // HUMERAL HEAD, on the shoulder pivot for the same reason as the femoral.
    named(
      `arm${s}`,
      "humeralHead",
      ellipsoid(mat, J[`shoulder${s}`], [cm(2.3), cm(2.3), cm(2.3)], null, 16),
    );
    named(
      `arm${s}`,
      "humerus",
      sweep(
        mat,
        [
          J[`shoulder${s}`],
          [k * 0.2, 0.618, 0.003],
          [k * 0.2235, 0.5085, 0.0046],
        ],
        (t, th) =>
          round(
            th,
            (cm(1.12) -
              cm(0.18) * Math.exp(-(((t - 0.13) / 0.07) ** 2)) +
              cm(0.52) * smooth(0.76, 1, t)) *
              domeStart(t, 0.06),
          ),
        { stations: 26, radial: 14 },
      ),
    );
    // DISTAL HUMERUS — a spool. The trochlear groove is a channel at 40% of
    // the way toward the medial side, the mound lateral of it is the
    // capitellum, and cutting the channel as a function of d.x is what makes
    // it wrap front AND back, which is what a pulley is.
    named(
      `elbow${s}`,
      "trochlea",
      ellipsoid(
        mat,
        [k * 0.2245, 0.506, 0.0045],
        [cm(2.85), cm(1.55), cm(1.9)],
        (v, d) => {
          v.multiplyScalar(
            1 -
              0.22 *
                Math.exp(-(((d.x + k * 0.4) / 0.22) ** 2)) *
                (1 - Math.max(0, d.y) ** 2),
          );
          // Olecranon fossa: the hollow on the BACK that the point of the
          // ulna drops into when the arm straightens.
          v.z +=
            cm(1.15) *
            Math.max(0, -d.z) ** 1.5 *
            Math.exp(-((d.x / 0.3) ** 2)) *
            Math.exp(-(((d.y - 0.35) / 0.36) ** 2));
          v.z -=
            cm(0.75) *
            Math.max(0, d.z) ** 1.5 *
            Math.exp(-((d.x / 0.28) ** 2)) *
            Math.exp(-(((d.y - 0.4) / 0.34) ** 2));
          // Epicondyles. The medial one is the big one, and subcutaneous —
          // it is the bone you hit when you hit your funny bone.
          v.x +=
            Math.sign(d.x) *
            (d.x * k < 0 ? cm(0.6) : cm(0.4)) *
            Math.abs(d.x) ** 5 *
            Math.exp(-(((d.y - 0.3) / 0.5) ** 2));
        },
        20,
      ),
    );
  });

  // Calvaria — the diploë between its tables is marrow too.
  group.add(
    rides(
      "head",
      ellipsoid(
        mat,
        [0, 0.962, 0.002],
        [cm(7.6), cm(8.2), cm(8.6)],
        (v, d) => {
          if (v.y < 0) v.y *= 0.4;
        },
        26,
      ),
    ),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.55, 0) };
}

/**
 * The shoulder girdle: clavicle and scapula.
 *
 * These were the conspicuous absence once the forearm and hand arrived. An arm
 * that begins at a humeral head with nothing behind it does not read as
 * attached; the girdle is what joins a limb to a trunk, and the clavicle is
 * the ONLY bony joint between them — the scapula is held on by muscle and
 * floats over the rib cage, which is why it can slide and the collarbone
 * breaks.
 *
 * Both ride the arm. The scapula is not strictly a limb bone, but it moves
 * with the arm rather than with the trunk — every time you raise an arm past
 * the horizontal the scapula rotates under it — so parenting it to the trunk
 * would be the more wrong of the two available answers.
 */
function shoulderGirdle(group, mat, s, k) {
  const arm = `arm${s}`;

  // Clavicle: an S, convex forward at the sternal two thirds and convex
  // backward at the acromial third. Drawn as an S because a straight bar here
  // is the single most recognisable mistake in a skeleton drawing.
  group.add(
    rides(
      arm,
      sweep(
        mat,
        [
          [k * cm(1.5), 0.7555, cm(6.4)],
          [k * 0.062, 0.7525, cm(5.6)],
          [k * 0.112, 0.7495, cm(1.8)],
          [k * 0.148, 0.7455, -cm(1.4)],
          [k * 0.166, 0.7425, -cm(2.2)],
        ],
        (t, th) => {
          // Round at the sternal end, flattening to a blade at the acromial.
          const r = cm(0.72) - cm(0.26) * smooth(0.15, 0.9, t);
          const flat = smooth(0.55, 1, t);
          return ellipse(th, r * (1 + 0.55 * flat), r * (1 - 0.38 * flat));
        },
        {
          stations: 26,
          radial: 10,
          seed: new THREE.Vector3(0, 1, 0),
        },
      ),
    ),
  );

  // Scapula: a flat triangle lying on the back of the rib cage, ribs 2 to 7,
  // narrowing to the inferior angle you can feel through the skin.
  group.add(
    rides(
      arm,
      ellipsoid(
        mat,
        [k * 0.079, 0.687, -0.0635],
        [cm(4.6), cm(7.4), cm(0.5)],
        (v, d) => {
          // Down to a point at the inferior angle, and shorter along the top.
          v.x *= 1 - 0.66 * Math.max(0, -d.y) ** 1.25;
          v.x *= 1 - 0.2 * Math.max(0, d.y) ** 2;
          // It WRAPS. The lateral edge curves forward around the cage, which
          // is what stops a flat plate from standing off the back like a lid.
          v.z += cm(3.4) * Math.max(0, k * d.x) ** 1.6;
        },
        26,
      ),
    ),
  );

  // Spine of the scapula, running out and up to the acromion — the ridge you
  // can trace with a finger from the midline to the point of the shoulder.
  group.add(
    rides(
      arm,
      sweep(
        mat,
        [
          [k * 0.042, 0.706, -0.066],
          [k * 0.096, 0.716, -0.062],
          [k * 0.142, 0.7275, -0.048],
          [k * 0.168, 0.7375, -0.026],
        ],
        (t, th) => {
          const r = cm(0.85) + cm(0.55) * smooth(0.55, 1, t);
          return ellipse(th, r * 0.55, r);
        },
        { stations: 20, radial: 10, seed: new THREE.Vector3(0, 0, 1) },
      ),
    ),
  );

  // Coracoid: the hook in front that the biceps and pectoralis minor pull on.
  // Small, but a scapula without it is a plate rather than a scapula.
  group.add(
    rides(
      arm,
      sweep(
        mat,
        [
          [k * 0.118, 0.7345, -cm(1.0)],
          [k * 0.116, 0.7395, cm(0.6)],
          [k * 0.104, 0.7365, cm(1.9)],
        ],
        (t, th) => round(th, cm(0.72) * (1 - 0.25 * t) * domeEnd(t, 0.2)),
        { stations: 14, radial: 8 },
      ),
    ),
  );
}

/* -------------------------------------------------------------- hematology */

/**
 * The marrow, and the spleen.
 *
 * WHAT THIS PANEL IS ACTUALLY ABOUT. A CBC counts cells; the cells are made in
 * red marrow and destroyed in the spleen. So the view is the marrow itself —
 * not the bones around it, which are now a system of their own — and the
 * distribution below is the real adult one: red marrow retreats out of the
 * limbs during childhood and ends up in the axial skeleton and the two
 * proximal metaphyses. The iliac crest is drawn heaviest because it holds the
 * most and because it is where a needle actually goes.
 *
 * Each piece sits INSIDE its bone, at roughly the calibre of the cavity. Lit
 * on its own it reads as a spine, a sternum and two wings glowing through the
 * skin, which is what a marrow map looks like — and never as a skeleton.
 */
function buildHematology(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Vertebral marrow. Every body from C7 down is red marrow in an adult; the
  // cervical ones above it have largely converted to fat, so the column starts
  // at the shoulders rather than at the skull.
  const levels = [
    LEVEL.C7,
    LEVEL.T1,
    LEVEL.T2,
    LEVEL.T3,
    LEVEL.T4,
    LEVEL.T5,
    LEVEL.T6,
    LEVEL.T7,
    LEVEL.T8,
    LEVEL.T9,
    LEVEL.T10,
    LEVEL.T11,
    LEVEL.T12,
    LEVEL.L1,
    LEVEL.L2,
    LEVEL.L3,
    LEVEL.L4,
    LEVEL.L5,
  ];
  levels.forEach((y, i) => {
    const gap = i < levels.length - 1 ? y - levels[i + 1] : 0.038;
    // Inside the cortex of the body drawn by buildSkeletal, so the two never
    // fight for the same surface.
    const r = (cm(1.3) + cm(1.5) * ((i + 6) / 24)) * 0.72;
    group.add(
      ellipsoid(
        mat,
        onSpine(y),
        [r, gap * 0.3, r * 0.78],
        (v, d) => {
          const w = 1 / Math.max(0.7, Math.sqrt(1 - d.y * d.y));
          v.x *= w;
          v.z *= w;
        },
        14,
      ),
    );
  });

  // Sternal marrow — the other classic aspiration site, and the reason a
  // sternum is worth drawing at all in a blood panel.
  group.add(
    sweep(
      mat,
      [
        [0, 0.752, cm(7.5)],
        [0, 0.7, cm(8.4)],
        [0, 0.62, cm(8.0)],
      ],
      (t, th) =>
        ellipse(th, cm(1.5) * (1 - 0.35 * t), cm(0.28) * domeEnd(t, 0.12)),
      { stations: 16, radial: 10, seed: new THREE.Vector3(-1, 0, 0) },
    ),
  );

  // Rib marrow: the posterior half of each rib, which is the part that stays
  // red. The anterior arches convert early and are left out.
  RIBS.slice(0, 10).forEach((rib, i) => {
    const yBack = LEVEL.T1 - (i / 11) * (LEVEL.T1 - LEVEL.T12);
    [1, -1].forEach((k) => {
      group.add(
        tube(
          mat,
          [
            [k * cm(1.9), yBack, -cm(2.2)],
            [k * cm(5.0), yBack - rib.fall * 0.12, -cm(6.2)],
            [k * rib.wide * 0.92, yBack - rib.fall * 0.4, -cm(1.6)],
          ],
          cm(0.3),
          { radial: 6, stations: 16, caps: false },
        ),
      );
    });
  });

  // Iliac marrow. The heaviest deposit in the adult body and the site of a
  // marrow biopsy — so it is drawn as the mass it is rather than as a rim.
  [1, -1].forEach((k) => {
    group.add(
      ellipsoid(
        mat,
        [k * 0.072, 0.238, -0.01],
        [cm(1.0), cm(4.2), cm(4.6)],
        (v, d) => {
          v.x += k * cm(3.2) * Math.max(0, d.y) ** 1.4;
          v.z -= cm(1.4) * Math.max(0, -d.y);
          v.y *= 1 - 0.3 * Math.max(0, -d.z);
        },
        20,
      ),
    );
  });

  // The two proximal metaphyses that keep red marrow into adult life.
  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    group.add(
      rides(
        `leg${s}`,
        sweep(
          mat,
          [J[`hip${s}`], [k * 0.085, 0.11, 0.003], [k * 0.086, 0.05, 0.005]],
          (t, th) => round(th, cm(1.5) * (1 - 0.4 * t) * domeStart(t, 0.14)),
          { stations: 16, radial: 10 },
        ),
      ),
    );
    group.add(
      rides(
        `arm${s}`,
        sweep(
          mat,
          [
            J[`shoulder${s}`],
            [k * 0.192, 0.678, 0.002],
            [k * 0.198, 0.632, 0.003],
          ],
          (t, th) => round(th, cm(1.05) * (1 - 0.4 * t) * domeStart(t, 0.16)),
          { stations: 14, radial: 10 },
        ),
      ),
    );
  });

  // Spleen, between ribs 9 and 11 on the left, its long axis along the tenth.
  // The notched anterior border is its signature, and it is what a surgeon
  // palpates for.
  group.add(
    ellipsoid(
      mat,
      [0.108, 0.505, -0.026],
      [cm(3.4), cm(5.6), cm(2.2)],
      (v, d) => {
        v.y += cm(2.2) * d.x;
        v.multiplyScalar(
          1 - 0.16 * Math.exp(-(((d.y - 0.2) / 0.16) ** 2)) * Math.max(0, d.z),
        );
        v.multiplyScalar(
          1 - 0.16 * Math.exp(-(((d.y + 0.25) / 0.16) ** 2)) * Math.max(0, d.z),
        );
      },
      26,
    ),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.5, 0) };
}

/* ------------------------------------------------------------------ immune */

/** Lymphatics, thymus and the joints a rheumatology panel is about. */
function buildImmune(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Thymus, behind the manubrium. Large in the young, fatty later — but it is
  // where T cells are selected, so it belongs in this plate.
  group.add(
    ellipsoid(
      mat,
      [0, 0.706, 0.056],
      [cm(2.2), cm(2.9), cm(1.0)],
      (v, d) => {
        v.x *= 1 - 0.4 * Math.exp(-Math.abs(d.x) / 0.25);
      },
      20,
    ),
  );

  // Node chains, each along the vessel it follows.
  [1, -1].forEach((k) => {
    chain(
      mat,
      group,
      [
        [k * 0.03, 0.86, 0.016],
        [k * 0.036, 0.8, 0.01],
        [k * 0.04, 0.762, 0.006],
      ],
      5,
      cm(0.6),
    ); // deep cervical
    chain(
      mat,
      group,
      [
        [k * 0.09, 0.744, 0.004],
        [k * 0.13, 0.73, 0.002],
        [k * 0.16, 0.71, 0.0],
      ],
      4,
      cm(0.7),
    ); // axillary
    chain(
      mat,
      group,
      [
        [k * 0.02, 0.69, -0.01],
        [k * 0.03, 0.665, -0.014],
        [k * 0.036, 0.64, -0.016],
      ],
      3,
      cm(0.5),
    ); // hilar
    chain(
      mat,
      group,
      [
        [k * 0.022, 0.44, -0.03],
        [k * 0.024, 0.38, -0.03],
        [k * 0.026, 0.33, -0.028],
      ],
      4,
      cm(0.55),
    ); // para-aortic
    chain(
      mat,
      group,
      [
        [k * 0.05, 0.29, -0.012],
        [k * 0.062, 0.25, 0.004],
        [k * 0.07, 0.216, 0.018],
      ],
      4,
      cm(0.6),
    ); // iliac + inguinal
  });
  // Mesenteric nodes, the largest collection in the body.
  chain(
    mat,
    group,
    [
      [0.01, 0.372, -0.008],
      [-0.012, 0.34, 0.0],
      [-0.026, 0.306, 0.008],
    ],
    4,
    cm(0.55),
  );

  // Thoracic duct: from the cisterna chyli at L2, up through the aortic
  // hiatus to the right of the aorta, crossing to the left at T5 and emptying
  // into the left subclavian vein. Almost never drawn, and the single most
  // "textbook" structure in the lymphatic system.
  group.add(
    ellipsoid(
      mat,
      [-0.014, LEVEL.L2, -0.038],
      [cm(0.9), cm(1.6), cm(0.7)],
      null,
      12,
    ),
  );
  group.add(
    tube(
      mat,
      [
        [-0.014, LEVEL.L2, -0.038],
        [-0.012, LEVEL.T12, -0.04],
        [-0.01, LEVEL.T8, -0.042],
        [-0.002, LEVEL.T5, -0.042],
        [0.014, 0.69, -0.032],
        [0.026, 0.728, -0.018],
      ],
      cm(0.25),
      { radial: 6, stations: 26 },
    ),
  );

  // The joints. Rheumatoid disease is symmetrical and small-joint first — it
  // takes the knuckles before the knees — so the hand is drawn out rather
  // than left as the single blob the mannequin has.
  // Every one of these is in a limb, so every one of them rides it. The
  // shoulder and hip capsules sit ON their pivot, so their own rotation is
  // invisible — they are parented anyway, because a joint that stayed behind
  // while the limb it belongs to moved would be the most obviously wrong
  // object on the screen.
  [
    ["shoulderL", "armL"],
    ["shoulderR", "armR"],
    ["elbowL", "armL"],
    ["elbowR", "armR"],
    ["wristL", "armL"],
    ["wristR", "armR"],
    ["hipL", "legL"],
    ["hipR", "legR"],
    ["kneeL", "legL"],
    ["kneeR", "legR"],
    ["ankleL", "legL"],
    ["ankleR", "legR"],
  ].forEach(([j, limb]) => {
    group.add(
      rides(limb, ellipsoid(mat, J[j], [cm(2.8), cm(2.2), cm(2.8)], null, 16)),
    );
  });
  [
    ["L", 1],
    ["R", -1],
  ].forEach(([s, k]) => {
    const w = J[`wrist${s}`];
    for (let i = 0; i < 4; i++) {
      const spread = (i - 1.5) * cm(1.5);
      group.add(
        rides(
          `arm${s}`,
          ellipsoid(
            mat,
            [w[0] + k * cm(0.6), w[1] - cm(6.5), w[2] + spread],
            [cm(0.7), cm(0.7), cm(0.7)],
            null,
            10,
          ),
        ),
      );
      group.add(
        rides(
          `arm${s}`,
          ellipsoid(
            mat,
            [w[0] + k * cm(0.8), w[1] - cm(9.5), w[2] + spread * 1.1],
            [cm(0.55), cm(0.55), cm(0.55)],
            null,
            10,
          ),
        ),
      );
    }
  });

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.5, 0) };
}

/* --------------------------------------------------------------- nutrition */

/** Oesophagus to rectum — where nutrients are actually absorbed. */
function buildNutrition(color) {
  const group = new THREE.Group();
  const mat = organMaterial(color);

  // Oesophagus, behind the trachea and slightly left, through the hiatus at
  // T10.
  group.add(
    tube(
      mat,
      [
        [0, 0.8, 0.006],
        [0, 0.72, -0.006],
        [0.006, 0.62, -0.016],
        [0.014, LEVEL.T10, -0.014],
        [0.02, 0.498, -0.008],
      ],
      cm(0.9),
      { radial: 10, stations: 26 },
    ),
  );

  // Stomach. A J: cardia at the hiatus, fundus rising left under the
  // diaphragm, body descending, then the antrum turning right to the pylorus
  // at the transpyloric plane. Swept along that path, the greater curvature
  // falls out of the geometry — it is simply the outside of the bend.
  group.add(
    sweep(
      mat,
      [
        [0.022, 0.5, -0.006],
        [0.045, 0.517, 0.004],
        [0.056, 0.492, 0.016],
        [0.052, 0.455, 0.024],
        [0.032, 0.428, 0.03],
        [0.004, 0.424, 0.026],
        [-0.016, 0.436, 0.014],
        [-0.026, LEVEL.L1, 0.004],
      ],
      (t, th) => {
        const bulk =
          smooth(0, 0.16, t) * (1 - smooth(0.62, 0.98, t) * 0.78) * 0.9 + 0.1;
        const r = cm(4.6) * bulk;
        // Rugae — the longitudinal folds of the lining, visible through the
        // wall as a gentle corrugation.
        return ellipse(th, r * (1 + 0.045 * Math.sin(th * 7)), r * 0.86);
      },
      { stations: 44, radial: 20 },
    ),
  );

  // Duodenum, the C-loop that wraps the head of the pancreas.
  group.add(
    sweep(
      mat,
      [
        [-0.026, LEVEL.L1, 0.004],
        [-0.048, 0.432, -0.002],
        [-0.058, 0.404, -0.01],
        [-0.054, 0.372, -0.014],
        [-0.03, 0.358, -0.016],
        [-0.0, 0.362, -0.018],
        [0.018, 0.386, -0.016],
        [0.024, 0.404, -0.012],
      ],
      (t, th) => round(th, cm(1.5)),
      { stations: 34, radial: 12, caps: false },
    ),
  );

  // Jejunum and ileum: six metres, packed into the central abdomen in gentle
  // festoons. Real bowel lies in loops that fold back on themselves; a random
  // walk reads as spaghetti, so the path is authored as descending U-turns
  // and narrows as it goes, jejunum to ileum.
  const coils = [];
  for (let i = 0; i <= 36; i++) {
    const t = i / 36;
    const turn = t * Math.PI * 5.2;
    // Loops of unequal reach and depth. Evenly-sized ones read as a stack of
    // identical sausages; real bowel hangs in festoons, some loops running
    // right across the abdomen and others barely leaving the midline.
    const wob = 0.74 + 0.26 * Math.sin(t * 11.3 + 1.7);
    const width = cm(6.8) * wob * (1 - 0.14 * t);
    coils.push([
      -(Math.sin(turn) * width - cm(0.6) + cm(3.2) * t),
      0.408 -
        t * 0.122 +
        Math.cos(turn * 0.5) * cm(1.2) +
        Math.sin(t * 17) * cm(0.6),
      0.03 - Math.cos(turn) * cm(1.9) - cm(0.5) * t,
    ]);
  }
  group.add(
    sweep(
      mat,
      coils,
      // Jejunum is wider than ileum, and it narrows the whole way down.
      (t, th) =>
        round(th, (cm(1.55) - cm(0.5) * t) * (1 + 0.06 * Math.sin(t * 61))),
      { stations: 220, radial: 10, caps: false },
    ),
  );

  // Colon. The frame around the small bowel: caecum low right, up the right
  // flank, across (sagging in the middle), down the left flank — with the
  // splenic flexure HIGHER than the hepatic, because the liver sits on one
  // side and not the other — then the sigmoid into the pelvis.
  group.add(
    sweep(
      mat,
      [
        [-0.084, 0.256, 0.012],
        [-0.096, 0.304, 0.012],
        [-0.104, 0.372, 0.012],
        [-0.1, 0.428, 0.008],
        [-0.062, 0.44, 0.014],
        [-0.01, 0.404, 0.028],
        [0.042, 0.396, 0.026],
        [0.086, 0.436, 0.012],
        [0.1, 0.4, 0.004],
        [0.104, 0.33, 0.006],
        [0.09, 0.276, 0.008],
        [0.05, 0.246, 0.006],
        [0.014, 0.234, -0.004],
        [0, 0.216, -0.018],
        [0, 0.186, -0.022],
      ],
      (t, th) => {
        const r = cm(3.1) - cm(1.4) * smooth(0, 0.92, t);
        // Haustra and the three taeniae coli. The sacculation is what makes a
        // colon a colon rather than a wide loop of small bowel, and it is one
        // ripple in t times one in θ.
        const sac = 1 + 0.11 * Math.sin(t * 76) * (1 - smooth(0.86, 1, t));
        const tae = 1 + 0.055 * Math.cos(th * 3);
        return round(th, r * sac * tae);
      },
      { stations: 130, radial: 16 },
    ),
  );

  // Appendix, off the caecum.
  group.add(
    tube(
      mat,
      [
        [-0.08, 0.245, 0.016],
        [-0.07, 0.232, 0.022],
        [-0.056, 0.226, 0.024],
      ],
      cm(0.4),
      { radial: 6, stations: 12 },
    ),
  );

  return { group, materials: [mat], focus: new THREE.Vector3(0, 0.37, 0.03) };
}

/* ---------------------------------------------------------------- systemic */

/**
 * Whole-body shell. Cancer has no single organ, so the systemic view is the
 * figure itself rather than an anchor point.
 */
function buildSystemic(color, bodyGroup) {
  const mat = organMaterial(color);
  mat.side = THREE.BackSide;
  // Clone the whole figure rather than copying each mesh's own transform. The
  // limbs now hang off joint pivots, so a mesh's local transform no longer
  // says where it is — only the hierarchy does. Cloning keeps the hierarchy,
  // shares the geometry, and means the shell moves when the figure dances
  // instead of standing still inside it.
  const group = bodyGroup.clone(true);
  group.scale.setScalar(1.055);
  group.traverse((o) => {
    if (o.isMesh) o.material = mat;
  });
  // The clone has its own Object3D nodes, so it does not inherit the figure's
  // pose. Handing back the matching pivots lets the frame loop drive both from
  // one set of numbers — otherwise the shell stands still while the body it is
  // a shell of dances, which is worse than not animating at all.
  const rig = {};
  ["head", "armL", "armR", "legL", "legR"].forEach((n) => {
    const node = group.getObjectByName(n);
    if (node) rig[n] = node;
  });
  return { group, rig, materials: [mat], focus: new THREE.Vector3(0, 0.35, 0) };
}

/** Organ systems keyed to the eleven specialty panels. */
export function buildOrgans(bodyGroup) {
  // Hues are spread around the wheel rather than clustered in earth tones:
  // with eleven systems, "which organ am I looking at" has to survive being
  // answered by colour alone.
  const systems = {
    neuro: buildNeuro(0x7c5cd6), // violet
    cardio: buildCardio(0xdc3f3f), // red
    endocrine: buildEndocrine(0xe8a01a), // amber
    hepatic: buildHepatic(0xc2622a), // burnt orange
    renal: buildRenal(0x17a2a2), // teal
    hematology: buildHematology(0xd42a72), // magenta
    pulmonary: buildPulmonary(0x2f8fd6), // sky
    immune: buildImmune(0x3fae55), // green
    nutrition: buildNutrition(0x9ec219), // lime
    // Ivory, and deliberately the least saturated of the eleven: bone is the
    // one system everyone already has a colour for, and a magenta skeleton
    // would be the only object on screen fighting its own name.
    skeletal: buildSkeletal(0xa9906c),
  };
  // Rigged here rather than inside each builder so that the ones with nothing
  // in a limb — a liver, a pair of lungs — still hand back the same five
  // pivots, and the frame loop never has to ask which kind it is holding.
  Object.values(systems).forEach((s) => {
    s.rig = rigify(s.group);
  });
  // The shell is the figure, so it gets its rig by cloning the figure's.
  systems.oncology = buildSystemic(0x5f6bd8, bodyGroup); // indigo shell
  return systems;
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
