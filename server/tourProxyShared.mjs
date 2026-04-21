import {
  callKorService2 as defaultCallKorService2,
  extractItemsFromBody,
  getMaskedKorService2Url,
  getTotalCount,
} from './visitkoreaClient.mjs'
import { normalizeTourQueryLang } from './tourApiLang.mjs'
import {
  applyDetailCommon2Defaults,
  pickDetailCommon2Params,
} from './tourDetailParams.mjs'

const TOUR_PROXY_DEV =
  process.env.TOURAPI_PROXY_DEBUG === '1' ||
  process.env.NODE_ENV !== 'production'

/** @type {Record<string, string[]>} */
const ALLOW = {
  'area-based': [
    'areaCode', 'sigunguCode', 'numOfRows', 'pageNo', 'arrange',
    'cat1', 'cat2', 'cat3', 'modifiedtime', 'eventStartDate', 'eventEndDate',
    'lang',
  ],
  'search-keyword': [
    'keyword', 'areaCode', 'sigunguCode', 'numOfRows', 'pageNo', 'arrange', 'cat1', 'cat2', 'cat3',
    'lang',
  ],
}

const TOUR_LIST_CACHE_TTL_MS = 6 * 60 * 60 * 1000

/** @type {Map<string, { expiry: number, payload: object }>} */
const tourListServerCache = new Map()
/** @type {Map<string, Promise<object>>} */
const tourListInflight = new Map()

const SLIM_TOUR_KEYS = [
  'contentid',
  'contenttypeid',
  'title',
  'addr1',
  'addr2',
  'mapx',
  'mapy',
  'firstimage',
  'firstimage2',
  'tel',
  'areacode',
  'sigungucode',
  'zipcode',
  'cat1',
  'cat2',
  'cat3',
]

function pickAllowed(searchParams, keys) {
  /** @type {Record<string, string>} */
  const out = {}
  for (const k of keys) {
    const v = searchParams.get(k)
    if (v != null && v !== '') out[k] = v
  }
  return out
}

/** @param {Record<string, unknown>} raw */
function slimTourItem(raw) {
  if (!raw || typeof raw !== 'object') return {}
  /** @type {Record<string, unknown>} */
  const out = {}
  for (const k of SLIM_TOUR_KEYS) {
    const v = raw[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') out[k] = v
  }
  return out
}

function tourErrorPayload(e) {
  const code = e?.code && typeof e.code === 'string' ? e.code : 'INTERNAL'
  const message =
    code === 'MISSING_SERVICE_KEY'
      ? 'TourAPI service key is missing'
      : typeof e?.upstreamStatus === 'number'
        ? 'TourAPI request failed'
        : e instanceof Error
          ? e.message
          : 'Server error'

  const payload = { code, message }
  if (typeof e?.upstreamStatus === 'number') payload.upstreamStatus = e.upstreamStatus
  if (typeof e?.contentType === 'string' && e.contentType) payload.contentType = e.contentType
  if (typeof e?.preview === 'string' && e.preview) payload.preview = e.preview
  if (typeof e?.reason === 'string' && e.reason) payload.reason = e.reason
  if (typeof e?.resultCode === 'string' && e.resultCode) payload.resultCode = e.resultCode
  return payload
}

function tourFailureEnvelope(e) {
  const payload = tourErrorPayload(e)
  return {
    ok: false,
    success: false,
    source: 'tourapi',
    upstreamStatus: payload.upstreamStatus,
    contentType: payload.contentType,
    message: payload.message,
    preview: payload.preview,
    reason: payload.reason,
    resultCode: payload.resultCode,
    error: payload,
  }
}

function errorStatusFromCode(code, upstreamStatus) {
  if (code === 'BAD_REQUEST') return 400
  if (code === 'MISSING_SERVICE_KEY') return 500
  if (code === 'TIMEOUT') return 504
  if (code === 'DNS_LOOKUP_FAILED' || code === 'NETWORK_CONNECTION_FAILED' || code === 'NETWORK') return 502
  if (typeof upstreamStatus === 'number' && upstreamStatus >= 400) return 502
  return 502
}

/** @param {Record<string, string>} params */
function buildTourListCacheKey(params) {
  const stable = {
    areaCode: params.areaCode ?? '',
    sigunguCode: params.sigunguCode ?? '',
    pageNo: params.pageNo ?? '1',
    numOfRows: params.numOfRows ?? '10',
    arrange: params.arrange ?? '',
    cat1: params.cat1 ?? '',
    cat2: params.cat2 ?? '',
    cat3: params.cat3 ?? '',
    lang: params.lang ?? 'ko',
    eventStartDate: params.eventStartDate ?? '',
    eventEndDate: params.eventEndDate ?? '',
    modifiedtime: params.modifiedtime ?? '',
  }
  return `tourList:${Object.entries(stable)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .sort()
    .join('&')}`
}

function detailCommonPublicMessage(payload) {
  const reason = typeof payload.reason === 'string' ? payload.reason : ''
  if (reason.includes('INVALID_REQUEST_PARAMETER') || reason.includes('INVALID_REQUEST_PARAMETER_ERROR')) {
    return '관광 공공데이터(API)가 요청 형식을 거절했습니다. 잠시 후 다시 시도해 주세요.'
  }
  if (typeof payload.message === 'string' && payload.message && payload.message !== 'TourAPI request failed') {
    return payload.message
  }
  return '관광 데이터 상세 요청에 실패했습니다.'
}

function clientSafeDetailErrorPayload(payload) {
  return {
    code: typeof payload.code === 'string' && payload.code ? payload.code : 'TOUR_DETAIL_UPSTREAM_ERROR',
    message: detailCommonPublicMessage(payload),
    reason: typeof payload.reason === 'string' ? payload.reason : undefined,
    resultCode: payload.resultCode,
    upstreamStatus: payload.upstreamStatus,
    endpoint: 'detailCommon2',
    operation: 'detailCommon2',
  }
}

function tourAreaResponse(success, lang, data, error) {
  const out = { success, lang, data: data ?? null }
  if (error != null && error !== '') out.error = String(error)
  return out
}

async function handleAreaBased(url, deps) {
  const params = pickAllowed(url.searchParams, ALLOW['area-based'])
  if (!params.pageNo) params.pageNo = '1'
  if (!params.numOfRows) params.numOfRows = '10'

  const cacheKey = buildTourListCacheKey(params)
  const now = Date.now()
  const hit = tourListServerCache.get(cacheKey)
  if (hit && hit.expiry > now) {
    return { status: 200, body: hit.payload }
  }

  let pending = tourListInflight.get(cacheKey)
  if (!pending) {
    pending = (async () => {
      const cached = tourListServerCache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) return cached.payload

      const json = await deps.callKorService2('areaBasedList2', params)
      const body = json?.response?.body ?? {}
      const items = extractItemsFromBody(body).map(slimTourItem)
      const payload = {
        ok: true,
        data: {
          items,
          totalCount: getTotalCount(body),
          pageNo: body.pageNo,
          numOfRows: body.numOfRows,
        },
      }
      tourListServerCache.set(cacheKey, {
        expiry: Date.now() + TOUR_LIST_CACHE_TTL_MS,
        payload,
      })
      return payload
    })().finally(() => {
      if (tourListInflight.get(cacheKey) === pending) tourListInflight.delete(cacheKey)
    })
    tourListInflight.set(cacheKey, pending)
  }

  try {
    return { status: 200, body: await pending }
  } catch (e) {
    const payload = tourErrorPayload(e)
    const status = errorStatusFromCode(payload.code, payload.upstreamStatus)
    console.warn(
      `[tour-serverless] /api/tour/area-based FAIL status=${status} code=${payload.code} upstream=${payload.upstreamStatus ?? '—'} reason=${payload.reason ?? payload.message}`,
    )
    return { status, body: tourFailureEnvelope(e) }
  }
}

async function handleDetailCommon(url, deps) {
  let params = pickDetailCommon2Params(url.searchParams)
  params = applyDetailCommon2Defaults(params)

  if (!params.contentId || !params.contentTypeId) {
    return {
      status: 400,
      body: {
        ok: false,
        success: false,
        endpoint: 'detailCommon2',
        message: 'contentId and contentTypeId are required',
        error: { code: 'BAD_REQUEST', message: 'contentId and contentTypeId are required' },
      },
    }
  }

  if (TOUR_PROXY_DEV) {
    console.log(`[tour-serverless] detailCommon2 param keys: ${Object.keys(params).sort().join(', ')}`)
    console.log(`[tour-serverless] detailCommon2 upstream (masked)=${getMaskedKorService2Url('detailCommon2', params)}`)
  }

  try {
    const json = await deps.callKorService2('detailCommon2', params)
    const body = json?.response?.body ?? {}
    const items = extractItemsFromBody(body)
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          item: items[0] ?? null,
          rawCount: items.length,
        },
      },
    }
  } catch (e) {
    const payload = tourErrorPayload(e)
    const status = errorStatusFromCode(payload.code, payload.upstreamStatus)
    const publicMsg = detailCommonPublicMessage(payload)
    console.warn(
      `[tour-serverless] /api/tour/detail/common FAIL status=${status} code=${payload.code} upstream=${payload.upstreamStatus ?? '—'} reason=${payload.reason ?? payload.message}`,
    )
    return {
      status,
      body: {
        ok: false,
        success: false,
        source: 'tourapi',
        endpoint: 'detailCommon2',
        operation: 'detailCommon2',
        message: publicMsg,
        error: clientSafeDetailErrorPayload(payload),
      },
    }
  }
}

async function handleSearchKeyword(url, deps) {
  const params = pickAllowed(url.searchParams, ALLOW['search-keyword'])
  if (!params.keyword) {
    return {
      status: 400,
      body: { ok: false, error: { code: 'BAD_REQUEST', message: 'keyword is required' } },
    }
  }

  try {
    const json = await deps.callKorService2('searchKeyword2', params)
    const body = json?.response?.body ?? {}
    const items = extractItemsFromBody(body)
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          items,
          totalCount: getTotalCount(body),
          pageNo: body.pageNo,
          numOfRows: body.numOfRows,
        },
      },
    }
  } catch (e) {
    const payload = tourErrorPayload(e)
    const status = errorStatusFromCode(payload.code, payload.upstreamStatus)
    console.warn(
      `[tour-serverless] /api/tour/search-keyword FAIL status=${status} code=${payload.code} upstream=${payload.upstreamStatus ?? '—'} reason=${payload.reason ?? payload.message}`,
    )
    return { status, body: tourFailureEnvelope(e) }
  }
}

async function handleTourArea(url, deps) {
  const rawLang = url.searchParams.get('lang')
  const langNorm = normalizeTourQueryLang(rawLang)
  if (langNorm === null) {
    return {
      status: 400,
      body: tourAreaResponse(false, String(rawLang ?? ''), null, 'Invalid lang. Use ko, en, ja, zh-CN, zh-TW'),
    }
  }
  const lang = langNorm
  const pageNo = url.searchParams.get('pageNo')?.trim() || '1'
  const numOfRows = url.searchParams.get('numOfRows')?.trim() || '10'
  const areaCode = url.searchParams.get('areaCode')?.trim() || '6'
  const arrange = url.searchParams.get('arrange')?.trim()
  const sigunguCode = url.searchParams.get('sigunguCode')?.trim()
  const paramRecord = {
    pageNo,
    numOfRows,
    lang,
    areaCode,
    ...(arrange ? { arrange } : {}),
    ...(sigunguCode ? { sigunguCode } : {}),
  }

  if (TOUR_PROXY_DEV) {
    console.log(`[tour-serverless] /api/tour/area requestUrl (masked)=${getMaskedKorService2Url('areaBasedList2', paramRecord)}`)
  }

  try {
    const json = await deps.callKorService2('areaBasedList2', paramRecord)
    return { status: 200, body: tourAreaResponse(true, lang, json, undefined) }
  } catch (e) {
    const code = e?.code && typeof e.code === 'string' ? e.code : 'TOUR_ERROR'
    const status = errorStatusFromCode(code, e?.upstreamStatus)
    console.warn(
      `[tour-serverless] /api/tour/area FAIL status=${status} code=${code} msg=${e instanceof Error ? e.message : 'TourAPI error'}`,
    )
    return { status, body: tourFailureEnvelope(e) }
  }
}

async function handleTourTest(url, deps) {
  const rawLang = url.searchParams.get('lang')
  const langNorm = normalizeTourQueryLang(rawLang)
  if (langNorm === null) {
    return {
      status: 400,
      body: tourAreaResponse(false, String(rawLang ?? ''), null, 'Invalid lang. Use ko, en, ja, zh-CN, zh-TW'),
    }
  }
  const lang = langNorm
  const paramRecord = {
    pageNo: '1',
    numOfRows: '10',
    lang,
    areaCode: '6',
  }

  try {
    const json = await deps.callKorService2('areaBasedList2', paramRecord)
    const items = extractItemsFromBody(json?.response?.body ?? {})
    const first = items[0]
    return {
      status: 200,
      body: tourAreaResponse(true, lang, { title: first?.title != null ? String(first.title) : null }, undefined),
    }
  } catch (e) {
    const code = e?.code && typeof e.code === 'string' ? e.code : 'TOUR_ERROR'
    const status = errorStatusFromCode(code, e?.upstreamStatus)
    console.warn(
      `[tour-serverless] /api/tour/test FAIL status=${status} code=${code} msg=${e instanceof Error ? e.message : 'TourAPI error'}`,
    )
    return { status, body: tourFailureEnvelope(e) }
  }
}

async function handleTourTestLang(url, deps) {
  const areaCode = url.searchParams.get('areaCode')?.trim() || '6'
  const langs = ['ko', 'en', 'ja']
  const titles = { ko: null, en: null, ja: null }
  const detailErrors = {}

  await Promise.all(
    langs.map(async (lc) => {
      try {
        const json = await deps.callKorService2('areaBasedList2', {
          areaCode,
          pageNo: '1',
          numOfRows: '1',
          lang: lc,
        })
        const items = extractItemsFromBody(json?.response?.body ?? {})
        const first = items[0]
        titles[lc] = first?.title != null ? String(first.title) : null
      } catch (e) {
        titles[lc] = null
        detailErrors[lc] = e instanceof Error ? e.message : 'Unknown error'
      }
    }),
  )

  const failCount = Object.keys(detailErrors).length
  return {
    status: failCount === 0 ? 200 : 502,
    body: {
      success: failCount === 0,
      timestamp: new Date().toISOString(),
      ko: titles.ko,
      en: titles.en,
      ja: titles.ja,
      ...(failCount > 0 ? { error: `일부 언어 요청 실패 (${failCount}/3)`, details: detailErrors } : {}),
      ...(TOUR_PROXY_DEV ? { meta: { areaCode } } : {}),
    },
  }
}

/**
 * @param {URL} url
 * @param {{ callKorService2?: typeof defaultCallKorService2 }} [deps]
 */
export async function getTourProxyResponse(url, deps = {}) {
  const resolvedDeps = {
    callKorService2: deps.callKorService2 ?? defaultCallKorService2,
  }

  if (url.pathname === '/api/tour/health') {
    return {
      status: 200,
      body: {
        ok: true,
        data: {
          api: 'tour',
          hasServiceKey: Boolean(process.env.VISITKOREA_SERVICE_KEY?.trim()),
        },
      },
    }
  }

  if (url.pathname === '/api/tour/area') {
    return handleTourArea(url, resolvedDeps)
  }

  if (url.pathname === '/api/tour/test') {
    return handleTourTest(url, resolvedDeps)
  }

  if (url.pathname === '/api/tour/test-lang') {
    return handleTourTestLang(url, resolvedDeps)
  }

  if (url.pathname === '/api/tour/area-based') {
    return handleAreaBased(url, resolvedDeps)
  }

  if (url.pathname === '/api/tour/detail/common') {
    return handleDetailCommon(url, resolvedDeps)
  }

  if (url.pathname === '/api/tour/search-keyword') {
    return handleSearchKeyword(url, resolvedDeps)
  }

  return {
    status: 404,
    body: { ok: false, error: { code: 'NOT_FOUND', message: 'Unknown tour route' } },
  }
}
