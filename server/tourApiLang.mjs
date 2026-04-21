const TOUR_SERVICE2_BASE_BY_LANG = {
  ko: 'https://apis.data.go.kr/B551011/KorService2',
  en: 'https://apis.data.go.kr/B551011/EngService2',
  ja: 'https://apis.data.go.kr/B551011/JpnService2',
  'zh-CN': 'https://apis.data.go.kr/B551011/ChsService2',
  'zh-TW': 'https://apis.data.go.kr/B551011/ChtService2',
}

/**
 * 브라우저 쿼리 `lang` 을 프록시 내부 표준 로케일로 정규화합니다.
 * KorService2 계열은 `lang` 파라미터가 아니라 서비스군 자체가 달라지므로,
 * 이 값은 upstream query가 아니라 서비스 선택에만 사용합니다.
 *
 * @param {string | null | undefined} raw
 * @returns {'ko'|'en'|'ja'|'zh-CN'|'zh-TW'|null}
 */
export function normalizeTourQueryLang(raw) {
  if (raw == null || String(raw).trim() === '') return 'ko'
  const t = String(raw).trim()
  const lc = t.toLowerCase().replace(/_/g, '-')
  if (lc === 'ko') return 'ko'
  if (lc === 'en') return 'en'
  if (lc === 'ja' || lc === 'jp') return 'ja'
  if (lc === 'zh' || lc === 'zh-cn' || lc === 'cn') return 'zh-CN'
  if (lc === 'zh-tw' || lc === 'zh-hant' || lc === 'tw') return 'zh-TW'
  return null
}

/**
 * @param {string} operation
 * @param {Record<string, string | number | undefined | null>} paramRecord
 */
export function buildTourService2Request(operation, paramRecord) {
  const requestedLang = normalizeTourQueryLang(paramRecord?.lang)
  if (requestedLang == null) {
    const err = new Error('Invalid lang. Use ko, en, ja, zh-CN, zh-TW')
    err.code = 'BAD_REQUEST'
    err.reason = 'INVALID_LANG'
    throw err
  }

  /** @type {Record<string, string | number>} */
  const params = {}
  for (const [key, value] of Object.entries(paramRecord ?? {})) {
    if (key === 'lang') continue
    if (value == null || String(value).trim() === '') continue
    params[key] = value
  }

  return {
    operation,
    requestedLang,
    baseUrl: TOUR_SERVICE2_BASE_BY_LANG[requestedLang],
    params,
  }
}
