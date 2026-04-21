import type { CacheProvider } from "./cacheProvider"
import { devCacheLog } from "./devCacheLog"
import { memoryCacheProvider } from "./memoryCacheProvider"

/** 기본 provider — KV 전환 시 `setCacheProvider` 로 교체 */
let active: CacheProvider = memoryCacheProvider

export function setCacheProvider(p: CacheProvider): void {
  active = p
}

export function getActiveCacheProvider(): CacheProvider {
  return active
}

export type CacheEntry<T> = {
  value: T
  expiresAt: number
}

export function getCache<T>(key: string): T | null {
  const v = active.get<T>(key)
  if (v != null) {
    devCacheLog("cache-hit", key)
    return v
  }
  return null
}

export function setCache<T>(key: string, value: T, ttlMs: number): void {
  active.set(key, value, ttlMs)
}

export function removeCache(key: string): void {
  active.delete(key)
}

export function clearAllSimpleCache(): void {
  active.clear()
}
