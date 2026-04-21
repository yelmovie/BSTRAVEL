/** 사용자에게는 단계만 노출 — 내부 스코어는 predict 단계에서만 사용 */

export type CrowdLevel = "low" | "medium" | "high"

/** 4단계 표시 티어 (한글 라벨은 crowdLabels) */
export type CrowdDisplayTier = "relaxed" | "normal" | "somewhat_busy" | "busy"

export type CrowdConfidence = "strong" | "medium" | "limited"

/** 혼잡도 시간·날씨 가중용 장소 유형 */
export type CrowdPlaceKind = "tour" | "restaurant" | "hotel" | "other"

/** 시간별 예보 전체 또는 일부만 있어도 됨 — 없으면 가중 1.0 */
export type CrowdWeatherSnapshot = {
  weatherCode: number | null
  precipitationMm?: number | null
  precipitationProbabilityPct?: number | null
  windSpeedMs?: number | null
  temperatureC?: number | null
}

export type CrowdPredictionInput = {
  category?: string
  /** 제목·이름 등 키워드 추출용 */
  titleHint?: string
  /** PLACES.crowdLevel 1~5 등 보조 힌트 */
  crowdLevelHint?: number
  popularityTier?: "major" | "standard" | "small"
  visitHour?: number
  isWeekend?: boolean
  indoorOutdoor?: "indoor" | "outdoor" | "mixed"
  /** WMO / Open-Meteo weather_code, null이면 날씨 반영 안 함 */
  weatherCode?: number | null
  stayPattern?: "short" | "medium" | "long"
  /** 미지정 시 추론 (contentTypeId·키워드) */
  placeKind?: CrowdPlaceKind
  /** 방문 일시 — 요일·시간 보정 기준 (미지정이면 현재 시각) */
  visitAt?: Date
  /** 상세 날씨(시간별 예보) — 없으면 weatherCode만 사용 */
  weatherSnapshot?: CrowdWeatherSnapshot | null
  /** 혼잡 base 캐시 키 — 보통 TourAPI content id */
  cachePlaceKey?: string
}

export type CrowdChip = { id: string; label: string }

/** 혼잡도 메인 옆 소형 라벨 */
export type CrowdRibbonLabelKo = "시간대 보정 적용" | "AI 추정 포함"

export type CrowdPredictionResult = {
  level: CrowdLevel
  /** 최종 표시 등급 (4단계 한글) */
  label: string
  displayTier: CrowdDisplayTier
  /** 공공 분류·인기도 등만 반영한 일 단위 추정(시간·날씨·요일 가중 전) */
  officialDateLabel: string
  /** 메인 값 옆 작은 라벨 */
  crowdRibbonLabelKo: CrowdRibbonLabelKo
  /** 카드 2단 — 공공 데이터(일·유형) 설명만 */
  officialExplanationKo: string
  /** 카드 2단 — 시간대·요일 등 추정 설명만 */
  estimateExplanationKo: string
  /** 카드 3단 — 공식 데이터 근거 한 줄 */
  evidenceOfficialKo: string
  /** 카드 3단 — 추정 요소 근거 한 줄 */
  evidenceEstimateKo: string
  /** 작은 맥락 뱃지 (공식 근거 / 시간 보정 / 추정 등) — 호환용 */
  contextBadges: CrowdChip[]
  /** 카드 본문 1·2문장 — 호환용 (공식/추정 합본과 동일하게 유지 가능) */
  primaryNarrative: string
  secondaryNarrative: string
  chips: CrowdChip[]
  /** 한 줄 근거(요인 기반, 기존 호환) */
  reason: string
  /** 짧은 한 줄 요약 — 카드 보조 설명 */
  summaryLine: string
  confidence: CrowdConfidence
  /** 고정 출처 라인(심사·일관성) */
  sourceLabel: string
  /** 상세 출처 보조 문구 */
  methodologyLine: string
  confidenceLabelKo: string
  /** 하단 유의 문구 */
  footerDisclaimerKo: string
}
