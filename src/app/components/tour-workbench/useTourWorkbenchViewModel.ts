import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  fetchTourAreaBased,
  fetchTourDetailCommon,
  fetchTourHealth,
  fetchTourSearchKeyword,
} from '../../lib/tour/tourApiClient'
import { normalizeTourItem } from '../../lib/tour/normalizeTourItem'
import { applyTourContentQuality } from '../../lib/tour/inferTourContentQuality'
import { mergeDetailCommonIntoPlace } from '../../lib/tour/mergeTourDetail'
import type { NormalizedTourPlace } from '../../lib/tour/tourTypes'
import { loadKakaoMapsSdk } from '../../lib/kakao/loadKakaoMapsSdk'
import { useI18n } from '../../i18n/I18nContext'
import { localeToTourApiLang } from '../../i18n/tourLang'
import type { AppLocale } from '../../i18n/constants'
import type { CompanionFilterState, SuitabilityLabel } from '../../lib/tour/companionFilterTypes'
import { EMPTY_COMPANION_FILTERS } from '../../lib/tour/companionFilterTypes'
import { rankTourPlacesForCompanion } from '../../lib/tour/applyCompanionRanking'
import { hasAnyCompanionFilter } from '../../lib/tour/companionFilterConfig'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return ''
}

export type TourSearchMode = 'area' | 'keyword'

export function useTourWorkbenchViewModel() {
  const { locale } = useI18n()
  const apiLang = useMemo(() => localeToTourApiLang(locale), [locale])

  const [health, setHealth] = useState('확인 중…')
  const [areaCode, setAreaCode] = useState('6')
  const [searchQuery, setSearchQuery] = useState('해운대')
  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [places, setPlaces] = useState<NormalizedTourPlace[]>([])
  const [total, setTotal] = useState(0)
  const [mode, setMode] = useState<TourSearchMode>('area')

  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const [detailDataLoading, setDetailDataLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailOverview, setDetailOverview] = useState('')

  const [kakaoReady, setKakaoReady] = useState(false)
  const [kakaoError, setKakaoError] = useState<string | null>(null)

  const [filters, setFilters] = useState<CompanionFilterState>({ ...EMPTY_COMPANION_FILTERS })

  const [hasLoadedTourList, setHasLoadedTourList] = useState(false)
  const prevLocaleRef = useRef<AppLocale | null>(null)
  /** 같은 항목에 상세 API(detailCommon2) 재호출 방지 */
  const detailFetchedIdsRef = useRef(new Set<string>())

  const { ranked, forList, forMap } = useMemo(() => rankTourPlacesForCompanion(places, filters), [places, filters])

  const visiblePlaces = forList

  const suitabilityById = useMemo(() => {
    const m: Record<string, SuitabilityLabel> = {}
    for (const r of ranked) m[r.id] = r.suitabilityLabel
    return m
  }, [ranked])

  const excludedCount = useMemo(() => {
    if (!hasAnyCompanionFilter(filters)) return 0
    return ranked.filter((r) => r.hardExcluded).length
  }, [ranked, filters])

  useEffect(() => {
    if (!selectedPlaceId) return
    if (!forList.some((p) => p.id === selectedPlaceId)) {
      setSelectedPlaceId(null)
      setDetailOverview('')
      setDetailError(null)
    }
  }, [forList, selectedPlaceId])

  useEffect(() => {
    ;(async () => {
      try {
        const h = await fetchTourHealth()
        setHealth(h.hasServiceKey ? '서버에 인증키가 설정됨' : 'VISITKOREA_SERVICE_KEY 없음 (503 예상)')
      } catch {
        setHealth('헬스 확인 실패 — pnpm dev(api+vite) 및 프록시를 확인하세요')
      }
    })()
  }, [])

  useEffect(() => {
    loadKakaoMapsSdk()
      .then(() => {
        setKakaoReady(true)
        setKakaoError(null)
      })
      .catch((e) => {
        setKakaoReady(false)
        setKakaoError(e instanceof Error ? e.message : '카카오맵 SDK 로드 실패')
      })
  }, [])

  const loadArea = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    setPlaces([])
    setSelectedPlaceId(null)
    setDetailOverview('')
    setDetailError(null)
    const lang = localeToTourApiLang(locale)
    try {
      const data = await fetchTourAreaBased({
        areaCode,
        numOfRows: 10,
        pageNo: 1,
        arrange: 'C',
        ...(lang ? { lang } : {}),
      })
      setTotal(data.totalCount)
      detailFetchedIdsRef.current.clear()
      setPlaces(
        data.items.map((r) =>
          normalizeTourItem(r as Record<string, unknown>, { uiLocale: locale, apiLang: lang }),
        ),
      )
      setHasLoadedTourList(true)
      if (data.items.length === 0) setListError('검색 결과가 없습니다. 조건을 변경해 다시 확인해 주세요.')
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : '일시적으로 정보를 불러오지 못했습니다.'
      setListError(`${msg} (pnpm dev 실행 시 TourAPI 서버·프록시 확인)`)
    } finally {
      setListLoading(false)
    }
  }, [areaCode, locale])

  const loadKeyword = useCallback(async () => {
    setListLoading(true)
    setListError(null)
    setPlaces([])
    setSelectedPlaceId(null)
    setDetailOverview('')
    setDetailError(null)
    const lang = localeToTourApiLang(locale)
    try {
      const data = await fetchTourSearchKeyword({
        keyword: searchQuery.trim(),
        areaCode: areaCode || undefined,
        numOfRows: 10,
        pageNo: 1,
        ...(lang ? { lang } : {}),
      })
      setTotal(data.totalCount)
      detailFetchedIdsRef.current.clear()
      setPlaces(
        data.items.map((r) =>
          normalizeTourItem(r as Record<string, unknown>, { uiLocale: locale, apiLang: lang }),
        ),
      )
      setHasLoadedTourList(true)
      if (data.items.length === 0) setListError('검색 결과가 없습니다. 조건을 변경해 다시 확인해 주세요.')
    } catch (e) {
      const msg =
        e instanceof Error ? e.message : '일시적으로 정보를 불러오지 못했습니다.'
      setListError(`${msg} (TourAPI 서버·프록시 확인)`)
    } finally {
      setListLoading(false)
    }
  }, [areaCode, searchQuery, locale])

  const runSearch = useCallback(() => {
    void (mode === 'area' ? loadArea() : loadKeyword())
  }, [mode, loadArea, loadKeyword])

  useEffect(() => {
    const prev = prevLocaleRef.current
    prevLocaleRef.current = locale
    if (prev === null) return
    if (prev === locale) return
    if (!hasLoadedTourList) return
    void (mode === 'area' ? loadArea() : loadKeyword())
  }, [locale, hasLoadedTourList, mode, loadArea, loadKeyword])

  const fetchDetailFor = useCallback(async (place: NormalizedTourPlace) => {
    if (detailFetchedIdsRef.current.has(place.id)) {
      setDetailOverview(place.overview ?? '')
      setDetailError(null)
      setDetailDataLoading(false)
      return
    }
    setDetailDataLoading(true)
    setDetailError(null)
    setDetailOverview('')
    try {
      if (!place.contentTypeId) {
        setDetailError('contentTypeId 없음')
        return
      }
      const lang = localeToTourApiLang(locale)
      const d = await fetchTourDetailCommon({
        contentId: place.id,
        contentTypeId: place.contentTypeId,
        ...(lang ? { lang } : {}),
      })
      const item = d.item
      if (!item) {
        setDetailError('detailCommon2 응답에 item 없음')
        return
      }
      const merged = mergeDetailCommonIntoPlace(place, item as Record<string, unknown>)
      const scored = applyTourContentQuality(merged, locale, lang)
      detailFetchedIdsRef.current.add(place.id)
      setPlaces((prev) => prev.map((p) => (p.id === place.id ? scored : p)))
      setDetailOverview(pickStr(item as Record<string, unknown>, 'overview', 'Overview'))
    } catch (e) {
      setDetailError(e instanceof Error ? e.message : '오류')
    } finally {
      setDetailDataLoading(false)
    }
  }, [locale])

  const selectPlaceById = useCallback(
    (id: string) => {
      const latest = places.find((p) => p.id === id)
      if (!latest) return
      setSelectedPlaceId(latest.id)
      void fetchDetailFor(latest)
    },
    [fetchDetailFor, places],
  )

  const selectRankedPlace = useCallback(
    (p: NormalizedTourPlace) => {
      const latest = places.find((x) => x.id === p.id) ?? p
      setSelectedPlaceId(latest.id)
      void fetchDetailFor(latest)
    },
    [fetchDetailFor, places],
  )

  const onMarkerSelect = useCallback(
    (id: string) => {
      selectPlaceById(id)
    },
    [selectPlaceById],
  )

  const selectedPlace = places.find((p) => p.id === selectedPlaceId) ?? null
  const selectedRanked = ranked.find((r) => r.id === selectedPlaceId) ?? null

  return {
    health,
    kakaoReady,
    kakaoError,
    mode,
    setMode,
    areaCode,
    setAreaCode,
    searchQuery,
    setSearchQuery,
    listLoading,
    listError,
    places,
    total,
    runSearch,
    filters,
    setFilters,
    excludedCount,
    selectedPlaceId,
    selectRankedPlace,
    onMarkerSelect,
    selectedPlace,
    selectedRanked,
    detailDataLoading,
    detailError,
    detailOverview,
    visiblePlaces,
    forMap,
    suitabilityById: hasAnyCompanionFilter(filters) ? suitabilityById : undefined,
    tourApiLang: apiLang,
  }
}
