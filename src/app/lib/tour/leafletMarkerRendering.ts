/**
 * 추천 지도 — Leaflet divIcon 바인딩 및 팝업 HTML
 */

import type { TourMapMarkerPlace } from "./tourMapMarkers"
import { buildLeafletMarkerDivIcon, getMarkerVariant, markerLabelKo } from "../map/markerVariant"

export function markerOrderIndex(place: TourMapMarkerPlace): number {
  return place.courseOrder ?? 1
}

export function buildMarkerLeafletIcon(
  place: TourMapMarkerPlace,
  loopIndex: number,
  selectedPlaceId: string | null,
  L: typeof import("leaflet"),
): import("leaflet").DivIcon {
  const variant = getMarkerVariant(
    {
      id: place.id,
      markerCategory: place.markerCategory,
      isAccessibleHighlight: place.isAccessibleHighlight,
      courseOrder: place.courseOrder,
    },
    loopIndex,
    selectedPlaceId,
  )
  return buildLeafletMarkerDivIcon(variant, L, {
    muted: place.source === "simulation",
  })
}

export function buildMarkerPopupHtml(place: TourMapMarkerPlace): string {
  const title = escapeHtml(place.title.trim() || "이름 없음")
  const categoryLabel = escapeHtml(markerLabelKo(place.markerCategory))

  return `
<div class="map-popup" style="font-family:'Noto Sans KR',sans-serif;min-width:140px;max-width:220px;line-height:1.45;">
  <strong style="font-size:13px;color:#1A1B2E;">${title}</strong><br/>
  <span style="font-size:11px;color:#6B6B88;">${categoryLabel}</span>
</div>`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}
