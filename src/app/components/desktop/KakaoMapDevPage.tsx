import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'

import { useI18n } from '../../i18n/I18nContext'
import { localeToTourApiLang } from '../../i18n/tourLang'
import { extractTourItemsFromKorServiceData, fetchTourAreaKorService } from '../../lib/tour/tourApiClient'
import { normalizeTourItem } from '../../lib/tour/normalizeTourItem'
import { markersFromNormalizedPlaces } from '../../lib/tour/tourMapMarkers'
import { KakaoTourPlacesMap } from '../map/KakaoTourPlacesMap'

import { DEFAULT_BUSAN_LAT, DEFAULT_BUSAN_LNG } from '../map/KakaoMapView'

/**
 * 실제 TourAPI(KorWith areaBasedList2) 목록 + 카카오맵 마커 스모크 (데스크톱)
 */
export function KakaoMapDevPage() {
  const navigate = useNavigate()
  const { locale } = useI18n()

  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [rawItems, setRawItems] = useState<Record<string, unknown>[]>([])

  useEffect(() => {
    const ac = new AbortController()
    setLoading(true)
    setFetchError(null)

    const lang = localeToTourApiLang(locale)

    fetchTourAreaKorService({
      areaCode: '6',
      numOfRows: '50',
      pageNo: '1',
      ...(lang != null ? { lang } : {}),
      signal: ac.signal,
    })
      .then((env) => {
        setRawItems(extractTourItemsFromKorServiceData(env.data))
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[KakaoMapDevPage] TourAPI /api/tour/area OK · lang=', env.lang)
        }
      })
      .catch((e: unknown) => {
        if (e instanceof Error && e.name === 'AbortError') return
        const msg =
          e instanceof Error
            ? e.message
            : typeof e === 'object' && e !== null && 'message' in e
              ? String((e as { message: unknown }).message)
              : '요청 실패'
        setFetchError(msg)
        setRawItems([])
      })
      .finally(() => {
        setLoading(false)
      })

    return () => ac.abort()
  }, [locale])

  const normalizedPlaces = useMemo(
    () =>
      rawItems.map((item) =>
        normalizeTourItem(item as Record<string, unknown>, {
          uiLocale: locale,
          apiLang: localeToTourApiLang(locale),
        }),
      ),
    [rawItems, locale],
  )

  const markers = useMemo(
    () => markersFromNormalizedPlaces(normalizedPlaces, 'live'),
    [normalizedPlaces],
  )

  const hasItems = rawItems.length > 0
  const noCoordinatePlaces = hasItems && markers.length === 0 && !loading && !fetchError

  return (
    <div
      style={{
        minHeight: 'calc(100dvh - 62px)',
        padding: '24px 40px 40px',
        maxWidth: 960,
        margin: '0 auto',
        fontFamily: "'Noto Sans KR', sans-serif",
      }}
    >
      <button
        type="button"
        onClick={() => navigate('/desktop/results')}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          marginBottom: 16,
          border: 'none',
          background: '#F6F7FB',
          borderRadius: 8,
          padding: '8px 14px',
          cursor: 'pointer',
          color: '#6B6B88',
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        ← 결과로
      </button>

      <h1
        style={{
          fontSize: 22,
          fontWeight: 800,
          color: '#1A1B2E',
          margin: '0 0 8px',
          letterSpacing: -0.5,
        }}
      >
        카카오맵 · TourAPI 마커
      </h1>
      <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B6B88', lineHeight: 1.55 }}>
        부산 지역(areaCode=6){' '}
        <code style={{ fontSize: 12 }}>GET /api/tour/area</code> (KorService2 areaBasedList2) 실데이터 → 정규화 좌표 → 마커.
        기본 중심(마커 없음): ({DEFAULT_BUSAN_LAT.toFixed(4)}, {DEFAULT_BUSAN_LNG.toFixed(4)}).
      </p>

      {loading ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#5B54D6', fontWeight: 600 }}>
          관광지 목록을 불러오는 중…
        </p>
      ) : null}

      {fetchError ? (
        <p
          role="alert"
          style={{
            margin: '0 0 12px',
            fontSize: 13,
            color: '#B42318',
            fontWeight: 600,
            lineHeight: 1.5,
          }}
        >
          관광지 데이터를 불러오지 못했습니다. ({fetchError})
        </p>
      ) : null}

      {noCoordinatePlaces ? (
        <p style={{ margin: '0 0 12px', fontSize: 13, color: '#6B6B88', lineHeight: 1.5 }}>
          표시할 장소 좌표가 없습니다. 응답에 mapx/mapy가 없거나 형식이 맞지 않을 수 있습니다.
        </p>
      ) : null}

      <div style={{ height: 420, width: '100%' }}>
        <KakaoTourPlacesMap markers={markers} style={{ height: '100%', minHeight: 420 }} />
      </div>

      {!loading && !fetchError && hasItems ? (
        <p style={{ margin: '16px 0 0', fontSize: 12, color: '#9A9CB0' }}>
          목록 {rawItems.length}건 · 지도 마커 {markers.length}건 (유효 좌표만 표시)
        </p>
      ) : null}
    </div>
  )
}
