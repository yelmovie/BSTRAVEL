/** 외부 지도(카카오맵 웹) 검색 열기 — 앱 내 지도(Leaflet)와 구분 */
export function openExternalMapSearch(query: string): void {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent(query)}`, "_blank", "noopener,noreferrer")
}
