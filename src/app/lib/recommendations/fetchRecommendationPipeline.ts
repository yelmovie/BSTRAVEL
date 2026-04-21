/**
 * Tour 목록은 `tourApiClient` 만 경유 (`instrumentedFetch` 직접 호출 없음).
 * · `planTourFetchForBusanArea` 가 권역별로 areaBased 또는 searchKeyword 계획 → `fetchTourAreaBased` / `fetchTourSearchKeyword`
 * · 둘 다 memoizedTourGet + CACHE_TTL_MS.tourList (searchKeyword 폴백 경로 포함).
 */
import type { AppLocale } from "../../i18n/constants"
import { localeToTourApiLang } from "../../i18n/tourLang"
import { fetchTourAreaBased, fetchTourSearchKeyword } from "../tour/tourApiClient"
import { normalizeTourItem } from "../tour/normalizeTourItem"
import { finalizeTourPlacesFromTourApiOnly } from "../tour/tourPlacesTourApiOnly"
import { getBusanFallbackPlan, planTourFetchForBusanArea } from "./busanTourQuery"
import { mapNormalizedTourToRecommendation } from "./mapTourToRecommendation"
import type { NormalizedRecommendation } from "./recommendationModel"

function devPipelineLog(stage: string, data: Record<string, unknown>) {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.log(`[recommend-pipeline] ${stage}`, data)
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim()
  }
  return ""
}

function rawContentId(raw: Record<string, unknown>): string {
  return pickStr(raw, "contentid", "contentId")
}

function dedupeOrdered(items: Record<string, unknown>[]): Record<string, unknown>[] {
  const seen = new Set<string>()
  const out: Record<string, unknown>[] = []
  for (const it of items) {
    const id = rawContentId(it)
    if (!id || seen.has(id)) continue
    seen.add(id)
    out.push(it)
  }
  return out
}

/** TourAPI는 페이지당 `numOfRows`로 목록 크기 제한 — 전체 레코드를 가져오지 않습니다(Supabase 없음). */
async function loadRawItems(
  busanAreaId: string,
  lang: string | undefined,
  signal?: AbortSignal,
): Promise<{ items: Record<string, unknown>[]; usedFallback: boolean }> {
  const primary = planTourFetchForBusanArea(busanAreaId)
  const devExpandedRows = import.meta.env.DEV ? 50 : 10
  const common = {
    /** 운영은 10건 유지, DEV 회귀 검증은 50건으로 확장 */
    numOfRows: devExpandedRows,
    pageNo: 1,
    ...(lang ? { lang } : {}),
  }

  if (primary.kind === "areaBasedList2") {
    const data = await fetchTourAreaBased({
      ...primary.params,
      ...common,
      signal,
    })
    if (signal?.aborted) return { items: [], usedFallback: false }
    if (data.items.length > 0) return { items: data.items, usedFallback: false }

    const fb = getBusanFallbackPlan()
    const fbData = await fetchTourAreaBased({
      ...fb.params,
      ...common,
      signal,
    })
    return { items: fbData.items, usedFallback: true }
  }

  const kw = await fetchTourSearchKeyword({
    keyword: primary.params.keyword,
    areaCode: primary.params.areaCode,
    ...common,
    signal,
  })
  if (signal?.aborted) return { items: [], usedFallback: false }
  if (kw.items.length > 0) return { items: kw.items, usedFallback: false }

  const fb = getBusanFallbackPlan()
  const fbData = await fetchTourAreaBased({
    ...fb.params,
    ...common,
    signal,
  })
  return { items: fbData.items, usedFallback: true }
}

export type FetchRecommendationsResult = {
  items: NormalizedRecommendation[]
  fetchedAt: string
  usedFallback: boolean
}

/**
 * 부산 조건 기반 TourAPI 목록 → 정규화 · TourAPI 전용 마무리 → 카드 모델
 */
export async function fetchRecommendationsForBusan(opts: {
  busanAreaId: string
  locale: AppLocale
  signal?: AbortSignal
}): Promise<FetchRecommendationsResult> {
  const lang = localeToTourApiLang(opts.locale)

  const { items: rawItems, usedFallback } = await loadRawItems(opts.busanAreaId, lang, opts.signal)
  devPipelineLog("raw-items", {
    busanAreaId: opts.busanAreaId,
    rawCount: rawItems.length,
    usedFallback,
  })

  if (opts.signal?.aborted) {
    return { items: [], fetchedAt: new Date().toISOString(), usedFallback }
  }

  const rows = dedupeOrdered(rawItems as Record<string, unknown>[])
  devPipelineLog("dedupe", {
    before: rawItems.length,
    after: rows.length,
  })
  const fetchedAt = new Date().toISOString()

  const normalized = rows.map((r) =>
    normalizeTourItem(r, {
      uiLocale: opts.locale,
      apiLang: lang,
    }),
  )
  devPipelineLog("normalized", {
    normalizedCount: normalized.length,
  })

  const finalized = finalizeTourPlacesFromTourApiOnly(normalized, opts.locale, lang)
  const validCoordsCount = finalized.filter((p) => p.lat != null && p.lng != null).length
  devPipelineLog("coordinate-filter", {
    finalizedCount: finalized.length,
    validCoordsCount,
  })

  const items = finalized.map((p) =>
    mapNormalizedTourToRecommendation({
      place: p,
      fetchedAt,
    }),
  )
  devPipelineLog("recommendations", {
    finalCount: items.length,
  })

  return {
    items,
    fetchedAt,
    usedFallback,
  }
}
