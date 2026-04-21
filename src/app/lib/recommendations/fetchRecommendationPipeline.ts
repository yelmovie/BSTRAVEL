import type { AppLocale } from "../../i18n/constants"
import { localeToTourApiLang } from "../../i18n/tourLang"
import { fetchTourAreaBased, fetchTourSearchKeyword } from "../tour/tourApiClient"
import { normalizeTourItem } from "../tour/normalizeTourItem"
import { finalizeTourPlacesFromTourApiOnly } from "../tour/tourPlacesTourApiOnly"
import { getBusanFallbackPlan, planTourFetchForBusanArea } from "./busanTourQuery"
import { mapNormalizedTourToRecommendation } from "./mapTourToRecommendation"
import type { NormalizedRecommendation } from "./recommendationModel"

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

async function loadRawItems(
  busanAreaId: string,
  lang: string | undefined,
  signal?: AbortSignal,
): Promise<{ items: Record<string, unknown>[]; usedFallback: boolean }> {
  const primary = planTourFetchForBusanArea(busanAreaId)
  const common = {
    /** 초기 카드만 필요 — 과호출 방지를 위해 최대 10건 */
    numOfRows: 10,
    pageNo: 1,
    ...(lang ? { lang } : {}),
  }

  if (primary.kind === "areaBasedList2") {
    const data = await fetchTourAreaBased({
      ...primary.params,
      ...common,
      listYN: "Y",
      signal,
    })
    if (signal?.aborted) return { items: [], usedFallback: false }
    if (data.items.length > 0) return { items: data.items, usedFallback: false }

    const fb = getBusanFallbackPlan()
    const fbData = await fetchTourAreaBased({
      ...fb.params,
      ...common,
      listYN: "Y",
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
    listYN: "Y",
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

  if (opts.signal?.aborted) {
    return { items: [], fetchedAt: new Date().toISOString(), usedFallback }
  }

  const rows = dedupeOrdered(rawItems as Record<string, unknown>[])
  const fetchedAt = new Date().toISOString()

  const normalized = rows.map((r) =>
    normalizeTourItem(r, {
      uiLocale: opts.locale,
      apiLang: lang,
    }),
  )

  const finalized = finalizeTourPlacesFromTourApiOnly(normalized, opts.locale, lang)

  const items = finalized.map((p) =>
    mapNormalizedTourToRecommendation({
      place: p,
      fetchedAt,
    }),
  )

  return {
    items,
    fetchedAt,
    usedFallback,
  }
}
