/**
 * 한국관광공사 TourAPI — 공공데이터포털
 * - KorService2: 일반 관광 오퍼레이션 (예: areaBasedList2)
 * - KorWithService2: 무장애(KorWith) GW — 기존 프록시 경로 유지
 *
 * serviceKey: `.env`에는 **디코딩된(평문) 키**만 넣습니다. 수동 `encodeURIComponent` 금지.
 * HTTP 쿼리 규격상 전송 시 한 번 인코딩되어야 하므로 `URLSearchParams.set('serviceKey', raw)` 로만 처리합니다.
 * (.env 에 이미 % 인코딩된 문자열을 넣으면 이중 인코딩되어 실패할 수 있음)
 */

const KOR_SERVICE2_BASE = 'https://apis.data.go.kr/B551011/KorService2'
const KOR_WITH_SERVICE2_BASE = 'https://apis.data.go.kr/B551011/KorWithService2'

const TOUR_DEV_LOG =
  process.env.TOURAPI_DEBUG === '1' ||
  process.env.NODE_ENV !== 'production'

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

/**
 * @param {string} baseUrl
 * @param {string} operation 예: areaBasedList2
 * @param {Record<string, string | number | undefined | null>} paramRecord
 */
function buildKorTourApiUrl(baseUrl, operation, paramRecord) {
  const serviceKey = process.env.VISITKOREA_SERVICE_KEY?.trim()
  if (!serviceKey) {
    const err = new Error('TourAPI key missing')
    err.code = 'MISSING_SERVICE_KEY'
    throw err
  }

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
      throw te
    }
    const ne = new Error(e instanceof Error ? e.message : 'Network error')
    ne.code = 'NETWORK'
    throw ne
  } finally {
    clearTimeout(timer)
    if (TOUR_DEV_LOG) {
      // eslint-disable-next-line no-console
      console.log(`[TourAPI] ← ${operation} ${Date.now() - t0}ms HTTP ${res?.status ?? '—'}`)
    }
  }

  const text = await res.text()
  let json
  try {
    json = JSON.parse(text)
  } catch {
    const pe = new Error('Invalid JSON from TourAPI')
    pe.code = 'INVALID_JSON'
    pe.detail = text.slice(0, 400)
    throw pe
  }

  if (!res.ok) {
    const he = new Error(`HTTP ${res.status}`)
    he.code = `HTTP_${res.status}`
    he.detail = text.slice(0, 400)
    throw he
  }

  const header = json?.response?.header
  const resultCode = header?.resultCode
  const resultMsg = header?.resultMsg ?? ''
  if (resultCode && String(resultCode) !== '0000') {
    const ae = new Error(resultMsg || 'TourAPI application error')
    ae.code = `TOURAPI_${resultCode}`
    ae.resultCode = resultCode
    throw ae
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
  return getMaskedKorTourRequestUrl(KOR_SERVICE2_BASE, operation, paramRecord)
}

/** KorService2 — areaBasedList2 등 */
export async function callKorService2(operation, paramRecord, options) {
  return fetchKorTourApi(KOR_SERVICE2_BASE, operation, paramRecord, options)
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
