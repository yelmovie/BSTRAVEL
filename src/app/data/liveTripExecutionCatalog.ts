/**
 * 실시간 여행 실행 화면용 단일 소스.
 * 코스별 프리셋이 없으면 Place.courseSteps·feasibility 등으로 생성합니다.
 */
import type { Place } from "./places";
import { PLACES } from "./places";

export type ExecutionDataMode = "live" | "sample";

export type TimelineState = "done" | "current" | "upcoming";

export type LiveIssueSeverity = "warning" | "urgent";

export interface LiveTripIssue {
  id: string;
  title: string;
  detail: string;
  category: "crowd" | "accessibility" | "weather";
  severity: LiveIssueSeverity;
  /** 시연용 출처 라벨 */
  sourceNote: string;
}

export interface LiveChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface LiveTimelineStep {
  id: string;
  label: string;
  sublabel?: string;
  /** 표시용 시각 */
  timeDisplay: string;
  state: TimelineState;
}

export interface LivePhaseDetail {
  headline: string;
  /** 다음 목적지 도착 예정 시각 표시 */
  nextArrivalDisplay: string;
  remainingMinutes: number;
  accessibilityMemo: string;
  actions: string[];
}

export interface NearbySpot {
  name: string;
  detail: string;
}

export interface EmergencyContact {
  name: string;
  phone: string;
  type: string;
}

export interface LiveTripExecution {
  courseId: string;
  courseTitle: string;
  /** 예: 이동 중 */
  statusLabel: string;
  /** 예: 출발 중 */
  phaseBadge: string;
  /** 1-based 현재 단계 */
  currentStepDisplay: number;
  totalSteps: number;
  progressPercent: number;
  nextDestinationName: string;
  transportSummary: string;
  /** 실행 데이터가 샘플인지 (날씨 등 다른 소스와 구분 표시용) */
  executionDataMode: ExecutionDataMode;
  lastUpdatedDisplay: string;
  phases: LivePhaseDetail[];
  /** 초기 활성 타임라인 인덱스 (0 = 첫 줄) */
  initialTimelineActiveIndex: number;
  timeline: LiveTimelineStep[];
  issues: LiveTripIssue[];
  checklist: LiveChecklistItem[];
  planB: string[];
  nearbyFacilities: NearbySpot[];
  emergencyContacts: EmergencyContact[];
  mapLink: string;
}

const DEFAULT_CHECKLIST: LiveChecklistItem[] = [
  { id: "w", label: "물 챙김", done: true },
  { id: "r", label: "화장실 위치 확인", done: false },
  { id: "b", label: "휴식 가능 벤치 확인", done: false },
  { id: "p", label: "동행자 이동 속도 반영", done: true },
];

function buildIssuesFromPlace(place: Place): LiveTripIssue[] {
  const out: LiveTripIssue[] = [];
  let n = 0;
  for (const r of place.feasibility.risks.slice(0, 3)) {
    n += 1;
    out.push({
      id: `risk-${n}`,
      title: r.name,
      detail: r.description,
      category: r.riskType === "crowd" ? "crowd" : r.riskType === "weather" ? "weather" : "accessibility",
      severity: r.riskLevel === "high" ? "urgent" : "warning",
      sourceNote: "코스 메타 기반 시연 알림",
    });
  }
  if (place.crowdLevel >= 3) {
    out.push({
      id: "crowd-hint",
      title: "혼잡도 상대적으로 높은 시간대 가능",
      detail: "실시간 혼잡 데이터 미연동 — 동선 여유 있게 계획하세요.",
      category: "crowd",
      severity: "warning",
      sourceNote: "샘플 추정",
    });
  }
  return out;
}

function parseStartTime(courseSteps: Place["courseSteps"]): string {
  const start = courseSteps[0];
  if (!start) return "09:00";
  const m = start.time.match(/(\d{1,2}:\d{2})/);
  return m ? m[1] : "09:00";
}

/** courseSteps 기반 타임라인 + 단계별 행동 (간략 생성) */
function buildFromPlace(place: Place): LiveTripExecution {
  const steps = place.courseSteps;
  const total = Math.max(steps.length, 1);
  const activeIdx = Math.min(1, total - 1);
  const labels = steps.map((s) => s.name);
  const timeline: LiveTimelineStep[] = steps.map((s, i) => ({
    id: `tl-${i}`,
    label: s.name,
    sublabel: s.subname,
    timeDisplay: s.time.includes("–") ? s.time.split("–")[0].trim() : s.time,
    state: i < activeIdx ? "done" : i === activeIdx ? "current" : "upcoming",
  }));

  const cur = steps[activeIdx] ?? steps[0];
  const phases: LivePhaseDetail[] = steps.map((s, i) => ({
    headline: i === 0 ? `${s.name}` : `${s.name} 진행`,
    nextArrivalDisplay: s.time.includes("–") ? s.time.split("–")[0].trim() : s.time,
    remainingMinutes: 10 + i * 3,
    accessibilityMemo:
      place.facilities.includes("elevator") ? "역사·시설 엘리베이터 우선 확인" : "평지·무단차 동선 확인",
    actions: [
      `${s.transport ?? "도보"} 이동 (${s.transportTime ?? ""})`,
      s.subname ? String(s.subname) : `${s.name} 도착 후 동선 확인`,
      "장애인 화장실·휴게 공간 위치 확인",
    ],
  }));

  const planB = place.feasibility.risks.map((r) => r.alternative).filter(Boolean).slice(0, 4);
  if (planB.length === 0) {
    planB.push("날씨 악화 시 실내 구간 우선", "동행자 피로 시 휴게 시간 연장", "혼잡 시 다음 장소 순서 변경");
  }

  return {
    courseId: place.id,
    courseTitle: place.name,
    statusLabel: "이동 중",
    phaseBadge: "여행 실행",
    currentStepDisplay: activeIdx + 1,
    totalSteps: total,
    progressPercent: Math.round(((activeIdx + 1) / total) * 100),
    nextDestinationName: cur?.name ?? place.name,
    transportSummary: `${cur?.transport ?? "도보"} · ${cur?.transportTime ?? ""}`,
    executionDataMode: "sample",
    lastUpdatedDisplay: new Date().toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }),
    phases,
    initialTimelineActiveIndex: activeIdx,
    timeline,
    issues: buildIssuesFromPlace(place),
    checklist: DEFAULT_CHECKLIST.map((c) => ({ ...c })),
    planB,
    nearbyFacilities: [
      { name: "장애인 화장실", detail: `${place.address} 인근 공공화장실 확인` },
      { name: "휴게·쉼터", detail: "코스 안내 지도 참고" },
    ],
    emergencyContacts: [
      { name: "부산 관광 안내", phone: "1330", type: "다국어" },
      { name: "국번 없이", phone: "119·112", type: "응급" },
    ],
    mapLink:
      place.lat != null && place.lng != null
        ? `https://www.google.com/maps?q=${place.lat},${place.lng}`
        : `https://www.google.com/maps/search/${encodeURIComponent(place.address)}`,
  };
}

/** 부산시민공원 코스 — 요청하신 시연 카피 */
const CITIZENPARK: LiveTripExecution = {
  courseId: "citizenpark",
  courseTitle: "부산시민공원 & 전포카페거리 코스",
  statusLabel: "이동 중",
  phaseBadge: "출발 중",
  currentStepDisplay: 2,
  totalSteps: 6,
  progressPercent: 32,
  nextDestinationName: "부산시민공원",
  transportSummary: "부산 도시철도 2호선 · 시민공원역",
  executionDataMode: "sample",
  lastUpdatedDisplay: "2026-04-18 10:12",
  initialTimelineActiveIndex: 1,
  /** 타임라인 6행과 동일 인덱스 */
  phases: [
    {
      headline: "시민공원역에서 여행 출발",
      nextArrivalDisplay: "10:00",
      remainingMinutes: 5,
      accessibilityMemo: "역사 엘리베이터·환승 안내 확인",
      actions: [
        "도시철도 2호선 시민공원역 승차·하차 동선 확인",
        "엘리베이터·넓은 개찰구 이용",
        "공원 방향 출구 안내판 확인",
      ],
    },
    {
      headline: "부산시민공원으로 이동 중",
      nextArrivalDisplay: "10:05",
      remainingMinutes: 12,
      accessibilityMemo: "지하철 엘리베이터 이용 가능",
      actions: [
        "도시철도 2호선 시민공원역 하차",
        "엘리베이터 이용 후 3번 출구 이동",
        "공원 베리어프리 입구로 진입",
      ],
    },
    {
      headline: "공원 내 휴식",
      nextArrivalDisplay: "12:00",
      remainingMinutes: 45,
      accessibilityMemo: "평지·배리어프리 동선 유지",
      actions: [
        "잔디광장·산책로 무장애 구간 유지",
        "카페 음료·간단 휴식",
        "그늘·벤치·화장실 위치 확인",
      ],
    },
    {
      headline: "서면 점심",
      nextArrivalDisplay: "12:45",
      remainingMinutes: 60,
      accessibilityMemo: "서면역·상권 평지 동선",
      actions: [
        "접근성 좋은 식당 선택",
        "점심 후 동선 여유 두기",
        "유모차·휠체어 통로 확인",
      ],
    },
    {
      headline: "전포카페거리 탐방",
      nextArrivalDisplay: "14:00",
      remainingMinutes: 40,
      accessibilityMemo: "일부 매장 계단 가능 — 1층 확인",
      actions: [
        "카페 입구 단차 확인",
        "야외 좌석 vs 실내 선택",
        "경사 구간 우회",
      ],
    },
    {
      headline: "서면역 귀가",
      nextArrivalDisplay: "15:10",
      remainingMinutes: 0,
      accessibilityMemo: "지하철 환승·엘리베이터",
      actions: ["서면역 이동", "환승 동선 확인", "귀가 안전 확인"],
    },
  ],
  timeline: [
    {
      id: "t1",
      label: "출발",
      sublabel: "시민공원역",
      timeDisplay: "10:00",
      state: "done",
    },
    {
      id: "t2",
      label: "부산시민공원",
      sublabel: "평지 산책·전시",
      timeDisplay: "10:05",
      state: "current",
    },
    {
      id: "t3",
      label: "공원 내 휴식",
      sublabel: "카페 휴게",
      timeDisplay: "12:00",
      state: "upcoming",
    },
    {
      id: "t4",
      label: "점심",
      sublabel: "서면",
      timeDisplay: "12:45",
      state: "upcoming",
    },
    {
      id: "t5",
      label: "전포카페거리",
      sublabel: "카페 탐방",
      timeDisplay: "14:00",
      state: "upcoming",
    },
    {
      id: "t6",
      label: "귀가",
      sublabel: "서면역",
      timeDisplay: "15:10",
      state: "upcoming",
    },
  ],
  issues: [
    {
      id: "i1",
      title: "시민공원 남문 인근 혼잡도 높음",
      detail: "주말 오전 유동인구 집중 구간입니다. 북문·측면 동선을 고려하세요.",
      category: "crowd",
      severity: "warning",
      sourceNote: "시연용 혼잡 시나리오",
    },
    {
      id: "i2",
      title: "전포카페거리 일부 경사 구간 주의",
      detail: "휠체어·유모차 시 포장 상태가 다른 구간이 있을 수 있습니다. 진입 전 확인하세요.",
      category: "accessibility",
      severity: "warning",
      sourceNote: "코스 리스크 메타 기반",
    },
  ],
  checklist: [
    { id: "c1", label: "물 챙김", done: true },
    { id: "c2", label: "화장실 위치 확인", done: false },
    { id: "c3", label: "휴식 가능 벤치 확인", done: false },
    { id: "c4", label: "동행자 이동 속도 반영", done: true },
  ],
  planB: [
    "비가 오면 시민공원 체류 시간 축소",
    "실내 카페 먼저 이동",
    "혼잡 시 북문 진입으로 우회",
  ],
  nearbyFacilities: [
    { name: "시민공원 무장애 화장실", detail: "중앙광장 인근 · 지도 안내판 참고" },
    { name: "유모차 대여", detail: "공원 안내소(운영 시간 확인)" },
    { name: "전포카페거리 휠체어 접근 카페", detail: "1층·무단차 매장 우선" },
  ],
  emergencyContacts: [
    { name: "부산 안전 안내", phone: "051-120", type: "시청" },
    { name: "관광안내", phone: "1330", type: "다국어" },
    { name: "응급", phone: "119", type: "구조" },
  ],
  mapLink: "https://www.google.com/maps?q=35.1616,129.0564",
};

export function getLiveTripExecution(courseId: string): LiveTripExecution {
  if (courseId === "citizenpark") return CITIZENPARK;
  const place = PLACES.find((p) => p.id === courseId);
  if (place) return buildFromPlace(place);
  return {
    ...CITIZENPARK,
    courseId: "unknown",
    courseTitle: `코스 (${courseId})`,
    issues: [
      {
        id: "unk",
        title: "코스 설정을 찾을 수 없음",
        detail: "알 수 없는 ID입니다. 부산 시범 코스(citizenpark 등)를 선택했는지 확인하세요.",
        category: "accessibility",
        severity: "warning",
        sourceNote: "클라이언트",
      },
    ],
  };
}

/** 타임라인 활성 인덱스에 맞춰 state 재계산 */
export function applyTimelineStates(
  timeline: LiveTimelineStep[],
  activeIndex: number,
): LiveTimelineStep[] {
  return timeline.map((step, i) => ({
    ...step,
    state: i < activeIndex ? "done" : i === activeIndex ? "current" : "upcoming",
  }));
}
