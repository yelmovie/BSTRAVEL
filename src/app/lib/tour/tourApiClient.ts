import type { TourApiEnvelope, TourApiSuccess, TourListPayload, TourDetailCommonPayload } from "./tourTypes"
import { CACHE_TTL_MS } from "../cache/cacheConfig"
import { instrumentedFetch } from "../apiDebug/instrumentedFetch"

export class TourApiClientError extends Error {
  readonly code: string
  readonly detail?: {
    upstreamStatus?: number
    contentType?: string
    preview?: string
    reason?: string
    resultCode?: string
  }

  constructor(
    code: string,
    message: string,
    detail?: {
      upstreamStatus?: number
      contentType?: string
      preview?: string
      reason?: string
      resultCode?: string
    },
  ) {
    super(message)
    this.name = "TourApiClientError"
    this.code = code
    this.detail = detail
  }
}

function devErrorMessage(
  baseMessage: string,
  detail?: {
    upstreamStatus?: number
    contentType?: string
    preview?: string
    reason?: string
    resultCode?: string
  },
) {
  if (!import.meta.env.DEV || !detail) return baseMessage
  const lines = [
    typeof detail.upstreamStatus === "number" ? `upstream status: ${detail.upstreamStatus}` : null,
    detail.contentType ? `content-type: ${detail.contentType}` : null,
    detail.resultCode ? `resultCode: ${detail.resultCode}` : null,
    detail.reason ? `reason: ${detail.reason}` : null,
    detail.preview ? `preview: ${detail.preview}` : null,
  ].filter(Boolean)
  return lines.length > 0 ? `${baseMessage}\n${lines.join("\n")}` : baseMessage
}

function friendlyTourApiMessage(detail?: {
  upstreamStatus?: number
  contentType?: string
  preview?: string
  reason?: string
  resultCode?: string
  message?: string
  endpoint?: string
}) {
  if (
    detail?.endpoint === "detailCommon2" &&
    typeof detail.message === "string" &&
    detail.message.trim() !== ""
  ) {
    return detail.message
  }
  if (detail?.upstreamStatus === 403) {
    return devErrorMessage(
      "관광 데이터 인증 오류\nTourAPI 서비스키 또는 요청 형식을 확인해 주세요",
      detail,
    )
  }

  if (detail?.resultCode) {
    return devErrorMessage(
      "관광 데이터 요청이 거절되었습니다\nTourAPI 요청 형식을 확인해 주세요",
      detail,
    )
  }

  return devErrorMessage("관광 데이터를 불러오지 못했습니다", detail)
}

function devLogEnvelopeFailure(params: {
  phase: string
  res: Response
  snippet?: string
  detail?: unknown
}) {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.error("[tourApiClient] envelope failure", {
    phase: params.phase,
    status: params.res.status,
    url: params.res.url,
    snippet: params.snippet,
    detail: params.detail,
  })
}

async function readTourEnvelope<T>(res: Response): Promise<TourApiSuccess<T>> {
  const snippet = import.meta.env.DEV ? (await res.clone().text()).slice(0, 280) : undefined
  let json: unknown
  try {
    json = await res.json()
  } catch {
    devLogEnvelopeFailure({ phase: "json-parse", res, snippet })
    throw new TourApiClientError("INVALID_RESPONSE", "TourAPI 응답 형식 불일치")
  }
  if (!json || typeof json !== "object") {
    devLogEnvelopeFailure({ phase: "object-shape", res, snippet, detail: json })
    throw new TourApiClientError("INVALID_RESPONSE", "TourAPI 응답 형식 불일치")
  }
  const env = json as TourApiEnvelope<T>
  if ("ok" in env && env.ok === false) {
    if (env.error.code === "MISSING_SERVICE_KEY") {
      throw new TourApiClientError(env.error.code, "환경변수 누락 가능", env.error)
    }
    throw new TourApiClientError(
      env.error.code,
      friendlyTourApiMessage(env.error),
      env.error,
    )
  }
  if (!res.ok) {
    devLogEnvelopeFailure({ phase: "http-not-ok", res, snippet, detail: env })
    throw new TourApiClientError(`HTTP_${res.status}`, "TourAPI 프록시 호출 실패")
  }
  if (!("ok" in env) || !env.ok) {
    devLogEnvelopeFailure({ phase: "missing-ok", res, snippet, detail: env })
    throw new TourApiClientError("INVALID_RESPONSE", "TourAPI 응답 형식 불일치")
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

type CacheSlot<T> = {
  expiry: number
  value?: T
  pending?: Promise<T>
}

const tourGetCache = new Map<string, CacheSlot<unknown>>()

/** PROD 에서 invalid TTL 시 console 경고 남발 방지 — 세션당 1회만 */
let warnedInvalidTourTtlInProd = false

/**
 * memoizedTourGet 의 두 번째 인자가 깨졌을 때(NaN·비유한수) 캐시 만료가 망가지지 않도록 정규화.
 * · 허용: finite 양수 number
 * · 실패 시: CACHE_TTL_MS.medium — 목록용 tourList(6h)로 폴백하면 코드 버그 시 detail 경로까지 장기 캐시될 수 있어 보수적으로 짧은 기본값 사용 (침묵 폴백 아님: DEV 는 매번 warn, PROD 는 세션 1회 warn)
 */
function resolveTourMemoTtlMs(ttlMs: number): number {
  if (typeof ttlMs === "number" && Number.isFinite(ttlMs) && ttlMs > 0) return ttlMs
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.warn(
      "[memoizedTourGet] invalid ttlMs; fallback CACHE_TTL_MS.medium (see resolveTourMemoTtlMs)",
      ttlMs,
    )
  } else if (!warnedInvalidTourTtlInProd) {
    warnedInvalidTourTtlInProd = true
    // eslint-disable-next-line no-console
    console.warn(
      "[memoizedTourGet] invalid ttlMs — fallback CACHE_TTL_MS.medium (once per session; fix caller)",
    )
  }
  return CACHE_TTL_MS.medium
}

async function memoizedTourGet<T>(cachePath: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  const resolvedTtl = resolveTourMemoTtlMs(ttlMs)
  const now = Date.now()
  const existing = tourGetCache.get(cachePath) as CacheSlot<T> | undefined
  if (existing?.value !== undefined && existing.expiry > now) return existing.value
  if (existing?.pending) return existing.pending

  const pending = loader()
    .then((data) => {
      tourGetCache.set(cachePath, {
        expiry: Date.now() + resolvedTtl,
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
  /** 한국관광공사 TourAPI 다국어(프록시가 상위로 전달) 예: en, ja, zh-CN */
  lang?: string
  signal?: AbortSignal
}): Promise<TourListPayload> {
  const { signal, ...rest } = params
  const qs = buildQuery(rest)
  const cachePath = `/api/tour/area-based?${qs}`
  return memoizedTourGet(
    cachePath,
    CACHE_TTL_MS.tourList,
    async () => {
      const res = await instrumentedFetch(
        cachePath,
        { signal },
        {
          label: "TourAPI KorService2 areaBasedList2 (프록시)",
        },
      )
      const env = await readTourEnvelope<TourListPayload>(res)
      if (!Array.isArray(env.data.items)) {
        throw new TourApiClientError("INVALID_ITEMS", "TourAPI 응답 형식 불일치")
      }
      if (import.meta.env.DEV && env.data.items.length === 0) {
        // eslint-disable-next-line no-console
        console.warn("[tourApiClient] TourAPI item 없음", {
          status: res.status,
          url: res.url,
        })
      }
      return env.data
    },
  )
}

export async function fetchTourDetailCommon(params: {
  contentId: string | number
  contentTypeId: string | number
  overviewYN?: string
  defaultYN?: string
  firstImageYN?: string
  mapinfoYN?: string
  areacodeYN?: string
  catcodeYN?: string
  lang?: string
  signal?: AbortSignal
}): Promise<TourDetailCommonPayload> {
  const { signal, ...p } = params
  /** addrinfoYN 은 KorService2 detailCommon2 에서 거절되는 환경이 있어 전송하지 않음 */
  const qs = buildQuery({
    ...p,
    overviewYN: params.overviewYN ?? "Y",
    defaultYN: params.defaultYN ?? "Y",
    firstImageYN: params.firstImageYN ?? "Y",
    mapinfoYN: params.mapinfoYN ?? "Y",
    areacodeYN: params.areacodeYN ?? "Y",
    catcodeYN: params.catcodeYN ?? "Y",
  })
  const cachePath = `/api/tour/detail/common?${qs}`
  return memoizedTourGet(
    cachePath,
    CACHE_TTL_MS.medium,
    async () => {
      const res = await instrumentedFetch(
        cachePath,
        { signal },
        {
          label: "TourAPI KorService2 detailCommon2 (프록시)",
        },
      )
      const env = await readTourEnvelope<TourDetailCommonPayload>(res)
      return env.data
    },
  )
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
  return memoizedTourGet(
    cachePath,
    CACHE_TTL_MS.tourList,
    async () => {
      const res = await instrumentedFetch(
        cachePath,
        { signal },
        {
          label: "TourAPI KorService2 searchKeyword2 (프록시)",
        },
      )
      const env = await readTourEnvelope<TourListPayload>(res)
      return env.data
    },
  )
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
  return memoizedTourGet(
    cachePath,
    CACHE_TTL_MS.tourList,
    async () => {
      const res = await instrumentedFetch(
        cachePath,
        { signal },
        {
          label: "TourAPI KorService2 areaBasedList2 (/api/tour/area)",
        },
      )
      const json = (await res.json()) as TourAreaKorServiceEnvelope
      if (!res.ok) {
        const errObj =
          json && typeof json === "object" && "error" in json
            ? (json as { error?: string | { message?: string } }).error
            : undefined
        const message =
          typeof errObj === "string"
            ? errObj
            : errObj && typeof errObj === "object" && typeof errObj.message === "string"
              ? errObj.message
              : `HTTP ${res.status}`
        throw new TourApiClientError("HTTP_ERROR", message)
      }
      if (!json.success) {
        throw new TourApiClientError("TOUR_AREA", json.error ?? "TourAPI area 요청 실패")
      }
      return json
    },
  )
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
