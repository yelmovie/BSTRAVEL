export interface Place {
  id: string;
  name: string;
  subtitle: string;
  score: number;
  image: string;
  tags: string[];
  description: string;
  duration: string;
  walkingAmount: string;
  address: string;
  operatingHours: string;
  facilities: string[];
  reasonText: string;
  evidence: string;
  walkingLevel: number;
  estimatedSteps: string;
  courseSteps: CourseStep[];
  scoreBreakdown: ScoreBreakdown;
  crowdLevel: number; // 1-5
  feasibility: FeasibilityData;
  busanArea: string;
  recommendReason: string;
  lat?: number;
  lng?: number;
}

export interface ScoreBreakdown {
  accessibility: number;     // 0-100
  companionFit: number;      // 0-100
  walkingLoad: number;       // 0-100 (higher = less walking burden)
  crowdStability: number;    // 0-100
  connectivity: number;      // 0-100
  interpretationText: string;
}

export interface RiskSegment {
  name: string;
  riskType: "crowd" | "slope" | "accessibility" | "distance" | "weather";
  riskLevel: "low" | "medium" | "high";
  description: string;
  alternative: string;
}

export interface FeasibilityData {
  successRate: number; // 0-100
  interpretation: string;
  risks: RiskSegment[];
}

export interface CourseStep {
  type: "start" | "place" | "rest" | "meal" | "end";
  name: string;
  subname?: string;
  time: string;
  duration: string;
  transport?: string;
  transportTime?: string;
  lat?: number;
  lng?: number;
}

export interface Alternative {
  id: string;
  name: string;
  subtitle: string;
  score: number;
  image: string;
  tags: string[];
  reason: string;
  busanArea?: string;
}

export const PLACES: Place[] = [
  {
    id: "haeundae",
    name: "해운대 아쿠아리움 & 동백섬 코스",
    subtitle: "해운대·수영권 · 실내+해변 코스",
    busanArea: "해운대·수영권",
    recommendReason: "어르신과 함께하기에 보행 부담이 비교적 적은 부산 해운대 권역 코스입니다",
    score: 9.2,
    image: "https://images.unsplash.com/photo-1769847770288-d290a1f9d943?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYWV1bmRhZSUyMGJlYWNoJTIwQnVzYW4lMjBLb3JlYSUyMGNvYXN0YWx8ZW58MXx8fHwxNzc2MzQwMTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["실내 아쿠아리움", "평지 산책로", "외국어 안내"],
    description:
      "SEA LIFE 부산 아쿠아리움은 전 구간 무장애 동선으로 휠체어·유모차 이용이 자유롭습니다. 관람 후 동백섬 산책로는 완전 평지로 이어져 어르신도 부담 없이 걸을 수 있어요. 해운대해수욕장 주변 휴식 공간도 접근성이 우수합니다.",
    duration: "약 3–4시간",
    walkingAmount: "최소",
    walkingLevel: 1,
    estimatedSteps: "약 3,400보",
    address: "부산 해운대구 해운대해변로 266",
    operatingHours: "매일 10:00 – 20:00 (마지막 입장 19:00)",
    facilities: ["elevator", "accessible_restroom", "parking", "cafe", "nursing_room", "foreign_guide"],
    reasonText: "실내 아쿠아리움 관람과 동백섬 평지 산책의 조합으로 보행 부담이 낮고, 다국어 안내 서비스로 외국인 동행에도 적합합니다.",
    evidence: "무장애 동선 완비 · 엘리베이터 2기 · 장애인화장실 3개소 · 영·중·일 안내 지원",
    crowdLevel: 3,
    lat: 35.1580,
    lng: 129.1604,
    scoreBreakdown: {
      accessibility: 93,
      companionFit: 91,
      walkingLoad: 88,
      crowdStability: 74,
      connectivity: 90,
      interpretationText: "실내 무장애 동선과 평지 산책로 조합으로 접근성이 탁월합니다. 주말 오전 혼잡에 유의하되 전반적으로 모든 동행자에게 적합한 코스입니다.",
    },
    feasibility: {
      successRate: 91,
      interpretation: "전반적으로 높은 실현 가능성을 가진 부산 해운대 코스입니다. 실내 구간이 많아 날씨 영향이 적고, 편의시설이 완비되어 어르신·휠체어 사용자도 무리 없이 진행 가능합니다.",
      risks: [
        {
          name: "동백섬 산책로 일부 구간",
          riskType: "slope",
          riskLevel: "low",
          description: "동백섬 내 일부 오르막 구간이 있으나 완만하여 대부분의 동행자에게 문제없음",
          alternative: "해수욕장 해변 산책로로 대체 시 완전 평지 유지 가능",
        },
        {
          name: "주말·성수기 아쿠아리움 혼잡",
          riskType: "crowd",
          riskLevel: "medium",
          description: "주말·여름 성수기 오전 10–11시 혼잡도 상승으로 휠체어·유모차 이동 난이도가 높아질 수 있음",
          alternative: "평일 방문 또는 오후 2시 이후 방문 권장",
        },
      ],
    },
    courseSteps: [
      { type: "start", name: "출발", subname: "지하철 2호선 해운대역 5번 출구", time: "10:00", duration: "", transport: "도보", transportTime: "10분", lat: 35.1625, lng: 129.1637 },
      { type: "place", name: "SEA LIFE 부산 아쿠아리움", subname: "실내 해양생물 관람", time: "10:10 – 12:00", duration: "약 2시간", transport: "도보", transportTime: "5분", lat: 35.1580, lng: 129.1604 },
      { type: "rest", name: "해운대해수욕장 카페 휴게", subname: "음료 및 해변 뷰 감상", time: "12:00 – 12:30", duration: "30분", transport: "도보", transportTime: "5분", lat: 35.1588, lng: 129.1595 },
      { type: "meal", name: "해운대 점심", subname: "접근성 좋은 해변 식당가", time: "13:00 – 14:00", duration: "1시간", transport: "도보", transportTime: "5분", lat: 35.1600, lng: 129.1590 },
      { type: "place", name: "동백섬 산책", subname: "평지 해안 산책로·누리마루", time: "14:10 – 15:20", duration: "약 1시간 10분", transport: "도보", transportTime: "3분", lat: 35.1530, lng: 129.1560 },
      { type: "end", name: "도착", subname: "지하철 2호선 동백역", time: "15:30", duration: "", lat: 35.1512, lng: 129.1548 },
    ],
  },
  {
    id: "gamcheon",
    name: "감천문화마을 & 자갈치시장 코스",
    subtitle: "중구·영도권 · 문화 체험 코스",
    busanArea: "중구·영도권",
    recommendReason: "외국인 동행 시 안내와 이동이 편한 부산 도심 코스입니다",
    score: 8.7,
    image: "https://images.unsplash.com/photo-1764147385132-4645d8b55dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHYW1jaGVvbiUyMGN1bHR1cmUlMjB2aWxsYWdlJTIwQnVzYW4lMjBjb2xvcmZ1bCUyMGhpbGxzaWRlfGVufDF8fHx8MTc3NjM0MDEzNXww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["문화마을", "외국어 안내", "전통 시장"],
    description:
      "부산의 대표 관광지 감천문화마을은 좁은 골목길이 특징이지만, 무장애 탐방로가 별도로 지정되어 있어 휠체어·유모차도 주요 포토스팟에 접근 가능합니다. 자갈치시장은 넓은 실내 공간과 외국어 안내판이 완비되어 외국인 동행에 적합합니다.",
    duration: "약 4–5시간",
    walkingAmount: "보통",
    walkingLevel: 2,
    estimatedSteps: "약 5,200보",
    address: "부산 사하구 감내2로 203",
    operatingHours: "09:00 – 18:00 (토~일 연장 운영)",
    facilities: ["accessible_restroom", "parking", "cafe", "foreign_guide", "audio_guide"],
    reasonText: "4개국어 안내판과 외국어 오디오가이드가 완비되어 외국인 동행에 최적이며, 무장애 탐방로로 휠체어 접근도 가능합니다.",
    evidence: "무장애 탐방로 지정 · 4개국어 안내판 · 자갈치 외국어 안내 완비 · 장애인화장실 2개소",
    crowdLevel: 3,
    lat: 35.0973,
    lng: 129.0103,
    scoreBreakdown: {
      accessibility: 78,
      companionFit: 85,
      walkingLoad: 72,
      crowdStability: 70,
      connectivity: 82,
      interpretationText: "문화적 가치가 높고 외국어 지원이 강점입니다. 마을 내 일부 경사로가 있으나 무장애 탐방로를 이용하면 주요 장소 접근이 가능합니다.",
    },
    feasibility: {
      successRate: 82,
      interpretation: "전반적으로 양호한 실현 가능성을 가진 코스입니다. 감천문화마을 내 무장애 탐방로 활용 시 대부분의 동행자에게 가능한 코스입니다.",
      risks: [
        {
          name: "감천문화마을 골목 경사",
          riskType: "slope",
          riskLevel: "medium",
          description: "마을 내 일부 좁은 골목 구간에 경사가 있어 휠체어·유모차 이동에 주의 필요",
          alternative: "안내소에서 배포하는 무장애 탐방로 지도 활용 권장",
        },
        {
          name: "주말 감천문화마을 혼잡",
          riskType: "crowd",
          riskLevel: "medium",
          description: "주말 오전 10–13시 외국인 관광객 집중으로 좁은 골목에서 이동 속도 저하 예상",
          alternative: "평일 또는 오전 9시 이전 방문 권장",
        },
      ],
    },
    courseSteps: [
      { type: "start", name: "출발", subname: "부산 도시철도 1호선 토성역 6번 출구", time: "09:30", duration: "", transport: "마을버스", transportTime: "15분", lat: 35.1040, lng: 129.0186 },
      { type: "place", name: "감천문화마을", subname: "무장애 탐방로 · 포토스팟 관람", time: "09:45 – 11:30", duration: "약 1시간 45분", transport: "버스", transportTime: "20분", lat: 35.0973, lng: 129.0103 },
      { type: "rest", name: "중구 카페 휴게", subname: "커피 한 잔의 여유", time: "11:50 – 12:20", duration: "30분", transport: "도보", transportTime: "10분", lat: 35.1009, lng: 129.0320 },
      { type: "meal", name: "남포동 점심", subname: "접근성 좋은 부산 향토 음식", time: "12:30 – 13:30", duration: "1시간", transport: "도보", transportTime: "5분", lat: 35.0977, lng: 129.0305 },
      { type: "place", name: "자갈치시장", subname: "실내 수산시장 관람 · 외국어 안내", time: "13:40 – 15:00", duration: "약 1시간 20분", transport: "도보", transportTime: "5분", lat: 35.0964, lng: 129.0295 },
      { type: "end", name: "도착", subname: "부산 도시철도 1호선 자갈치역", time: "15:10", duration: "", lat: 35.0972, lng: 129.0273 },
    ],
  },
  {
    id: "citizenpark",
    name: "부산시민공원 & 전포카페거리 코스",
    subtitle: "서면·부산시민공원권 · 도심 평지 코스",
    busanArea: "서면·부산시민공원권",
    recommendReason: "휠체어와 유아차 이동을 함께 고려한 부산 실내 중심 코스입니다",
    score: 9.0,
    image: "https://images.unsplash.com/photo-1758570840533-2bfaaf80efc3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxCdXNhbiUyMGNpdGl6ZW4lMjBwYXJrJTIwZ3JlZW4lMjB1cmJhbiUyMEtvcmVhfGVufDF8fHx8MTc3NjM0MDEzNXww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["완전 평지", "넓은 공원", "카페 탐방"],
    description:
      "부산시민공원은 완전 평지로 조성된 대형 도심 공원으로 전 구간 배리어프리 동선이 완비되어 있습니다. 휠체어·유모차 이동이 자유롭고 넓은 쉼터와 화장실이 곳곳에 배치되어 있습니다. 전포카페거리는 접근성 좋은 카페들이 밀집해 있어 편안한 휴식이 가능합니다.",
    duration: "약 3–4시간",
    walkingAmount: "적음",
    walkingLevel: 1,
    estimatedSteps: "약 3,800보",
    address: "부산 부산진구 시민공원로 73",
    operatingHours: "05:00 – 24:00 (연중무휴)",
    facilities: ["elevator", "accessible_restroom", "parking", "cafe", "nursing_room", "guide_map"],
    reasonText: "완전 평지 + 배리어프리 동선으로 휠체어·유모차 이동이 자유롭고, 도심 위치로 교통 접근성이 우수합니다.",
    evidence: "평지 100% · 배리어프리 인증 · 장애인화장실 6개소 · 유모차 대여 가능 · 무료 입장",
    crowdLevel: 2,
    lat: 35.1616,
    lng: 129.0564,
    scoreBreakdown: {
      accessibility: 97,
      companionFit: 93,
      walkingLoad: 94,
      crowdStability: 82,
      connectivity: 91,
      interpretationText: "완전 평지·배리어프리 인증으로 접근성이 최상위 수준입니다. 무료 입장에 넓은 공간으로 모든 동행자에게 가장 안정적인 코스입니다.",
    },
    feasibility: {
      successRate: 95,
      interpretation: "가장 높은 실현 가능성을 가진 코스입니다. 완전 평지로 날씨에 영향받지 않는 쉼터가 많고 배리어프리 인증 시설이 완비되어 있습니다.",
      risks: [
        {
          name: "전포카페거리 일부 구간",
          riskType: "slope",
          riskLevel: "low",
          description: "전포카페거리 일부 카페는 계단 진입이 있을 수 있어 사전 확인 권장",
          alternative: "1층 접근 가능한 카페만 선택하면 완전 배리어프리 유지 가능",
        },
      ],
    },
    courseSteps: [
      { type: "start", name: "출발", subname: "부산 도시철도 2호선 시민공원역", time: "10:00", duration: "", transport: "도보", transportTime: "3분", lat: 35.1620, lng: 129.0568 },
      { type: "place", name: "부산시민공원", subname: "평지 산책·잔디광장·전시관 관람", time: "10:05 – 12:00", duration: "약 2시간", transport: "도보", transportTime: "10분", lat: 35.1616, lng: 129.0564 },
      { type: "rest", name: "공원 내 카페 휴게", subname: "음료 및 잔디밭 휴식", time: "12:00 – 12:30", duration: "30분", transport: "도보", transportTime: "10분", lat: 35.1610, lng: 129.0559 },
      { type: "meal", name: "서면 점심", subname: "접근성 좋은 다양한 식당가", time: "12:45 – 13:45", duration: "1시간", transport: "도보", transportTime: "5분", lat: 35.1577, lng: 129.0587 },
      { type: "place", name: "전포카페거리", subname: "접근성 좋은 카페 탐방", time: "14:00 – 15:00", duration: "약 1시간", transport: "도보", transportTime: "5분", lat: 35.1563, lng: 129.0558 },
      { type: "end", name: "도착", subname: "부산 도시철도 1/2호선 서면역", time: "15:10", duration: "", lat: 35.1577, lng: 129.0593 },
    ],
  },
  {
    id: "dongrae",
    name: "동래읍성 역사관 & 금강공원 코스",
    subtitle: "동래·온천권 · 역사 체험 코스",
    busanArea: "동래·온천권",
    recommendReason: "실내 역사관 관람 중심으로 보행 부담이 적고, 어르신·외국인 동행에 적합한 코스입니다",
    score: 8.6,
    image: "https://images.unsplash.com/photo-1764059115796-46fcc9b842af?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxLb3JlYW4lMjB0cmFkaXRpb25hbCUyMHZpbGxhZ2UlMjBoaXN0b3JpYyUyMGFyY2hpdGVjdHVyZSUyMGF1dHVtbnxlbnwxfHx8fDE3NzYzNDE1MTJ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["실내 역사관", "온천 체험", "이동 최소"],
    description:
      "동래읍성 역사관은 전 구간 엘리베이터가 완비된 실내 전시 공간으로, 휠체어·유모차 이동이 자유롭습니다. 다국어 오디오 가이드를 제공해 외국인 동행에도 적합합니다. 금강공원은 완만한 경사의 평지 산책로가 갖춰져 어르신도 편안하게 걸을 수 있으며, 동래 온천 족욕 체험으로 여행 피로를 풀 수 있습니다.",
    duration: "약 3–4시간",
    walkingAmount: "적음",
    walkingLevel: 1,
    estimatedSteps: "약 3,200보",
    address: "부산 동래구 명륜동 산 29-1 (동래읍성 역사관)",
    operatingHours: "09:00 – 18:00 (월요일 휴관)",
    facilities: ["elevator", "accessible_restroom", "parking", "audio_guide", "foreign_guide"],
    reasonText: "실내 역사관 관람과 완만한 공원 산책의 조합으로 보행 부담이 낮으며, 다국어 안내로 외국인 동행에도 최적입니다.",
    evidence: "엘리베이터 완비 · 장애인화장실 2개소 · 4개국어 오디오가이드 · 장애인 주차구역",
    crowdLevel: 1,
    lat: 35.2018,
    lng: 129.0847,
    scoreBreakdown: {
      accessibility: 88,
      companionFit: 86,
      walkingLoad: 92,
      crowdStability: 90,
      connectivity: 80,
      interpretationText: "실내 역사관 중심으로 보행 부담이 가장 낮은 편입니다. 비교적 한산한 관광지로 혼잡 안정성이 높고, 다국어 안내가 강점입니다.",
    },
    feasibility: {
      successRate: 93,
      interpretation: "전반적으로 높은 실현 가능성을 가진 동래·온천권 코스입니다. 실내 역사관 중심으로 날씨 영향을 받지 않으며, 비수기·평일 모두 쾌적하게 이용 가능합니다.",
      risks: [
        {
          name: "금강공원 일부 산책로",
          riskType: "slope",
          riskLevel: "low",
          description: "금강공원 산책로 일부 구간에 완만한 경사가 있으나 대부분 무리 없는 수준",
          alternative: "케이블카 이용 또는 하단 평지 구간만 산책 가능",
        },
      ],
    },
    courseSteps: [
      { type: "start", name: "출발", subname: "부산 도시철도 4호선 동래역 1번 출구", time: "10:00", duration: "", transport: "도보", transportTime: "8분", lat: 35.2041, lng: 129.0836 },
      { type: "place", name: "동래읍성 역사관", subname: "실내 전시 관람 · 다국어 오디오가이드", time: "10:10 – 11:40", duration: "약 1시간 30분", transport: "도보", transportTime: "5분", lat: 35.2018, lng: 129.0847 },
      { type: "rest", name: "동래 시장 카페 휴게", subname: "전통 시장 분위기 · 음료 휴식", time: "11:45 – 12:15", duration: "30분", transport: "도보", transportTime: "5분", lat: 35.2002, lng: 129.0832 },
      { type: "meal", name: "동래파전 점심", subname: "접근성 좋은 동래 향토 식당", time: "12:20 – 13:20", duration: "1시간", transport: "도보", transportTime: "10분", lat: 35.1990, lng: 129.0830 },
      { type: "place", name: "금강공원 산책", subname: "완만한 평지·호수 산책로", time: "13:30 – 14:40", duration: "약 1시간 10분", transport: "도보", transportTime: "5분", lat: 35.1983, lng: 129.0765 },
      { type: "end", name: "도착", subname: "부산 도시철도 1호선 온천장역", time: "14:50", duration: "", lat: 35.1960, lng: 129.0751 },
    ],
  },
];

export const ALTERNATIVES: Alternative[] = [
  {
    id: "dongbaek",
    name: "광안리해수욕장 & 수변공원 코스",
    subtitle: "해운대·수영권 · 완전 평지",
    busanArea: "해운대·수영권",
    score: 9.4,
    image: "https://images.unsplash.com/photo-1769847770288-d290a1f9d943?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxIYWV1bmRhZSUyMGJlYWNoJTIwQnVzYW4lMjBLb3JlYSUyMGNvYXN0YWx8ZW58MXx8fHwxNzc2MzQwMTM0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["완전 평지", "해변 산책로", "화장실 완비"],
    reason: "오르막길이 전혀 없는 해변 평지 코스",
  },
  {
    id: "gukje",
    name: "국제시장 & 용두산공원 코스",
    subtitle: "중구·영도권 · 도심 문화 코스",
    busanArea: "중구·영도권",
    score: 8.9,
    image: "https://images.unsplash.com/photo-1764147385132-4645d8b55dc4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxHYW1jaGVvbiUyMGN1bHR1cmUlMjB2aWxsYWdlJTIwQnVzYW4lMjBjb2xvcmZ1bCUyMGhpbGxzaWRlfGVufDF8fHx8MTc3NjM0MDEzNXww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["전통 시장", "도심 공원", "엘리베이터"],
    reason: "도심에서 다양한 먹거리와 문화를 함께 즐길 수 있는 코스",
  },
];

export const COMPANION_LIST = [
  { id: "elderly", label: "어르신", icon: "elderly" as const },
  { id: "stroller", label: "유모차", icon: "stroller" as const },
  { id: "wheelchair", label: "휠체어", icon: "wheelchair" as const },
  { id: "foreigner", label: "외국인", icon: "foreigner" as const },
  { id: "family", label: "가족", icon: "family" as const },
];

export const FACILITY_INFO: Record<string, { label: string; icon: string }> = {
  elevator: { label: "엘리베이터", icon: "elevator" },
  accessible_restroom: { label: "장애인 화장실", icon: "accessible" },
  parking: { label: "장애인 주차", icon: "parking" },
  cafe: { label: "카페", icon: "cafe" },
  nursing_room: { label: "수유실", icon: "nursing" },
  guide_map: { label: "점자 안내", icon: "braille" },
  audio_guide: { label: "오디오 가이드", icon: "audio" },
  foreign_guide: { label: "외국어 안내", icon: "language" },
  wheelchair_rental: { label: "휠체어 대여", icon: "wheelchair" },
};

export const BUSAN_AREAS = [
  {
    id: "busan-haeundae",
    name: "해운대·수영권",
    sub: "BEXCO·해운대·광안리·민락수변공원",
    emoji: "🏖",
    color: "#4A7BBF",
  },
  {
    id: "busan-junggu",
    name: "중구·영도권",
    sub: "자갈치시장·감천문화마을·남포동·용두산",
    emoji: "🎨",
    color: "#C4793C",
  },
  {
    id: "busan-seomyeon",
    name: "서면·부산시민공원권",
    sub: "서면·전포카페거리·부산시민공원",
    emoji: "🌿",
    color: "#3D8B7A",
  },
  {
    id: "busan-dongrae",
    name: "동래·온천권",
    sub: "동래읍성·온천장·금강공원·범어사",
    emoji: "♨️",
    color: "#B07AAF",
  },
] as const;