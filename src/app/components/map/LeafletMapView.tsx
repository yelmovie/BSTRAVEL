import { useEffect, useMemo, useRef, type CSSProperties } from 'react'

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

import { MAP_MARKER_CLASSIFICATION_FOOTNOTE_KO } from '../../lib/copy/trustMessaging'
import { routePointsFromMarkerPlaces, type TourMapMarkerPlace } from '../../lib/tour/tourMapMarkers'
import { buildMarkerLeafletIcon, buildMarkerPopupHtml } from '../../lib/tour/leafletMarkerRendering'

export const DEFAULT_BUSAN_LAT = 35.1796
export const DEFAULT_BUSAN_LNG = 129.0756
export const DEFAULT_LEAFLET_ZOOM = 13
const LEAFLET_TILE_FALLBACK =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 256 256">
      <rect width="256" height="256" fill="#ECEFF6"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9CA0B3" font-family="Noto Sans KR, sans-serif" font-size="14">Map tile error</text>
    </svg>`,
  )

export type LeafletMapViewProps = {
  lat?: number
  lng?: number
  level?: number
  places?: TourMapMarkerPlace[]
  selectedPlaceId?: string | null
  onMarkerSelect?: (placeId: string) => void
  statusMessage?: string | null
  className?: string
  style?: CSSProperties
}

export function LeafletMapView({
  lat = DEFAULT_BUSAN_LAT,
  lng = DEFAULT_BUSAN_LNG,
  level = DEFAULT_LEAFLET_ZOOM,
  places: placesProp,
  selectedPlaceId = null,
  onMarkerSelect,
  statusMessage = null,
  className,
  style,
}: LeafletMapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const polylineRef = useRef<L.Polyline | null>(null)

  const markerMode = placesProp !== undefined
  const places = useMemo(() => placesProp ?? [], [placesProp])

  useEffect(() => {
    const el = containerRef.current
    if (!el || mapRef.current) return

    const map = L.map(el, {
      zoomControl: true,
      attributionControl: true,
    }).setView([lat, lng], level)

    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      errorTileUrl: LEAFLET_TILE_FALLBACK,
    }).addTo(map)
    if (import.meta.env.DEV) {
      let warnedTileError = false
      tileLayer.on('tileerror', (evt) => {
        if (warnedTileError) return
        warnedTileError = true
        // eslint-disable-next-line no-console
        console.warn('[LeafletMapView] tile load failed; fallback tile applied', evt)
      })
    }

    mapRef.current = map
    window.setTimeout(() => map.invalidateSize(), 0)

    return () => {
      polylineRef.current?.remove()
      polylineRef.current = null
      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []
      map.remove()
      mapRef.current = null
    }
  }, [lat, lng, level])

  useEffect(() => {
    if (markerMode) return
    const map = mapRef.current
    if (!map) return
    map.setView([lat, lng], level)
    map.invalidateSize()
  }, [markerMode, lat, lng, level])

  useEffect(() => {
    if (!markerMode) return
    const map = mapRef.current
    if (!map) return

    markersRef.current.forEach((m) => m.remove())
    markersRef.current = []
    polylineRef.current?.remove()
    polylineRef.current = null

    if (places.length === 0) {
      map.setView([DEFAULT_BUSAN_LAT, DEFAULT_BUSAN_LNG], DEFAULT_LEAFLET_ZOOM)
      map.invalidateSize()
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.warn('[LeafletMapView] marker count: 0 (empty places[])')
        // eslint-disable-next-line no-console
        console.warn('[LeafletMapView] polyline: skipped (no places)')
      }
      return
    }

    const latlngs: L.LatLngExpression[] = []

    for (let idx = 0; idx < places.length; idx++) {
      const place = places[idx]
      if (place.lat == null || place.lng == null) continue

      const selected = String(place.id) === String(selectedPlaceId ?? "")
      const marker = L.marker([place.lat, place.lng], {
        icon: buildMarkerLeafletIcon(place, idx, selectedPlaceId, L),
        zIndexOffset: selected ? 9500 : 400 + idx,
      })
        .addTo(map)
        .bindPopup(buildMarkerPopupHtml(place))

      marker.on('click', () => {
        onMarkerSelect?.(place.id)
      })

      markersRef.current.push(marker)
      latlngs.push([place.lat, place.lng])
    }

    if (latlngs.length > 1) {
      polylineRef.current = L.polyline(latlngs, {
        color: '#5B54D6',
        weight: 4,
        opacity: 0.72,
      }).addTo(map)
      if (import.meta.env.DEV) {
        const rp = routePointsFromMarkerPlaces(places)
        // eslint-disable-next-line no-console
        console.log('[LeafletMapView] polyline: rendered · route points:', rp.length, rp.map((x) => `${x.order}:${x.id}`).join(' → '))
      }
    } else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[LeafletMapView] polyline: skipped (need >=2 points, got', latlngs.length, ')')
    }

    const selected = selectedPlaceId != null
      ? places.find(
          (p) => String(p.id) === String(selectedPlaceId) && p.lat != null && p.lng != null,
        )
      : undefined

    if (selected) {
      map.setView([selected.lat, selected.lng], 15)
      const withCoords = places.filter((p) => p.lat != null && p.lng != null)
      const selectedIdx = withCoords.findIndex((p) => String(p.id) === String(selectedPlaceId))
      if (selectedIdx >= 0) {
        markersRef.current[selectedIdx]?.openPopup()
      }
    } else if (latlngs.length === 1) {
      map.setView(latlngs[0], 15)
    } else if (latlngs.length > 1) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [24, 24] })
    } else {
      map.setView([DEFAULT_BUSAN_LAT, DEFAULT_BUSAN_LNG], DEFAULT_LEAFLET_ZOOM)
    }

    map.invalidateSize()

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[LeafletMapView] marker count:', markersRef.current.length, '| selected:', selectedPlaceId ?? '—')
    }
  }, [markerMode, onMarkerSelect, places, selectedPlaceId])

  const showEmptyPlacesHint = markerMode && places.length === 0
  const overlayMessage = statusMessage ?? (showEmptyPlacesHint ? '표시할 장소 좌표가 없습니다' : null)
  const showMapFootnote = markerMode && places.length > 0

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: 400,
        background: '#E8EAF2',
        borderRadius: 12,
        overflow: 'hidden',
        boxShadow: '0 4px 20px rgba(26, 27, 46, 0.08)',
        ...style,
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          minHeight: 400,
        }}
      />
      {(showMapFootnote || overlayMessage) ? (
        <div
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {showMapFootnote ? (
            <div
              style={{
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 10,
                color: '#6B6B88',
                lineHeight: 1.45,
                textAlign: 'center',
                textShadow: '0 1px 0 rgba(255,255,255,0.9)',
              }}
            >
              {MAP_MARKER_CLASSIFICATION_FOOTNOTE_KO}
            </div>
          ) : null}
          {overlayMessage ? (
            <div
              role="status"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255,255,255,0.94)',
                border: '1px solid #E4E6EF',
                fontFamily: "'Noto Sans KR', sans-serif",
                fontSize: 12,
                color: '#6B6B88',
                textAlign: 'center',
              }}
            >
              {overlayMessage}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
