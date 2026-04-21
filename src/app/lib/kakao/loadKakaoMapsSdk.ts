/**
 * 카카오맵 JavaScript API 스크립트 로더 (공식: autoload=false 후 kakao.maps.load)
 * @see https://apis.map.kakao.com/web/guide/#getappkey
 *
 * 키: import.meta.env.VITE_KAKAO_MAP_JS_KEY (호출 시 인자 생략 시 사용)
 */
const SCRIPT_ATTR = 'data-kakao-maps-sdk'

/** 공식 스크립트 경로 — `/v2/maps/sdk.js` */
function scriptSrc(appKey: string): string {
  const key = encodeURIComponent(appKey)
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${key}&autoload=false`
}

let readyPromise: Promise<typeof kakao.maps> | null = null

function resolveAppKey(explicit?: string | null): string | undefined {
  const fromEnv =
    typeof import.meta.env.VITE_KAKAO_MAP_JS_KEY === 'string'
      ? import.meta.env.VITE_KAKAO_MAP_JS_KEY.trim()
      : ''
  return (explicit?.trim() || fromEnv) || undefined
}

/**
 * 카카오 맵 SDK를 한 번만 로드하고 `kakao.maps.load` 완료 후 **`kakao.maps` 네임스페이스**를 반환합니다.
 * @param appKey 생략 시 `import.meta.env.VITE_KAKAO_MAP_JS_KEY` 사용
 */
export function loadKakaoMapsSdk(appKey?: string | undefined | null): Promise<typeof kakao.maps> {
  const key = resolveAppKey(appKey ?? null)

  if (import.meta.env.DEV) {
    if (!key) {
      // eslint-disable-next-line no-console
      console.warn('[Kakao Maps] VITE_KAKAO_MAP_JS_KEY 가 비어 있습니다 (.env.local 확인)')
    } else {
      // eslint-disable-next-line no-console
      console.log('[Kakao Maps] 앱 키가 설정되어 있습니다 (값은 로그에 출력하지 않음)')
    }
  }

  if (!key) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_JS_KEY 가 비어 있습니다'))
  }
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 로드할 수 있습니다'))
  }
  if (readyPromise) return readyPromise

  readyPromise = new Promise<typeof kakao.maps>((resolve, reject) => {
    const invokeLoad = () => {
      try {
        if (!window.kakao?.maps) {
          reject(new Error('window.kakao.maps 가 없습니다'))
          return
        }
        const mapsNs = window.kakao.maps
        mapsNs.load(() => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[Kakao Maps] SDK 로드 및 kakao.maps.load 완료')
          }
          resolve(mapsNs)
        })
      } catch (e) {
        reject(e instanceof Error ? e : new Error('kakao.maps.load 실패'))
      }
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`)
    if (existing) {
      if (window.kakao?.maps) {
        invokeLoad()
      } else {
        existing.addEventListener('load', invokeLoad, { once: true })
        existing.addEventListener(
          'error',
          () => reject(new Error('카카오맵 스크립트 로드 실패')),
          { once: true },
        )
      }
      return
    }

    const script = document.createElement('script')
    script.setAttribute(SCRIPT_ATTR, '1')
    script.async = true
    script.src = scriptSrc(key)
    script.onload = () => invokeLoad()
    script.onerror = () => {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[Kakao Maps] SDK 스크립트 네트워크 로드 실패 (도메인 등록·키·네트워크 확인)')
      }
      reject(new Error('카카오맵 SDK 요청 실패(도메인·키·네트워크 등)'))
    }
    document.head.appendChild(script)
  }).catch((e) => {
    readyPromise = null
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[Kakao Maps] SDK 로드 실패', e)
    }
    throw e
  })

  return readyPromise
}
