import type { CompanionFilterState, RankedTourPlace } from './companionFilterTypes'
import type { NormalizedTourPlace } from './tourTypes'
import { hasAnyCompanionFilter } from './companionFilterConfig'
import { buildAccessibilityFlags } from './buildAccessibilityFlags'
import { buildRankedTourPlace } from './scoreTourPlaceForGroup'

export type CompanionRankingResult = {
  /** 점수 내림차순(하드 제외는 뒤로) */
  ranked: RankedTourPlace[]
  /** 목록에 표시할 행 */
  forList: RankedTourPlace[]
  /** 지도 마커 대상 */
  forMap: RankedTourPlace[]
}

/**
 * 동행 필터가 꺼져 있으면 하드 제외 없이 전체를 유지하고, 점수·플래그만 계산합니다.
 * 켜져 있으면 하드 제외 항목은 목록·지도에서 뺍니다.
 */
export function rankTourPlacesForCompanion(
  places: NormalizedTourPlace[],
  filter: CompanionFilterState,
): CompanionRankingResult {
  const ranked = places.map((p) => buildRankedTourPlace(p, buildAccessibilityFlags(p), filter))
  const active = hasAnyCompanionFilter(filter)

  const sorted = active
    ? [...ranked].sort((a, b) => {
        if (a.hardExcluded !== b.hardExcluded) return a.hardExcluded ? 1 : -1
        return b.suitabilityScore - a.suitabilityScore
      })
    : ranked

  const forList = active ? sorted.filter((r) => !r.hardExcluded) : sorted
  const forMap = forList.filter((r) => r.hasValidCoordinates && r.lat !== null && r.lng !== null)

  return { ranked: sorted, forList, forMap }
}
