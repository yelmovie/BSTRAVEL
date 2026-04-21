import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { getKakaoSdkDiagnostics, loadKakaoMapsSdk } from '../../lib/kakao/loadKakaoMapsSdk'
import { routePointsFromMarkerPlaces, type TourMapMarkerPlace } from '../../lib/tour/tourMapMarkers'
import { placeKindBadgeLabelKo } from '../../lib/recommendations/recommendationPlaceKind'

/** 부산 시청 일대 기준 시가지 뷰 */
export const DEFAULT_BUSAN_LAT = 35.1796
export const DEFAULT_BUSAN_LNG = 129.0756
export const DEFAULT_CITY_MAP_LEVEL = 8

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function pinSvgUri(fill: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40"><path fill="${fill}" d="M16 0C9 0 3 6 3 13c0 11 13 27 13 27s13-16 13-27c0-7-6-13-13-13z"/><circle cx="16" cy="13" r="5" fill="#fff"/></svg>`
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`
}

/** 목록 순서 기준 경로 역할 — 직선 연결용 데모(실제 도로 경로 아님) */
function buildMarkerInfoHtml(
  p: TourMapMarkerPlace,
  routeMeta?: { index: number; total: number },
): string {
  const badgeBg = p.source === 'live' ? '#EDF7F2' : '#F0F1F5'
  const badgeFg = p.source === 'live' ? '#3D8B7A' : '#6B6B88'
  const badgeLabel = p.source === 'live' ? '실데이터 · TourAPI' : '데모'
  const title = escapeHtml(p.title || '(제목 없음)')
  const kindKo = escapeHtml(placeKindBadgeLabelKo(p.placeKind))
  const addr =
    p.address === null
      ? ''
      : `<div style="margin-top:6px;font-size:11px;color:#6B6B88;line-height:1.35;">${escapeHtml(p.address)}</div>`

  let routeRow = ''
  if (routeMeta && routeMeta.total >= 2) {
    const { index, total } = routeMeta
    const chip =
      index === 0
        ? `<span style="display:inline-block;margin-bottom:8px;font-size:10px;font-weight:800;color:#5B54D6;background:#EEEDFA;padding:4px 9px;border-radius:8px;border:1px solid #E8E6FA;">출발</span>`
        : index === total - 1
          ? `<span style="display:inline-block;margin-bottom:8px;font-size:10px;font-weight:800;color:#5B54D6;background:#EEEDFA;padding:4px 9px;border-radius:8px;border:1px solid #E8E6FA;">도착</span>`
          : `<span style="display:inline-block;margin-bottom:8px;font-size:10px;font-weight:700;color:#6B6B88;background:#F6F7FB;padding:4px 9px;border-radius:8px;border:1px solid #ECEEF5;">경유 ${index + 1}</span>`
    routeRow = `<div>${chip}</div>`
  }

  return `
    <div style="padding:10px 12px;min-width:180px;max-width:260px;font-family:'Noto Sans KR',sans-serif;">
      <div style="display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-bottom:6px;">
        <span style="display:inline-block;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;color:${badgeFg};background:${badgeBg};">${badgeLabel}</span>
        <span style="display:inline-block;padding:2px 7px;border-radius:6px;font-size:10px;font-weight:700;color:#5B54D6;background:#F6F5FF;border:1px solid #E8E6FA;">${kindKo}</span>
      </div>
      ${routeRow}
      <div style="font-size:13px;font-weight:700;color:#1A1B2E;line-height:1.35;">${title}</div>
      ${addr}
    </div>
  `
}

let pinImages: { def: kakao.maps.MarkerImage; sel: kakao.maps.MarkerImage } | null = null

function ensurePinImages(): { def: kakao.maps.MarkerImage; sel: kakao.maps.MarkerImage } {
  if (!pinImages) {
    pinImages = {
      def: new kakao.maps.MarkerImage(
        pinSvgUri('#9EA0B8'),
        new kakao.maps.Size(30, 38),
      ),
      sel: new kakao.maps.MarkerImage(
        pinSvgUri('#5B54D6'),
        new kakao.maps.Size(34, 42),
      ),
    }
  }
  return pinImages
}

export type KakaoMapViewProps = {
  lat?: number
  lng?: number
  level?: number
  /**
   * 전달 시 마커 모드 — 정규화된 장소 목록 (`TourMapMarkerPlace`).
   * 생략 시에는 lat/lng/level 만 반영되는 단순 중심 지도입니다.
   */
  places?: TourMapMarkerPlace[]
  selectedPlaceId?: string | null
  /** 마커 클릭 시 목록·추천 카드와 동기화 */
  onMarkerSelect?: (placeId: string) => void
  className?: string
  style?: CSSProperties
}

export function KakaoMapView({
  lat = DEFAULT_BUSAN_LAT,
  lng = DEFAULT_BUSAN_LNG,
  level = DEFAULT_CITY_MAP_LEVEL,
  places: placesProp,
  selectedPlaceId = null,
  onMarkerSelect,
  className,
  style,
}: KakaoMapViewProps) {
  const markerMode = placesProp !== undefined
  const places = placesProp ?? []

  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<kakao.maps.Map | null>(null)
  const markerObjsRef = useRef<kakao.maps.Marker[]>([])
  const markerByIdRef = useRef<Map<string, kakao.maps.Marker>>(new Map())
  const polylineRef = useRef<kakao.maps.Polyline | null>(null)
  const infoWindowRef = useRef<kakao.maps.InfoWindow | null>(null)

  const propsRef = useRef({ lat, lng, level })
  propsRef.current = { lat, lng, level }

  const [fatalErrorMessage, setFatalErrorMessage] = useState<string | null>(null)
  const [, setDiagnosticVersion] = useState(0)
  const [mapReady, setMapReady] = useState(false)

  const markersLayoutKey = places
    .map((m) =>
      `${m.id}|${m.lat}|${m.lng}|${m.title}|${m.address ?? ''}|${m.source}|${m.placeKind}|${m.courseOrder}|${m.isAccessibleHighlight ? 1 : 0}|${m.accessibilityHint ?? ''}`,
    )
    .join('¦')

  const markerFrameKey = `${markersLayoutKey}¦sel:${selectedPlaceId ?? '∅'}`

  /** 단순 모드: 지도 초기화 */
  useEffect(() => {
    if (markerMode) return

    let cancelled = false

    ;(async () => {
      try {
        await loadKakaoMapsSdk()
      } catch (e) {
        if (!cancelled) {
          setFatalErrorMessage(e instanceof Error ? e.message : '지도를 불러오지 못했습니다')
          setDiagnosticVersion((v) => v + 1)
        }
        return
      }

      const el = containerRef.current
      if (!el) {
        if (!cancelled) setFatalErrorMessage('지도 컨테이너를 찾지 못했습니다')
        return
      }

      try {
        const { lat: la, lng: ln, level: lv } = propsRef.current
        mapRef.current = new kakao.maps.Map(el, {
          center: new kakao.maps.LatLng(la, ln),
          level: lv,
        })
        mapRef.current.relayout()
        if (!cancelled) setFatalErrorMessage(null)
      } catch (e) {
        if (!cancelled) setFatalErrorMessage(e instanceof Error ? e.message : '지도를 불러오지 못했습니다')
      }
    })()

    return () => {
      cancelled = true
      mapRef.current = null
      const el = containerRef.current
      if (el) el.innerHTML = ''
    }
  }, [markerMode])

  /** 단순 모드: 중심·레벨 동기화 */
  useEffect(() => {
    if (markerMode) return
    const map = mapRef.current
    if (!map) return
    try {
      map.setCenter(new kakao.maps.LatLng(lat, lng))
      map.setLevel(level)
      map.relayout()
    } catch (e) {
      setFatalErrorMessage(e instanceof Error ? e.message : '지도를 불러오지 못했습니다')
    }
  }, [markerMode, lat, lng, level])

  /** 마커 모드: 지도 + 인포 초기화 */
  useEffect(() => {
    if (!markerMode) return

    let cancelled = false

    ;(async () => {
      try {
        await loadKakaoMapsSdk()
      } catch (e) {
        if (!cancelled) {
          setFatalErrorMessage(e instanceof Error ? e.message : '지도를 불러오지 못했습니다')
          setDiagnosticVersion((v) => v + 1)
        }
        return
      }

      const el = containerRef.current
      if (!el || cancelled) {
        if (!cancelled && !el) setFatalErrorMessage('지도 컨테이너를 찾지 못했습니다')
        return
      }

      try {
        mapRef.current = new kakao.maps.Map(el, {
          center: new kakao.maps.LatLng(DEFAULT_BUSAN_LAT, DEFAULT_BUSAN_LNG),
          level: DEFAULT_CITY_MAP_LEVEL,
        })
        mapRef.current.relayout()
        infoWindowRef.current = new kakao.maps.InfoWindow({ removable: true })
        ensurePinImages()
        if (!cancelled) {
          setFatalErrorMessage(null)
          setMapReady(true)
        }
      } catch (e) {
        if (!cancelled) setFatalErrorMessage(e instanceof Error ? e.message : '지도를 불러오지 못했습니다')
      }
    })()

    return () => {
      cancelled = true
      setMapReady(false)
      infoWindowRef.current?.close()
      infoWindowRef.current = null
      markerObjsRef.current.forEach((m) => {
        m.setMap(null)
      })
      markerObjsRef.current = []
      markerByIdRef.current.clear()
      polylineRef.current?.setMap(null)
      polylineRef.current = null
      mapRef.current = null
      const el = containerRef.current
      if (el) el.innerHTML = ''
    }
  }, [markerMode])

  /** 마커 모드: 마커 그리기·bounds·선택 포커스 */
  useEffect(() => {
    if (!markerMode) return

    const map = mapRef.current
    const iw = infoWindowRef.current
    if (!mapReady || !map || !iw || fatalErrorMessage) return

    iw.close()

    polylineRef.current?.setMap(null)
    polylineRef.current = null

    for (const mk of markerObjsRef.current) {
      mk.setMap(null)
    }
    markerObjsRef.current = []
    markerByIdRef.current.clear()

    if (places.length === 0) {
      map.setCenter(new kakao.maps.LatLng(DEFAULT_BUSAN_LAT, DEFAULT_BUSAN_LNG))
      map.setLevel(DEFAULT_CITY_MAP_LEVEL)
      map.relayout()
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[KakaoMapView] marker count: 0 (empty places[])')
        // eslint-disable-next-line no-console
        console.log('[KakaoMapView] polyline: skipped (no places)')
      }
      return
    }

    const pins = ensurePinImages()
    const totalPts = places.length

    places.forEach((p, index) => {
      const pos = new kakao.maps.LatLng(p.lat, p.lng)
      const isSel = selectedPlaceId === p.id
      const marker = new kakao.maps.Marker({
        position: pos,
        map,
        image: isSel ? pins.sel : pins.def,
      })
      markerObjsRef.current.push(marker)
      markerByIdRef.current.set(p.id, marker)
      kakao.maps.event.addListener(marker, 'click', () => {
        onMarkerSelect?.(p.id)
        iw.setContent(buildMarkerInfoHtml(p, { index, total: totalPts }))
        iw.open(map, marker)
      })
    })

    if (places.length >= 2) {
      const path = places.map((pt) => new kakao.maps.LatLng(pt.lat, pt.lng))
      polylineRef.current = new kakao.maps.Polyline({
        path,
        strokeWeight: 4,
        strokeColor: '#5B54D6',
        strokeOpacity: 0.72,
        strokeStyle: 'solid',
        map,
      })
      if (import.meta.env.DEV) {
        const rp = routePointsFromMarkerPlaces(places)
        // eslint-disable-next-line no-console
        console.log('[KakaoMapView] polyline: rendered · route points:', rp.length, rp.map((x) => `${x.order}:${x.id}`).join(' → '))
      }
    } else if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log('[KakaoMapView] polyline: skipped (need ≥2 points, got', places.length, ')')
    }

    const selPlace =
      selectedPlaceId != null ? places.find((m) => m.id === selectedPlaceId) : undefined
    const selMarker = selPlace ? markerByIdRef.current.get(selPlace.id) : undefined
    const selIdx = selPlace ? places.findIndex((m) => m.id === selPlace.id) : -1

    if (selPlace && selMarker) {
      map.panTo(new kakao.maps.LatLng(selPlace.lat, selPlace.lng))
      map.setLevel(5)
      iw.setContent(
        buildMarkerInfoHtml(
          selPlace,
          selIdx >= 0 && totalPts >= 2 ? { index: selIdx, total: totalPts } : undefined,
        ),
      )
      iw.open(map, selMarker)
    } else {
      const bounds = new kakao.maps.LatLngBounds()
      for (const p of places) {
        bounds.extend(new kakao.maps.LatLng(p.lat, p.lng))
      }
      map.setBounds(bounds)
    }

    map.relayout()

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log(
        '[KakaoMapView] marker count:',
        places.length,
        '| selected:',
        selectedPlaceId ?? '—',
      )
    }
  }, [markerMode, markerFrameKey, mapReady, fatalErrorMessage, onMarkerSelect])

  const showEmptyPlacesHint =
    markerMode && places.length === 0 && mapReady && !fatalErrorMessage

  const diagnosticUrl =
    import.meta.env.DEV
      ? (window as Window & { __BSTRAVEL_KAKAO_SDK_URL__?: string }).__BSTRAVEL_KAKAO_SDK_URL__
      : undefined
  const diagnostics = import.meta.env.DEV ? getKakaoSdkDiagnostics() : null

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
        aria-hidden={Boolean(fatalErrorMessage)}
      />
      {fatalErrorMessage ? (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            background: '#F6F7FB',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 14,
            color: '#6B6B88',
            textAlign: 'center',
            lineHeight: 1.5,
          }}
        >
          <div>
            <div>지도를 불러오지 못했습니다</div>
            <div style={{ marginTop: 8 }}>{fatalErrorMessage}</div>
            <div style={{ marginTop: 10 }}>
              Kakao 지도 스크립트 요청이 차단되었을 수 있습니다.
              <br />
              브라우저 확장 프로그램, 추적 방지 기능, 보안 프로그램, 네트워크 차단, 또는 카카오 JavaScript 키/도메인 등록을 확인하세요.
            </div>
            {import.meta.env.DEV && diagnosticUrl ? (
              <>
                <div
                  style={{
                    marginTop: 12,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#FFFFFF',
                    border: '1px solid #E4E6EF',
                    fontSize: 12,
                    color: '#6B6B88',
                    textAlign: 'left',
                    lineHeight: 1.6,
                    wordBreak: 'break-all',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#1A1B2E', marginBottom: 6 }}>개발 진단</div>
                  <div>key detected: {diagnostics?.keyDetected ? 'yes' : 'no'}</div>
                  <div>sdk request url: {diagnostics?.maskedUrl ?? diagnosticUrl}</div>
                  <div>script load event: {diagnostics?.lastScriptEvent ?? 'idle'}</div>
                  <div>existing script tag: {diagnostics?.existingScriptTag ? 'yes' : 'no'}</div>
                  <div>window.kakao: {diagnostics?.windowKakaoExists ? 'yes' : 'no'}</div>
                  <div>window.kakao.maps: {diagnostics?.windowKakaoMapsExists ? 'yes' : 'no'}</div>
                </div>
                <div
                  style={{
                    marginTop: 10,
                    padding: '10px 12px',
                    borderRadius: 10,
                    background: '#FFFDF6',
                    border: '1px solid #F2E3B6',
                    fontSize: 12,
                    color: '#7A5D00',
                    textAlign: 'left',
                    lineHeight: 1.55,
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>개발 모드 점검 체크리스트</div>
                  <div>- 시크릿 모드에서 테스트</div>
                  <div>- 광고 차단/보안 확장 프로그램 끄기</div>
                  <div>- 다른 브라우저에서 테스트</div>
                  <div>- 다른 네트워크(예: 휴대폰 핫스팟)에서 테스트</div>
                  <div>- 카카오 개발자 콘솔에 `http://localhost:5173` 등록 확인</div>
                  <div>- JavaScript 키 사용 여부 확인</div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
      {showEmptyPlacesHint ? (
        <div
          role="status"
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            right: 12,
            padding: '10px 12px',
            borderRadius: 10,
            background: 'rgba(255,255,255,0.94)',
            border: '1px solid #E4E6EF',
            fontFamily: "'Noto Sans KR', sans-serif",
            fontSize: 12,
            color: '#6B6B88',
            textAlign: 'center',
            pointerEvents: 'none',
          }}
        >
          표시할 장소가 없습니다
        </div>
      ) : null}
    </div>
  )
}
