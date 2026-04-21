import type { NormalizedRecommendation } from "./recommendationModel"

/**
 * 모바일/데스크톱 공통: TourAPI 추천 상세(`TourApiPlaceDetail`)로 갈지 여부.
 * - 세션/라우트 state에 추천 항목이 있으면 실데이터 상세
 * - 숫자-only id는 TourAPI contentId로 간주 (데모 장소 slug와 충돌 방지)
 */
export function isTourApiDetailRoute(
  id: string,
  tourItem: NormalizedRecommendation | null,
): boolean {
  if (tourItem != null && tourItem.id === id) return true
  return /^\d+$/.test(id)
}
