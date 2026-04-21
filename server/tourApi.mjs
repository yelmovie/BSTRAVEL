/**
 * 로컬 TourAPI 프록시 서버 (serviceKey는 이 프로세스 환경변수에서만 읽음)
 * 유료·외부 기계 번역(Google/DeepL 등) 미포함 — 관광 API만 프록시합니다.
 *
 * Vite dev: vite.config proxy → http://127.0.0.1:3080
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
dotenv.config({ path: path.join(projectRoot, '.env.local') })
dotenv.config({ path: path.join(projectRoot, '.env') })
import { URL } from 'node:url'
import {
  callKorService2,
  callKorWithService2,
  extractItemsFromBody,
  getMaskedKorService2Url,
  getTotalCount,
} from './visitkoreaClient.mjs'

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

if (process.env.TOURAPI_THROW_IF_NO_KEY === '1' && !process.env.VISITKOREA_SERVICE_KEY?.trim()) {
  throw new Error('TourAPI key missing')
}

/**
 * KorService2 areaBasedList2 등 쿼리용 — 공식 코드(KO/EN/JA/ZH-CN 스타일)만 허용
 * @param {string | null | undefined} raw
 * @returns {'ko'|'en'|'ja'|'zh-CN'|null} null 이면 잘못된 값
 */
function normalizeTourQueryLang(raw) {
  if (raw == null || String(raw).trim() === '') return 'ko'
  const t = String(raw).trim()
  const lc = t.toLowerCase().replace(/_/g, '-')
  if (lc === 'zh-cn') return 'zh-CN'
  if (lc === 'zh') return 'zh-CN'
  if (lc === 'ko') return 'ko'
  if (lc === 'en') return 'en'
  if (lc === 'ja' || lc === 'jp') return 'ja'
  return null
}

/*
 * TODO: KorWithService2 전용 「무장애 정보」 단일 조회 오퍼레이션명은
 * 공공데이터포털 매뉴얼(개방데이터_활용매뉴얼(무장애여행).zip) Swagger에서 확인 후
 * allowlist + callKorWithService2 로 이 파일에 추가할 것. 확인 전에는 임의 경로를 만들지 말 것.
 */

/** @type {Record<string, string[]>} */
const ALLOW = {
  'area-based': [
    'areaCode', 'sigunguCode', 'numOfRows', 'pageNo', 'arrange', 'listYN',
    'cat1', 'cat2', 'cat3', 'modifiedtime', 'eventStartDate', 'eventEndDate',
    'lang',
  ],
  'detail-common': [
    'contentId', 'contentTypeId', 'defaultYN', 'firstImageYN', 'areacodeYN',
    'catcodeYN', 'addrinfoYN', 'mapinfoYN', 'overviewYN',
    'lang',
  ],
  'search-keyword': [
    'keyword', 'areaCode', 'sigunguCode', 'numOfRows', 'pageNo', 'arrange', 'listYN', 'cat1', 'cat2', 'cat3',
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
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(body)
}

async function handleAreaBased(url, res) {
  const params = pickAllowed(url.searchParams, ALLOW['area-based'])
  if (!params.listYN) params.listYN = 'Y'
  if (!params.pageNo) params.pageNo = '1'
  if (!params.numOfRows) params.numOfRows = '10'
  const json = await callKorWithService2('areaBasedList2', params)
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

async function handleDetailCommon(url, res) {
  const params = pickAllowed(url.searchParams, ALLOW['detail-common'])
  if (!params.contentId || !params.contentTypeId) {
    sendJson(res, 400, { ok: false, error: { code: 'BAD_REQUEST', message: 'contentId and contentTypeId are required' } })
    return
  }
  const json = await callKorWithService2('detailCommon2', params)
  const body = json?.response?.body ?? {}
  const items = extractItemsFromBody(body)
  sendJson(res, 200, {
    ok: true,
    data: {
      item: items[0] ?? null,
      rawCount: items.length,
    },
  })
}

async function handleSearchKeyword(url, res) {
  const params = pickAllowed(url.searchParams, ALLOW['search-keyword'])
  if (!params.keyword) {
    sendJson(res, 400, { ok: false, error: { code: 'BAD_REQUEST', message: 'keyword is required' } })
    return
  }
  const json = await callKorWithService2('searchKeyword2', params)
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
      tourAreaResponse(false, String(rawLang ?? ''), null, 'Invalid lang. Use ko, en, ja, zh-CN'),
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
    listYN: 'Y',
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
    const status = code === 'MISSING_SERVICE_KEY' ? 500 : 502
    if (TOUR_PROXY_DEV) {
      // eslint-disable-next-line no-console
      console.warn(
        `[tour-proxy] /api/tour/area FAIL time=${Date.now() - t0}ms code=${code} msg=${msg}`,
      )
    }
    sendJson(res, status, tourAreaResponse(false, lang, null, msg))
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
      tourAreaResponse(false, String(rawLang ?? ''), null, 'Invalid lang. Use ko, en, ja, zh-CN'),
    )
    return
  }
  const lang = langNorm

  const paramRecord = {
    pageNo: '1',
    numOfRows: '10',
    listYN: 'Y',
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
    const status = code === 'MISSING_SERVICE_KEY' ? 500 : 502
    if (TOUR_PROXY_DEV) {
      // eslint-disable-next-line no-console
      console.warn(`[tour-proxy] /api/tour/test FAIL time=${Date.now() - t0}ms`, code, msg)
    }
    sendJson(res, status, tourAreaResponse(false, lang, null, msg))
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
          listYN: 'Y',
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

    if (req.method !== 'GET') {
      sendJson(res, 404, { ok: false, error: { code: 'NOT_FOUND', message: 'Method not allowed' } })
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
    const code = e?.code && typeof e.code === 'string' ? e.code : 'INTERNAL'
    const message = e instanceof Error ? e.message : 'Server error'
    const status =
      code === 'BAD_REQUEST' ? 400 : code === 'MISSING_SERVICE_KEY' ? 500 : 502
    sendJson(res, status, { ok: false, error: { code, message } })
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
    console.warn(
      '[tour-api] VISITKOREA_SERVICE_KEY is missing — TourAPI routes will return 500/502. Set .env.local or use TOURAPI_THROW_IF_NO_KEY=1 to fail fast on startup.',
    )
  }
})
