import { SCALE_META, scaleIndex, statusOf } from "./scales";
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
/**
 * Six rounds, three months apart, newest first.
 *
 * Eighteen months is what makes the liver series legible: AFP, GGT and FIB-4
 * are each individually unremarkable for the first four draws, and it is only
 * the shape across all six that reads as anything. A cross-sectional test
 * would have returned "normal" five times.
 */
const RAW = [
  {
    round: 6, date: "07.03",
    fullDate: { en: "3 July 2026", ko: "2026년 7월 3일" },
    bodyNote: {
      hepatic: {
        en: "AFP has now crossed its reference range, having roughly doubled every round for a year. GGT and the fibrosis estimate rose with it while platelets fell — the combination that warrants imaging rather than another wait.",
        ko: "AFP가 1년 동안 회차마다 거의 두 배씩 오르다 이번에 참고 범위를 넘었습니다. 같은 기간 GGT와 섬유화 추정치가 함께 올라가고 혈소판은 떨어졌습니다. 한 번 더 기다릴 게 아니라 영상 검사가 필요한 조합입니다.",
      },
      endocrine: {
        en: "Average blood sugar edged past the upper limit. Small on its own, but it has moved in the same direction for four rounds.",
        ko: "평균 혈당이 상한을 넘었습니다. 한 번만 보면 작은 변화지만, 네 회차 연속 같은 방향입니다.",
      },
    },
    bodyAction: {
      hepatic: {
        en: "Book hepatology. Ask for a liver ultrasound with a repeat AFP; bring this trajectory, not just today's number.",
        ko: "소화기내과 진료를 예약하세요. 간 초음파와 AFP 재검을 요청하시고, 오늘 수치 하나가 아니라 이 추이를 가져가세요.",
      },
    },
    summary: {
      en: "The liver panel is the finding this round. AFP crossed its range for the first time, and it did so at the end of a year-long climb that GGT, the fibrosis estimate and a falling platelet count all track. Blood sugar also crossed. Everything else is inside range.",
      ko: "이번 회차의 핵심은 간입니다. AFP가 처음으로 참고 범위를 넘었고, 그것도 1년에 걸친 상승의 끝에서 넘었습니다. 같은 기간 GGT와 섬유화 추정치가 오르고 혈소판이 떨어졌습니다. 혈당도 상한을 넘었습니다. 나머지는 모두 범위 안입니다.",
    },
    mindActivities: {
      en: [
        "Get 30 minutes of aerobic exercise three times a week to bring arousal down.",
        "Cut screens an hour before bed and keep your wake time fixed.",
      ],
      ko: [
        "주 3회 30분 이상 유산소 운동으로 각성 수준을 낮추세요.",
        "취침 1시간 전 화면 사용을 줄이고 기상 시간을 고정하세요.",
      ],
    },
    bodyActivities: {
      en: [
        "Bring the full six-round liver trend to your appointment — the shape is the reason to go.",
        "Stop alcohol until you have been seen.",
      ],
      ko: [
        "6회차 전체 간 추이를 진료에 가져가세요. 가야 하는 이유가 그 모양에 있습니다.",
        "진료를 받기 전까지 음주는 중단하세요.",
      ],
    },
    mind: {
      en: "Steady on the mood and sleep pathways, with stress load climbing gently across the last three rounds. Nothing here needs action on its own.",
      ko: "기분과 수면 경로는 안정적이고, 스트레스 부하만 최근 세 회차에 걸쳐 완만히 올라갔습니다. 단독으로 조치가 필요한 항목은 없습니다.",
    },
  },
  {
    round: 5, date: "04.02",
    fullDate: { en: "2 April 2026", ko: "2026년 4월 2일" },
    bodyNote: {
      hepatic: {
        en: "The fibrosis estimate crossed its threshold this round. AFP is still inside range, but it has risen at every draw since the first.",
        ko: "이번 회차에 섬유화 추정치가 기준을 넘었습니다. AFP는 아직 범위 안이지만 첫 회차 이후 매번 올라가고 있습니다.",
      },
    },
    bodyAction: {
      hepatic: {
        en: "Do not wait a full quarter. Repeat the liver panel and raise the trend with a clinician.",
        ko: "분기를 다 기다리지 마세요. 간 패널을 재검하고 추이를 의료진과 상의하세요.",
      },
    },
    summary: {
      en: "The liver markers are still individually mild, but four of them have moved the same way for four rounds. That consistency is the signal here, not any single value.",
      ko: "간 지표들은 아직 각각으로는 경미합니다. 다만 네 개가 네 회차 동안 같은 방향으로 움직였습니다. 여기서의 신호는 어느 한 수치가 아니라 그 일관성입니다.",
    },
    mindActivities: {
      en: ["Keep the sleep and activity pattern you have."],
      ko: ["현재의 수면·활동 패턴을 그대로 유지하세요."],
    },
    bodyActivities: {
      en: ["Cut alcohol to zero for one round and see whether GGT responds."],
      ko: ["한 회차 동안 음주를 완전히 끊고 GGT가 반응하는지 보세요."],
    },
    mind: {
      en: "Mood and sleep are settled. Stress load has started to drift up.",
      ko: "기분과 수면은 안정적입니다. 스트레스 부하가 올라가기 시작했습니다.",
    },
  },
  {
    round: 4, date: "01.08",
    fullDate: { en: "8 January 2026", ko: "2026년 1월 8일" },
    bodyNote: {
      hepatic: {
        en: "GGT crossed its reference range for the first time. On its own this is common and usually diet or alcohol.",
        ko: "GGT가 처음으로 참고 범위를 넘었습니다. 단독으로는 흔한 일이고 보통 식습관이나 음주가 원인입니다.",
      },
    },
    bodyAction: {
    },
    summary: {
      en: "One liver enzyme moved out of range. Read alone it is unremarkable; it is listed here so the next round has something to compare against.",
      ko: "간 효소 하나가 범위를 벗어났습니다. 단독으로는 특별할 것이 없고, 다음 회차가 비교할 대상을 갖도록 기록해 둡니다.",
    },
    mindActivities: { en: ["Two or more active days a week."], ko: ["주 2회 이상 신체 활동."] },
    bodyActivities: { en: ["Recheck the liver panel next round."], ko: ["다음 회차에 간 패널을 재확인하세요."] },
    mind: {
      en: "All five pathways sit below the peer average.",
      ko: "다섯 경로 모두 또래 평균 아래입니다.",
    },
  },
  {
    round: 3, date: "10.04",
    fullDate: { en: "4 October 2025", ko: "2025년 10월 4일" },
    bodyNote: {}, bodyAction: {},
    summary: {
      en: "Every system is inside its reference range. The cardiovascular markers raised at the first draw have fully corrected.",
      ko: "모든 계열이 참고 범위 안입니다. 첫 회차에 올라와 있던 심혈관 지표는 완전히 정상화됐습니다.",
    },
    mindActivities: { en: ["Keep the pattern you have."], ko: ["지금 패턴을 유지하세요."] },
    bodyActivities: { en: ["Stay on the quarterly cadence."], ko: ["분기 주기를 유지하세요."] },
    mind: {
      en: "The strongest round so far across all five pathways.",
      ko: "다섯 경로 모두 지금까지 중 가장 좋은 회차입니다.",
    },
  },
  {
    round: 2, date: "07.05",
    fullDate: { en: "5 July 2025", ko: "2025년 7월 5일" },
    bodyNote: {}, bodyAction: {},
    summary: {
      en: "Lipids have come most of the way back and inflammation has settled. Nothing outside range.",
      ko: "지질이 대부분 회복됐고 염증도 가라앉았습니다. 범위를 벗어난 항목은 없습니다.",
    },
    mindActivities: { en: ["Hold the sleep schedule."], ko: ["수면 스케줄을 유지하세요."] },
    bodyActivities: { en: ["Keep saturated fat where it is."], ko: ["포화지방 섭취를 지금 수준으로 유지하세요."] },
    mind: {
      en: "Sleep and mood pathways both improved from the baseline round.",
      ko: "수면과 기분 경로 모두 기준 회차보다 개선됐습니다.",
    },
  },
  {
    round: 1, date: "04.05",
    fullDate: { en: "5 April 2025", ko: "2025년 4월 5일" },
    bodyNote: {
      cardio: {
        en: "Vessel inflammation and LDL went over the range together — a combination worth approaching from lifestyle first.",
        ko: "혈관 염증 지표와 LDL이 함께 참고 범위를 넘었습니다. 생활 요인부터 접근할 만한 조합입니다.",
      },
      nutrition: {
        en: "Vitamin D sits under the reference range — common at this latitude in winter, and the easiest of these to fix.",
        ko: "비타민 D가 참고 범위 아래입니다. 겨울철에 흔하고, 이 중 가장 교정하기 쉬운 항목입니다.",
      },
    },
    bodyAction: {
      cardio: {
        en: "Start with saturated fat and activity levels; recheck at the next round.",
        ko: "포화지방 섭취와 활동량을 먼저 조정하고 다음 회차에 재확인하세요.",
      },
      nutrition: {
        en: "Daily vitamin D and 15 minutes of midday sun.",
        ko: "비타민 D 보충과 한낮 햇빛 15분을 권합니다.",
      },
    },
    summary: {
      en: "The baseline draw, and the one everything after is measured against. Cardiovascular markers and vitamin D were outside range; the liver panel was entirely normal.",
      ko: "기준이 되는 첫 채혈이고, 이후 모든 회차가 여기에 견줍니다. 심혈관 지표와 비타민 D가 범위를 벗어났고, 간 패널은 완전히 정상이었습니다.",
    },
    mindActivities: {
      en: ["Ten minutes a day of breathing practice.", "Hold the same bed and wake times for two weeks."],
      ko: ["호흡 훈련을 하루 10분.", "취침·기상 시간을 2주간 고정해보세요."],
    },
    bodyActivities: {
      en: ["Cut saturated fat and get at least 150 active minutes a week."],
      ko: ["포화지방을 줄이고 주 150분 이상 유산소 활동을 확보하세요."],
    },
    mind: {
      en: "Tension is high and recovery time is short. Build the rest structure first.",
      ko: "긴장이 높고 회복 시간이 부족합니다. 휴식 구조를 먼저 만드세요.",
    },
  },
];

export const SESSIONS = RAW.map((s, i) => ({
  ...s,
  // RAW is newest-first; the marker demo arrays are oldest-first.
  roundIndex: RAW.length - 1 - i,
}))
  // Indices are computed from the blood markers, then status from the index,
  // so a number on screen can never disagree with the marker behind it.
  .map((s) => {
    const indices = SCALE_META.map((meta) => scaleIndex(meta, s.roundIndex));
    return { ...s, indices, status: indices.map(statusOf) };
  });

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

  SYSTEMS.forEach((system) => {
    const values = valuesAt(system, session.roundIndex);
    system.markers.forEach((m, i) => {
      const lv = markerLevel(m, values[i]);
      if (lv > 0) out += 1;
      else if (isOptimal(m, values[i])) optimal += 1;
      else inRange += 1;
    });
  });

  // Mind indices are derived from these same markers, so counting them again
  // would double-count the draw.
  return { total: TOTAL_MARKERS, optimal, inRange, out };
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
  monthly: {
    labelKey: "store.monthly",
    noteKey: "store.monthlyNote",
    ctaKey: "store.ctaMonthly",
    price: 79000,
  },
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
    price: 59000,
    badge: true,
  },
  half: {
    labelKey: "store.half",
    noteKey: "store.halfNote",
    ctaKey: "store.ctaHalf",
    price: 64000,
  },
};

export const PROFILE = {
  name: { en: "Jiho", ko: "지호" },
  fullName: { en: "Jiho Kim", ko: "김지호" },
  initial: "J",
  age: 34,
  // Demo value. The name is gender-neutral in Korean, so this is a choice the
  // fixture makes rather than something derivable — change this one line and the
  // age-and-sex cohort relabels itself.
  sex: { en: "male", ko: "남성" },
  nextInDays: 52,
  roundsSoFar: 6,
  monthsTracked: 18,
  nextDate: { en: "2 October 2026", ko: "2026년 10월 2일" },
};
