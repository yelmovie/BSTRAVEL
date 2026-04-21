/**
 * 외부 혼잡 API 프록시 — 인증키는 서버 환경변수만 사용 (브라우저 노출 금지)
 *
 * 클라이언트: GET /api/crowd?area=&lat=&lng=&timeSlot=&courseId=
 * 서버가 CROWD_API_BASE_URL 로 동일 쿼리를 전달하고 x-api-key / Bearer 는 서버에서만 설정.
 */

function parseEnabled(raw) {
  if (raw == null || String(raw).trim() === '') return true
  const normalized = String(raw).trim().toLowerCase()
  return normalized !== '0' && normalized !== 'false' && normalized !== 'off'
}

function parseTimeoutMs(raw) {
  const n = Number(raw)
  if (!Number.isFinite(n) || n <= 0) return 10000
  return Math.max(1000, Math.min(n, 30000))
}

/**
 * @param {URL} clientUrl 클라이언트 요청 URL (? 쿼리 포함)
 * @param {import('http').ServerResponse} res
 * @param {(res: import('http').ServerResponse, status: number, obj: unknown) => void} sendJson
 */
export async function handleCrowdProxy(clientUrl, res, sendJson) {
  const enabled = parseEnabled(process.env.CROWD_API_ENABLED)
  if (!enabled) {
    sendJson(res, 503, {
      ok: false,
      error: { code: 'CROWD_DISABLED', message: 'Crowd proxy disabled (CROWD_API_ENABLED)' },
    })
    return
  }

  const baseUrlRaw = process.env.CROWD_API_BASE_URL?.trim()
  if (!baseUrlRaw) {
    sendJson(res, 503, {
      ok: false,
      error: {
        code: 'NOT_CONFIGURED',
        message: 'Crowd upstream not configured (set CROWD_API_BASE_URL on the server)',
      },
    })
    return
  }

  /** @type {URL} */
  let upstreamUrl
  try {
    upstreamUrl = new URL(baseUrlRaw)
  } catch {
    sendJson(res, 500, {
      ok: false,
      error: { code: 'BAD_CONFIG', message: 'Invalid CROWD_API_BASE_URL' },
    })
    return
  }

  for (const [k, v] of clientUrl.searchParams.entries()) {
    upstreamUrl.searchParams.set(k, v)
  }

  const timeoutMs = parseTimeoutMs(process.env.CROWD_API_TIMEOUT_MS)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const headers = new Headers({ Accept: 'application/json' })
    const apiKey = process.env.CROWD_API_KEY?.trim()
    if (apiKey) {
      headers.set('x-api-key', apiKey)
      headers.set('Authorization', `Bearer ${apiKey}`)
    }

    const upstreamRes = await fetch(upstreamUrl.toString(), {
      method: 'GET',
      headers,
      signal: controller.signal,
    })

    const text = await upstreamRes.text()
    const ct = upstreamRes.headers.get('content-type') || ''
    const bodyContentType =
      ct.includes('json') || text.trim().startsWith('{') || text.trim().startsWith('[')
        ? 'application/json; charset=utf-8'
        : ct || 'application/octet-stream'

    res.writeHead(upstreamRes.status, {
      'Content-Type': bodyContentType,
      'Cache-Control': 'no-store',
    })
    res.end(Buffer.from(text, 'utf8'))
  } catch (e) {
    const msg =
      e instanceof Error
        ? e.name === 'AbortError'
          ? `crowd upstream timeout (${timeoutMs}ms)`
          : e.message
        : 'crowd upstream failed'
    sendJson(res, 502, {
      ok: false,
      error: { code: 'UPSTREAM_FAILED', message: msg },
    })
  } finally {
    clearTimeout(timer)
  }
}
