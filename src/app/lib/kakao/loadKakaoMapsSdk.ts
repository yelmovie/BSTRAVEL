/**
 * 카카오맵 JavaScript API 스크립트 로더 (공식: autoload=false 후 kakao.maps.load)
 * @see https://apis.map.kakao.com/web/guide/#getappkey
 *
 * 키: import.meta.env.VITE_KAKAO_MAP_JS_KEY (호출 시 인자 생략 시 사용)
 */
const SCRIPT_ATTR = 'data-kakao-maps-sdk'

type KakaoSdkDiagnostics = {
  keyDetected: boolean
  maskedKey: string
  maskedUrl: string
  existingScriptTag: boolean
  lastScriptEvent: 'idle' | 'load' | 'error' | 'abort'
  userAgent: string
  windowKakaoExists: boolean
  windowKakaoMapsExists: boolean
}

type KakaoWindow = Window & {
  __BSTRAVEL_KAKAO_SDK_URL__?: string
  __BSTRAVEL_KAKAO_SDK_DIAGNOSTICS__?: KakaoSdkDiagnostics
}

/** 공식 스크립트 경로 — `/v2/maps/sdk.js` */
function scriptSrc(appKey: string): string {
  return `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
}

let readyPromise: Promise<typeof kakao.maps> | null = null

function maskKey(raw?: string | null): string {
  const key = typeof raw === 'string' ? raw.trim() : ''
  if (!key) return '(missing)'
  if (key.length <= 8) return `${key.slice(0, 2)}… (${key.length} chars)`
  return `${key.slice(0, 4)}…${key.slice(-4)} (${key.length} chars)`
}

function updateDiagnostics(next: Partial<KakaoSdkDiagnostics>) {
  if (typeof window === 'undefined') return
  const w = window as KakaoWindow
  const current: KakaoSdkDiagnostics = w.__BSTRAVEL_KAKAO_SDK_DIAGNOSTICS__ ?? {
    keyDetected: false,
    maskedKey: '(missing)',
    maskedUrl: '',
    existingScriptTag: false,
    lastScriptEvent: 'idle',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '(no navigator)',
    windowKakaoExists: Boolean(window.kakao),
    windowKakaoMapsExists: Boolean(window.kakao?.maps),
  }
  w.__BSTRAVEL_KAKAO_SDK_DIAGNOSTICS__ = {
    ...current,
    ...next,
  }
}

export function getKakaoSdkDiagnostics(): KakaoSdkDiagnostics | null {
  if (typeof window === 'undefined') return null
  return (window as KakaoWindow).__BSTRAVEL_KAKAO_SDK_DIAGNOSTICS__ ?? null
}

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
  const url = key ? scriptSrc(key) : ''
  const maskedUrl = url ? url.replace(/appkey=[^&]+/, `appkey=${maskKey(key)}`) : ''
  const existing = typeof document !== 'undefined'
    ? document.querySelector<HTMLScriptElement>(`script[${SCRIPT_ATTR}]`)
    : null

  updateDiagnostics({
    keyDetected: Boolean(key),
    maskedKey: maskKey(key),
    maskedUrl,
    existingScriptTag: Boolean(existing),
    lastScriptEvent: 'idle',
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '(no navigator)',
    windowKakaoExists: Boolean(window.kakao),
    windowKakaoMapsExists: Boolean(window.kakao?.maps),
  })

  if (import.meta.env.DEV) {
    if (!key) {
      // eslint-disable-next-line no-console
      console.warn('[Kakao Maps] VITE_KAKAO_MAP_JS_KEY 가 비어 있습니다 (.env.local 확인)')
    } else {
      // eslint-disable-next-line no-console
      console.log('[Kakao Maps] 앱 키 감지:', maskKey(key))
      // eslint-disable-next-line no-console
      console.log('[Kakao Maps] SDK URL:', maskedUrl)
      // eslint-disable-next-line no-console
      console.log('[Kakao Maps] 기존 script 존재:', Boolean(existing))
      // eslint-disable-next-line no-console
      console.log('[Kakao Maps] userAgent:', typeof navigator !== 'undefined' ? navigator.userAgent : '(no navigator)')
      if (typeof window !== 'undefined') {
        ;(window as KakaoWindow).__BSTRAVEL_KAKAO_SDK_URL__ = url
      }
    }
  }

  if (!key) {
    return Promise.reject(new Error('VITE_KAKAO_MAP_JS_KEY 가 비어 있습니다'))
  }
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('브라우저 환경에서만 로드할 수 있습니다'))
  }
  if (window.kakao?.maps) {
    return Promise.resolve(window.kakao.maps)
  }
  if (readyPromise) return readyPromise

  readyPromise = new Promise<typeof kakao.maps>((resolve, reject) => {
    const blockedMessage =
      'Kakao 지도 스크립트 요청이 차단되었을 수 있습니다. 브라우저 확장 프로그램, 추적 방지 기능, 보안 프로그램, 네트워크 차단, 또는 카카오 JavaScript 키/도메인 등록을 확인하세요.'

    const finishLoad = () => {
      updateDiagnostics({
        windowKakaoExists: Boolean(window.kakao),
        windowKakaoMapsExists: Boolean(window.kakao?.maps),
      })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[Kakao Maps] window.kakao exists after load:', Boolean(window.kakao))
        // eslint-disable-next-line no-console
        console.log('[Kakao Maps] window.kakao.maps exists after load:', Boolean(window.kakao?.maps))
      }
      try {
        if (!window.kakao?.maps) {
          reject(new Error('Kakao not loaded'))
          return
        }
        window.kakao.maps.load(() => {
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log('[Kakao Maps] SDK 로드 및 kakao.maps.load 완료')
          }
          resolve(window.kakao.maps)
        })
      } catch (e) {
        reject(e instanceof Error ? e : new Error('kakao.maps.load 실패'))
      }
    }

    if (existing) {
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[Kakao Maps] 기존 SDK script 재사용')
      }
      existing.addEventListener('load', () => {
        updateDiagnostics({ lastScriptEvent: 'load' })
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.log('[Kakao Maps] script event: load (existing)')
        }
        finishLoad()
      }, { once: true })
      existing.addEventListener('error', () => {
        updateDiagnostics({ lastScriptEvent: 'error' })
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('[Kakao Maps] script event: error (existing)')
        }
        reject(new Error(blockedMessage))
      }, { once: true })
      existing.addEventListener('abort', () => {
        updateDiagnostics({ lastScriptEvent: 'abort' })
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.error('[Kakao Maps] script event: abort (existing)')
        }
        reject(new Error(blockedMessage))
      }, { once: true })
      if (window.kakao?.maps) finishLoad()
      return
    }

    const script = document.createElement('script')
    script.setAttribute(SCRIPT_ATTR, '1')
    script.async = true
    script.src = url
    script.onload = () => {
      updateDiagnostics({ lastScriptEvent: 'load' })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.log('[Kakao Maps] script event: load')
      }
      finishLoad()
    }
    script.onerror = () => {
      updateDiagnostics({
        lastScriptEvent: 'error',
        windowKakaoExists: Boolean(window.kakao),
        windowKakaoMapsExists: Boolean(window.kakao?.maps),
      })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[Kakao Maps] script event: error')
        // eslint-disable-next-line no-console
        console.error('[Kakao Maps] SDK script network load failed')
      }
      reject(new Error(blockedMessage))
    }
    script.onabort = () => {
      updateDiagnostics({
        lastScriptEvent: 'abort',
        windowKakaoExists: Boolean(window.kakao),
        windowKakaoMapsExists: Boolean(window.kakao?.maps),
      })
      if (import.meta.env.DEV) {
        // eslint-disable-next-line no-console
        console.error('[Kakao Maps] script event: abort')
      }
      reject(new Error(blockedMessage))
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
