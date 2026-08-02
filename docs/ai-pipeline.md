# AI in Pedia — where it actually goes, and what it cannot do yet

*Written against the project document's AI sections. Its claims are quoted; the
assessment is mine.*

---

## What the document proposes

| | Document says | Where it runs |
|---|---|---|
| Discovery | "다중오믹스 빅데이터(TCGA 등 공공 데이터 + 자체 코호트)에 기계학습을 적용해" — screen candidate CpGs, validate tissue → blood | Offline |
| Stress index | "stress에 영향을 주는 factor들을 feature로 선별하여 점수화하는 model 개발" | Offline fit, in-app scoring |
| Prediction | Future cell age and disease risk | In-app |
| Open question | "연구에서 실제로 사용하신 AI 모델이 구체적으로 어떤 것이었는지" | — |

The last row matters most: the document does not yet name a model. So the useful
output here is not "use X" but **which class of model the data can support**.

---

## 1. Discovery — elastic net, not deep learning

An Illumina EPIC array gives ~935k probes. A realistic first cohort is hundreds
of samples. That is p ≫ n by three orders of magnitude.

At that ratio a neural network will reach near-perfect training accuracy on
almost any label you give it, including a label you shuffled. What it learns is
plate position, extraction batch and collection site. This is not a caution
about overfitting in general — it is the specific, repeatedly documented failure
mode of deep learning on methylation arrays.

**Use instead:**

1. **Filter** — drop cross-reactive probes, SNP-overlapping probes, sex
   chromosomes. Typically removes 5–8%.
2. **Normalise and correct batch** — funnorm/BMIQ, then ComBat with the outcome
   protected. Batch must be handled before feature selection, not after; a
   feature selected on uncorrected data is often a feature of the plate.
3. **Differential methylation** — limma on **M values**. The document already
   has this right: "분석은 M값으로, 보고는 베타값으로."
4. **Penalised selection** — elastic net (α ≈ 0.5) with nested cross-validation.
   The outer fold must contain the *entire* pipeline including selection, or the
   reported accuracy is leaked.
5. **Stability selection** — refit on subsamples; keep CpGs that survive most of
   them. This is what separates a marker from a coincidence.

Deep learning becomes reasonable at roughly n > 10,000 with a stable assay, and
even then it mostly matches the linear model.

## 2. The bottleneck is not the model — it is tissue → blood

This is the part I would raise first at a mentoring session, because no
algorithm improves it.

A CpG that cleanly separates tumour from normal **in tissue** frequently
vanishes in plasma:

- Circulating tumour DNA is commonly **< 1%** of cfDNA in early-stage disease,
  and can be well under 0.1%. The remaining 99%+ is leukocyte DNA.
- So the observed plasma β is a mixture, dominated by blood cells. A 40
  percentage-point tumour signal at 0.5% tumour fraction moves the plasma
  reading by ~0.2 points.

Two consequences:

**(a) Cell-type deconvolution is mandatory, not optional.** Every plasma
methylation reading has to be interpreted against a reference of blood cell
type proportions, or you are measuring the subject's neutrophil count. The app's
brain-derived cfDNA concept is exactly this idea and is the right instinct.

**(b) MS-HRM's sensitivity is the binding constraint.** MS-HRM typically
resolves down to ~5–10% methylated alleles. Against a <1% tumour fraction, that
is one to two orders of magnitude short for early detection. The technology is
excellent for what it is — fast, cheap, no sequencer — but the cost structure
that makes the $40 / 24-hour claim work is the same thing that caps sensitivity.

*This does not sink the plan.* It relocates it. MS-HRM is well matched to
**monitoring a known signal** — tracking someone whose marker is already
elevated, at monthly cadence — and poorly matched to **finding an unknown one**
in an asymptomatic population. The product is already built around longitudinal
tracking, so this is an argument for the roadmap it already has, not against it.

## 3. Prediction — small, linear, calibrated

Implemented in `src/data/models.js`.

**Cell age.** A penalised linear regression over CpG M values. This is not a
simplification of what Horvath and DunedinPACE do — it *is* what they do. A
clock is an intercept plus a few hundred weights. Nothing is gained by making
it a network, and interpretability is lost, which for a health product being
handed to a clinician is the wrong trade.

**Ageing pace.** OLS slope over the monthly estimates, reported with its
confidence interval. With twelve points and a clock whose own test–retest noise
is unmeasured, the honest output is a range. The fixture currently gives
1.47/yr with a 95% interval of 0.52–2.42 — an interval that wide is the finding.

**Disease risk.** Already correct in `src/data/bayes.js`: prior odds × likelihood
ratios. For a screening test in a low-prevalence population, **calibration beats
discrimination**. An AUC of 0.85 with a mis-calibrated intercept produces more
false alarms than an AUC of 0.78 that is properly calibrated, and every step of
an LR chain can be audited by the doctor the reader is sent to.

## 4. The real constraint is sample size

| Target | Order of n needed | Why |
|---|---|---|
| Methylation clock (age) | 500–2,000 | Age has a huge effect size; clocks work at modest n |
| Tissue-of-origin at 1% fraction | 10,000+ with deep sequencing | Detecting a rare mixture component |
| Mental-health phenotype | 10,000+ | The document's own figure: PRS explains **1.5–3.2%** of variance |

That last row is the one to internalise. When a predictor explains ~2% of
variance, the sample needed to estimate it stably is in the tens of thousands.
The document is already honest about this — it records that only two psychiatric
biomarkers are FDA-recognised, that methylation–depression correlations are
weak, and that causality is unestablished. **Keep that honesty in the pitch.** It
is more persuasive than a confident number, and it is the difference between a
research plan and a claim that will not survive contact with a reviewer.

The proposed route — SNUH collaboration, then dormitories and military cohorts —
is the right shape for accumulating longitudinal samples. Budget years and IRB,
not months.

## 5. So what is buildable now — and what was built

Not a predictive model. **The instrument.**

The app now runs the full path from a raw plate to what a reader sees:

```
관리자 판독값 입력  →  원시 패널 (β, M)
      ↓
markerLevel · deviationOf · scaleIndex · markerLoad
      ↓
systemLevel → bodySummary → healthScore
bayes(LR) · interactions · window(sampling)
      ↓
홈 점수 · 몸 행/시트 · 마음 지수 · 시그널 · 예측
```

Change ALT from 38 to 92 in the admin screen and the liver row reads 179% over,
the health score moves 60 → 58, and the liver signal re-fires — because those
were always computed. What was missing was the entrance.

The model slot is cut to the right shape and **visibly empty**: every model
declares `trainingN: 0` and `validation: null`, and the model card renders those
as prominently as the prediction. When a real fit exists it replaces three
fields and nothing else changes.

---

## What I would ask the mentor

1. At what tumour fraction does your MS-HRM assay hold its LOD, measured — not
   from the kit insert?
2. Which cell-type deconvolution reference are you using for plasma, and was it
   built on the same array version?
3. In the TCGA screen, was feature selection inside the cross-validation loop?
4. For the stress index: what is the outcome label, and who adjudicates it?
   A model is only as good as the thing it is regressed on, and "stress" is not
   yet a measurement.
