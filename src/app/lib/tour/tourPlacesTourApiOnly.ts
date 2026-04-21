import type { AppLocale } from "../../i18n/constants"
import { applyTourContentQuality } from "./inferTourContentQuality"
import type { NormalizedTourPlace } from "./tourTypes"

/**
 * 하이브리드·외부 번역 필드 없이 TourAPI 목록 응답만으로 품질 힌트를 붙입니다.
 */
export function finalizeTourPlacesFromTourApiOnly(
  places: NormalizedTourPlace[],
  uiLocale: AppLocale,
  apiLang: string | undefined,
): NormalizedTourPlace[] {
  return places.map((p) => applyTourContentQuality(p, uiLocale, apiLang))
}
