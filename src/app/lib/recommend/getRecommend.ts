/**
 * 동일 조건 추천 목록 캐시 + 동시 요청 dedupe (TourAPI 호출 감소)
 */
import type { AppLocale } from "../../i18n/constants"
import { getCache, setCache } from "../cache/simpleCache"
import { CACHE_TTL_MS } from "../cache/cacheConfig"
import { devCacheLog } from "../cache/devCacheLog"
import { runDeduped } from "../cache/requestDedupe"
import { hashStringToKey } from "../cache/stringHash"
import {
  fetchRecommendationsForBusan,
  type FetchRecommendationsResult,
} from "../recommendations/fetchRecommendationPipeline"

export type RecommendProfileKey = {
  /** 여행 시간대 식별자 */
  travelTime?: string
  departureTime?: string
  /** 인원·구성 등 직렬화 */
  groupKey?: string
  companionsKey?: string
  supportKey?: string
  /** 목적 탭 등 */
  purposeKey?: string
  indoorPref?: string
  accessibilityKey?: string
}

function buildRecommendCachePayload(
  busanAreaId: string,
  locale: AppLocale,
  profile: RecommendProfileKey | undefined,
): string {
  return JSON.stringify({
    a: busanAreaId,
    l: locale,
    t: profile?.travelTime ?? "",
    d: profile?.departureTime ?? "",
    g: profile?.groupKey ?? "",
    c: profile?.companionsKey ?? "",
    s: profile?.supportKey ?? "",
    p: profile?.purposeKey ?? "",
    i: profile?.indoorPref ?? "",
    x: profile?.accessibilityKey ?? "",
  })
}

export async function getRecommendationsCached(opts: {
  busanAreaId: string
  locale: AppLocale
  signal?: AbortSignal
  profile?: RecommendProfileKey
}): Promise<FetchRecommendationsResult> {
  const payload = buildRecommendCachePayload(opts.busanAreaId, opts.locale, opts.profile)
  const cacheKey = `recommend:${hashStringToKey(payload)}`
  if (import.meta.env.DEV) {
    const payloadCompanionLog = {
      companions: opts.profile?.companionsKey ?? "",
      support: opts.profile?.supportKey ?? "",
    }
    const cacheKeyLog = {
      cacheKey,
      companions: opts.profile?.companionsKey ?? "",
      support: opts.profile?.supportKey ?? "",
    }
    // eslint-disable-next-line no-console
    console.log(`[recommend] payload companions: ${JSON.stringify(payloadCompanionLog)}`)
    // eslint-disable-next-line no-console
    console.log(`[recommend-cache] key: ${JSON.stringify(cacheKeyLog)}`)
  }

  const cached = getCache<FetchRecommendationsResult>(cacheKey)
  if (cached) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[recommend-cache] hit", { cacheKey, count: cached.items.length })
    }
    return cached
  }

  return runDeduped(cacheKey, async () => {
    const inner = getCache<FetchRecommendationsResult>(cacheKey)
    if (inner) return inner
    devCacheLog("external-fetch", "fetchRecommendationsForBusan")
    const res = await fetchRecommendationsForBusan({
      busanAreaId: opts.busanAreaId,
      locale: opts.locale,
      signal: opts.signal,
    })
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[recommend-cache] miss->set", {
        cacheKey,
        count: res.items.length,
        usedFallback: res.usedFallback,
      })
    }
    setCache(cacheKey, res, CACHE_TTL_MS.recommend)
    return res
  })
}
