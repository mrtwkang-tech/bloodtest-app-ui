# Full Panel — blood test subscription app

At-home blood testing mockup: five mental health scales plus 65 biomarkers
covering 17 conditions, grouped into ten organ systems — one per medical
specialty — and read through a 3D anatomy viewer. React + Vite + three.js,
English base with a full Korean dictionary.

## Design decisions

**Mind and body are separate tabs.** The scales are *state* (continuous,
fluctuating); the screenings are *risk* (mostly-null, heavy). They answer
different questions, so they never share one chart.

**Every percentage is computed.** Scale scores convert to peer percentiles
via a normal CDF (`src/lib/stats.js`); the radar plots percentiles on
graduated rings, so the peer average is a regular pentagon at 50 and every
axis is comparable. Each scale card carries a ruled percentile axis with the
peer average and screening threshold marked on it, rather than a gradient you
have to estimate against. Status, biomarker counts, and the health score are
all derived from raw values — nothing on screen is stored twice.

**Monospace carries the measurements.** Descriptions, units, states and
counts are set in mono; proportional type is reserved for names and headings.
Radii are small and stepped (14 / 10 / 8), boundaries are hairlines rather
than shadows, and status is a dot plus a word rather than a tinted capsule —
capsules are reserved for genuine badges.

**The body is a procedural 3D anatomy** (`src/three/`). The figure is driven
by a named joint map — bones drawn between articulations with a cap at each
hinge — rather than a stack of floating capsules, so the elbow, knee and
wrist read as places the body bends.

Ten organ systems, each mapped to the specialty you would be referred to:
neurology (brain, stem, cord, nerve roots), cardiology (heart, chambers,
aortic arch, carotids, subclavians, iliacs), endocrinology (thyroid,
adrenals, pancreas), hepatology (liver, gallbladder, bile duct), nephrology
(kidneys, ureters, bladder), haematology (spine and rib marrow, spleen, long
bones), pulmonology (lobed lungs, trachea, bronchi), rheumatology (joints and
node clusters), oncology (the whole figure — cancer has no single organ), and
nutrition (stomach, small bowel, colon). A flagged system glows in its status
colour; selecting one brings it forward and dims the rest. Drag to rotate
(1:1, momentum projected on release), tap an organ to open its markers.

**Marker direction is modelled.** Most markers are harmful when high, but
HDL, eGFR, haemoglobin and every vitamin are harmful when *low*. Each marker
declares a `dir`, and the level thresholds and the traffic-light band both
read it — so the green stretch is always the safe side.

**Motion follows Apple's fluid-interface rules** (`src/motion/physics.js`):
press feedback on pointer-down, sheets track the finger 1:1 and rubber-band
past bounds, flicks land where the gesture was going
(`project()` — exponential decay, not v²/2a), reduced-motion honoured.

**The tab bar is real glass.** A progressive-blur stack (four masked
`backdrop-filter` layers, 2→26px) melts content into the material instead of
cutting it; the tint firms up only while content runs underneath and clears
at the page end; a specular band drifts as content moves. Solid fallback
under `prefers-reduced-transparency`.

**Statutory pages ship in-app** (`src/data/legal.js`): terms, privacy policy,
sensitive-data consent, refund/withdrawal, sample handling, open-source
licences, business disclosure. Company fields are visible placeholders
flagged "확인 필요" — replace before launch.

## Run

```bash
npm install
npm run dev
```

## Layout

- `src/data/` — instruments, zones, sessions, legal copy (all derived stats live here)
- `src/lib/` — normal CDF / percentile, trend projection
- `src/three/` — procedural anatomy + scene driver
- `src/motion/` — springs, velocity tracker, momentum projection
- `src/i18n/` — `en`/`ko` dictionaries, `useLang`
- `src/screens/`, `src/components/` — UI

## Disclaimer

All values are fabricated demo data. Screening output is not a diagnosis.
