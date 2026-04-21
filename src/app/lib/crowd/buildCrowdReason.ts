import type { CrowdPredictionInput } from "./types"
import type { InferredProfile } from "./inferCrowdProfile"
import { isSignificantRain } from "./crowdRules"

/**
 * 규칙 기반 한 줄 설명 — 실측·정확 수치 언급 금지
 */
export function buildCrowdReason(opts: {
  profile: InferredProfile
  visitHour: number
  isWeekend: boolean
  weatherCode: number | null | undefined
}): string {
  const { profile, visitHour, isWeekend, weatherCode } = opts
  const rain = isSignificantRain(weatherCode ?? null)
  const afternoon = visitHour >= 13 && visitHour <= 17
  const morning = visitHour >= 9 && visitHour <= 11

  const bits: string[] = []

  if (profile.popularityTier === "major") bits.push("대표 관광지 특성")
  else if (profile.popularityTier === "small") bits.push("소규모 장소 특성")

  if (isWeekend) bits.push("주말 수요")
  else bits.push("평일 패턴")

  if (afternoon) bits.push("오후 시간대")
  else if (morning) bits.push("오전 시간대")

  if (profile.indoorOutdoor === "outdoor") bits.push("실외 동선 비중")
  else if (profile.indoorOutdoor === "indoor") bits.push("실내 관람형")

  if (rain && profile.indoorOutdoor === "outdoor") bits.push("강수 시 실외 동선 부담 완화 기대")

  const core = bits.slice(0, 3).join(", ")
  return `${core}을(를) 반영한 시간대·유형 추정입니다.`
}

/** 카드 보조 설명 한 줄 */
export function buildCrowdSummaryLine(level: "low" | "medium" | "high"): string {
  if (level === "low") return "현재 조건 기준으로 비교적 편하게 동선을 짜기 쉬울 가능성이 큽니다."
  if (level === "medium") return "일부 시간대에 방문객이 몰릴 수 있어 여유 시간을 두는 편이 좋습니다."
  return "대기 또는 이동 밀집이 생길 수 있어 동선·일정 여유를 권합니다."
}
