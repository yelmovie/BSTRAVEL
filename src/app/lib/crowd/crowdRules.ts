/**
 * 혼잡도 예측 — 규칙·상수 단일 소스 (하드코딩 분산 금지)
 */

import type { CrowdConfidence, CrowdLevel } from "./types"

/** 내부 합산만 사용, UI에 숫자로 노출하지 않음 */
export const SCORE_THRESHOLDS = {
  lowMax: 2,
  mediumMax: 5,
} as const

export const SOURCE_LABEL_KO = "공공데이터 기반 예측"

/** 심사/푸터 공통 문구 */
export const METHODOLOGY_LINE_KO =
  "혼잡도는 한국관광공사 공개 분류·소개와 선택 시각·요일·장소 유형에 더한 참고용 추정이며, 날씨 화면의 예보와는 근거가 다릅니다. 실측 유동인구나 인원 수치가 아닙니다."

export const CONFIDENCE_LABEL: Record<CrowdConfidence, string> = {
  strong: "기준 충분",
  medium: "참고용 예측",
  limited: "데이터 제한",
}

export const LEVEL_LABEL: Record<CrowdLevel, string> = {
  low: "여유",
  medium: "보통",
  high: "혼잡",
}

/** 점수 가중 (내부 전용) */
export const WEIGHT = {
  popularity: { major: 2, standard: 1, small: 0 },
  weekend: 2,
  afternoonPeak: 2, // 13~17
  midday: 1, // 11~13
  outdoorBias: 1,
  mixedBias: 1,
  rainOutdoorPenalty: -1,
  shortStayBonus: -1,
  longStayBonus: 1,
  earlyQuiet: -1, // 평일 7~10
} as const

/** Open-Meteo WMO 코드: 비/소나기 구간이면 실외 불리 */
export function isSignificantRain(weatherCode: number | null | undefined): boolean {
  if (weatherCode == null || Number.isNaN(weatherCode)) return false
  if (weatherCode >= 51 && weatherCode <= 67) return true
  if (weatherCode >= 80 && weatherCode <= 82) return true
  return false
}

export function mapRawScoreToLevel(score: number): CrowdLevel {
  if (score <= SCORE_THRESHOLDS.lowMax) return "low"
  if (score <= SCORE_THRESHOLDS.mediumMax) return "medium"
  return "high"
}
