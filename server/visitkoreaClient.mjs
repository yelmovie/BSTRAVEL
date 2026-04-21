import { buildTourService2Request } from './tourApiLang.mjs'

/**
 * 한국관광공사 TourAPI — 공공데이터포털
 * - Tour Service2: locale별 Kor/Eng/Jpn/Chs/Cht 서비스 분기
 * - KorWithService2: 무장애(KorWith) GW — 기존 프록시 경로 유지
 *
 * serviceKey: `.env`에는 **디코딩된(평문) 키**만 넣습니다. 수동 `encodeURIComponent` 금지.
 * HTTP 쿼리 규격상 전송 시 한 번 인코딩되어야 하므로 `URLSearchParams.set('serviceKey', raw)` 로만 처리합니다.
 * (.env 에 이미 % 인코딩된 문자열을 넣으면 이중 인코딩되어 실패할 수 있음)
 */

const KOR_WITH_SERVICE2_BASE = 'https://apis.data.go.kr/B551011/KorWithService2'

const TOUR_DEV_LOG =
  process.env.TOURAPI_DEBUG === '1' ||
  process.env.NODE_ENV !== 'production'

function decodeMaybeEncodedServiceKey(raw) {
  const text = typeof raw === 'string' ? raw.trim() : ''
  if (!text) return ''
  if (!text.includes('%')) return text
  try {
    const decoded = decodeURIComponent(text)
    return decoded.trim() || text
  } catch {
    return text
  }
}

function maskUrlForLog(fullUrl) {
  try {
    const u = new URL(fullUrl)
    const q = u.searchParams.get('serviceKey')
    if (q) {
      const masked =
        q.length <= 10 ? '***' : `${q.slice(0, 4)}…${q.slice(-4)}`
      u.searchParams.set('serviceKey', masked)
    }
    return u.toString()
  } catch {
    return fullUrl.replace(/serviceKey=[^&]+/, 'serviceKey=***')
  }
}

function previewText(raw, limit = 300) {
  const text = typeof raw === 'string' ? raw : String(raw ?? '')
  return text.slice(0, limit)
}

function createUpstreamError(message, code, extras = {}) {
  const err = new Error(message)
  err.code = code
  Object.assign(err, extras)
  return err
}

function classifyFetchFailure(e) {
  const msg = e instanceof Error ? e.message : String(e ?? '')
  const lower = msg.toLowerCase()
  if (lower.includes('enotfound') || lower.includes('eai_again') || lower.includes('name not resolved')) {
    return 'DNS_LOOKUP_FAILED'
  }
  if (lower.includes('refused') || lower.includes('econnreset') || lower.includes('socket')) {
    return 'NETWORK_CONNECTION_FAILED'
  }
  return 'NETWORK'
}

function detectUpstreamReason(text, contentType) {
  const body = typeof text === 'string' ? text.trim() : ''
  if (!body) return 'Empty upstream response'
  if (contentType.includes('xml') || body.startsWith('<')) {
    const xmlMsg =
      body.match(/<(?:returnAuthMsg|returnMsg|errMsg|msgBody)>([^<]+)</i)?.[1] ??
      body.match(/<message>([^<]+)<\/message>/i)?.[1]
    const xmlCode =
      body.match(/<(?:returnReasonCode|returnCode|errCd|code)>([^<]+)</i)?.[1] ??
      body.match(/<errorCode>([^<]+)<\/errorCode>/i)?.[1]
    if (xmlCode || xmlMsg) {
      return [xmlCode, xmlMsg].filter(Boolean).join(' ')
    }
  }
  return previewText(body, 180)
}

function resolveServiceKey() {
  const raw = process.env.VISITKOREA_SERVICE_KEY
  const serviceKey = decodeMaybeEncodedServiceKey(raw)
  if (!serviceKey) {
    const err = new Error('TourAPI key missing')
    err.code = 'MISSING_SERVICE_KEY'
    throw err
  }
  return serviceKey
}

/**
 * @param {string} baseUrl
 * @param {string} operation 예: areaBasedList2
 * @param {Record<string, string | number | undefined | null>} paramRecord
 */
function buildKorTourApiUrl(baseUrl, operation, paramRecord) {
  const serviceKey = resolveServiceKey()

  const mobileApp = process.env.VISITKOREA_MOBILE_APP?.trim() || 'MovieSSam'

  const params = new URLSearchParams()
  params.set('serviceKey', serviceKey)
  params.set('MobileOS', 'ETC')
  params.set('MobileApp', mobileApp)
  params.set('_type', 'json')

  for (const [k, v] of Object.entries(paramRecord)) {
    if (v === undefined || v === null || String(v).trim() === '') continue
    params.set(k, String(v))
  }

  return `${baseUrl}/${operation}?${params.toString()}`
}

/** dev 로그용 — serviceKey 마스킹 */
export function getMaskedKorTourRequestUrl(baseUrl, operation, paramRecord) {
  const raw = buildKorTourApiUrl(baseUrl, operation, paramRecord)
  return maskUrlForLog(raw)
}

/**
 * @param {string} baseUrl
 * @param {string} operation 예: areaBasedList2
 * @param {Record<string, string | number | undefined | null>} paramRecord
 */
async function fetchKorTourApi(baseUrl, operation, paramRecord, { timeoutMs = 15000 } = {}) {
  const url = buildKorTourApiUrl(baseUrl, operation, paramRecord)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  const t0 = Date.now()

  if (TOUR_DEV_LOG) {
    // eslint-disable-next-line no-console
    console.log(`[TourAPI] → ${maskUrlForLog(url)}`)
  }

  let res
  try {
    res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })
  } catch (e) {
    if (e?.name === 'AbortError') {
      const te = new Error(`Request timeout after ${timeoutMs}ms`)
      te.code = 'TIMEOUT'
      te.reason = 'UPSTREAM_TIMEOUT'
      throw te
    }
    const ne = new Error(e instanceof Error ? e.message : 'Network error')
    ne.code = classifyFetchFailure(e)
    ne.reason = 'UPSTREAM_NETWORK_FAILURE'
    throw ne
  } finally {
    clearTimeout(timer)
    if (TOUR_DEV_LOG) {
      // eslint-disable-next-line no-console
      console.log(`[TourAPI] ← ${operation} ${Date.now() - t0}ms HTTP ${res?.status ?? '—'}`)
    }
  }

  const text = await res.text()
  const contentType = res.headers.get('content-type') || ''
  const preview = previewText(text, 300)
  const upstreamReason = detectUpstreamReason(text, contentType)

  if (TOUR_DEV_LOG) {
    // eslint-disable-next-line no-console
    console.log(`[TourAPI] status=${res.status} ${res.statusText || ''} content-type=${contentType || '(missing)'}`)
    // eslint-disable-next-line no-console
    console.log(`[TourAPI] preview=${preview || '(empty)'}`)
  }

  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw createUpstreamError('Invalid JSON from TourAPI', 'INVALID_JSON', {
      upstreamStatus: res.status,
      contentType,
      preview,
      reason: upstreamReason,
    })
  }

  if (!res.ok) {
    throw createUpstreamError(`HTTP ${res.status}`, `HTTP_${res.status}`, {
      upstreamStatus: res.status,
      contentType,
      preview,
      reason: upstreamReason,
    })
  }

  const topResultCode = json?.resultCode
  const topResultMsg = json?.resultMsg ?? ''
  if (topResultCode && String(topResultCode) !== '0000') {
    throw createUpstreamError(topResultMsg || 'TourAPI application error', `TOURAPI_${topResultCode}`, {
      upstreamStatus: res.status,
      contentType,
      preview,
      reason: topResultMsg || upstreamReason,
      resultCode: topResultCode,
    })
  }

  const header = json?.response?.header
  const resultCode = header?.resultCode
  const resultMsg = header?.resultMsg ?? ''
  if (resultCode && String(resultCode) !== '0000') {
    throw createUpstreamError(resultMsg || 'TourAPI application error', `TOURAPI_${resultCode}`, {
      upstreamStatus: res.status,
      contentType,
      preview,
      reason: resultMsg || upstreamReason,
      resultCode,
    })
  }

  const langUsed = paramRecord?.lang != null ? String(paramRecord.lang) : '—'
  if (TOUR_DEV_LOG) {
    // eslint-disable-next-line no-console
    console.log(`[TourAPI] ✓ ${operation} lang=${langUsed} ok`)
  }

  return json
}

/** KorService2 전체 요청 URL (serviceKey 마스킹) — 프록시 dev 로그용 */
export function getMaskedKorService2Url(operation, paramRecord) {
  const req = buildTourService2Request(operation, paramRecord)
  return getMaskedKorTourRequestUrl(req.baseUrl, req.operation, req.params)
}

/** Tour Service2 — locale별 Kor/Eng/Jpn/Chs/Cht 분기 */
export async function callKorService2(operation, paramRecord, options) {
  const req = buildTourService2Request(operation, paramRecord)
  return fetchKorTourApi(req.baseUrl, req.operation, req.params, options)
}

/** KorWithService2 — 무장애 GW (기존 /api/tour/area-based 등) */
export async function callKorWithService2(operation, paramRecord, options) {
  return fetchKorTourApi(KOR_WITH_SERVICE2_BASE, operation, paramRecord, options)
}

export function extractItemsFromBody(body) {
  if (!body || typeof body !== 'object') return []
  const items = body.items
  if (!items || typeof items !== 'object') return []
  const item = items.item
  if (item == null) return []
  return Array.isArray(item) ? item : [item]
}

export function getTotalCount(body) {
  const n = body?.totalCount
  const num = typeof n === 'string' ? parseInt(n, 10) : Number(n)
  return Number.isFinite(num) ? num : 0
}
