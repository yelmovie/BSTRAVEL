/**
 * 카카오맵 마커용 경량 모델 — NormalizedTourPlace 에서 좌표가 검증된 항목만 사용
 */
import type { NormalizedRecommendation } from '../recommendations/recommendationModel'
import type { NormalizedTourPlace } from './tourTypes'

export type TourMapMarkerPlace = {
  id: string
  title: string
  lat: number
  lng: number
  address: string | null
  imageUrl: string | null
  source: 'live' | 'demo'
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
  for (const p of places) {
    if (!p.hasValidCoordinates || p.lat === null || p.lng === null) continue
    const addr = p.address.trim()
    out.push({
      id: p.id,
      title: p.title,
      lat: p.lat,
      lng: p.lng,
      address: addr === '' ? null : addr,
      imageUrl: pickImageUrl(p),
      source,
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
  return places.map((p, order) => ({
    id: p.id,
    title: p.title,
    lat: p.lat,
    lng: p.lng,
    order,
  }))
}

/** 추천 카드(NormalizedRecommendation) → 마커 (좌표 없으면 제외) */
export function markersFromRecommendations(items: NormalizedRecommendation[]): TourMapMarkerPlace[] {
  const out: TourMapMarkerPlace[] = []
  for (const r of items) {
    if (r.lat === null || r.lng === null) continue
    const addr = r.address?.trim() ?? ''
    const img = r.imageUrl?.trim() ?? ''
    out.push({
      id: r.id,
      title: r.title,
      lat: r.lat,
      lng: r.lng,
      address: addr === '' ? null : addr,
      imageUrl: img === '' ? null : img,
      source: r.source === 'live' ? 'live' : 'demo',
    })
  }
  return out
}
