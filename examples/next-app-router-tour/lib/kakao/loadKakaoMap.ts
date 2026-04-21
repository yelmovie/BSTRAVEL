/**
 * 카카오맵 JavaScript API — 클라이언트 컴포넌트에서만 import
 * @see https://apis.map.kakao.com/web/guide/#getappkey
 */
const SCRIPT_ATTR = 'data-kakao-maps-sdk'

function scriptSrc(appKey: string): string {
  return `https://dapi.kakao.com/v2/maps-sdk.js?appkey=${encodeURIComponent(appKey)}&autoload=false`
}

let ready: Promise<void> | null = null

export function loadKakaoMapScript(appKey: string | undefined): Promise<void> {
  const key = appKey?.trim()
  if (!key) return Promise.reject(new Error('NEXT_PUBLIC_KAKAO_MAP_JS_KEY 가 비어 있습니다'))
  if (typeof window === 'undefined') return Promise.reject(new Error('클라이언트에서만 호출'))
  if (ready) return ready

  ready = new Promise<void>((resolve, reject) => {
    const runLoad = () => {
      if (!window.kakao?.maps) {
        reject(new Error('kakao.maps 없음'))
        return
      }
      window.kakao.maps.load(() => resolve())
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`)
    if (existing) {
      if (window.kakao?.maps) runLoad()
      else {
        existing.addEventListener('load', runLoad, { once: true })
        existing.addEventListener('error', () => reject(new Error('스크립트 로드 실패')), { once: true })
      }
      return
    }

    const s = document.createElement('script')
    s.setAttribute(SCRIPT_ATTR, '1')
    s.async = true
    s.src = scriptSrc(key)
    s.onload = () => runLoad()
    s.onerror = () => reject(new Error('SDK 요청 실패(도메인·키)')))
    document.head.appendChild(s)
  }).catch((e) => {
    ready = null
    throw e
  })

  return ready
}
