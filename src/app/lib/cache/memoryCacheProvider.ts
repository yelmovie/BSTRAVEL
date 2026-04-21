import type { CacheProvider } from "./cacheProvider"

type Entry<T> = { value: T; expiresAt: number }

function createMemoryCacheProvider(): CacheProvider & { _map: Map<string, Entry<unknown>> } {
  const map = new Map<string, Entry<unknown>>()

  return {
    _map: map,

    get<T>(key: string): T | null {
      const entry = map.get(key)
      if (!entry) return null
      if (Date.now() >= entry.expiresAt) {
        map.delete(key)
        return null
      }
      return entry.value as T
    },

    set<T>(key: string, value: T, ttlMs: number): void {
      map.set(key, {
        value,
        expiresAt: Date.now() + ttlMs,
      })
    },

    delete(key: string): void {
      map.delete(key)
    },

    clear(): void {
      map.clear()
    },
  }
}

/** 기본 단일 인스턴스 — Vitest 등에서 clear 시 동일 참조 유지 */
export const memoryCacheProvider = createMemoryCacheProvider()
