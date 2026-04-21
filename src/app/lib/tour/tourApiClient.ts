import type { TourApiEnvelope, TourApiSuccess, TourListPayload, TourDetailCommonPayload } from "./tourTypes"
import { instrumentedFetch } from "../apiDebug/instrumentedFetch"

export class TourApiClientError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = "TourApiClientError"
    this.code = code
  }
}

async function readTourEnvelope<T>(res: Response): Promise<TourApiSuccess<T>> {
  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new TourApiClientError("INVALID_RESPONSE", "응답이 JSON이 아닙니다")
  }
  if (!json || typeof json !== "object") {
    throw new TourApiClientError("INVALID_RESPONSE", "응답 형식이 올바르지 않습니다")
  }
  const env = json as TourApiEnvelope<T>
  if ("ok" in env && env.ok === false) {
    throw new TourApiClientError(env.error.code, env.error.message)
  }
  if (!res.ok) {
    throw new TourApiClientError(`HTTP_${res.status}`, "HTTP / 프록시 오류")
  }
  if (!("ok" in env) || !env.ok) {
    throw new TourApiClientError("INVALID_RESPONSE", "알 수 없는 응답")
  }
  return env as TourApiSuccess<T>
}

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue
    q.set(k, String(v))
  }
  return q.toString()
}

/** 메모리 캐시 TTL (동일 조건 재요청 비용 절감). 약 3분. */
const TOUR_GET_CACHE_TTL_MS = 180_000

type CacheSlot<T> = {
  expiry: number
  value?: T
  pending?: Promise<T>
}

const tourGetCache = new Map<string, CacheSlot<unknown>>()

async function memoizedTourGet<T>(cachePath: string, loader: () => Promise<T>): Promise<T> {
  const now = Date.now()
  const existing = tourGetCache.get(cachePath) as CacheSlot<T> | undefined
  if (existing?.value !== undefined && existing.expiry > now) return existing.value
  if (existing?.pending) return existing.pending

  const pending = loader()
    .then((data) => {
      tourGetCache.set(cachePath, {
        expiry: Date.now() + TOUR_GET_CACHE_TTL_MS,
        value: data as unknown,
      })
      return data
    })
    .catch((err) => {
      tourGetCache.delete(cachePath)
      throw err
    })

  tourGetCache.set(cachePath, {
    expiry: now,
    pending,
  })

  return pending
}

export async function fetchTourAreaBased(params: {
  areaCode?: string
  sigunguCode?: string
  numOfRows?: string | number
  pageNo?: string | number
  arrange?: string
  listYN?: string
  /** 한국관광공사 TourAPI 다국어(프록시가 상위로 전달) 예: en, ja, zh-CN */
  lang?: string
  signal?: AbortSignal
}): Promise<TourListPayload> {
  const { signal, ...rest } = params
  const qs = buildQuery(rest)
  const cachePath = `/api/tour/area-based?${qs}`
  return memoizedTourGet(cachePath, async () => {
    const res = await instrumentedFetch(
      cachePath,
      { signal },
      {
        label: "TourAPI KorWith areaBasedList2 (프록시)",
      },
    )
    const env = await readTourEnvelope<TourListPayload>(res)
    return env.data
  })
}

export async function fetchTourDetailCommon(params: {
  contentId: string | number
  contentTypeId: string | number
  overviewYN?: string
  defaultYN?: string
  firstImageYN?: string
  addrinfoYN?: string
  mapinfoYN?: string
  lang?: string
  signal?: AbortSignal
}): Promise<TourDetailCommonPayload> {
  const { signal, ...p } = params
  const qs = buildQuery({
    ...p,
    overviewYN: params.overviewYN ?? "Y",
    defaultYN: params.defaultYN ?? "Y",
    firstImageYN: params.firstImageYN ?? "Y",
    addrinfoYN: params.addrinfoYN ?? "Y",
    mapinfoYN: params.mapinfoYN ?? "Y",
  })
  const cachePath = `/api/tour/detail/common?${qs}`
  return memoizedTourGet(cachePath, async () => {
    const res = await instrumentedFetch(
      cachePath,
      { signal },
      {
        label: "TourAPI KorWith detailCommon2 (프록시)",
      },
    )
    const env = await readTourEnvelope<TourDetailCommonPayload>(res)
    return env.data
  })
}

export async function fetchTourSearchKeyword(params: {
  keyword: string
  areaCode?: string
  sigunguCode?: string
  numOfRows?: string | number
  pageNo?: string | number
  lang?: string
  signal?: AbortSignal
}): Promise<TourListPayload> {
  const { signal, ...rest } = params
  const qs = buildQuery(rest)
  const cachePath = `/api/tour/search-keyword?${qs}`
  return memoizedTourGet(cachePath, async () => {
    const res = await instrumentedFetch(
      cachePath,
      { signal },
      {
        label: "TourAPI KorWith searchKeyword2 (프록시)",
      },
    )
    const env = await readTourEnvelope<TourListPayload>(res)
    return env.data
  })
}

export async function fetchTourHealth(): Promise<{ hasServiceKey: boolean }> {
  const res = await instrumentedFetch("/api/tour/health", undefined, {
    label: "TourAPI 프록시 헬스",
  })
  const env = await readTourEnvelope<{ hasServiceKey: boolean }>(res)
  return env.data
}

/** GET /api/tour/area — KorService2 `areaBasedList2` 전체 JSON (`success` / `lang` / `data`) */
export type TourAreaKorServiceEnvelope = {
  success: boolean
  lang: string
  data: unknown
  error?: string
}

export async function fetchTourAreaKorService(params: {
  lang?: string
  areaCode?: string
  pageNo?: string
  numOfRows?: string
  signal?: AbortSignal
}): Promise<TourAreaKorServiceEnvelope> {
  const { signal, ...rest } = params
  const qs = buildQuery(rest)
  const cachePath = `/api/tour/area?${qs}`
  return memoizedTourGet(cachePath, async () => {
    const res = await instrumentedFetch(
      cachePath,
      { signal },
      {
        label: "TourAPI KorService2 areaBasedList2 (/api/tour/area)",
      },
    )
    const json = (await res.json()) as TourAreaKorServiceEnvelope
    if (!res.ok) {
      throw new TourApiClientError("HTTP_ERROR", json.error ?? `HTTP ${res.status}`)
    }
    if (!json.success) {
      throw new TourApiClientError("TOUR_AREA", json.error ?? "TourAPI area 요청 실패")
    }
    return json
  })
}

/** KorService2 응답 `data.response.body.items` 에서 item 배열 추출 */
export function extractTourItemsFromKorServiceData(data: unknown): Record<string, unknown>[] {
  const body = (data as { response?: { body?: unknown } })?.response?.body
  if (!body || typeof body !== "object") return []
  const items = (body as { items?: unknown }).items
  if (!items || typeof items !== "object") return []
  const item = (items as { item?: unknown }).item
  if (item == null) return []
  return Array.isArray(item) ? item : [item]
}
