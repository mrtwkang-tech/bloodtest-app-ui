# Pedia — longitudinal blood panel

At-home blood testing mockup: 69 biomarkers covering 17 conditions across ten
organ systems — one per medical specialty — read through a 3D anatomy viewer,
plus five mind indices and imported body composition from the same visit.
Six rounds at three-month intervals. React + Vite + three.js, English base
with a full Korean dictionary.

## The thing it is built to demonstrate

Across the six rounds, AFP rises at every draw — roughly 48% per round —
while GGT and a fibrosis estimate climb with it and platelets fall. For four
of those six draws every one of those values is inside its reference range. A
cross-sectional panel returns "normal" five times and finds the liver on the
sixth; the trajectory is legible from the third.

That is the whole argument for a subscription rather than a check-up:
`interactions.js` can fit a slope because it has a series to fit it to. Body
composition corroborates it from a second instrument — unintentional weight
loss with a falling phase angle, in the same window.

## Design decisions

**The mind indices come out of the blood, not a questionnaire.** This is a
blood test, so a PHQ-9 score had no business being here — it is a number the
panel cannot produce. Each index is instead a weighted composite of markers
the draw actually measures, along pathways known to move mood: inflammation
(hs-CRP, IL-6), tryptophan diversion (Kyn/Trp), neuroplasticity (BDNF), the
stress axis (cortisol, DHEA-S), overnight melatonin output, oxygen delivery
and thyroid. Every card shows the chain — *marker → mechanism → index* — in
plain language, because the index alone is uninterpretable to a non-specialist.

This is also why a 1–3 month cadence is the right one: these markers integrate
over weeks to months. HbA1c averages 2–3 months of glucose; ferritin and the
omega-3 index shift over months; BDNF and cortisol over weeks. A daily reading
would be noise. An index describes biological load along a pathway — it is not
a diagnosis, and the UI says so.

**Mind and body are separate tabs.** The indices are *state*; the screenings
are *risk* (mostly-null, heavy). They answer different questions.

**Body composition is imported, not decorative.** An InBody series pairs with
the blood over the same rounds, and the cross-read block names the places one
changes how the other should be read — most usefully creatinine, which is a
muscle breakdown product, so a muscular body posts a high creatinine and a low
estimated GFR with healthy kidneys.

**Cross-system signals (BETA).** A per-specialty panel can only ask "is this
marker out of range?". It cannot ask whether three in-range markers, in this
combination, are a pattern — and that is where the interesting findings live:
residual inflammatory risk behind handled lipids, glucose tracking stress
rather than diet, inflammation reaching mood, three normal values that add up
to fatigue. Six conservative rules, each showing the readings it was built
from. Labelled BETA because these are heuristics over demo data, not a
validated risk model.

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
