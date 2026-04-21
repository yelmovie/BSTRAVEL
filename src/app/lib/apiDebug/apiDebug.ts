/** 개발 모드에서만 API 호출 이력을 쌓습니다. 프로덕션 번들에서는 log가 no-op입니다. */

export type ApiDebugEntry = {
  id: string
  label: string
  url: string
  ms: number
  ok: boolean
  status?: number
  error?: string
  at: number
}

const MAX = 50
const entries: ApiDebugEntry[] = []
const listeners = new Set<() => void>()

function notify() {
  for (const l of listeners) l()
}

export function logApiDebug(
  partial: Omit<ApiDebugEntry, "id" | "at"> & { label: string },
): void {
  if (!import.meta.env.DEV) return
  const e: ApiDebugEntry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    at: Date.now(),
    ...partial,
  }
  entries.unshift(e)
  while (entries.length > MAX) entries.pop()
  notify()
}

export function getApiDebugEntries(): readonly ApiDebugEntry[] {
  return entries
}

export function subscribeApiDebug(cb: () => void): () => void {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function clearApiDebugEntries(): void {
  entries.length = 0
  notify()
}
