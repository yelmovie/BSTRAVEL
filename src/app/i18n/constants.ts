export const LOCALE_STORAGE_KEY = "bstravel.locale"
export const FIRST_VISIT_STORAGE_KEY = "bstravel.firstVisitModalDone"

export type AppLocale = "ko" | "en" | "ja" | "zh-CN" | "zh-TW" | "ar" | "ru"

export const SUPPORTED_LOCALES: {
  code: AppLocale
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
  { code: "ar", label: "العربية", hint: "Arabic" },
  { code: "ru", label: "Русский", hint: "Russian" },
]

export const DEFAULT_LOCALE: AppLocale = "ko"
