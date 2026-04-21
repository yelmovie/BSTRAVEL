/**
 * 개발 환경에서만 캐시·요청 관측용 로그 (프로덕션 출력 없음)
 */

const PREFIXES = ["weather:", "weather-ui:", "recommend:", "crowd:", "tourList:", "/api/tour"]

function isInteresting(key: string): boolean {
  return PREFIXES.some((p) => key.includes(p))
}

export function devCacheLog(tag: string, keyOrDetail?: string): void {
  if (!import.meta.env.DEV) return
  const d = keyOrDetail ?? ""
  if (tag === "cache-hit" && d && !isInteresting(d)) return
  // eslint-disable-next-line no-console
  console.log(`[${tag}]`, d)
}
