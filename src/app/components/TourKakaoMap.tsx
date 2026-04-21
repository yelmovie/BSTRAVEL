import { useEffect, useRef } from 'react'
import type { NormalizedTourPlace } from '../lib/tour/tourTypes'
import type { SuitabilityLabel } from '../lib/tour/companionFilterTypes'

/** 부산 시청 인근 기본 중심 (좌표 없는 목록만 있을 때) */
const DEFAULT_CENTER = { lat: 35.1796, lng: 129.0756 }

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

type Props = {
  sdkReady: boolean
  places: NormalizedTourPlace[]
  selectedId: string | null
  onMarkerSelect: (id: string) => void
  /** 있으면 인포윈도·zIndex에 반영 (과장 문구 없이 등급만) */
  suitabilityById?: Record<string, SuitabilityLabel>
}

const LABEL_HINT: Record<SuitabilityLabel, string> = {
  recommended: '추천',
  partial_match: '일부 조건',
  insufficient_info: '정보 부족',
}

export function TourKakaoMap({ sdkReady, places, selectedId, onMarkerSelect, suitabilityById }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markersRef = useRef<kakao.maps.Marker[]>([])
  const markerByIdRef = useRef<Record<string, kakao.maps.Marker>>({})
  const infoRef = useRef<kakao.maps.InfoWindow | null>(null)

  useEffect(() => {
    if (!sdkReady || !containerRef.current || !window.kakao?.maps) return

    if (!mapRef.current) {
      const withCoordInit = places.filter((p) => p.hasValidCoordinates && p.lat !== null && p.lng !== null)
      const first = withCoordInit[0]
      const center =
        first && first.lat !== null && first.lng !== null
          ? new kakao.maps.LatLng(first.lat, first.lng)
          : new kakao.maps.LatLng(DEFAULT_CENTER.lat, DEFAULT_CENTER.lng)
      mapRef.current = new kakao.maps.Map(containerRef.current, {
        center,
        level: 8,
      })
    }
    const map = mapRef.current

    for (const m of markersRef.current) {
      m.setMap(null)
    }
    markersRef.current = []
    markerByIdRef.current = {}
    if (infoRef.current) {
      infoRef.current.close()
    }
    infoRef.current = new kakao.maps.InfoWindow({ removable: true })

    for (const p of places) {
      if (!p.hasValidCoordinates || p.lat === null || p.lng === null) continue
      const pos = new kakao.maps.LatLng(p.lat, p.lng)
      const marker = new kakao.maps.Marker({ position: pos, map })
      const lab = suitabilityById?.[p.id]
      if (lab === 'recommended') marker.setZIndex(5)
      else if (lab === 'partial_match') marker.setZIndex(4)
      else if (lab === 'insufficient_info') marker.setZIndex(3)
      else marker.setZIndex(2)
      markerByIdRef.current[p.id] = marker
      kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerSelect(p.id)
        const hint = lab ? `<div style="margin-top:6px;font-size:10px;color:#6B6B88;">동행 필터: ${escapeHtml(LABEL_HINT[lab])}</div>` : ''
        const html = `<div style="padding:10px;max-width:240px;font-family:sans-serif;font-size:12px;line-height:1.45;">
          <strong>${escapeHtml(p.title)}</strong><br/>
          <span style="color:#555;font-size:11px;">${escapeHtml(p.address || '주소 없음')}</span>${hint}
        </div>`
        infoRef.current!.setContent(html)
        infoRef.current!.open(map, marker)
      })
      markersRef.current.push(marker)
    }
  }, [sdkReady, places, onMarkerSelect, suitabilityById])

  useEffect(() => {
    const map = mapRef.current
    const iw = infoRef.current
    if (!sdkReady || !map || !iw || !selectedId) return

    const p = places.find((x) => x.id === selectedId)
    if (!p?.hasValidCoordinates || p.lat === null || p.lng === null) return

    map.panTo(new kakao.maps.LatLng(p.lat, p.lng))
    const marker = markerByIdRef.current[selectedId]
    if (marker) {
      marker.setZIndex(30)
      const lab = suitabilityById?.[p.id]
      const hint = lab ? `<div style="margin-top:6px;font-size:10px;color:#6B6B88;">동행 필터: ${escapeHtml(LABEL_HINT[lab])}</div>` : ''
      const html = `<div style="padding:10px;max-width:240px;font-family:sans-serif;font-size:12px;line-height:1.45;">
        <strong>${escapeHtml(p.title)}</strong><br/>
        <span style="color:#555;font-size:11px;">${escapeHtml(p.address || '주소 없음')}</span>${hint}
      </div>`
      iw.setContent(html)
      iw.open(map, marker)
    }
  }, [sdkReady, selectedId, places, suitabilityById])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: 240,
        background: '#E8E9EF',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    />
  )
}
