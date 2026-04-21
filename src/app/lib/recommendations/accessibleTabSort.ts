import type { NormalizedRecommendation } from "./recommendationModel"
import { deriveNumericScore } from "./liveCardDerive"

function distanceSortKey(item: NormalizedRecommendation): number {
  const d = item.routeMetrics?.distanceKm
  if (d == null || !Number.isFinite(d)) return Number.POSITIVE_INFINITY
  return d
}

/**
 * 「이동편한 곳」 탭: 점수 우선 → 거리 짧은 순 → 근거 개수 → 기존 추천 점수
 */
export function compareAccessibleTabOrder(
  a: NormalizedRecommendation,
  b: NormalizedRecommendation,
): number {
  if (b.accessibleScore !== a.accessibleScore) {
    return b.accessibleScore - a.accessibleScore
  }
  const da = distanceSortKey(a)
  const db = distanceSortKey(b)
  if (da !== db) return da - db
  const ra = (a.accessibilityReasons ?? a.accessibilityReason ?? []).length
  const rb = (b.accessibilityReasons ?? b.accessibilityReason ?? []).length
  if (rb !== ra) return rb - ra
  return deriveNumericScore(b) - deriveNumericScore(a)
}
