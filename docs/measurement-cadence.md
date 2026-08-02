# Measurement cadence — how often each thing is worth drawing, and what does not need blood at all

*The panel is drawn monthly. This document asks, marker by marker, whether
monthly is the right interval — and where it is not, what the right one is. It
is the source for two tables in the code: `WINDOW_DAYS` in `src/data/window.js`
and `CV_PCT` in `src/data/precision.js`.*

**On the numbers.** `CV` here is the combined within-subject coefficient of
variation, √(CV_A² + CV_I²) — analytical imprecision folded together with
within-person biological variation. The figures are **representative values from
the published biological-variation literature** (the EFLM Biological Variation
Database and assay inserts), not measurements from any particular laboratory or
platform. Several markers in this panel are hypothetical assays with no
published variation at all; those are marked *est.* and should be treated as
placeholders, not findings.

---

## 1. Three clocks, not one

"How often should we measure X" is three questions wearing one coat, and
conflating them is the standard error.

| | What it decides | Where it lives |
|---|---|---|
| **Integration window** | How many days the value summarises. HbA1c ≈ 100. | `window.js` |
| **Noise floor** | How large a difference has to be before it is a difference. | `precision.js` |
| **Phase** | Whether the analyte has a rhythm, and if so what hour to draw at. | *nowhere yet* |

The rule that falls out:

> **interval = max( integration window, time for a plausible drift to clear the
> noise floor )** — and for anything rhythmic, **fixing the hour comes before
> fixing the interval.**

The second term is the one this product had never computed. hs-CRP integrates
about three days, so every monthly draw is genuinely new information — and its
within-person variation is about 43%, which means it can **triple between two
draws with nothing having happened.** Both facts are true at once. A model that
knows only the first will happily plot the tripling as a trend.

The third term is why cortisol resists this framing entirely. Its concentration
varies roughly tenfold within a single day. One draw a month at 08:00 carries
more information than thirty draws at random hours, and no amount of extra
sampling fixes an unfixed hour.

### The corollary nobody likes

Some analytes cannot be measured usefully by drawing blood at any interval,
because the quantity of interest **is** the variability:

- **Glucose, insulin, lactate** — minute to minute.
- **Pulsatile hormones — GH, LH, ACTH, PTH** — a single draw samples one point
  of a pulse train. Clinical practice does not try; it measures the
  **integrator** instead. IGF-1 stands in for GH for exactly this reason.

Fasting is not a measurement protocol so much as a trick for pinning the phase
of a signal that never stops moving.

---

## 2. cfDNA — the one that justifies the draw

The product's whole argument rests here, so it gets its own section.

**Total cell-free DNA reports the moment of the draw.** Circulating half-life is
on the order of 15 minutes to a couple of hours. Hard exercise can raise it
roughly tenfold, with a return to baseline inside the hour; trauma, infection
and sepsis do the same more slowly. The practical consequence is that **the
pre-analytics matter more than the number**: no strenuous exercise for 24–48 h,
a fixed hour, a cell-stabilising tube, plasma separated within hours. An
unstandardised cfDNA value is not a noisy measurement of the right thing, it is
a precise measurement of the wrong one.

**Tissue-of-origin methylation fractions report turnover.** Deconvolving the
methylation signal gives the share of cfDNA shed by each tissue, which tracks
how fast that tissue is dying and being replaced — again over hours.
Proportions are steadier than the total, because the pre-analytical factors that
inflate one compartment tend to inflate all of them.

**And here is the trap.** The integration window is a day. The biology
underneath — tumour burden, fibrotic progression, neuronal loss — moves over
weeks to months. **A one-day window does not imply a one-day decision interval.**
Clinical ctDNA practice reflects this: minimal-residual-disease surveillance
after surgery runs every three months for two years, then every six. Nobody
draws it daily, and not because of cost.

**Leukocyte methylation carries a confounder this panel does not correct.** The
locus-level marks (`FKBP5`, `NR3C1`, `SLC6A4`, `BDNF`) are measured in white
cells, so a shift in the neutrophil-to-lymphocyte mix changes the apparent
methylation with no change in methylation. Cell-composition deconvolution is
standard in the literature and absent here.

---

## 3. Marker by marker

`Window` is the app's current `windowDays`. `CV` and `Significant change` come
from `precision.js` — the change column is the reference-change ratio, so
"×1.4 / ×0.7" means a value must rise by 40% or fall by 30% before it counts.
**Cadence** is what the biology actually supports; ⚠ marks a row where the app's
window materially disagrees with it.

### Neuro

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| p-tau217 | 7 d | 12% | ×1.39 / ×0.72 | ⚠ annual — moves over years |
| NfL | 7 d | 12% | ×1.39 / ×0.72 | ⚠ annual; 6 mo in active disease |
| GFAP | 7 d | 12% | ×1.39 / ×0.72 | ⚠ annual |
| Aβ42/40 | 7 d | 6% | ×1.18 / ×0.85 | ⚠ annual |
| α-synuclein | 7 d | 18% | ×1.64 / ×0.61 | ⚠ annual |
| S100B | 7 d | 20% | ×1.73 / ×0.58 | ⚠ an acute-injury marker; not a trend item |
| Kyn/Trp ratio | 10 d | 15% | ×1.51 / ×0.66 | monthly |
| Free tryptophan | 7 d | 15% | ×1.51 / ×0.66 | monthly, fasting |
| BDNF | 7 d | 25% | ×1.98 / ×0.51 | monthly — mostly platelet BDNF; handling dominates |
| 6-sulfatoxymelatonin | hours | 28% | ×2.14 / ×0.47 | monthly; overnight or first-void urine |

### Cardio

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| hs-CRP | 7 d | 43% | ×3.13 / ×0.32 | **two draws ≥2 weeks apart, averaged**; discard >10 mg/L |
| LDL-C | 7 d | 9% | ×1.28 / ×0.78 | 3 months |
| HDL-C | 7 d | 8% | ×1.25 / ×0.80 | 6 months |
| Triglycerides | 7 d | 22% | ×1.83 / ×0.55 | 3 months, fasting |
| ApoB | 7 d | 8% | ×1.25 / ×0.80 | 3 months |
| Lp(a) | 7 d | 9% | ×1.28 / ×0.78 | ⚠ **once in a lifetime** — ~90% genetically set |
| Homocysteine | 7 d | 10% | ×1.32 / ×0.76 | 3 months |
| NT-proBNP | 7 d | 33% | ×2.44 / ×0.41 | monthly while titrating; else annual |
| Troponin-I | 7 d | 18% | ×1.64 / ×0.61 | ⚠ acute marker; annual as screening |

### Endocrine

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| HbA1c | 100 d | 3% | ×1.09 / ×0.92 | ⚠ 3 months — see §5, the window model discards it |
| Fasting glucose | 7 d | 6% | ×1.18 / ×0.85 | ⚠ instantaneous; CGM replaces it outright |
| Fasting insulin | 7 d | 22% | ×1.83 / ×0.55 | 3 months |
| Fructosamine | 18 d | 5% | ×1.15 / ×0.87 | 2–3 weeks |
| Cortisol:DHEA-S | 21 d | 25% | ×1.98 / ×0.51 | monthly, **fixed hour** |
| Cortisol awakening response | hours | 35% | ×2.57 / ×0.39 | ⚠ **2–3 consecutive days**, saliva at wake/+30/+45 |
| GDF-15 | 14 d | 13% | ×1.43 / ×0.70 | 3 months |
| HOMA-IR | 7 d | 25% | ×1.98 / ×0.51 | 3 months |
| TSH | 21 d | 20% | ×1.73 / ×0.58 | ⚠ 6 weeks after any dose change |
| Free T4 | 21 d | 6% | ×1.18 / ×0.85 | ⚠ 6 weeks |
| Cortisol (AM) | hours | 22% | ×1.83 / ×0.55 | ⚠ one point of a tenfold rhythm; **fixed hour** |
| DHEA-S | 21 d | 8% | ×1.25 / ×0.80 | 3 months |

### Hepatic

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| ALT | 7 d | 20% | ×1.73 / ×0.58 | 3 months |
| AST | 7 d | 13% | ×1.43 / ×0.70 | 3 months |
| GGT | 7 d | 12% | ×1.39 / ×0.72 | 3 months |
| ALP | 7 d | 7% | ×1.21 / ×0.82 | 3 months |
| Total bilirubin | 7 d | 23% | ×1.88 / ×0.53 | 3 months |
| Albumin | 7 d | 4% | ×1.12 / ×0.90 | 3 months |
| FIB-4 | 30 d | 16% | ×1.55 / ×0.64 | 6–12 months |

### Renal

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| Creatinine | 7 d | 6% | ×1.18 / ×0.85 | 3 months |
| eGFR | 7 d | 6% | ×1.18 / ×0.85 | 3 months — CKD is confirmed on a repeat ≥3 months out |
| BUN | 7 d | 14% | ×1.47 / ×0.68 | 3 months |
| Cystatin C | 7 d | 6% | ×1.18 / ×0.85 | 3 months |
| UACR | 7 d | 35% | ×2.57 / ×0.39 | **2 of 3 samples** over 3–6 months |
| Uric acid | 7 d | 9% | ×1.28 / ×0.78 | 3 months |

### Haematology

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| Haemoglobin | 30 d | 4% | ×1.12 / ×0.90 | 3 months |
| Haematocrit | 30 d | 4% | ×1.12 / ×0.90 | 3 months |
| WBC | 7 d | 12% | ×1.39 / ×0.72 | 3 months |
| Platelets | 7 d | 9% | ×1.28 / ×0.78 | 3 months |
| Ferritin | 21 d | 16% | ×1.55 / ×0.64 | 3 months — also an acute-phase reactant |
| MCV | 30 d | 2% | ×1.06 / ×0.95 | 3 months — the steadiest thing on the panel |

### Pulmonary

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| Eosinophils | 7 d | 25% | ×1.98 / ×0.51 | 3 months |
| Total IgE | 7 d | 15% | ×1.51 / ×0.66 | 6–12 months |
| α1-antitrypsin | 7 d | 7% | ×1.21 / ×0.82 | ⚠ **once** — a genotype, not a state |
| SpO₂ | 7 d | 2% | ×1.06 / ×0.95 | ⚠ continuous; an oximeter, not a tube |
| KL-6 | 7 d | 11% | ×1.36 / ×0.74 | 3–6 months |

### Immune

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| ESR | 7 d | 20% | ×1.73 / ×0.58 | 3 months |
| Rheumatoid factor | 7 d | 20% | ×1.73 / ×0.58 | ⚠ annual |
| Anti-CCP | 7 d | 15% | ×1.51 / ×0.66 | ⚠ **once** — does not track treatment |
| ANA titre | 7 d | 30% | ×2.26 / ×0.44 | ⚠ annual; doubling dilutions, so ×2 is the resolution |
| IL-6 | 3 d | 45% | ×3.29 / ×0.30 | monthly, **fixed hour** — ~1 h half-life, nocturnal peak |
| Neutrophil:lymphocyte | 5 d | 25% | ×1.98 / ×0.51 | monthly |
| Complement C3 | 7 d | 6% | ×1.18 / ×0.85 | 3 months |

### Oncology

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| cfDNA | hours | 45% *est.* | ×3.29 / ×0.30 | monthly; **standardisation dominates** — see §2 |
| CEA | 7 d | 12% | ×1.39 / ×0.72 | 3 months |
| CA19-9 | 7 d | 17% | ×1.60 / ×0.63 | 3 months |
| AFP | 7 d | 11% | ×1.36 / ×0.74 | 3 months |
| CA-125 | 7 d | 25% | ×1.98 / ×0.51 | 3 months |
| PSA | 7 d | 15% | ×1.51 / ×0.66 | ⚠ annual; velocity needs ≥3 draws over ≥18 months |

### Nutrition

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| Vitamin D | 21 d | 13% | ×1.43 / ×0.70 | ⚠ 3 months — half-life 2–3 wk but steady state ~3 mo |
| Vitamin B12 | 30 d | 14% | ×1.47 / ×0.68 | 3–6 months |
| Active B12 (holoTC) | 21 d | 16% | ×1.55 / ×0.64 | 4–6 weeks — the responsive fraction |
| Plasma omega-3 | 21 d | 12% | ×1.39 / ×0.72 | 4–6 weeks |
| Folate | 14 d | 24% | ×1.93 / ×0.52 | ⚠ serum tracks recent meals; RBC folate is 3–4 months |
| Iron | 3 d | 28% | ×2.14 / ×0.47 | monthly, fasting AM — status is read off ferritin, not this |
| Magnesium | 14 d | 5% | ×1.15 / ×0.87 | 3 months — serum poorly reflects stores |
| Zinc | 14 d | 10% | ×1.32 / ×0.76 | 3 months |
| Omega-3 index | 120 d | 7% | ×1.21 / ×0.82 | 4 months — a red cell's lifetime |

### Skeletal

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| CTX-1 | 60 d | 11% | ×1.36 / ×0.74 | 3 months — **fasting, fixed morning hour** |
| P1NP | 90 d | 8% | ×1.25 / ×0.80 | 3–6 months |
| Bone ALP | 90 d | 7% | ×1.21 / ×0.82 | 3–6 months |
| PTH | 7 d | 25% | ×1.98 / ×0.51 | 3 months — pulsatile secretion |
| Osteocalcin | 60 d | 15% | ×1.51 / ×0.66 | 3 months |
| Corrected calcium | 7 d | 2% | ×1.06 / ×0.95 | 3 months — regulated hour to hour |
| Phosphate | 7 d | 9% | ×1.28 / ×0.78 | 3 months |

The two CV figures for CTX-1 and P1NP **assume the standardised draw.** CTX-1
has a roughly twofold circadian swing and food suppresses it by half within the
hour; unstandardised, its variation is far larger than 11%. The familiar
"least significant change of 25–30%" quoted for bone turnover markers is exactly
this row's reference-change ratio expressed as a percentage.

### Epigenetics

| Marker | Window | CV | Significant change | Cadence |
|---|---:|---:|---|---|
| DNAm cortisol (90d) | 90 d | 8% | ×1.25 / ×0.80 | 3–6 months |
| NR3C1 exon 1F | 75 d | 10% | ×1.32 / ×0.76 | 3 months † |
| FKBP5 intron 7 | 75 d | 8% | ×1.25 / ×0.80 | 3 months † |
| DNAm inflammation | 90 d | 8% | ×1.25 / ×0.80 | 3–6 months |
| SLC6A4 promoter | 75 d | 10% | ×1.32 / ×0.76 | 3 months † |
| BDNF promoter IV | 75 d | 10% | ×1.32 / ×0.76 | 3 months † |
| PER2/CLOCK index | 21 d | 10% | ×1.32 / ×0.76 | monthly |
| COMT Val158 CpG | 75 d | 8% | ×1.25 / ×0.80 | 3 months † |
| OXTR −934 CpG | 75 d | 10% | ×1.32 / ×0.76 | 3 months † |
| DunedinPACE | 1 yr | 4% | ×1.12 / ×0.90 | annual, and 2 years is safer |
| DNAmTL | 1 yr | 4% | ×1.12 / ×0.90 | annual — attrition is tens of bp/yr against %-scale error |
| cfDNA sgACC (SST-CpG) | hours | 40% *est.* | ×2.91 / ×0.34 | window hours, **decisions 1–3 months** |
| cfDNA amygdala (GAD1-CpG) | hours | 40% *est.* | ×2.91 / ×0.34 | ″ |
| cfDNA PVN (CRH-CpG) | hours | 40% *est.* | ×2.91 / ×0.34 | ″ |
| cfDNA SCN (VIP-CpG) | hours | 40% *est.* | ×2.91 / ×0.34 | ″ |
| cfDNA oligodendrocyte (MBP-CpG) | hours | 40% *est.* | ×2.91 / ×0.34 | ″ |

† These CVs cover assay imprecision only. They do **not** include the
cell-composition confounder described in §2, which this panel does not correct
for and which is plausibly larger than the assay term.

---

## 4. What should not be measured in blood at all

Grouped by what each one actually replaces, rather than by technology.

### Continuous — where the variability *is* the signal

| Instead of | Use | What it adds |
|---|---|---|
| Fasting glucose, HbA1c | **CGM** (interstitial, 5-min, 10–14 d/sensor) | Time-in-range, glycaemic variability, GMI. Strictly more than a fasting value. |
| Nothing currently | **Overnight HRV** (rMSSD) | The best daily proxy for the stress-recovery axis. Day-to-day scatter is wide, so 7-day rolling averages are standard. |
| Early CRP rise | **Resting HR, respiratory rate** | Catch infection and overtraining days before an acute-phase protein moves. |
| Cortisol/melatonin phase | **Wrist skin temperature** | The distal temperature minimum tracks circadian phase — a wearable stand-in for DLMO. |
| `DayDial`'s inferred wake time | **Actigraphy** | The app currently *back-calculates* sleep timing from two markers. Actigraphy measures it. |
| — | **Light exposure at eye level** | Circadian misalignment's *cause*, not its consequence. Far more actionable than either. |

### Saliva

Free cortisol (the standard for the awakening response), melatonin (the standard
for dim-light melatonin onset), α-amylase. Repeatable daily at no cost, which is
what makes the 2–3 consecutive days a real CAR needs actually feasible.

### Urine

6-sulfatoxymelatonin overnight or first-void — **already in this panel**. Also
24-hour free cortisol, isoprostanes for oxidative stress, albumin:creatinine.

### Hair, in the opposite direction

Hair cortisol integrates roughly **one month per centimetre**; the proximal 3 cm
is a three-month retrospective in a single sample. It is the exact complement of
the saliva measurement — one gives the day, the other gives the season.

### Breath, stool

Acetone for ketosis, FeNO for airway inflammation. Faecal calprotectin for gut
inflammation.

### Microsampling

Tasso, VAMS and similar make a weekly cadence realistic for many analytes
without a venipuncture. **They do not work for cfDNA** — that needs 10–20 mL of
plasma, a stabilising tube, and processing within hours.

### The conclusion this leads to

> Nearly everything that genuinely needs daily measurement is already outside
> the blood draw. The one thing blood does that nothing else can is
> **tissue-of-origin cfDNA methylation** — no wearable will ever say which organ
> is turning over. That is the argument for the draw, and it is an argument for
> a monthly one.

---

## 5. What the app does with this, and what it still gets wrong

**Implemented.** `precision.js` carries the CV column above and computes the
reference change value on the log scale — every marker here is positive and
right-skewed, and the familiar symmetric form (2.77 × CV) yields a significant
*fall* of −119% for hs-CRP, which is not a quantity a concentration can have.
`TrendChart` gates the round-over-round delta on it and, separately, tests the
slope across rounds, so it can say the thing this product is actually about:
**no single month moved, and the year did.**

The gate applies to **change**, never to **level**. A value is where it is; the
question RCV answers is only whether it got there since last month.

**A finding from running it.** Across all 100 markers and all 11 monthly steps —
1,100 comparisons — **not one clears its noise floor.** That is not a bug in the
gate. It is a property of the demo data: `walk()` in `body.js` produces a mean
step of 3.8% where real repeat measurements of these analytes run 2–45%. The
seeded series are smoother than any real panel, and until now the app presented
that smoothness as precision. The authored narrative series are the same — which
is *correct* for the round-12 inflammation finding, where five markers each move
a few percent a month and three of them carry a significant twelve-round trend.

**Still wrong, and deliberately not fixed here:**

- **`windowDays` is wrong for 49 markers**, all of which fall through to a
  7-day default. Cardio, renal and pulmonary are 100% default. Every ⚠ in §3 is
  one of these.
- **The window is treated as rectangular.** HbA1c is an exponentially weighted
  average with roughly half its value from the last 30 days, so it is about half
  new every month — yet `windowDays: 100` classifies it as `CONTEXT` and weights
  it **zero**. It is simultaneously the most trustworthy delta on the panel
  (CV 3%) and the one the index throws away. The omega-3 index has the same
  shape of error.
- **There is no phase axis.** `requiresFixedTime` exists on exactly two markers
  (`body.js:329,341`) and is **read nowhere**. CTX-1 does not carry it at all,
  despite food halving it within the hour.
- **The 2.5 boundary.** `sampling()` classifies at `ratio <= 2.5`, so the
  75-day methylation markers land at exactly 2.5, fall into `OVERLAPPING`, and
  are scored at full weight — contradicting the file's own comment.
- **No cell-composition correction** for leukocyte methylation (§2).
- **No daily layer.** Everything in §4 is absent.
