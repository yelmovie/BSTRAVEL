/** 주소 조합 규칙 단일화 */
export function formatTourAddress(addr1: string, addr2: string): string {
  const a = addr1.trim()
  const b = addr2.trim()
  if (a && b) return `${a} ${b}`
  return a || b || ''
}
