/**
 * 서버 전용 — Route Handler에서만 import (VISITKOREA_SERVICE_KEY 사용)
 * KorWithService2: https://apis.data.go.kr/B551011/KorWithService2
 */

const KOR_WITH_BASE = 'https://apis.data.go.kr/B551011/KorWithService2'

export type TourUpstreamResult<T> = { ok: true; data: T } | { ok: false; error: { code: string; message: string } }

function extractItems(body: Record<string, unknown> | undefined): Record<string, unknown>[] {
  if (!body?.items || typeof body.items !== 'object') return []
  const items = body.items as { item?: unknown }
  const item = items.item
  if (item == null) return []
  return Array.isArray(item) ? (item as Record<string, unknown>[]) : [item as Record<string, unknown>]
}

function totalCount(body: Record<string, unknown> | undefined): number {
  const n = body?.totalCount
  const num = typeof n === 'string' ? parseInt(n, 10) : Number(n)
  return Number.isFinite(num) ? num : 0
}

export async function korWithGet(
  operation: 'areaBasedList2' | 'detailCommon2',
  params: Record<string, string>,
  timeoutMs = 15000,
): Promise<TourUpstreamResult<unknown>> {
  const serviceKey = process.env.VISITKOREA_SERVICE_KEY?.trim()
  if (!serviceKey) {
    return { ok: false, error: { code: 'MISSING_SERVICE_KEY', message: 'VISITKOREA_SERVICE_KEY is not set' } }
  }

  const mobileApp =
    process.env.VISITKOREA_MOBILE_APP?.trim() ||
    process.env.NEXT_PUBLIC_APP_NAME?.trim() ||
    'MovieSSam'

  const q = new URLSearchParams()
  q.set('serviceKey', serviceKey)
  q.set('MobileOS', 'ETC')
  q.set('MobileApp', mobileApp)
  q.set('_type', 'json')
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') q.set(k, String(v))
  }

  const url = `${KOR_WITH_BASE}/${operation}?${q.toString()}`
  const ctrl = new AbortController()
  const t = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: 'application/json' } })
    const text = await res.text()
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      return { ok: false, error: { code: 'INVALID_JSON', message: 'Upstream returned non-JSON' } }
    }
    if (!res.ok) {
      return { ok: false, error: { code: `HTTP_${res.status}`, message: text.slice(0, 200) } }
    }
    const header = (json as { response?: { header?: { resultCode?: string; resultMsg?: string } } })?.response?.header
    const rc = header?.resultCode
    if (rc && String(rc) !== '0000') {
      return { ok: false, error: { code: `TOURAPI_${rc}`, message: header?.resultMsg || 'TourAPI error' } }
    }
    return { ok: true, data: json }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      return { ok: false, error: { code: 'TIMEOUT', message: `Timeout after ${timeoutMs}ms` } }
    }
    return { ok: false, error: { code: 'NETWORK', message: e instanceof Error ? e.message : 'fetch failed' } }
  } finally {
    clearTimeout(t)
  }
}

export function parseListBody(json: unknown) {
  const body = (json as { response?: { body?: Record<string, unknown> } })?.response?.body
  return {
    items: extractItems(body),
    totalCount: totalCount(body),
    pageNo: body?.pageNo,
    numOfRows: body?.numOfRows,
  }
}

export function parseDetailBody(json: unknown): Record<string, unknown> | null {
  const body = (json as { response?: { body?: Record<string, unknown> } })?.response?.body
  const items = extractItems(body)
  return items[0] ?? null
}
