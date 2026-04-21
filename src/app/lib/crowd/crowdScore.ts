import type { CrowdPlaceKind, CrowdPredictionInput, CrowdWeatherSnapshot } from "./types"
import { getTimeWeight, getWeatherWeight, getDayWeight, type WeatherForCrowd } from "./crowdWeights"
import { isFixedSolarPublicHolidayKR } from "./koreanCalendarFlags"
import { getCrowdLabel } from "./crowdLabels"
import type { CrowdLevel } from "./types"

export type CrowdResolvedInput = CrowdPredictionInput &
  Required<
    Pick<
      CrowdPredictionInput,
      "visitHour" | "isWeekend" | "indoorOutdoor" | "popularityTier" | "stayPattern"
    >
  >

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}

/**
 * 공공 분류·인기도·실내외·체류 패턴만 반영한 일 단위 기준 비율
 * (요일·시간대·상세 날씨 가중 전 — 관광공사 분류 등 공개 데이터 기반 추정 프록시)
 */
export function computeOfficialDayBaseRatio(input: CrowdResolvedInput): number {
  let r = 1.0

  const tier = input.popularityTier
  if (tier === "major") r += 0.05
  else if (tier === "small") r -= 0.05

  const io = input.indoorOutdoor
  if (io === "outdoor") r += 0.03
  else if (io === "indoor") r -= 0.04

  const stay = input.stayPattern
  if (stay === "short") r -= 0.03
  if (stay === "long") r += 0.03

  return clamp(r, 0.82, 1.12)
}

function toWeatherForCrowd(raw: CrowdPredictionInput): WeatherForCrowd | null {
  const snap: CrowdWeatherSnapshot | undefined = raw.weatherSnapshot ?? undefined
  const code = snap?.weatherCode ?? raw.weatherCode ?? null
  if (code == null && snap == null) return null
  return {
    weatherCode: code,
    precipitationMm: snap?.precipitationMm ?? null,
    precipitationProbabilityPct: snap?.precipitationProbabilityPct ?? null,
    windSpeedMs: snap?.windSpeedMs ?? null,
    temperatureC: snap?.temperatureC ?? null,
  }
}

export type CrowdComputationBreakdown = {
  officialScore: number
  finalScore: number
  weightDay: number
  weightTime: number
  weightWeather: number
  officialLabelKo: string
  officialTier: ReturnType<typeof getCrowdLabel>["tier"]
  finalLabelKo: string
  finalTier: ReturnType<typeof getCrowdLabel>["tier"]
  legacyLevel: CrowdLevel
}

export function calculateCrowdScore(params: {
  resolvedInput: CrowdResolvedInput
  placeKind: CrowdPlaceKind
  visitDate: Date
  visitHour: number
  rawInput: CrowdPredictionInput
  /** 캐시된 일 단위 base만 주입 — 시간·날씨 가중은 여전히 런타임 계산 */
  cachedOfficialRatio?: number
}): CrowdComputationBreakdown {
  const { resolvedInput, placeKind, visitDate, visitHour, rawInput } = params

  const officialScore =
    params.cachedOfficialRatio != null && Number.isFinite(params.cachedOfficialRatio)
      ? params.cachedOfficialRatio
      : computeOfficialDayBaseRatio(resolvedInput)

  const holiday = isFixedSolarPublicHolidayKR(visitDate)
  const weightDay = getDayWeight(visitDate, holiday)

  const weightTime = getTimeWeight(placeKind, visitHour)

  const wFull = toWeatherForCrowd(rawInput)
  const weightWeather = getWeatherWeight(placeKind, visitHour, wFull)

  let finalScore = officialScore * weightDay * weightTime * weightWeather
  finalScore = clamp(finalScore, 0.45, 1.52)

  const o = getCrowdLabel(officialScore)
  const f = getCrowdLabel(finalScore)

  return {
    officialScore,
    finalScore,
    weightDay,
    weightTime,
    weightWeather,
    officialLabelKo: o.labelKo,
    officialTier: o.tier,
    finalLabelKo: f.labelKo,
    finalTier: f.tier,
    legacyLevel: f.legacyLevel,
  }
}
