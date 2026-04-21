/** 캐시 키 충돌 완화용 좌표 반올림 */
export function roundCoordKey(n: number, decimals = 2): string {
  return n.toFixed(decimals)
}

/** Asia/Seoul 기준 달력 날짜 YYYY-MM-DD */
export function dateKeySeoul(d: Date): string {
  return d.toLocaleDateString("en-CA", { timeZone: "Asia/Seoul" })
}

/** 선택 시각의 서울 시각 0–23 (2자리) */
export function hourKeySeoul(d: Date): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    hour12: false,
  }).formatToParts(d)
  const hour = parts.find((p) => p.type === "hour")?.value ?? "0"
  return hour.length >= 2 ? hour : hour.padStart(2, "0")
}
