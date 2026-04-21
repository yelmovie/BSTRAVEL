export const LOCALE_STORAGE_KEY = "bstravel.locale"
export const FIRST_VISIT_STORAGE_KEY = "bstravel.firstVisitModalDone"

export type AppLocale = "ko" | "en" | "ja" | "zh-CN" | "zh-TW" | "ar" | "ru"
export type ActiveAppLocale = "ko" | "en" | "ja" | "zh-CN" | "zh-TW"

export const ACTIVE_LOCALES: {
  code: ActiveAppLocale
  /** UI 표시용 네이티브 이름 */
  label: string
  /** 영문 부가 표기 (선택) */
  hint?: string
}[] = [
  { code: "ko", label: "한국어" },
  { code: "en", label: "English" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "中文(简体)", hint: "Simplified Chinese" },
  { code: "zh-TW", label: "中文(繁體)", hint: "Traditional Chinese" },
]

/** 언어 선택 UI에서 노출되는 운영 언어 목록 */
export const SUPPORTED_LOCALES = ACTIVE_LOCALES

/** 향후 재오픈 가능성을 위해 파일은 유지하되, 현재는 UI 비노출 */
export const INACTIVE_LOCALES: AppLocale[] = ["ar", "ru"]

export const DEFAULT_LOCALE: AppLocale = "ko"
