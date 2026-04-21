import type { AppLocale } from "./constants"

/**
 * 한국관광공사 KorWithService2 등 TourAPI 호출 시 쿼리 `lang` 값.
 * 공공데이터포털 명세와 다를 경우 이 파일만 조정하면 됩니다.
 *
 * 규칙: UI 로케일과 동일 계열을 우선 요청하고, TourAPI 미지원 로케일(ar/ru 등)은 영어 데이터를 요청합니다.
 */
export function localeToTourApiLang(locale: AppLocale): string | undefined {
  const map: Record<AppLocale, string | undefined> = {
    ko: undefined,
    en: "en",
    ja: "ja",
    "zh-CN": "zh-CN",
    "zh-TW": "zh-TW",
    ar: "en",
    ru: "en",
  }
  return map[locale]
}

/** 디버그·안내 문구용 (예: en, zh-CN) */
export function tourApiLangCodeOrDefault(locale: AppLocale): string {
  return localeToTourApiLang(locale) ?? "ko"
}
