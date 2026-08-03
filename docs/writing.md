# How text exists in this app

*Written after a reviewer called the copy "AI slop". The critique was right, and
the usual remedy — write shorter, write plainer — would have been the wrong fix.
The sentences were fine. There were too many of them saying the same thing, and
nobody had ever counted.*

---

## What was actually wrong

Opening one scale row on the Mind tab made a reader pass **51 prose sentences**
(56 on the day view), of which about **20 restated something already on the same
scroll surface**.

| Fact | Times stated |
|---|---|
| "4 of 5 scales in range" | 4, inside 110px |
| One scale's peer position | 5, one of them backwards |
| Its score | 3 |
| Its status | 3 |
| "not a diagnosis" | 4 |
| "these assays are hypothetical" | 2, verbatim |

**Every one had a code comment defending it.** `ScaleDetail.jsx` justified a
duplicate footnote for "a reader arriving here by tapping a row" who would miss
the tab's copy — while the same file's header recorded that the component had
stopped being a sheet and now opens inline, on the same scroll surface.
`HomeTab.jsx` defended a rounds count and a months count as different facts; the
data makes them the same integer in every state.

Each argument is correct about its own component. **The unit of review was the
component. The reader's unit is the scroll surface.**

---

## The rule

> **Text is either computed from the data, or it is a name. Nothing in between.**

### LABEL — names a thing

`코르티솔` · `점수` · `기상` · `이번 채혈`

Never a sentence, never a restatement. A label earns its place by naming
something the reader can see but could not otherwise address.

*Done wrong:* `day.night` was `"밤 — 멜라토닌 시작부터 기상까지"` — two labels
already printed as the reader's own clock times 30px above, naming an arc that
physically terminates under each of those two dots.

### DERIVED — computed at render, from the data

`기분 회로가 쓰인 정도 45% · 외 1개` · `12회차 추세는 하락` · `또래 20%보다 높음`

A claim about the data is generated from the data, so it cannot be wrong, cannot
go stale, and — the part that decided it — **works for a reader whose round is
not one of the twelve someone wrote paragraphs for.**

Every derived sentence must be **falsifiable from the same screen**: name the
rendered value a reader could check it against. If there is none, it is
decoration.

*Done wrong:* twelve hand-written round paragraphs, five of six contradicting
the charts directly below them. Round 8 said `"다섯 경로 모두 또래 평균
아래입니다"` over four scores above 50. Round 12 called a 49% rise 45%, because
45% was a different quantity — the over-reference ratio.

*Done right:* `scaleSummaryLine` in `data/scales.js`, which replaced a
four-bucket restatement of the numeral 40px to its right. It produces 51
distinct strings across 60 cells and says what the score cannot: the
best-scoring scale on the panel has a marker past its reference, and a
lower-scoring one has none.

### TERMS — the standing conditions the numbers come under

One owner, one place per surface, never concatenated three-deep. **Each surface
states the terms for what IT prints.** The assay caveat lives on the only screen
that prints assays with values; the not-a-diagnosis claim lives on the tab.

Crisis resources live in `data/legal.js`, keyed by `JURISDICTION` and never by
UI language. They are the one category where being wrong is not a taste problem:
routing on language sent a Korean reader on an English-locale phone to 988,
which does not connect from Korea.

---

## The review rule

**Review the scroll surface, not the component.**

A comment defending a string must name **the other places that fact renders and
the pixel distance to the nearest one**. "A reader might not have seen X" is not
an argument until you have measured whether X is on screen.

A comment describing behaviour that has since changed is worse than none: it is
an argument that outlived its premise and keeps winning. Four shipped, each
protecting a duplicate.

---

## What this culture had already shipped

- 63 dead dictionary keys (~10%), including the only string that fully explained
  the 0/50/100 scale — three live strings each explained a third of it
- four runtime-unreachable branches
- one unit-orientation contradiction firing in **39 of 60 scale-rounds**, with no
  round where all five agreed
- a crisis number that does not connect from the country the service is
  registered in, chosen by browser language
- two locale asymmetries where the two languages made *different claims*: only
  English said the likelihood ratios were demo values, only Korean named the
  cancer

Baseline after this pass: **Mind tab, round 12, one row open — 38 sentences,
zero restatements.**

---

## What DERIVED does not mean

A generated sentence is not honest because it was generated. A finding
generator was designed to replace the twelve hand-written round paragraphs, and
an adversarial pass over the real fixture rejected it before it shipped. What it
found is the more useful half of this document.

- **The lead rule fired in 12 of 12 synthetic rounds of pure assay noise.** It
  tested `markerLevel`, an unhedged inequality, and never called `movedSince` —
  so a handful of markers sitting near their own reference crossed back and
  forth on scatter alone and were announced every month. That is precisely the
  failure `precision.js` exists to prevent, rebuilt in a new module.
- **It manufactured a fresh contradiction.** In round 5 it would have printed
  "the level went up" on a screen whose figure caption reads
  `"모든 수치가 정상 범위 안입니다"`.
- **One template's count was false in every round** — it claimed 33 markers had
  run the same way where 8 had, because it collected hits without regard to
  direction.
- **The ranking preferred novelty to magnitude**, leading on platelets at −23%
  in a round where AFP was +227%, and going silent in the two rounds where AFP
  was +150% and +185%.
- **It put an alarm frame on scores above the peer average** — "worst yet" on a
  54 that the row beside it called 양호 at the 61st percentile. That is the
  mirror image of the hand-written defect it was replacing.
- The `se === 0` guard its own comment claimed to close was open in 12 of 700
  fits, one of which was a round's lead.

So the rule stands, with a condition it did not have before: **a derived
sentence must clear the same significance gate as the number it describes.** A
generator whose guards are weaker than the app's own precision model does not
remove prose that overstates its evidence. It produces it faster, at scale, and
with the authority of having been computed.

The Korean particle handling was the one part that survived contact: zero broken
combinations across all 100 marker names, five axis names and every score the
fixture produces.

## The census

Every key in `src/i18n/dict.js`, both languages, classified.

| Tier | Keys | Share |
|---|---:|---:|
| LABEL | 376 | 59.8% |
| DERIVED | 116 | 18.4% |
| TERMS | 110 | 17.5% |
| **PROSE-THAT-SHOULD-BE-DERIVED** | **27** | **4.3%** |
| | **629** | |

Of the 116 DERIVED, 60 are function-valued and 56 are constants selected by a
computed branch. One TERMS entry is also function-valued — `mind.crisis`, which
interpolates the crisis line for the reader's locale. A parameter drawn from a
locale table is not a measurement, so the tier does not change; `tiers.mjs`
tests TERMS before it tests for a function, and that is why.

### The full fourth-tier list

Grouped by the file whose guard fails to entail them.

**`src/data/interactions.js` — 12**

| Key | The clause the guard does not entail |
|---|---|
| `ix.residualInflammation.title` | `염증이 남음`, while hs-CRP is 1.0 against a reference of 1.0 |
| `ix.residualInflammation.body` | "cholesterol looks handled" from `ldl.level === 0` alone; ApoB, HDL and triglycerides are never read |
| `ix.stressGlycaemia.title` | `식단이 아니라` — no marker in the panel measures diet |
| `ix.stressGlycaemia.body` | `혈당이 올라가고 있습니다`, `부신 여력이 떨어지는` — two trends from three single-round ratios |
| `ix.inflammatoryMood.title` | `염증이 기분까지 닿음` — the app's own `mind.cadenceNote` says `기분은 피에 없습니다` |
| `ix.inflammatoryMood.body` | `신경가소성 수치가 낮게 있습니다` — `ratio(bdnf) > 0.95` admits in-range values |
| `ix.fatigueChain.title` | `피로` — fatigue is not measured anywhere |
| `ix.fatigueChain.body` | `셋 다 범위의 아래쪽에` — `ratio(ferritin) > 0.32` admits mid-band |
| `ix.sleepAxis.title` | `수면 길이가 아니라` — `scale.circadian.base` says the panel cannot know the length |
| `ix.sleepAxis.body` | `아침 코르티솔은 뚜렷한데` — the cortisol awakening response is not in the guard |
| `ix.metabolicLiver.title` | `함께 움직이는` — one round is read |
| `ix.metabolicLiver.body` | `나란히 올라가고 있습니다` — one round is read |

**`src/data/inbody.js` — 9**

| Key | The clause the guard does not entail |
|---|---|
| `ib.link.creatinine.title` | `크레아티닌이 높은 건` — 0.90–0.96 against a reference of 1.2, in all 12 rounds |
| `ib.link.creatinine.body` | presupposes a lowered eGFR; it is 97.7–101.8 against a floor of 90 |
| `ib.link.visceral.title` | `원인은 … 쪽` — causation, from two independent thresholds |
| `ib.link.visceral.body` | `체중보다 내장지방을 더 가깝게 따라갑니다` — two correlations, neither computed |
| `ib.link.fluid.title` | `염증과 함께 움직인` — one round is read |
| `ib.link.fluid.body` | `염증이 올라간 상태에서`, while `markerLevel(hs-CRP)` is 0 in every round it renders |
| `ib.link.muscle.body` | `골격근량과 기초대사량이 함께 떨어졌습니다` — BMR is never read; it happens to fall on this fixture |
| `ib.link.loss.title` | `의도하지 않은` — intent. **Dead**: the guard needs a 3% two-round drop; the fixture's largest is 2.02% |
| `ib.link.loss.body` | `간 수치가 움직인 기간과 겹칩니다` — an overlap of two windows, neither computed. **Dead** |

**`src/data/bayes.js` — 4**

| Key | The clause the guard does not entail |
|---|---|
| `dx.f.afpRise` | `1년간` — the guard is `rising(afp, r, n = 4)`. **Dead**: HCC never clears `shown` |
| `dx.f.loss` | `의도하지 않은` — intent, same 3% guard, **dead** for the same reason |
| `dx.f.noHbv` | pushed **unconditionally** at `lr: 0.35`. No hepatitis serology exists in the panel |
| `dx.f.vis` | `높음` at `>= 85`, against the metric's own `high: 100` |

**Dead pair that was meant to be one computed branch — 2**

| Key | |
|---|---|
| `ix.crossedNow` | `AFP가 정상 범위를 넘었습니다.` — `interactions.js` already computes `stats.crossed`; nothing renders either half |
| `ix.notCrossedYet` | `AFP는 아직 정상 범위 안입니다.` |

Three conclusions the list forces.

**Seven of the 27 never reach a screen at all**, in two different ways, and that
is exactly why nobody caught them. Two are unreferenced anywhere in `src/`
(`ix.crossedNow`, `ix.notCrossedYet` — check 4 finds these). Five are wired up
correctly and never fire on the twelve-round fixture: `dx.f.afpRise`,
`dx.f.loss` and `dx.f.noHbv` sit under the HCC condition, which never clears
`shown`; `ib.link.loss.title` and `ib.link.loss.body` need a 3% two-round weight
drop that never happens. No lint can find the second kind. Only evaluating every
rule over every round can, which is a fixture test, not a static check.

**Fourteen of the 27 are short** — ten finding titles and four one-line finding
labels. The pile is not "long paragraphs"; it is any string carrying a claim, at
any length. `내장지방 높음` is four syllables and it contradicts the band it sits
next to.

**Two more keys are dead without being wrong.** `dx.f.fib` and `dx.f.a1cTrend`
are correctly derived, correctly guarded, and never rendered — the first belongs
to HCC, the second needs four strictly-rising HbA1c draws and the series has
flat steps. Being right is not the same as being reachable, and the census
counts them as DERIVED because they are.

---

## The lint

`scripts/copycheck.mjs` runs the checks that do not need a browser: locale
symmetry, dead keys, two keys sharing one Korean string, and `status.line`
making a peer claim. Dead keys are reported and not enforced — 68 is a backlog,
and a check that fails on every run stops being read.

```
node scripts/copycheck.mjs
```

The prose-per-surface count is not in it, because it cannot be: the defect only
becomes countable once the components are on screen together. That one is
measured by driving the app.
