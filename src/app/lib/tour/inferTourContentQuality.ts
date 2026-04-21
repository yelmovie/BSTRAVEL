import type { AppLocale } from "../../i18n/constants"
import type { NormalizedTourPlace, TourContentQuality } from "./tourTypes"

function hangulDensity(text: string): number {
  const t = text.replace(/\s/g, "")
  if (!t.length) return 0
  const hangul = (t.match(/[\uAC00-\uD7A3]/g) ?? []).length
  return hangul / t.length
}

/**
 * 공공 API가 요청 언어 필드를 두지 않거나 번역이 비어 있으면 한국어가 그대로 올 수 있습니다.
 * 휴리스틱으로 '한국어 원문 우선' 가능성을 표시합니다 (기계 번역 아님).
 */
export function inferTourContentQuality(
  uiLocale: AppLocale,
  apiLang: string | undefined,
  fragments: string[],
): TourContentQuality {
  if (uiLocale === "ko") return "api_native"
  const combined = fragments.filter(Boolean).join("\n").trim()
  if (combined.length < 6) return "api_native"
  if (!apiLang || apiLang === "ko") return "api_native"

  const d = hangulDensity(combined)
  const hangulCount = (combined.match(/[\uAC00-\uD7A3]/g) ?? []).length
  if (hangulCount >= 6 && d > 0.32) return "api_fallback_ko"
  return "api_native"
}

export function applyTourContentQuality(
  place: NormalizedTourPlace,
  uiLocale: AppLocale,
  apiLang: string | undefined,
): NormalizedTourPlace {
  const q = inferTourContentQuality(uiLocale, apiLang, [
    place.title,
    place.overview,
    place.accessibleInfo,
  ])
  return {
    ...place,
    contentQuality: q,
    tourApiLangRequested: apiLang,
  }
}
