import type { SuitabilityLabel } from './companionFilterTypes'

/**
 * 점수·하드 제외·핵심 정보 공백을 종합해 배지 라벨만 결정 (문구 단정과 분리)
 */
export function getSuitabilityLabel(params: {
  hardExcluded: boolean
  score: number
  hasAnyActiveFilter: boolean
  strollerUnknownButRequired: boolean
  /** 휠체어 동행을 켰는데 안내 텍스트에 휠체어 관련 힌트가 없음 */
  wheelchairRequiredWithoutTextHint: boolean
}): SuitabilityLabel {
  if (params.hardExcluded) return 'insufficient_info'
  if (!params.hasAnyActiveFilter) return 'recommended'

  if (params.strollerUnknownButRequired) return 'insufficient_info'

  if (params.wheelchairRequiredWithoutTextHint && params.score < 24) return 'insufficient_info'

  if (params.wheelchairRequiredWithoutTextHint) return 'partial_match'

  if (params.score >= 46) return 'recommended'
  if (params.score >= 22) return 'partial_match'
  return 'insufficient_info'
}
