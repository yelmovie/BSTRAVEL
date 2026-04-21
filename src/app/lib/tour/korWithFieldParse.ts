import type { KorWithTriState } from './companionFilterTypes'

/**
 * KorWith 응답의 유모차·반려동물 등 안내 문구를 삼분법으로만 해석.
 * API가 내려주는 문자열 패턴은 다양하므로, 불명확하면 unknown/partial.
 */
export function parseKorWithTriState(raw: string): KorWithTriState {
  const s = raw.trim().toLowerCase()
  if (!s) return 'unknown'

  const neg =
    /불가|불가능|입장\s*불가|불편|제한|없음|불가\s*가|미\s*제공|미제공|해당\s*없|착석\s*불가/.test(s) ||
    /\bno\b/.test(s)
  if (neg) return 'no'

  const pos =
    /가능|입장\s*가|이용\s*가|완비|비치|설치|대여|무료|자유|편의|지원|가능\s*함/.test(s) ||
    /^(y|yes|ok)$/.test(s)
  if (pos) return 'yes'

  if (/문의|사전|협의|별도|부분|일부|제한적|조건부|상황/.test(s)) return 'partial'

  return 'partial'
}
