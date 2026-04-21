/**
 * Leaflet 마커 variant — 카테고리 글리프·이동편한 후보 링·순번·선택 상태
 */

import type L from "leaflet"
import type { PlaceCategory } from "../recommendations/recommendationModel"

/** 지도 divIcon용 (클래스명 `.marker.${category}`) */
export type MarkerLeafletVariant = {
  category: string
  glyph: string
  isAccessible: boolean
  isSelected: boolean
  /** 코스 순번(1부터) */
  order: number
}

export type MarkerVariantInput = {
  id: string
  markerCategory?: string | null
  category?: string | null
  isAccessibleCandidate?: boolean
  isAccessibleHighlight?: boolean
  courseOrder?: number
}

function normalizeCategory(cat: string): string {
  const c = cat.trim().toLowerCase()
  if (c === "food" || c === "lodging" || c === "convenience" || c === "attraction" || c === "unknown") return c
  return "unknown"
}

function glyphForCategory(cat: string): string {
  const c = normalizeCategory(cat)
  if (c === "food") return "\u{1F374}"
  if (c === "lodging") return "\u{1F6CF}"
  if (c === "convenience") return "\u{2615}"
  return "\u{1F4CD}"
}

/**
 * 지도 마커 한 건분 스타일 정보 (Leaflet divIcon HTML 생성 시 사용)
 */
export function getMarkerVariant(
  p: MarkerVariantInput,
  index: number,
  selectedId?: string | null,
): MarkerLeafletVariant {
  const catRaw = p.markerCategory ?? p.category ?? "unknown"
  const cat = normalizeCategory(String(catRaw))
  return {
    category: cat,
    glyph: glyphForCategory(cat),
    isAccessible: Boolean(p.isAccessibleCandidate ?? p.isAccessibleHighlight),
    isSelected: selectedId != null && String(selectedId) === String(p.id),
    order: typeof p.courseOrder === "number" && p.courseOrder >= 1 ? p.courseOrder : index + 1,
  }
}

export function buildLeafletMarkerDivIcon(
  variant: MarkerLeafletVariant,
  Leaflet: typeof L,
  opts?: { muted?: boolean },
): L.DivIcon {
  const sel = variant.isSelected ? " selected" : ""
  const muted = opts?.muted ? " muted" : ""
  const html = `
    <div class="marker ${variant.category}${sel}${muted}">
      ${variant.isAccessible ? '<div class="ring"></div>' : ""}
      <div class="body">${variant.glyph}</div>
      <div class="order">${variant.order}</div>
    </div>
  `
  return Leaflet.divIcon({
    html,
    className: "marker-wrapper",
    iconSize: [36, 48],
    iconAnchor: [18, 42],
    popupAnchor: [0, -36],
  })
}

function categoryLabelKo(cat: PlaceCategory): string {
  switch (cat) {
    case "attraction":
      return "관광지"
    case "food":
      return "식사"
    case "lodging":
      return "숙박"
    case "convenience":
      return "휴식·편의"
    default:
      return "기타"
  }
}

/** 팝업·툴팁용 짧은 한글 유형 */
export function markerLabelKo(cat: PlaceCategory): string {
  return categoryLabelKo(cat)
}
