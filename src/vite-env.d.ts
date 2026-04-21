/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 카카오맵 JavaScript 키(웹). 공식: 앱 키 > 플랫폼 등록 후 사용 */
  readonly VITE_KAKAO_MAP_JS_KEY?: string
  readonly VITE_APP_NAME?: string
  /** `true`이면 예시 코스·비교·정렬 칩 등 시연 확장 UI 표시 */
  readonly VITE_DEMO_MODE?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
