/** KorWith 공통 필드(chkcbcnvn, chkpetnvn, expguide)만 사용한 요약 — 한 곳에서만 생성 */

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v).trim()
  }
  return ''
}

export function buildAccessibleSummary(raw: Record<string, unknown>): string {
  const stroller = pickStr(raw, 'chkcbcnvn')
  const pet = pickStr(raw, 'chkpetnvn')
  const exp = pickStr(raw, 'expguide')
  const parts: string[] = []
  if (stroller) parts.push(`유모차: ${stroller}`)
  if (pet) parts.push(`반려동물: ${pet}`)
  if (exp) parts.push(exp.length > 160 ? `${exp.slice(0, 160)}…` : exp)
  return parts.join(' · ') || '세부 접근성 텍스트 필드가 응답에 없습니다'
}
