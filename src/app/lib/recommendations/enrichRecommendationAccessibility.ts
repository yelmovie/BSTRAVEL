import type { NormalizedRecommendation } from "./recommendationModel"
import { mapPlacesWithAccessibility } from "../tour/accessibilityScore"

/**
 * 정렬된 목록에 대해 이전 장소 좌표·유형으로 점수·근거·후보 여부 채움.
 * 내부적으로 `mapPlacesWithAccessibility`와 동일 패턴 (`accessibilityReason` = 스니펫의 `accessibilityReasons`).
 */
export function enrichRecommendationsWithAccessibilityScores(
  items: NormalizedRecommendation[],
): NormalizedRecommendation[] {
  return mapPlacesWithAccessibility(items as Record<string, unknown>[]) as NormalizedRecommendation[]
}

/** 세션 등 단건 로드 시 (이전 장소 없음 → 거리 가점 없음) */
export function enrichSingleRecommendationAccessibility(
  item: NormalizedRecommendation,
): NormalizedRecommendation {
  return mapPlacesWithAccessibility([item as Record<string, unknown>])[0] as NormalizedRecommendation
}
