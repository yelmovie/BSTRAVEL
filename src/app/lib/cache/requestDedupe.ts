/**
 * 동일 키로 동시에 들어온 비동기 작업을 1회만 실행하고 결과를 공유합니다.
 * (Open-Meteo / Tour / 추천 파이프라인과 별도 — 인스턴스 메모리 동시성 전용)
 */
import { devCacheLog } from "./devCacheLog"

const inflight = new Map<string, Promise<unknown>>()

export async function runDeduped<T>(key: string, factory: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) {
    devCacheLog("dedupe-hit", key)
    return existing
  }

  const pending = factory().finally(() => {
    if (inflight.get(key) === pending) inflight.delete(key)
  })

  inflight.set(key, pending)
  return pending as Promise<T>
}
