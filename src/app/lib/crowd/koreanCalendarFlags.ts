/**
 * 고정 공휴일(양력)만 반영 — 음력 설·추석 등은 별도 데이터 없으면 미포함
 */

export function isFixedSolarPublicHolidayKR(date: Date): boolean {
  const m = date.getMonth() + 1
  const d = date.getDate()
  if (m === 1 && d === 1) return true
  if (m === 3 && d === 1) return true
  if (m === 5 && d === 5) return true
  if (m === 6 && d === 6) return true
  if (m === 8 && d === 15) return true
  if (m === 10 && d === 3) return true
  if (m === 10 && d === 9) return true
  if (m === 12 && d === 25) return true
  return false
}
