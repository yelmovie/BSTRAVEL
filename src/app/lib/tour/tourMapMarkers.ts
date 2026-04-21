/**
 * Leaflet 관광지 마커용 경량 모델 — NormalizedTourPlace 에서 좌표가 검증된 항목만 사용
 */
import type { NormalizedRecommendation, PlaceCategory, RecommendationPlaceKind } from '../recommendations/recommendationModel'
import { derivePlaceKind } from '../recommendations/recommendationPlaceKind'
import { mapContentTypeIdToCategory } from './accessibilityScore'
import type { NormalizedTourPlace } from './tourTypes'

export type TourMapMarkerPlace = {
  id: string
  title: string
  lat: number
  lng: number
  address: string | null
  imageUrl: string | null
  source: 'live' | 'simulation'
  placeKind: RecommendationPlaceKind
  /** 점수·마커 색·glyph (`placeKind`와 별개 — 카페→편의 보정 없음) */
  markerCategory: PlaceCategory
  /** 지도·리스트 공통 코스 순번(1부터) */
  courseOrder: number
  /** 이동편한 곳 후보(내부 점수·필드 기준, 확정 접근성 아님) */
  isAccessibleHighlight: boolean
  /** 팝업·배지용 근거 1줄 */
  accessibilityHint: string | null
}

function pickImageUrl(p: NormalizedTourPlace): string | null {
  const thumb = p.thumbnail?.trim() ?? ''
  const img = p.image?.trim() ?? ''
  const u = thumb || img
  if (!u || u.startsWith('data:image/svg')) return null
  return u
}

/** 좌표 없음·무효는 목록에서 제외 (마커를 만들지 않음) */
export function markersFromNormalizedPlaces(
  places: NormalizedTourPlace[],
  source: TourMapMarkerPlace['source'],
): TourMapMarkerPlace[] {
  const out: TourMapMarkerPlace[] = []
  let ord = 0
  for (const p of places) {
    if (!p.hasValidCoordinates || p.lat === null || p.lng === null) continue
    ord += 1
    const addr = p.address.trim()
    out.push({
      id: p.id,
      title: p.title,
      lat: p.lat,
      lng: p.lng,
      address: addr === '' ? null : addr,
      imageUrl: pickImageUrl(p),
      source,
      placeKind: derivePlaceKind({
        contentTypeId: p.contentTypeId,
        title: p.title,
        category: null,
        tags: [],
      }),
      markerCategory: mapContentTypeIdToCategory(p.contentTypeId),
      courseOrder: ord,
      isAccessibleHighlight: false,
      accessibilityHint: null,
    })
  }
  return out
}

/** 지도 경로선용 — 유효 좌표만, UI 목록 순서 유지 */
export type TourRoutePoint = {
  id: string
  title: string
  lat: number
  lng: number
  order: number
}

export function routePointsFromMarkerPlaces(places: TourMapMarkerPlace[]): TourRoutePoint[] {
  return places.map((p) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    order: p.courseOrder - 1,
  }))
}

/** 추천 카드(NormalizedRecommendation) → 마커 (좌표 없으면 제외) */
export function markersFromRecommendations(items: NormalizedRecommendation[]): TourMapMarkerPlace[] {
  const out: TourMapMarkerPlace[] = []
  let ord = 0
  for (const r of items) {
    if (r.lat === null || r.lng === null) continue
    ord += 1
    const addr = r.address?.trim() ?? ''
    const img = (r.thumbnailUrl ?? r.imageUrl)?.trim() ?? ''
    const hint =
      r.accessibilityReasons?.[0]?.trim() ?? r.accessibilityReason?.[0]?.trim() ?? null
    out.push({
      id: r.id,
      title: r.title,
      lat: r.lat,
      lng: r.lng,
      address: addr === '' ? null : addr,
      imageUrl: img === '' ? null : img,
      source: r.source === 'live' ? 'live' : 'simulation',
      placeKind: r.placeKind,
      markerCategory: r.placeCategory,
      courseOrder: ord,
      isAccessibleHighlight: r.isAccessibleCandidate,
      accessibilityHint: hint,
    })
  }
  return out
}
