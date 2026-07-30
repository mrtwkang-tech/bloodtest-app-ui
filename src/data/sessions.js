import { SCALE_META, scalePercentile, statusOf } from "./scales";
import {
  SYSTEMS,
  TOTAL_CONDITIONS,
  TOTAL_MARKERS,
  isOptimal,
  markerLevel,
  systemsAt,
  valuesAt,
} from "./body";

/**
 * Demo rounds, newest first.
 *
 * Scores are raw instrument values; status, percentile, biomarker counts and
 * the health score are all derived. Nothing that can be computed is stored, so
 * the numbers on screen cannot drift apart from each other.
 *
 * Narrative text stays as a per-language pair rather than an i18n key, because
 * it is content rather than interface copy.
 */
const RAW = [
  {
    round: 3,
    date: "07.03",
    fullDate: { en: "3 July 2026", ko: "2026년 7월 3일" },
    scores: [4, 5, 21, 7, 28],
    bodyNote: {
      endocrine: {
        en: "Average blood sugar edged just past the upper limit. Nothing needs action today, but the direction matters at the next round.",
        ko: "평균 혈당이 정상 상한을 조금 넘어섰습니다. 당장 조치가 필요한 수준은 아니지만 다음 회차에서 방향을 확인해야 합니다.",
      },
    },
    bodyAction: {
      endocrine: {
        en: "Adjust when you eat carbohydrates and move after meals. If the next round points the same way, see an endocrinologist.",
        ko: "탄수화물 섭취 시점과 식후 활동을 조정해보고, 다음 검사에서도 같은 방향이면 내분비내과 상담을 권합니다.",
      },
    },
    summary: {
      en: "Only stress sits above the peer average; the other four scales are steady. On the body side the hormone panel came up — HbA1c and fasting glucose both edged over — while the other nine systems are inside their ranges.",
      ko: "마음은 스트레스만 또래 평균을 웃돌고 나머지 네 항목은 안정 범위입니다. 몸은 호르몬 계열에서 HbA1c와 공복혈당이 함께 상한을 넘었고, 나머지 9개 계열은 모두 참고 범위 안입니다.",
    },
    mindActivities: {
      en: [
        "Get 30 minutes of aerobic exercise three times a week to bring arousal down.",
        "Cut screens an hour before bed and keep your wake time fixed.",
        "Protect one block a week that is completely separate from work.",
      ],
      ko: [
        "주 3회 30분 이상 유산소 운동으로 각성 수준을 낮추세요.",
        "취침 1시간 전 화면 사용을 줄이고 기상 시간을 고정하세요.",
        "주 1회는 업무와 완전히 분리된 활동 시간을 확보하세요.",
      ],
    },
    bodyActivities: {
      en: [
        "A ten-minute walk after meals is what average blood sugar responds to fastest.",
        "Cut refined carbohydrates and check which way HbA1c moves next round.",
      ],
      ko: [
        "식후 10분 걷기를 습관으로 만들면 평균 혈당이 가장 빠르게 반응합니다.",
        "정제 탄수화물을 줄이고 다음 회차에서 HbA1c 방향을 확인하세요.",
      ],
    },
    mind: {
      en: "Broadly steady, but your sense of control has dropped. Sleep and mood are holding, so there is room to recover — manage the stressor and the next round should improve.",
      ko: "전반적으로 안정적이지만 상황에 대한 통제감이 낮아진 상태입니다. 수면과 정서 지표가 유지되고 있어 회복 여력은 충분하며, 스트레스 요인만 관리하면 다음 회차에서 개선될 가능성이 높습니다.",
    },
  },
  {
    round: 2,
    date: "04.02",
    fullDate: { en: "2 April 2026", ko: "2026년 4월 2일" },
    scores: [6, 5, 17, 8, 30],
    bodyNote: {},
    bodyAction: {},
    summary: {
      en: "Every mental health scale and all ten body systems are inside their reference ranges. The cardiovascular markers and vitamin D that were flagged last round have both come back.",
      ko: "마음 다섯 항목과 몸 10개 계열이 모두 참고 범위 안입니다. 직전 회차에서 벗어나 있던 심혈관 지표와 비타민 D 모두 정상 구간으로 돌아왔습니다.",
    },
    mindActivities: {
      en: [
        "Keep the sleep and activity pattern you have.",
        "Stay at two or more active days a week.",
      ],
      ko: [
        "현재의 수면·활동 패턴을 그대로 유지하세요.",
        "주 2회 이상 신체 활동을 이어가세요.",
      ],
    },
    bodyActivities: {
      en: ["Stay on the quarterly cadence so the trend stays readable."],
      ko: ["분기 검사 주기를 유지해 변화를 추적하세요."],
    },
    mind: {
      en: "Mood and sleep are both in a settled band, and stress sits below the peer average. Holding this pattern is the best move available.",
      ko: "정서와 수면이 모두 안정 구간에 있습니다. 스트레스 체감도 또래 평균 이하로 여유가 있는 상태이며, 지금 패턴을 유지하는 것이 가장 좋은 선택입니다.",
    },
  },
  {
    round: 1,
    date: "01.08",
    fullDate: { en: "8 January 2026", ko: "2026년 1월 8일" },
    scores: [7, 8, 15, 10, 36],
    bodyNote: {
      cardio: {
        en: "Vessel inflammation and LDL went over the range together. That combination is worth looking at from lifestyle first.",
        ko: "혈관 염증 지표와 LDL이 함께 참고 범위를 넘었습니다. 두 값이 같이 올라간 조합이라 생활 요인부터 살펴볼 필요가 있습니다.",
      },
      nutrition: {
        en: "Vitamin D sits under the reference range — common at this latitude in winter, and the easiest of these to fix.",
        ko: "비타민 D가 참고 범위 아래입니다. 겨울철에 흔하고, 이 중 가장 교정하기 쉬운 항목입니다.",
      },
    },
    bodyAction: {
      cardio: {
        en: "Start with saturated fat and activity levels. If it holds at the next round, see a cardiologist.",
        ko: "포화지방 섭취와 활동량을 먼저 조정하고, 다음 회차에서도 유지되면 순환기내과 상담을 권합니다.",
      },
      nutrition: {
        en: "Daily vitamin D and 15 minutes of midday sun. It usually corrects within one cycle.",
        ko: "비타민 D 보충과 한낮 햇빛 15분을 권합니다. 보통 한 주기 안에 회복됩니다.",
      },
    },
    summary: {
      en: "Your first test, and the baseline everything else is compared against. Anxiety, sleep and burnout were above the peer average; the cardiovascular panel and vitamin D were both outside range.",
      ko: "첫 검사로 이후 회차의 비교 기준이 되는 회차입니다. 마음은 불안·수면·번아웃이 또래 평균을 넘었고, 몸은 심혈관 계열과 비타민 D가 참고 범위를 벗어났습니다.",
    },
    mindActivities: {
      en: [
        "Ten minutes a day of breathing or relaxation practice.",
        "Set a hard finish time for work so there is a boundary.",
        "Hold the same bed and wake times for two weeks.",
      ],
      ko: [
        "호흡·이완 훈련을 하루 10분 실시하세요.",
        "업무 종료 시간을 정해 경계를 만드세요.",
        "취침·기상 시간을 2주간 고정해보세요.",
      ],
    },
    bodyActivities: {
      en: ["Cut saturated fat and get at least 150 active minutes a week."],
      ko: ["포화지방을 줄이고 주 150분 이상 유산소 활동을 확보하세요."],
    },
    mind: {
      en: "Tension is high and recovery time is short. Sleep efficiency is low too, so exhaustion can accumulate — build the rest structure first.",
      ko: "긴장이 높고 회복 시간이 부족한 상태입니다. 수면 효율도 낮아 소진이 누적될 수 있으므로, 휴식 구조를 먼저 만드는 것이 우선입니다.",
    },
  },
];

export const SESSIONS = RAW.map((s, i) => ({
  ...s,
  // RAW is newest-first; the marker demo arrays are oldest-first.
  roundIndex: RAW.length - 1 - i,
  status: s.scores.map((score, i) => statusOf(SCALE_META[i], score)),
  percentiles: s.scores.map((score, i) =>
    scalePercentile(SCALE_META[i], score),
  ),
}));

/** Pick the language variant of a content field. */
export function pick(field, lang) {
  if (field == null) return field;
  return field[lang] ?? field.en ?? field;
}

export function mindSummary(session) {
  const warn = session.status.filter((s) => s !== "good").length;
  const worst = session.status.includes("alert")
    ? "alert"
    : warn
      ? "watch"
      : "good";
  const keys = session.status
    .map((s, i) => (s === "good" ? null : SCALE_META[i].key))
    .filter(Boolean);
  return { warn, worst, keys, ok: SCALE_META.length - warn };
}

export function bodySummary(session) {
  const zones = systemsAt(session.roundIndex);
  const flagged = zones.filter((z) => z.level > 0);
  const clear = zones.filter((z) => z.level === 0);
  const worst = zones.reduce((a, z) => Math.max(a, z.level), 0);
  const okConditions = clear.reduce((n, z) => n + z.zone.conditionKeys.length, 0);
  return {
    zones,
    flagged,
    clear,
    worst,
    okConditions,
    total: TOTAL_CONDITIONS,
    keys: flagged.map((z) => z.zone.nameKey),
  };
}

/**
 * Biomarker roll-up across both domains — the count strip on the home screen.
 * The five mental scales are treated as markers too, so "total" is the number
 * of things the panel actually measured.
 */
export function biomarkerCounts(session) {
  let optimal = 0;
  let inRange = 0;
  let out = 0;

  session.status.forEach((s, i) => {
    if (s !== "good") out += 1;
    else if (session.percentiles[i] <= 35) optimal += 1;
    else inRange += 1;
  });

  SYSTEMS.forEach((system) => {
    const values = valuesAt(system, session.roundIndex);
    system.markers.forEach((m, i) => {
      const lv = markerLevel(m, values[i]);
      if (lv > 0) out += 1;
      else if (isOptimal(m, values[i])) optimal += 1;
      else inRange += 1;
    });
  });

  return { total: SCALE_META.length + TOTAL_MARKERS, optimal, inRange, out };
}

/**
 * Health score, 0–100.
 *
 * Optimal markers carry full weight, in-range markers most of it, and an
 * out-of-range marker costs more the further past its threshold it sits. It is
 * a summary of this panel, not a clinical index — the copy says so.
 */
export function healthScore(session) {
  const c = biomarkerCounts(session);
  const base = (c.optimal * 1 + c.inRange * 0.82) / c.total;

  let penalty = 0;
  session.status.forEach((s) => {
    if (s === "watch") penalty += 0.02;
    if (s === "alert") penalty += 0.05;
  });
  SYSTEMS.forEach((system) => {
    const values = valuesAt(system, session.roundIndex);
    system.markers.forEach((m, i) => {
      const lv = markerLevel(m, values[i]);
      if (lv === 1) penalty += 0.015;
      if (lv === 2) penalty += 0.04;
    });
  });

  return Math.max(0, Math.min(100, Math.round((base - penalty) * 100)));
}

/** Trend series for a body marker across every round, oldest first. */
export function bodySeries(systemKey, markerIndex) {
  return SYSTEMS.find((s) => s.key === systemKey).markers[markerIndex].demo;
}

/** Markers offered on the body trend chart — representative, not all thirteen. */
/** One representative marker per system for the trend picker. */
export const BODY_METRICS = [
  ["endocrine", 0], ["cardio", 1], ["cardio", 0], ["nutrition", 0],
  ["hepatic", 0], ["renal", 1], ["hematology", 0], ["pulmonary", 0],
  ["immune", 0], ["oncology", 0], ["neuro", 0],
].map(([zone, mi]) => {
  const system = SYSTEMS.find((s) => s.key === zone);
  return { zone, mi, zoneKey: system.nameKey, marker: system.markers[mi] };
});

export const PLANS = {
  single: {
    labelKey: "store.single",
    noteKey: "store.singleNote",
    ctaKey: "store.ctaSingle",
    price: 89000,
  },
  quarter: {
    labelKey: "store.quarter",
    noteKey: "store.quarterNote",
    ctaKey: "store.ctaQuarter",
    price: 69000,
    badge: true,
  },
  half: {
    labelKey: "store.half",
    noteKey: "store.halfNote",
    ctaKey: "store.ctaHalf",
    price: 79000,
  },
};

export const PROFILE = {
  name: { en: "Jiho", ko: "지호" },
  fullName: { en: "Jiho Kim", ko: "김지호" },
  initial: "J",
  age: 34,
  nextInDays: 52,
  nextDate: { en: "19 Sep 2026", ko: "2026년 9월 19일" },
};
