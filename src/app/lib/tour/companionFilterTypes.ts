/**
 * 동행 조건 필터·추천 — 타입만 정의 (기준값·가중치는 companionFilterConfig.ts)
 */

import type { NormalizedTourPlace } from './tourTypes'

/** UI / URL 상태에 쓰는 사용자 조건 (한 곳에서 해석) */
export type CompanionFilterState = {
  seniorFriendly: boolean
  strollerFriendly: boolean
  wheelchairFriendly: boolean
  childFriendly: boolean
  parkingNeeded: boolean
  indoorPreferred: boolean
  lowWalkingLoad: boolean
  restroomImportant: boolean
}

export const EMPTY_COMPANION_FILTERS: CompanionFilterState = {
  seniorFriendly: false,
  strollerFriendly: false,
  wheelchairFriendly: false,
  childFriendly: false,
  parkingNeeded: false,
  indoorPreferred: false,
  lowWalkingLoad: false,
  restroomImportant: false,
}

/** KorWith 목록/상세의 유모차 등 Y/N 계열 필드 해석 (값 문자열은 API 응답 그대로 보관) */
export type KorWithTriState = 'yes' | 'no' | 'partial' | 'unknown'

/**
 * TourAPI에서 직접 읽은 근거만 `confirmed`.
 * 키워드·텍스트 기반은 `inference` (UI/문구에서 단정 금지).
 */
export type TourAccessibilityFlags = {
  strollerFieldRaw: string
  strollerFromKorWith: KorWithTriState
  petFieldRaw: string
  petFromKorWith: KorWithTriState
  expguideRaw: string
  /** 텍스트에서 휠체어·경사로 등 힌트가 있는지 (추론) */
  wheelchairHintFromText: boolean
  /** 실내·날씨 회피 등 힌트 (추론, 키워드 기준은 config) */
  indoorHintFromText: boolean
  parkingHintFromText: boolean
  restroomHintFromText: boolean
  lowMobilityHintFromText: boolean
  familyOrChildHintFromText: boolean
}

export type SuitabilityLabel = 'recommended' | 'partial_match' | 'insufficient_info'

export type RankedTourPlace = NormalizedTourPlace & {
  accessibilityFlags: TourAccessibilityFlags
  suitabilityScore: number
  /** 확정 문장 + [추론] 접두가 붙은 문장 혼합 가능 */
  suitabilityReasons: string[]
  cautionNotes: string[]
  suitabilityLabel: SuitabilityLabel
  /** 하드 필터에서 제외되었는지 (좌표 없음, 명시적 불가 등) */
  hardExcluded: boolean
  hardExcludeReason: string | null
}
