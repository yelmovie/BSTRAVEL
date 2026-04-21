import type { CompanionFilterState, TourAccessibilityFlags } from './companionFilterTypes'
import type { NormalizedTourPlace } from './tourTypes'
import { COMPANION_SCORE_WEIGHTS } from './companionFilterConfig'
import { getSuitabilityLabel } from './getSuitabilityLabel'
import { getCautionNotes } from './getCautionNotes'
import type { RankedTourPlace } from './companionFilterTypes'
import { hasAnyCompanionFilter } from './companionFilterConfig'

export type ScoreBreakdown = {
  score: number
  reasons: string[]
  hardExcluded: boolean
  hardExcludeReason: string | null
  strollerUnknownButRequired: boolean
  wheelchairRequiredWithoutTextHint: boolean
}

const INF = '[추론] '

function hasNegativeWheelchairSignal(text: string): boolean {
  const t = text.toLowerCase()
  return (
    /휠체어\s*입장\s*불가|휠체어\s*불가|휠체어\s*이용\s*불가|휠체어\s*불편|wheelchair\s*not\s*allowed/.test(t) ||
    false
  )
}

/**
 * A: 하드 필터(명시적 불가·좌표 없음 등) + B: 소프트 점수 + 라벨 입력값
 */
export function scoreTourPlaceForGroup(
  place: NormalizedTourPlace,
  flags: TourAccessibilityFlags,
  filter: CompanionFilterState,
): ScoreBreakdown {
  let score = 0
  const reasons: string[] = []
  let hardExcluded = false
  let hardExcludeReason: string | null = null

  const textBlob = [flags.expguideRaw, place.overview, place.accessibleInfo].filter(Boolean).join('\n')
  const active = hasAnyCompanionFilter(filter)

  if (active && !place.hasValidCoordinates) {
    hardExcluded = true
    hardExcludeReason = '선택한 동행 조건으로 볼 때 지도·동선 비교를 위해 좌표가 필요한데, 응답에 유효 좌표가 없습니다.'
  }

  if (active && filter.strollerFriendly && flags.strollerFromKorWith === 'no') {
    hardExcluded = true
    hardExcludeReason = '유모차 관련 공식 안내 문구상 이용이 어렵다고 표시된 장소입니다.'
  }

  if (active && filter.wheelchairFriendly && textBlob && hasNegativeWheelchairSignal(textBlob)) {
    hardExcluded = true
    hardExcludeReason = '안내 텍스트에 휠체어 이용 제한으로 읽히는 표현이 포함되어 있습니다. (문구 기반)'
  }

  if (hardExcluded) {
    return {
      score: 0,
      reasons: [hardExcludeReason || '제외됨'],
      hardExcluded: true,
      hardExcludeReason,
      strollerUnknownButRequired: false,
      wheelchairRequiredWithoutTextHint: false,
    }
  }

  const strollerUnknownButRequired = Boolean(filter.strollerFriendly && flags.strollerFromKorWith === 'unknown')
  const wheelchairRequiredWithoutTextHint = Boolean(filter.wheelchairFriendly && !flags.wheelchairHintFromText)

  if (flags.strollerFromKorWith === 'yes') {
    score += COMPANION_SCORE_WEIGHTS.strollerConfirmedYes
    reasons.push('유모차: 관광공사 응답 필드(chkcbcnvn) 문구상 이용 가능으로 확인됨.')
  } else if (flags.strollerFromKorWith === 'partial') {
    score += COMPANION_SCORE_WEIGHTS.perActiveConditionPartial + 4
    reasons.push('유모차: 안내 문구가 조건부·부분 허용 형태로 확인됨. 방문 전 확인 권장.')
  } else if (flags.strollerFromKorWith === 'unknown') {
    score += COMPANION_SCORE_WEIGHTS.strollerUnknownPenalty
    if (filter.strollerFriendly) reasons.push('유모차: 전용 필드 값이 비어 있거나 해석이 어려워 공식 정보가 부족합니다.')
  }

  if (flags.wheelchairHintFromText) {
    score += COMPANION_SCORE_WEIGHTS.wheelchairTextHintInference
    reasons.push(`${INF}안내 텍스트에 휠체어·경사로·승강 설비 등과 연관될 수 있는 표현이 포함됨. 실제 동선은 현장 확인이 필요합니다.`)
  }

  if (flags.lowMobilityHintFromText && filter.seniorFriendly) {
    score += COMPANION_SCORE_WEIGHTS.seniorMobilityHintInference
    reasons.push(`${INF}노약자 동행 시 참고할 만한 보행·휴게 관련 표현이 일부 확인됨.`)
  }

  if (flags.familyOrChildHintFromText && filter.childFriendly) {
    score += COMPANION_SCORE_WEIGHTS.childFamilyHintInference
    reasons.push(`${INF}유아·가족 동반과 연관될 수 있는 키워드가 안내에 포함됨.`)
  }

  if (flags.indoorHintFromText && filter.indoorPreferred) {
    score += COMPANION_SCORE_WEIGHTS.indoorHintInference
    reasons.push(`${INF}실내·전시 시설과 연관될 수 있는 표현이 안내에 포함됨.`)
  }

  if (flags.parkingHintFromText && filter.parkingNeeded) {
    score += COMPANION_SCORE_WEIGHTS.parkingHintInference
    reasons.push(`${INF}주차 관련 표현이 안내 텍스트에서 확인됨.`)
  }

  if (flags.restroomHintFromText && filter.restroomImportant) {
    score += COMPANION_SCORE_WEIGHTS.restroomHintInference
    reasons.push(`${INF}화장실·수유 등과 연관될 수 있는 표현이 안내에 포함됨.`)
  }

  if (place.overview.length >= 120) {
    score += COMPANION_SCORE_WEIGHTS.richOverviewBonus
    reasons.push('소개 개요 문구가 비교적 길어, 동행 조건을 검토할 참고 자료가 있습니다.')
  }
  if (place.tel) {
    score += COMPANION_SCORE_WEIGHTS.hasTelBonus
    reasons.push('문의용 전화번호가 있어 현장·운영 확인이 비교적 수월할 수 있습니다.')
  }
  if (!place.missingOriginalImage) {
    score += COMPANION_SCORE_WEIGHTS.hasImageBonus
  }

  if (filter.lowWalkingLoad && (flags.lowMobilityHintFromText || place.overview.length >= 80)) {
    score += COMPANION_SCORE_WEIGHTS.seniorMobilityHintInference
    reasons.push(`${INF}이동 부담 완화와 연관될 수 있는 정보나 설명이 일부 있습니다.`)
  }

  if (reasons.length === 0 && active) {
    reasons.push('선택한 조건에 대해 확인된 공식·텍스트 근거가 제한적입니다.')
  }

  return {
    score,
    reasons,
    hardExcluded: false,
    hardExcludeReason: null,
    strollerUnknownButRequired,
    wheelchairRequiredWithoutTextHint,
  }
}

export function buildRankedTourPlace(place: NormalizedTourPlace, flags: TourAccessibilityFlags, filter: CompanionFilterState): RankedTourPlace {
  const s = scoreTourPlaceForGroup(place, flags, filter)
  const hasAnyActiveFilter = hasAnyCompanionFilter(filter)
  const suitabilityLabel = getSuitabilityLabel({
    hardExcluded: s.hardExcluded,
    score: s.score,
    hasAnyActiveFilter,
    strollerUnknownButRequired: s.strollerUnknownButRequired,
    wheelchairRequiredWithoutTextHint: s.wheelchairRequiredWithoutTextHint,
  })
  const cautionNotes = getCautionNotes(flags, filter)

  return {
    ...place,
    accessibilityFlags: flags,
    suitabilityScore: s.score,
    suitabilityReasons: s.reasons,
    cautionNotes,
    suitabilityLabel,
    hardExcluded: s.hardExcluded,
    hardExcludeReason: s.hardExcludeReason,
  }
}
