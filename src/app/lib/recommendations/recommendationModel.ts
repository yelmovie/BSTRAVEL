/**
 * 추천 결과 파이프라인의 단일 소스 타입 (TourAPI 정규화 후 · 데모 Place 와 분리)
 */

export type RecommendationDataSource = "live" | "demo"

/** TourAPI 기반 추천 카드 한 건 */
export type NormalizedRecommendation = {
  id: string
  contentTypeId: string
  title: string
  address: string | null
  imageUrl: string | null
  overview: string | null
  lat: number | null
  lng: number | null
  category: string | null
  tags: string[]
  source: RecommendationDataSource
  fetchedAt: string
  /** 무장애·접근성 — API에 없으면 중립 문구 */
  accessibilityNote: string | null
  /** 목록·상세 병합 원본 (디버그·추가 매핑용, UI에 직접 노출 금지) */
  mergedRaw: Record<string, unknown>
}
