import { C, EASE, STATUS_LAMP, T, tint } from "../tokens";
import { SCALE_META } from "../data/scales";
import { readMarker } from "../data/panels";
import { useT } from "../i18n";

/**
 * The day, as a dial — the one mind axis with an unambiguous physical shape.
 *
 * WHY THIS EXISTS AS A CANDIDATE AT ALL, given it can only speak for one of the
 * five. Because circadian alignment is not a quantity, it is a PHASE, and every
 * other rendering in this product flattens phase into a number and loses the
 * only thing that made it interesting. `scales.js` says so about the axis
 * itself — "Phase, not duration. Nothing here knows how long you slept." A bar
 * cannot draw a phase. A clock face can, and it is the one shape a reader
 * already knows how to read without being taught.
 *
 * The two curves are the two the panel actually measures. Cortisol peaks about
 * half an hour after waking — the cortisol awakening response, `body.js` has it
 * as its own marker with `requiresFixedTime` — and melatonin rises after dusk,
 * measured the next morning as 6-sulfatoxymelatonin. Both markers are in the
 * circadian axis's driver list; nothing here is invented for the picture.
 *
 * WHY IT WAS UNREADABLE, and what was done about it. The clock is the half that
 * works: time-as-angle is a notation every reader already owns. The other half
 * was a second encoding nobody owns — CONCENTRATION AS RADIAL THICKNESS — used
 * four times over, in two solid bands and two dashed ghosts, with no key naming
 * which band was which hormone. The one instruction on screen ("filled curve:
 * cortisol · outline: melatonin") had gone false when the tracks were split;
 * both were filled by then. So a reader was asked to decode an unfamiliar
 * encoding, unaided, from a legend that lied. The fixes, in order of how much
 * they matter:
 *
 *   1. SAY WHAT THE SHAPES ARE. A real key, with the hormones named and glossed
 *      in plain language, and one line stating the radial rule outright.
 *   2. PRINT THE FINDING. The phase shift was drawn as the gap between a solid
 *      arc and a dashed one and left for the reader to measure by eye. It is
 *      now also a sentence with a number in it — "24 minutes later than peers"
 *      — which is what a reader wanted from the gap in the first place.
 *   3. FEWER SHAPES. The melatonin ghost is gone. The cortisol ghost stays,
 *      because cortisol is the ring this axis is scored against, so its gap is
 *      the one the sentence below is about.
 *
 * WHAT IT STILL CANNOT DO, stated plainly because the switcher will be compared
 * on it: recovery, inflammation, substrate and metabolic have no time-of-day
 * signature in this panel, so they do not appear at all. It is an instrument
 * for one axis, shown beside a list of five.
 */

const CX = 150;
const CY = 104;
const R = 70;

/**
 * THE RADIAL STACK, OUTWARD FROM THE DIAL EDGE. Written down because four
 * things want the same 30px of margin and the first draft let two of them
 * collide: the night arc used to be a wash over the whole face, which greyed
 * out both tracks and made the melatonin band — also grey — vanish into it.
 * Night belongs at the rim, where it says "these hours are dark" without
 * tinting the measurements.
 */
const NIGHT = [R + 2, R + 7];
const PEER_TICK = [R + 9, R + 14];
const HOUR_LABEL = R + 20;
const MARK_TIP = R + 16;
const MARK_LABEL = R + 28;

/**
 * TWO TRACKS, NOT TWO BLOBS.
 *
 * Cortisol and melatonin were first drawn as bands over the same radius range,
 * and they overlap for a third of the day — the result was two shapes fighting
 * for the same pixels and neither readable. They are different hormones on
 * different clocks; they get different rings. Cortisol runs on the outside
 * because it is the one the axis is scored against, melatonin inside it.
 *
 * The inner number of each pair is that track's ZERO, and it is drawn as a
 * hairline circle. Without it "thicker means more" has nothing to be thicker
 * than, and the band reads as an arbitrary blob.
 */
const CORT = [R * 0.7, R];
const MEL = [R * 0.38, R * 0.62];

/** Where the peer's day sits — the anchor the marker ratios are measured from. */
const PEER_WAKE = 7;
const PEER_DIM = 21.5;

/** Hour → angle, midnight at the top, noon at the bottom, clockwise. */
const at = (hour, radius) => {
  const a = ((hour / 24) * 360 - 90) * (Math.PI / 180);
  return [CX + radius * Math.cos(a), CY + radius * Math.sin(a)];
};

/** An annular wedge from one hour to another, clockwise. */
function ring(fromH, toH, inner, outer) {
  const span = (toH - fromH + 24) % 24;
  const big = span > 12 ? 1 : 0;
  const p = (h, r) =>
    at(h, r)
      .map((n) => n.toFixed(1))
      .join(" ");
  return (
    `M${p(fromH, outer)} A${outer} ${outer} 0 ${big} 1 ${p(toH, outer)} ` +
    `L${p(toH, inner)} A${inner} ${inner} 0 ${big} 0 ${p(fromH, inner)} Z`
  );
}

/**
 * A curve over the day, as a BAND between the track's zero circle and the
 * value. The first version walked only the outer edge and closed it, which
 * floods the whole interior — two hormones drawn that way are two overlapping
 * discs and you cannot see either. So the path walks out along the value, back
 * around the zero circle in reverse, and closes: an annular band whose
 * thickness at any hour is the concentration at that hour.
 */
function curve(fn, inner, span) {
  const N = 96;
  const outer = [];
  const back = [];
  for (let i = 0; i <= N; i++) {
    const h = (i / N) * 24;
    outer.push(at(h, inner + span * Math.max(0, Math.min(1, fn(h)))));
    back.push(at(h, inner));
  }
  const seg = (pts, cmd) =>
    pts
      .map(([x, y], i) => `${i ? "L" : cmd}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(" ");
  return `${seg(outer, "M")} ${seg(back.reverse(), "L")} Z`;
}

/**
 * Just the value edge, open, for the peer's ghost. Stroking the closed band
 * path drew a dashed circle around the track's zero as well as the curve — a
 * second full ring the reader had to learn to ignore. It breaks the path where
 * the value is cut off, so the ghost exists only over the hours the hormone
 * does, exactly like the solid band beside it.
 */
function edge(fn, inner, span) {
  const N = 96;
  const out = [];
  let pen = false;
  for (let i = 0; i <= N; i++) {
    const h = (i / N) * 24;
    const v = fn(h);
    if (v <= 0) {
      pen = false;
      continue;
    }
    const [x, y] = at(h, inner + span * Math.min(1, v));
    out.push(`${pen ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`);
    pen = true;
  }
  return out.join(" ");
}

/**
 * THE TAIL IS CUT AT SEVEN PERCENT, and this is the single change that made the
 * dial legible. Both hormones are near zero for most of the day; drawn faithful
 * to the last decimal, each band kept a 1–4px thickness right around the clock
 * and the picture came out as two concentric rings with a bulge. What it is, is
 * two humps at opposite ends of the day. Below the cut the band pinches shut
 * and — being unstroked — disappears, so the outer track is empty at night and
 * the inner track is empty by day, which is the whole finding.
 */
const cut =
  (fn, k = 0.07) =>
  (h) => {
    const v = fn(h);
    return v < k ? 0 : v;
  };

/** Cortisol: sharp peak just after waking, long decay, trough around midnight. */
const cortisol = (wake) => (h) => {
  const since = (h - wake + 24) % 24;
  const rise = Math.exp(-(((since - 0.6) / 0.9) ** 2));
  const decay = Math.exp(-since / 7);
  return Math.min(1, rise * 0.75 + decay * 0.45);
};

/** Melatonin: onset about two hours before sleep, cleared an hour after waking. */
const melatonin = (dim) => (h) => {
  const since = (h - dim + 24) % 24;
  if (since > 11) return 0.02;
  return Math.min(1, Math.sin((since / 11) * Math.PI) ** 0.7);
};

/** Decimal hour → wall clock. A time on a clock face needs no explaining. */
const clock = (h) => {
  const total = Math.round((((h % 24) + 24) % 24) * 60);
  return `${String(Math.floor(total / 60) % 24).padStart(2, "0")}:${String(
    total % 60,
  ).padStart(2, "0")}`;
};

/** Two hours within about 55 minutes of each other on the dial. */
const near = (a, b) => {
  const d = Math.abs(a - b) % 24;
  return Math.min(d, 24 - d) < 1.4;
};

/**
 * The phase shift as a sentence. This is the number the whole picture exists to
 * produce, and until now it was only ever available by eye-measuring the gap
 * between two arcs.
 */
function phaseText(t, delta) {
  const min = Math.round(Math.abs(delta) * 60);
  if (min < 5) return t("day.same");
  const h = Math.floor(min / 60);
  const m = min % 60;
  const d =
    h === 0
      ? t("day.durM", { m })
      : m === 0
        ? t("day.durH", { h })
        : t("day.durHM", { h, m });
  return t(delta > 0 ? "day.later" : "day.earlier", { d });
}

export default function DayDial({
  scores,
  statuses,
  active,
  onPick,
  roundIndex,
}) {
  const t = useT();
  const ci = SCALE_META.findIndex((m) => m.key === "circadian");
  const status = statuses[ci];

  // Phase is read off the two markers rather than assumed. A low awakening
  // response and low overnight melatonin both read as a LATER, flatter day, so
  // the whole dial rotates with the person instead of being a stock diagram.
  const car = readMarker(
    "endocrine",
    "Cortisol awakening response",
    roundIndex,
  );
  const amt6 = readMarker("neuro", "6-sulfatoxymelatonin", roundIndex);
  const carRatio = car.value / car.marker.ref;
  const melRatio = amt6.value / amt6.marker.ref;
  const wake = PEER_WAKE + Math.max(-2.5, Math.min(2.5, (1 - carRatio) * 3.2));
  const dim = PEER_DIM + Math.max(-2.5, Math.min(2.5, (1 - melRatio) * 3.2));

  const lamp = status === "good" ? C.ink2 : STATUS_LAMP[status];
  const on = !active || active === "circadian";
  const line = on ? lamp : C.ink2;

  // Each marker against the peer it is measured from. Colour only carries when
  // the shift is big enough to be worth a reader's attention — an eight-minute
  // difference lit up in amber would be the palette lying about precision.
  const MARKS = [
    { h: wake, key: "day.wake", delta: wake - PEER_WAKE },
    { h: dim, key: "day.dim", delta: dim - PEER_DIM },
  ];

  // ONE ROW OF THREE, and it was four stacked rows because of the glosses.
  //
  // The comment this replaces blamed the stack on ko and en needing different
  // widths — true, but only because each entry carried an explanation. Bare
  // names are 44px in Korean and 43–51px in English, and three of those fit on
  // one line in both languages. The explanations were the problem, and the
  // explanations were also redundant: the cortisol band BEGINS at the dot
  // labelled 기상 and the melatonin band at the dot labelled 멜라토닌 시작, so
  // "the one that wakes you" restates the picture it sits under.
  //
  // `day.night` went for the same reason, harder. Its Korean was "밤 —
  // 멜라토닌 시작부터 기상까지", a verbatim concatenation of two labels already
  // printed as the reader's own clock times 30px above, naming an arc that
  // physically terminates under each of those two dots. And its grey was a
  // near-match for the melatonin grey two rows below it, so the legend made the
  // two harder to tell apart rather than easier.
  const legend = [
    { at: 16, color: tint(line, 0.5), width: 7, dash: null, label: t("day.cortisol") },
    { at: 108, color: tint(C.ink, 0.22), width: 7, dash: null, label: t("day.melatonin") },
    { at: 196, color: C.peerStroke, width: 1.4, dash: "3 3", label: t("day.peerDay") },
  ];


  return (
    <svg
      viewBox="0 0 300 316"
      width="100%"
      style={{ display: "block", touchAction: "pan-y", cursor: "pointer" }}
      role="img"
      aria-label={`${t("scale.circadian")} ${scores[ci]} · ${t(
        "day.wake",
      )} ${clock(wake)} · ${t("day.dim")} ${clock(dim)}`}
      // THE WHOLE PICTURE IS THE TAP TARGET, and it has to be the root element
      // rather than a transparent disc behind the dial — which is what it was,
      // and which never fired: every path and numeral drawn after it sat on top
      // and swallowed the click. The caption under this card says to tap the
      // picture, and a 3mm ribbon is not what anyone will aim at.
      onClick={() => onPick("circadian")}
    >
      {/* The face: the dial edge, and one zero circle per track. */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={C.hairlineStrong}
        strokeWidth="1"
      />
      {[CORT[0], MEL[0]].map((r) => (
        <circle
          key={r}
          cx={CX}
          cy={CY}
          r={r}
          fill="none"
          stroke={C.hairline}
          strokeWidth="1"
        />
      ))}

      {/* Hours. Ticks every two so the eye can count to a marker, labels every
          six so it can orient — twelve numerals on a 144px dial is a watch
          face, not a measurement. */}
      {Array.from({ length: 12 }, (_, i) => i * 2).map((h) => {
        const [x1, y1] = at(h, R - 4);
        const [x2, y2] = at(h, R);
        return (
          <line
            key={`t${h}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.hairlineStrong}
            strokeWidth="1"
          />
        );
      })}
      {[0, 6, 12, 18]
        // Dropped when a marker's own time sits on top of it. wake ranges over
        // 04:30–09:30 and can land squarely on the 06 numeral.
        .filter((h) => !MARKS.some((m) => near(m.h, h)))
        .map((h) => {
          const [lx, ly] = at(h, HOUR_LABEL);
          return (
            <text
              key={h}
              x={lx}
              y={ly + 3.5}
              textAnchor="middle"
              style={{ ...T.micro, fill: C.faintest }}
            >
              {String(h).padStart(2, "0")}
            </text>
          );
        })}

      {/* Night, as an arc at the rim. It was a wash over the whole face, and a
          wash is the one thing you cannot do here: the melatonin band is grey,
          the night is grey, and the hours melatonin matters most are exactly
          the hours the wash covered. At the rim it says the same thing and
          tints none of the measurements. */}
      <path d={ring(dim, wake, NIGHT[0], NIGHT[1])} fill={tint(C.ink, 0.3)} />

      {/* The cortisol awakening response used to be boxed here, as a tinted
          wedge over the half hour after waking. It came out as an unexplained
          grey block sitting on the one part of the dial a reader was meant to
          look at, and there was nowhere left to put a label for it. The spike
          itself, immediately clockwise of the waking dot, IS the awakening
          response; drawing a box round it was labelling by decoration. */}

      {/* The peer's cortisol, dashed, on the outer track only. The gap between
          this and the solid band is the phase shift — the same fact the
          sentence in the footer states in minutes. Melatonin had a ghost too;
          four overlapping ribbons was three too many, and it was the ring the
          axis is NOT scored against. */}
      <path
        d={edge(cut(cortisol(PEER_WAKE)), CORT[0], CORT[1] - CORT[0])}
        fill="none"
        stroke={C.peerStroke}
        strokeWidth="1.1"
        strokeDasharray="3 3"
      />

      {/* AREA, NO OUTLINE. Both bands used to be stroked, and both hormones are
          near zero for most of the day — so for most of the day the band was
          two coincident edges and the stroke drew them as a hard ring. The
          picture came out as concentric circles with a bulge, which is the
          opposite of what it is: two humps, at opposite ends of the day, on
          separate tracks. Unstroked, a near-zero hour renders as nothing,
          which is what a near-zero hour is. */}
      <path
        d={curve(cut(melatonin(dim)), MEL[0], MEL[1] - MEL[0])}
        fill={tint(C.ink, 0.22)}
        style={{ transition: `all 420ms ${EASE}` }}
      />
      <path
        d={curve(cut(cortisol(wake)), CORT[0], CORT[1] - CORT[0])}
        fill={tint(on ? lamp : C.ink2, 0.5)}
        style={{ transition: `all 420ms ${EASE}` }}
      />

      {/* The peer's two turning points as rim ticks, so the reader's own dots
          have something to be early or late against. */}
      {[PEER_WAKE, PEER_DIM].map((h) => {
        const [x1, y1] = at(h, PEER_TICK[0]);
        const [x2, y2] = at(h, PEER_TICK[1]);
        return (
          <line
            key={`peer${h}`}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            stroke={C.peerStroke}
            strokeWidth="1.5"
            strokeDasharray="2 2"
          />
        );
      })}

      {/* Waking and melatonin onset, marked where they fall and labelled with
          the wall clock. Anchoring by the cosine keeps a five-character time
          inside the box at every angle either marker can reach. */}
      {MARKS.map(({ h, key }) => {
        const [dx, dy] = at(h, R);
        const [ax, ay] = at(h, MARK_TIP);
        const [lx, ly] = at(h, MARK_LABEL);
        const cos = (lx - CX) / MARK_LABEL;
        return (
          <g key={key}>
            <line
              x1={dx}
              y1={dy}
              x2={ax}
              y2={ay}
              stroke={C.ink}
              strokeWidth="1"
            />
            <circle
              cx={dx}
              cy={dy}
              r="3.4"
              fill={C.ink}
              stroke={C.bg}
              strokeWidth="1.4"
            />
            <text
              x={lx}
              y={ly + 3.5}
              textAnchor={cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle"}
              style={{ ...T.num, fontSize: 11, fontWeight: 600, fill: C.ink }}
            >
              {clock(h)}
            </text>
          </g>
        );
      })}

      {/* The score, and a word saying that is what it is. A bare numeral in the
          middle of a clock face reads as a time. */}
      <text
        x={CX}
        y={CY + 1}
        textAnchor="middle"
        style={{ ...T.num, fontSize: 19, fontWeight: 600, fill: C.ink }}
      >
        {scores[ci]}
      </text>
      <text
        x={CX}
        y={CY + 15}
        textAnchor="middle"
        style={{ ...T.micro, fontSize: 9, fill: C.faintest }}
      >
        {t("mind.scoreLabel")}
      </text>

      <line
        x1={16}
        y1={206}
        x2={284}
        y2={206}
        stroke={C.hairline}
        strokeWidth="1"
      />

      {/* The finding, in words. Both turning points, each with its clock time
          and its distance from the peer's — which is the quantity this axis is
          made of, and which used to exist only as the gap between two arcs. */}
      {MARKS.map(({ key, h, delta }, i) => {
        const x = i === 0 ? 16 : 284;
        const anchor = i === 0 ? "start" : "end";
        const far = Math.abs(delta) >= 1;
        return (
          <g key={`f${key}`}>
            {/* "est." is not decoration. The panel measures a marker ratio,
                not a sleep log — these clock times are MODELLED from the
                awakening response and overnight melatonin. The dial always
                asserted them, silently, by rotating; printing the numeral
                makes the claim legible, so it also has to be qualified. */}
            <text
              x={x}
              y={224}
              textAnchor={anchor}
              style={{ ...T.micro, fill: C.faint }}
            >
              {`${t(key)} · ${t("day.est")}`}
            </text>
            <text
              x={x}
              y={244}
              textAnchor={anchor}
              style={{ ...T.num, fontSize: 16, fontWeight: 600, fill: C.ink }}
            >
              {clock(h)}
            </text>
            <text
              x={x}
              y={260}
              textAnchor={anchor}
              style={{
                ...T.caption,
                fontSize: 10.5,
                fill: far && on ? lamp : C.muted,
              }}
            >
              {phaseText(t, delta)}
            </text>
          </g>
        );
      })}

      {/* The key. Two hormones named and glossed, and the dashed stroke told
          what it stands for. The line this replaces said "filled curve:
          cortisol · outline: melatonin", which stopped being true the day the
          two got separate tracks and both got filled. */}
      {legend.map((l) => (
        <g key={l.label}>
          <line
            x1={l.at}
            y1={280}
            x2={l.at + 14}
            y2={280}
            stroke={l.color}
            strokeWidth={l.width}
            strokeDasharray={l.dash ?? undefined}
          />
          <text
            x={l.at + 22}
            y={284}
            style={{ ...T.caption, fontSize: 11, fill: C.body }}
          >
            {l.label}
          </text>
        </g>
      ))}

      {/* The radial rule, stated once. Angle-as-time is a notation the reader
          already owns; thickness-as-concentration is not, and it was never
          written down anywhere on this screen. */}
      <text
        x={16}
        y={304}
        style={{ ...T.caption, fontSize: 11, fill: C.faint }}
      >
        {t("day.howto")}
      </text>
    </svg>
  );
}
