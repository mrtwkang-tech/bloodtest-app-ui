# Full Panel — blood test subscription app

At-home blood testing mockup: five mental health scales and six condition
screenings (cancer, Alzheimer's, MI, Parkinson's, stroke, diabetes), read
through a 3D anatomy viewer. React + Vite + three.js, English base with a
full Korean dictionary.

## Design decisions

**Mind and body are separate tabs.** The scales are *state* (continuous,
fluctuating); the screenings are *risk* (mostly-null, heavy). They answer
different questions, so they never share one chart.

**Every percentage is computed.** Scale scores convert to peer percentiles
via a normal CDF (`src/lib/stats.js`); the radar plots percentiles, so the
peer average is a regular pentagon at 50 and every axis is comparable.
Status, biomarker counts, and the health score are all derived from raw
values — nothing shown on screen is stored twice.

**The body is a procedural 3D anatomy** (`src/three/`). Six conditions group
into four organ systems — brain & nerves, cardiovascular (heart + vessel
tree), metabolic (pancreas + liver), whole-body (cancer, which lights the
figure itself). A flagged system glows in its status colour; selecting one
brings it forward. Drag to rotate (1:1, momentum projected on release), tap
an organ to open its markers.

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
