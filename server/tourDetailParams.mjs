/**
 * KorService2 detailCommon2 요청 파라미터 구성
 *
 * 참고: 일부 게이트웨이는 `addrinfoYN` 포함 시 INVALID_REQUEST_PARAMETER_ERROR 로 거절합니다.
 *       해당 키는 클라이언트·프록시 모두에서 전달하지 않습니다.
 */

/** 브라우저 쿼리에서 받아 업스트림으로 넘길 수 있는 키 (스펙 동기화 시 이 목록만 수정) */
export const DETAIL_COMMON2_ALLOWED_QUERY_KEYS = [
  'contentId',
  'contentTypeId',
  'defaultYN',
  'firstImageYN',
  'areacodeYN',
  'catcodeYN',
  'mapinfoYN',
  'overviewYN',
  'lang',
]

const YN_KEYS = new Set([
  'defaultYN',
  'firstImageYN',
  'areacodeYN',
  'catcodeYN',
  'mapinfoYN',
  'overviewYN',
])

/**
 * URLSearchParams → 허용 키만 추출 (undefined/null/빈 문자열 제외)
 * @param {URLSearchParams} searchParams
 * @returns {Record<string, string>}
 */
export function pickDetailCommon2Params(searchParams) {
  /** @type {Record<string, string>} */
  const out = {}
  for (const key of DETAIL_COMMON2_ALLOWED_QUERY_KEYS) {
    const raw = searchParams.get(key)
    if (raw == null) continue
    const t = String(raw).trim()
    if (t === '') continue
    out[key] = t
  }
  return out
}

/**
 * API가 기대하는 Y/N 정규화 — 그 외 값은 제거하여 잘못된 파라미터 전달 방지
 * @param {Record<string, string>} params
 */
export function normalizeYnParams(params) {
  /** @type {Record<string, string>} */
  const out = { ...params }
  for (const key of YN_KEYS) {
    if (!(key in out)) continue
    const u = String(out[key]).trim().toUpperCase()
    if (u === 'Y' || u === 'N') out[key] = u
    else delete out[key]
  }
  return out
}

/**
 * 목록 연동 클라이언트와 동일하게 기본 요청 플래그 채움 (없을 때만)
 * @param {Record<string, string>} params
 */
export function applyDetailCommon2Defaults(params) {
  /** @type {Record<string, string>} */
  const next = { ...params }
  const defaults = {
    defaultYN: 'Y',
    firstImageYN: 'Y',
    areacodeYN: 'Y',
    catcodeYN: 'Y',
    mapinfoYN: 'Y',
    overviewYN: 'Y',
  }
  for (const [k, v] of Object.entries(defaults)) {
    if (!(k in next) || next[k] === '') next[k] = v
  }
  return normalizeYnParams(next)
}
