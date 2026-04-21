/**
 * Recommendation model types shared across normalization + UI layers.
 */

import type { RouteMetrics } from "../tour/routeMetrics"

/** mapContentTypeId 기반 분류 · 마커·접근성 점수와 동일 */
export type PlaceCategory =
  | "attraction"
  | "food"
  | "lodging"
  | "convenience"
  | "unknown"

/** 카드 그룹·유형 뱃지용 (제목·태그까지 반영한 최종 유형) */
export type RecommendationPlaceKind =
  | "attraction"
  | "food"
  | "lodging"
  | "convenience"
  | "other"

/** TourAPI 정규화 후 추천 카드·지도·저장 공통 스냅샷 */
export interface NormalizedRecommendation {
  id: string
  contentTypeId: string
  placeKind: RecommendationPlaceKind
  title: string
  address: string | null
  /** 카드·목록용 작은 이미지 (TourAPI firstimage2 등) — 없으면 imageUrl과 동일 사용 */
  thumbnailUrl: string | null
  /** 상세·원본 이미지(TourAPI firstimage 등) */
  imageUrl: string | null
  overview: string | null
  lat: number | null
  lng: number | null
  /** 한글 유형 라벨 (예: 관광지, 음식점) */
  category: string | null
  tags: string[]
  source: string
  fetchedAt: string
  accessibilityNote: string | null

  accessibleScore: number
  /** 레거시 호환 — enrich 시 accessibilityReasons와 동일 길이로 유지 */
  accessibilityReason: string[]
  accessibilityReasons: string[]

  placeCategory: PlaceCategory
  isAccessibleCandidate: boolean

  /** 레거시 필드 — 신규 로직에서는 사용하지 않음 */
  accessibilityMetrics: unknown | null

  mergedRaw: Record<string, unknown>

  /** 직선거리·도보·차량 시간 등 — enrich 후 채움 */
  routeMetrics: RouteMetrics | null
}
