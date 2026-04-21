/**
 * 혼잡도 일 단위 base 비율만 캐시 (시간·날씨 가중은 캐시하지 않음)
 */
import { getCache, setCache } from "../cache/simpleCache"
import { CACHE_TTL_MS } from "../cache/cacheConfig"
import { dateKeySeoul } from "../cache/geoKey"
import { computeOfficialDayBaseRatio, type CrowdResolvedInput } from "./crowdScore"

export function crowdBaseCacheKey(placeKey: string, visitDate: Date): string {
  return `crowd:${placeKey}:${dateKeySeoul(visitDate)}`
}

export function getCachedOfficialRatio(
  placeKey: string,
  visitDate: Date,
  resolve: () => number,
): number {
  const k = crowdBaseCacheKey(placeKey, visitDate)
  const hit = getCache<number>(k)
  if (hit != null && Number.isFinite(hit)) return hit
  const v = resolve()
  setCache(k, v, CACHE_TTL_MS.crowdBase)
  return v
}

export function getOfficialBaseFromProfile(resolved: CrowdResolvedInput, placeKey: string, visitDate: Date): number {
  return getCachedOfficialRatio(placeKey, visitDate, () => computeOfficialDayBaseRatio(resolved))
}
