import type { NormalizedTourPlace } from './tourTypes'
import type { TourAccessibilityFlags } from './companionFilterTypes'
import { INFERENCE_KEYWORD_GROUPS } from './companionFilterConfig'
import { parseKorWithTriState } from './korWithFieldParse'

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

function includesAny(haystack: string, needles: readonly string[]): boolean {
  const h = haystack.toLowerCase()
  return needles.some((n) => h.includes(n.toLowerCase()))
}

/**
 * TourAPI item(raw) + 정규화된 개요/요약 문자열만 사용. 새 필드명은 추가하지 않음.
 */
export function buildAccessibilityFlags(place: NormalizedTourPlace): TourAccessibilityFlags {
  const raw = place.raw
  const strollerFieldRaw = pickStr(raw, 'chkcbcnvn')
  const petFieldRaw = pickStr(raw, 'chkpetnvn')
  const expguideRaw = pickStr(raw, 'expguide')

  const textBlob = [
    expguideRaw,
    place.overview,
    place.accessibleInfo,
    place.title,
    place.address,
  ]
    .filter(Boolean)
    .join('\n')

  return {
    strollerFieldRaw,
    strollerFromKorWith: parseKorWithTriState(strollerFieldRaw),
    petFieldRaw,
    petFromKorWith: parseKorWithTriState(petFieldRaw),
    expguideRaw,
    wheelchairHintFromText: includesAny(textBlob, INFERENCE_KEYWORD_GROUPS.wheelchair),
    indoorHintFromText: includesAny(textBlob, INFERENCE_KEYWORD_GROUPS.indoor),
    parkingHintFromText: includesAny(textBlob, INFERENCE_KEYWORD_GROUPS.parking),
    restroomHintFromText: includesAny(textBlob, INFERENCE_KEYWORD_GROUPS.restroom),
    lowMobilityHintFromText: includesAny(textBlob, INFERENCE_KEYWORD_GROUPS.seniorMobility),
    familyOrChildHintFromText: includesAny(textBlob, INFERENCE_KEYWORD_GROUPS.familyChild),
  }
}
