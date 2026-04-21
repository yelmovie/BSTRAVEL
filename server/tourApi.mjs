/**
 * 로컬 API 프록시 서버
 * - TourAPI: serviceKey는 이 프로세스 환경변수에서만 읽음 (VISITKOREA_SERVICE_KEY)
 * - 혼잡 외부 API: crowdApi.mjs — 키는 CROWD_API_* 서버 전용
 * 유료·외부 기계 번역(Google/DeepL 등) 미포함
 *
 * Vite dev: vite.config proxy → http://127.0.0.1:3080 (`/api/tour`, `/api/crowd`만). 날씨 `/api/weather` 는 프록시 없음 — 로컬은 `VITE_API_BASE_URL` 또는 배포는 `api/weather.mjs`.
 */
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import http from 'node:http'

import { applyMergedEnv } from '../scripts/mergeProjectEnv.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
applyMergedEnv(projectRoot)
import {
  callKorService2,
  extractItemsFromBody,
  getMaskedKorService2Url,
  getTotalCount,
} from './visitkoreaClient.mjs'
import { normalizeTourQueryLang } from './tourApiLang.mjs'
import { handleCrowdProxy } from './crowdApi.mjs'
import { handleWeatherProxy } from './weatherApi.mjs'
import {
  applyDetailCommon2Defaults,
  pickDetailCommon2Params,
} from './tourDetailParams.mjs'

const PORT = Number(process.env.TOURAPI_SERVER_PORT || 3080) || 3080

const TOUR_PROXY_DEV =
  process.env.TOURAPI_PROXY_DEBUG === '1' ||
  process.env.NODE_ENV !== 'production'

function maskVisitKoreaKey(raw) {
  const k = typeof raw === 'string' ? raw.trim() : ''
  if (!k) return '(missing)'
  if (k.length <= 8) return `${k.slice(0, 2)}…(${k.length} chars)`
  return `${k.slice(0, 4)}…${k.slice(-4)} (${k.length} chars)`
}

if (TOUR_PROXY_DEV) {
  const envPath = path.join(projectRoot, '.env')
  const localPath = path.join(projectRoot, '.env.local')
  // eslint-disable-next-line no-console
  console.log('[TourAPI] env merge root:', projectRoot)
  // eslint-disable-next-line no-console
  console.log('[TourAPI] files:', '.env=', fs.existsSync(envPath), '.env.local=', fs.existsSync(localPath))
  // eslint-disable-next-line no-console
  console.log('[TourAPI] VISITKOREA_SERVICE_KEY:', maskVisitKoreaKey(process.env.VISITKOREA_SERVICE_KEY))
  if (!process.env.VISITKOREA_SERVICE_KEY?.trim()) {
    // eslint-disable-next-line no-console
    console.warn('[TourAPI] Missing VISITKOREA_SERVICE_KEY')
  }
}

if (process.env.TOURAPI_THROW_IF_NO_KEY === '1' && !process.env.VISITKOREA_SERVICE_KEY?.trim()) {
  throw new Error('TourAPI key missing')
}

/*
 * TODO: KorWithService2 전용 「무장애 정보」 단일 조회 오퍼레이션명은
 * 공공데이터포털 매뉴얼(개방데이터_활용매뉴얼(무장애여행).zip) Swagger에서 확인 후
 * allowlist + callKorWithService2 로 이 파일에 추가할 것. 확인 전에는 임의 경로를 만들지 말 것.
 */

/** @type {Record<string, string[]>} */
const ALLOW = {
  'area-based': [
    'areaCode', 'sigunguCode', 'numOfRows', 'pageNo', 'arrange',
    'cat1', 'cat2', 'cat3', 'modifiedtime', 'eventStartDate', 'eventEndDate',
    'lang',
  ],
  // detail-common 은 pickDetailCommon2Params + applyDetailCommon2Defaults 사용 (addrinfoYN 미전달)
  'detail-common': [
    'contentId', 'contentTypeId', 'defaultYN', 'firstImageYN', 'areacodeYN',
    'catcodeYN', 'mapinfoYN', 'overviewYN', 'lang',
  ],
  'search-keyword': [
    'keyword', 'areaCode', 'sigunguCode', 'numOfRows', 'pageNo', 'arrange', 'cat1', 'cat2', 'cat3',
    'lang',
  ],
}

function pickAllowed(searchParams, keys) {
  /** @type {Record<string, string>} */
  const out = {}
  for (const k of keys) {
    const v = searchParams.get(k)
    if (v != null && v !== '') out[k] = v
  }
  return out
}

function sendJson(res, status, obj) {
  const body = JSON.stringify(obj)
  /** Vite 프록시 없이 `VITE_API_BASE_URL=http://127.0.0.1:3080` 로 브라우저가 직접 호출할 때 필요 */
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (process.env.NODE_ENV !== 'production' || process.env.TOURAPI_CORS === '1') {
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    headers['Access-Control-Allow-Headers'] = 'Content-Type'
  }
  res.writeHead(status, headers)
  res.end(body)
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
  const payload = {
    code,
    message,
  }

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
  const qs = Object.entries(stable)
    .map(([k, v]) => `${k}=${encodeURIComponent(v)}`)
    .sort()
    .join('&')
  return `tourList:${qs}`
}

async function handleAreaBased(url, res) {
  const params = pickAllowed(url.searchParams, ALLOW['area-based'])
  if (!params.pageNo) params.pageNo = '1'
  if (!params.numOfRows) params.numOfRows = '10'

  const cacheKey = buildTourListCacheKey(params)
  const now = Date.now()
  const hit = tourListServerCache.get(cacheKey)
  if (hit && hit.expiry > now) {
    sendJson(res, 200, hit.payload)
    return
  }

  let pending = tourListInflight.get(cacheKey)
  if (!pending) {
    pending = (async () => {
      const cached = tourListServerCache.get(cacheKey)
      if (cached && cached.expiry > Date.now()) return cached.payload

      const json = await callKorService2('areaBasedList2', params)
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
    const payload = await pending
    sendJson(res, 200, payload)
  } catch (e) {
    const payload = tourErrorPayload(e)
    const status = errorStatusFromCode(payload.code, payload.upstreamStatus)
    if (TOUR_PROXY_DEV) {
      const failureKind =
        payload.code === 'MISSING_SERVICE_KEY'
          ? 'env-missing'
          : payload.code === 'TIMEOUT'
            ? 'upstream-timeout'
            : payload.code === 'DNS_LOOKUP_FAILED' || payload.code === 'NETWORK_CONNECTION_FAILED' || payload.code === 'NETWORK'
              ? 'upstream-network'
              : typeof payload.upstreamStatus === 'number'
                ? 'upstream-http'
                : 'proxy-failure'
      // eslint-disable-next-line no-console
      console.warn(
        `[tour-proxy] /api/tour/area-based FAIL kind=${failureKind} status=${status} code=${payload.code} upstream=${payload.upstreamStatus ?? '—'} reason=${payload.reason ?? payload.message}`,
      )
    }
    sendJson(res, status, tourFailureEnvelope(e))
  }
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
  /** preview 원문은 서버 로그만 사용 — 클라이언트에는 미전달 */
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

async function handleDetailCommon(url, res) {
  let params = pickDetailCommon2Params(url.searchParams)
  params = applyDetailCommon2Defaults(params)

  if (!params.contentId || !params.contentTypeId) {
    sendJson(res, 400, {
      ok: false,
      success: false,
      endpoint: 'detailCommon2',
      message: 'contentId and contentTypeId are required',
      error: { code: 'BAD_REQUEST', message: 'contentId and contentTypeId are required' },
    })
    return
  }

  if (TOUR_PROXY_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[tour-proxy] detailCommon2 param keys: ${Object.keys(params).sort().join(', ')}`)
    // eslint-disable-next-line no-console
    console.log(`[tour-proxy] detailCommon2 upstream (masked)=${getMaskedKorService2Url('detailCommon2', params)}`)
  }

  try {
    const json = await callKorService2('detailCommon2', params)
    const body = json?.response?.body ?? {}
    const items = extractItemsFromBody(body)
    sendJson(res, 200, {
      ok: true,
      data: {
        item: items[0] ?? null,
        rawCount: items.length,
      },
    })
  } catch (e) {
    const payload = tourErrorPayload(e)
    const status = errorStatusFromCode(payload.code, payload.upstreamStatus)
    const publicMsg = detailCommonPublicMessage(payload)
    sendJson(res, status, {
      ok: false,
      success: false,
      source: 'tourapi',
      endpoint: 'detailCommon2',
      operation: 'detailCommon2',
      message: publicMsg,
      error: clientSafeDetailErrorPayload(payload),
    })
  }
}

async function handleSearchKeyword(url, res) {
  const params = pickAllowed(url.searchParams, ALLOW['search-keyword'])
  if (!params.keyword) {
    sendJson(res, 400, { ok: false, error: { code: 'BAD_REQUEST', message: 'keyword is required' } })
    return
  }
  const json = await callKorService2('searchKeyword2', params)
  const body = json?.response?.body ?? {}
  const items = extractItemsFromBody(body)
  sendJson(res, 200, {
    ok: true,
    data: {
      items,
      totalCount: getTotalCount(body),
      pageNo: body.pageNo,
      numOfRows: body.numOfRows,
    },
  })
}

/** GET /api/tour/area · /api/tour/test 공통 응답 포맷 (클라이언트용) */
function tourAreaResponse(success, lang, data, error) {
  /** @type {{ success: boolean, lang: string, data: any, error?: string }} */
  const out = {
    success,
    lang,
    data: data ?? null,
  }
  if (error != null && error !== '') out.error = String(error)
  return out
}

/**
 * GET /api/tour/area — KorService2 areaBasedList2
 * 필수와 동일한 베이스: serviceKey(환경), MobileOS=ETC, MobileApp, _type=json, pageNo=1, numOfRows=10, lang
 * Query: lang (기본 ko, en|ja|zh-CN), pageNo, numOfRows, areaCode(기본 6), arrange, sigunguCode
 */
async function handleTourAreaKorService(url, res) {
  const rawLang = url.searchParams.get('lang')
  const langNorm = normalizeTourQueryLang(rawLang)
  if (langNorm === null) {
    sendJson(
      res,
      400,
      tourAreaResponse(false, String(rawLang ?? ''), null, 'Invalid lang. Use ko, en, ja, zh-CN, zh-TW'),
    )
    return
  }
  const lang = langNorm

  const pageNo = url.searchParams.get('pageNo')?.trim() || '1'
  const numOfRows = url.searchParams.get('numOfRows')?.trim() || '10'
  const areaCode = url.searchParams.get('areaCode')?.trim() || '6'
  const arrange = url.searchParams.get('arrange')?.trim()
  const sigunguCode = url.searchParams.get('sigunguCode')?.trim()

  /** @type {Record<string, string>} */
  const paramRecord = {
    pageNo,
    numOfRows,
    lang,
    areaCode,
    ...(arrange ? { arrange } : {}),
    ...(sigunguCode ? { sigunguCode } : {}),
  }

  const t0 = Date.now()

  if (TOUR_PROXY_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[tour-proxy] /api/tour/area requestUrl (masked)=${getMaskedKorService2Url('areaBasedList2', paramRecord)}`)
  }

  try {
    const json = await callKorService2('areaBasedList2', paramRecord)
    if (TOUR_PROXY_DEV) {
      // eslint-disable-next-line no-console
      console.log(
        `[tour-proxy] /api/tour/area response OK status=200 time=${Date.now() - t0}ms lang=${lang} (TourAPI 상세 HTTP·시간은 [TourAPI] 로그 참고)`,
      )
    }
    sendJson(res, 200, tourAreaResponse(true, lang, json, undefined))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'TourAPI error'
    const code = e?.code && typeof e.code === 'string' ? e.code : 'TOUR_ERROR'
    const status = errorStatusFromCode(code, e?.upstreamStatus)
    if (TOUR_PROXY_DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[tour-proxy] /api/tour/area FAIL time=${Date.now() - t0}ms code=${code} msg=${msg}`,
      )
    }
    sendJson(res, status, tourFailureEnvelope(e))
  }
}

/**
 * GET /api/tour/test — TourAPI 단일 호출 후 첫 항목 제목 (연결 스모크)
 */
async function handleTourTestMinimal(url, res) {
  const rawLang = url.searchParams.get('lang')
  const langNorm = normalizeTourQueryLang(rawLang)
  if (langNorm === null) {
    sendJson(
      res,
      400,
      tourAreaResponse(false, String(rawLang ?? ''), null, 'Invalid lang. Use ko, en, ja, zh-CN, zh-TW'),
    )
    return
  }
  const lang = langNorm

  const paramRecord = {
    pageNo: '1',
    numOfRows: '10',
    lang,
    areaCode: '6',
  }

  const t0 = Date.now()
  if (TOUR_PROXY_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[tour-proxy] /api/tour/test requestUrl (masked)=${getMaskedKorService2Url('areaBasedList2', paramRecord)}`)
  }

  try {
    const json = await callKorService2('areaBasedList2', paramRecord)
    const items = extractItemsFromBody(json?.response?.body ?? {})
    const first = items[0]
    const title = first?.title != null ? String(first.title) : null
    if (TOUR_PROXY_DEV) {
      // eslint-disable-next-line no-console
      console.log(`[tour-proxy] /api/tour/test OK time=${Date.now() - t0}ms title=${title ?? '(none)'}`)
    }
    sendJson(res, 200, tourAreaResponse(true, lang, { title }, undefined))
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'TourAPI error'
    const code = e?.code && typeof e.code === 'string' ? e.code : 'TOUR_ERROR'
    const status = errorStatusFromCode(code, e?.upstreamStatus)
    if (TOUR_PROXY_DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[tour-proxy] /api/tour/test FAIL time=${Date.now() - t0}ms`, code, msg)
    }
    sendJson(res, status, tourFailureEnvelope(e))
  }
}

/**
 * GET /api/tour/test-lang — ko · en · ja 각각 첫 번째 관광지 title 비교
 * 수동 스모크 전용: 요청 1회당 상위 TourAPI(areaBasedList2) 호출이 언어 수만큼 발생합니다(기본 3회).
 */
async function handleTourTestLang(url, res) {
  const areaCode = url.searchParams.get('areaCode')?.trim() || '6'
  const langs = ['ko', 'en', 'ja']
  const t0 = Date.now()

  if (TOUR_PROXY_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[tour-proxy] /api/tour/test-lang areaCode=${areaCode}`)
  }

  /** @type {Record<string, string | null>} */
  const titles = { ko: null, en: null, ja: null }
  /** @type {Record<string, string>} */
  const detailErrors = {}

  await Promise.all(
    langs.map(async (lc) => {
      try {
        const json = await callKorService2('areaBasedList2', {
          areaCode,
          pageNo: '1',
          numOfRows: '1',
          lang: lc,
        })
        const items = extractItemsFromBody(json?.response?.body ?? {})
        const first = items[0]
        titles[lc] = first?.title != null ? String(first.title) : null
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Unknown error'
        titles[lc] = null
        detailErrors[lc] = msg
      }
    }),
  )

  const failCount = Object.keys(detailErrors).length
  /** 세 언어 모두 HTTP·TourAPI 단계까지 예외 없이 완료 */
  const success = failCount === 0

  const payload = {
    success,
    timestamp: new Date().toISOString(),
    ko: titles.ko,
    en: titles.en,
    ja: titles.ja,
    ...(failCount > 0 ? { error: `일부 언어 요청 실패 (${failCount}/3)`, details: detailErrors } : {}),
    ...(TOUR_PROXY_DEV ? { meta: { areaCode, ms: Date.now() - t0 } } : {}),
  }

  if (TOUR_PROXY_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[tour-proxy] /api/tour/test-lang done ${Date.now() - t0}ms`, {
      ko: titles.ko,
      en: titles.en,
      ja: titles.ja,
    })
  }

  sendJson(res, success ? 200 : 502, payload)
}

const server = http.createServer(async (req, res) => {
  try {
    if (!req.url) {
      sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Not found' } })
      return
    }

    const url = new URL(req.url, `http://${req.headers.host}`)

    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      })
      res.end()
      return
    }

    if (url.pathname === '/api/weather' || url.pathname === '/api/weather/') {
      await handleWeatherProxy(url, res, sendJson)
      return
    }

    if (req.method !== 'GET') {
      sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Method not allowed' } })
      return
    }

    if (url.pathname === '/api/crowd' || url.pathname === '/api/crowd/') {
      await handleCrowdProxy(url, res, sendJson)
      return
    }

    if (url.pathname === '/api/tour/health') {
      const hasKey = Boolean(process.env.VISITKOREA_SERVICE_KEY?.trim())
      sendJson(res, 200, { ok: true, data: { api: 'tour', hasServiceKey: hasKey } })
      return
    }

    if (url.pathname === '/api/tour/area') {
      await handleTourAreaKorService(url, res)
      return
    }

    if (url.pathname === '/api/tour/test') {
      await handleTourTestMinimal(url, res)
      return
    }

    if (url.pathname === '/api/tour/test-lang') {
      await handleTourTestLang(url, res)
      return
    }

    if (url.pathname === '/api/tour/area-based') {
      await handleAreaBased(url, res)
      return
    }

    if (url.pathname === '/api/tour/detail/common') {
      await handleDetailCommon(url, res)
      return
    }

    if (url.pathname === '/api/tour/search-keyword') {
      await handleSearchKeyword(url, res)
      return
    }

    sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Unknown tour route' } })
  } catch (e) {
    const payload = tourErrorPayload(e)
    const status = errorStatusFromCode(payload.code, payload.upstreamStatus)
    sendJson(res, status, tourFailureEnvelope(e))
  }
})

server.listen(PORT, '127.0.0.1', () => {
  const appName = process.env.VISITKOREA_MOBILE_APP?.trim() || 'MovieSSam'
  // eslint-disable-next-line no-console
  console.log(`[tour-api] listening on http://127.0.0.1:${PORT} (TOURAPI_SERVER_PORT=${PORT})`)
  if (TOUR_PROXY_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[tour-api] VISITKOREA_SERVICE_KEY (masked)=${maskVisitKoreaKey(process.env.VISITKOREA_SERVICE_KEY)}`)
    // eslint-disable-next-line no-console
    console.log(`[tour-api] VISITKOREA_MOBILE_APP=${appName}`)
  }
  if (!process.env.VISITKOREA_SERVICE_KEY?.trim()) {
    // eslint-disable-next-line no-console
    console.warn('[TourAPI] Missing VISITKOREA_SERVICE_KEY')
  }
})
