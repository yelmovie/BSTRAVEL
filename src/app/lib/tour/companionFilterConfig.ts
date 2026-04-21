/**
 * 동행 필터 단일 기준점 — 가중치·추론용 키워드만 여기서 관리
 * (API 필드명은 지어내지 않음. 텍스트 추론은 보수적으로만 사용)
 */

import type { CompanionFilterState } from './companionFilterTypes'

export const COMPANION_SCORE_WEIGHTS = {
  /** 목록/상세에 유모차 필드가 "가능" 계열로 확인될 때 */
  strollerConfirmedYes: 28,
  strollerUnknownPenalty: -6,
  strollerExplicitNoHard: 0,
  /** [추론] 휠체어 관련 키워드가 안내 텍스트에 포함될 때 (가점만, 하드 충족으로 쓰지 않음) */
  wheelchairTextHintInference: 10,
  /** [추론] 노약자·보행 부담 완화 키워드 */
  seniorMobilityHintInference: 6,
  /** [추론] 유아·가족 키워드 */
  childFamilyHintInference: 8,
  /** [추론] 실내·전시 관련 */
  indoorHintInference: 5,
  parkingHintInference: 6,
  restroomHintInference: 6,
  /** 개요·전화 등 정보가 있으면 동행 계획 수립에 유리할 수 있음 (추론 아님, 데이터 존재) */
  richOverviewBonus: 4,
  hasTelBonus: 2,
  hasImageBonus: 2,
  /** 사용자가 요구한 조건마다 충족 시 추가 가점(확정/추론 구분은 scoreTourPlaceForGroup에서 처리) */
  perActiveConditionMet: 5,
  perActiveConditionPartial: 2,
} as const

/** [추론] 개요·유모차요약·expguide 통합 텍스트에서만 사용 */
export const INFERENCE_KEYWORD_GROUPS = {
  wheelchair: ['휠체어', 'wheelchair', '경사로', '승강기', '엘리베이터', 'elevator', '리프트'],
  seniorMobility: ['노약자', '교통약자', '보행', '평지', '짧은', '휴게', '의자'],
  familyChild: ['유아', '영유아', '가족', '키즈', '어린이', '아이', '수유', '임산부'],
  indoor: ['실내', '전시', '박물관', '미술관', '체험관'],
  parking: ['주차', '주차장', 'parking'],
  restroom: ['화장실', 'restroom', '수유실'],
} as const

export function countActiveConditions(f: CompanionFilterState): number {
  let n = 0
  if (f.seniorFriendly) n++
  if (f.strollerFriendly) n++
  if (f.wheelchairFriendly) n++
  if (f.childFriendly) n++
  if (f.parkingNeeded) n++
  if (f.indoorPreferred) n++
  if (f.lowWalkingLoad) n++
  if (f.restroomImportant) n++
  return n
}

export function hasAnyCompanionFilter(f: CompanionFilterState): boolean {
  return countActiveConditions(f) > 0
}
