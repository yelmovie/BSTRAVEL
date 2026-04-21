'use client'

import { useEffect, useRef } from 'react'
import type { TourPlace } from '../../types/tour'

const DEFAULT = { lat: 35.1796, lng: 129.0756 }

function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

type Props = {
  places: TourPlace[]
  selectedId: string | null
  sdkReady: boolean
  onMarkerSelect: (id: string) => void
}

export function KakaoMapView({ places, selectedId, sdkReady, onMarkerSelect }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markers = useRef<kakao.maps.Marker[]>([])
  const byId = useRef<Record<string, kakao.maps.Marker>>({})
  const iw = useRef<kakao.maps.InfoWindow | null>(null)

  useEffect(() => {
    if (!sdkReady || !el.current || !window.kakao?.maps) return

    const withC = places.filter((p) => p.hasValidCoordinates && p.lat != null && p.lng != null)
    const c0 = withC[0]
    const center =
      c0 && c0.lat != null && c0.lng != null
        ? new kakao.maps.LatLng(c0.lat, c0.lng)
        : new kakao.maps.LatLng(DEFAULT.lat, DEFAULT.lng)

    if (!mapRef.current) {
      mapRef.current = new kakao.maps.Map(el.current, { center, level: 8 })
    }
    const map = mapRef.current

    for (const m of markers.current) m.setMap(null)
    markers.current = []
    byId.current = {}
    iw.current?.close()
    iw.current = new kakao.maps.InfoWindow({ removable: true })

    for (const p of places) {
      if (!p.hasValidCoordinates || p.lat == null || p.lng == null) continue
      const pos = new kakao.maps.LatLng(p.lat, p.lng)
      const mk = new kakao.maps.Marker({ position: pos, map })
      byId.current[p.id] = mk
      kakao.maps.event.addListener(mk, 'click', () => {
        onMarkerSelect(p.id)
        iw.current!.setContent(
          `<div style="padding:8px;font-size:12px;max-width:220px"><strong>${esc(p.title)}</strong><br/><span style="color:#555">${esc(p.address || '')}</span></div>`,
        )
        iw.current!.open(map, mk)
      })
      markers.current.push(mk)
    }
  }, [sdkReady, places, onMarkerSelect])

  useEffect(() => {
    const map = mapRef.current
    const w = iw.current
    if (!sdkReady || !map || !w || !selectedId) return
    const p = places.find((x) => x.id === selectedId)
    if (!p?.hasValidCoordinates || p.lat == null || p.lng == null) return
    map.panTo(new kakao.maps.LatLng(p.lat, p.lng))
    const mk = byId.current[selectedId]
    if (mk) {
      w.setContent(
        `<div style="padding:8px;font-size:12px;max-width:220px"><strong>${esc(p.title)}</strong><br/><span style="color:#555">${esc(p.address || '')}</span></div>`,
      )
      w.open(map, mk)
    }
  }, [sdkReady, selectedId, places])

  return <div ref={el} style={{ width: '100%', height: 280, borderRadius: 12, background: '#E8E9EF' }} />
}
