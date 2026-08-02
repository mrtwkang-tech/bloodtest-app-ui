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
 * WHAT IT CANNOT DO, stated plainly because the switcher will be compared on
 * it: recovery, inflammation, substrate and metabolic have no time-of-day
 * signature in this panel, so they appear only as marks on the rim. It is an
 * instrument for one axis, shown beside a list of five.
 */

const CX = 138;
const CY = 126;
const R = 76;

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
 * A curve over the day, as a BAND between the inner circle and the value.
 *
 * The first version walked only the outer edge and closed it, which floods the
 * whole interior — two hormones drawn that way are two overlapping discs and
 * you cannot see either. So the path walks out along the value, back around
 * the inner circle in reverse, and closes: an annular band whose thickness at
 * any hour is the concentration at that hour, which is the thing being drawn.
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
  const wake = 7 + Math.max(-2.5, Math.min(2.5, (1 - carRatio) * 3.2));
  const dim = 21.5 + Math.max(-2.5, Math.min(2.5, (1 - melRatio) * 3.2));

  const lamp = status === "good" ? C.ink2 : STATUS_LAMP[status];
  const on = !active || active === "circadian";

  return (
    <svg
      viewBox="0 0 300 236"
      width="100%"
      style={{ display: "block", touchAction: "pan-y" }}
      role="img"
      aria-label={`${t("scale.circadian")} ${scores[ci]}`}
    >
      {/* The face. Four quarter ticks and nothing else — an hour hand's worth
          of gridlines on a 300px dial is a watch face, not a measurement. */}
      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="none"
        stroke={C.hairline}
        strokeWidth="1"
      />
      <circle
        cx={CX}
        cy={CY}
        r={R * 0.52}
        fill="none"
        stroke={C.hairline}
        strokeWidth="1"
      />
      {[0, 6, 12, 18].map((h) => {
        const [x1, y1] = at(h, R * 0.52);
        const [x2, y2] = at(h, R);
        const [lx, ly] = at(h, R + 13);
        return (
          <g key={h}>
            <line
              x1={x1}
              y1={y1}
              x2={x2}
              y2={y2}
              stroke={C.hairline}
              strokeWidth="1"
            />
            <text
              x={lx}
              y={ly + 3.5}
              textAnchor="middle"
              style={{ ...T.micro, fill: C.faintest }}
            >
              {String(h).padStart(2, "0")}
            </text>
          </g>
        );
      })}

      {/* Night, as a wash rather than a label. */}
      <path d={ring(dim, wake, R * 0.52, R)} fill={tint(C.ink, 0.045)} />

      <g style={{ cursor: "pointer" }} onClick={() => onPick("circadian")}>
        {/* Melatonin first, so cortisol draws over the crossing. */}
        <path
          d={curve(melatonin(dim), R * 0.52, R * 0.44)}
          fill={tint(C.ink, 0.05)}
          stroke={C.ink2}
          strokeWidth="1.4"
          style={{ transition: `all 420ms ${EASE}` }}
        />
        <path
          d={curve(cortisol(wake), R * 0.52, R * 0.44)}
          fill={tint(on ? lamp : C.ink2, 0.09)}
          stroke={on ? lamp : C.ink2}
          strokeWidth="1.9"
          style={{ transition: `all 420ms ${EASE}` }}
        />
      </g>

      {/* Waking and dimming, marked where they actually fall. */}
      {[
        [wake, "day.wake"],
        [dim, "day.dim"],
      ].map(([h, key]) => {
        const [x, y] = at(h, R);
        const [lx, ly] = at(h, R + 26);
        return (
          <g key={key}>
            <circle cx={x} cy={y} r="3" fill={C.ink} />
            <text
              x={lx}
              y={ly + 3}
              textAnchor={
                lx > CX + 6 ? "start" : lx < CX - 6 ? "end" : "middle"
              }
              style={{ ...T.micro, fill: C.body }}
            >
              {t(key)}
            </text>
          </g>
        );
      })}

      <text
        x={CX}
        y={CY + 3}
        textAnchor="middle"
        style={{ ...T.num, fontSize: 17, fill: C.ink }}
      >
        {scores[ci]}
      </text>

      <text
        x={CX}
        y={226}
        textAnchor="middle"
        style={{ ...T.micro, fill: C.faintest }}
      >
        {t("day.legend")}
      </text>
    </svg>
  );
}
