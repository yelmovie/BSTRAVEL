/**
 * 혼잡도 시간·날씨 가중에 쓰는 유형 (추천 placeKind와 정렬)
 */
import type { NormalizedRecommendation } from "../recommendations/recommendationModel"
import type { CrowdPlaceKind } from "./types"

export function crowdPlaceKindFromRecommendation(r: NormalizedRecommendation): CrowdPlaceKind {
  if (r.placeKind === "food") return "restaurant"
  if (r.placeKind === "lodging") return "hotel"
  return "tour"
}

/** 로컬 Place 등 문자열만 있을 때 보조 */
export function crowdPlaceKindFromHints(category?: string, title?: string): CrowdPlaceKind {
  const t = `${category ?? ""} ${title ?? ""}`
  if (/숙소|호텔|펜션|모텔|게스트|민박/i.test(t)) return "hotel"
  if (/음식|식당|맛집|카페|레스토랑/i.test(t)) return "restaurant"
  return "tour"
}
