/**
 * 캐시 추상화 — 현재는 메모리 구현만 사용.
 * 이후 Cloudflare KV / Redis 등으로 교체 시 `setCacheProvider()`만 갈아끼우면 됩니다.
 * request dedupe(`requestDedupe.ts`)는 프로세스 내 동시성용으로 provider와 독립입니다.
 */
export interface CacheProvider {
  get<T>(key: string): T | null
  set<T>(key: string, value: T, ttlMs: number): void
  delete(key: string): void
  clear(): void
}
