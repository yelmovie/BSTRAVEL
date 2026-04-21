/**
 * 혼잡도 가중치 상수 — 무료 공공·날씨 + 자체 규칙 (유료 유동인구 미사용)
 */

import type { CrowdPlaceKind } from "./types"

/** 장소 유형별 시간대 가중 (표 기반, 기본 1.0) */
export function getTimeWeight(placeKind: CrowdPlaceKind, hour: number): number {
  const h = Math.max(0, Math.min(23, Math.floor(hour)))

  if (placeKind === "restaurant") {
    if (h >= 8 && h < 10) return 0.9
    if (h >= 11 && h < 13) return 1.35
    if (h >= 14 && h < 17) return 0.95
    if (h >= 18 && h < 20) return 1.4
    return 0.9
  }

  if (placeKind === "hotel") {
    if (h >= 9 && h < 14) return 0.95
    if (h >= 15 && h < 18) return 1.15
    if (h >= 19 && h < 21) return 1.05
    return 0.95
  }

  // tour + other: 관광·일반
  if (h >= 9 && h < 11) return 1.0
  if (h >= 11 && h < 13) return 1.1
  if (h >= 14 && h < 17) return 1.25
  if (h >= 17 && h < 19) return 1.1
  return 0.95
}

export type WeatherForCrowd = {
  weatherCode: number | null
  precipitationMm: number | null
  precipitationProbabilityPct: number | null
  windSpeedMs: number | null
  temperatureC: number | null
}

/** 강수 코드 (WMO) — crowdRules와 정합 */
function isRainyCode(code: number | null): boolean {
  if (code == null || Number.isNaN(code)) return false
  if (code >= 51 && code <= 67) return true
  if (code >= 80 && code <= 82) return true
  return false
}

function isLunchDinnerRestaurant(hour: number): boolean {
  return (hour >= 11 && hour < 14) || (hour >= 17 && hour < 21)
}

/**
 * 날씨 가중치 — 유형·시간대별 (추정)
 * 여러 규칙 겹치면 곱하고 상한 clamp (과장 방지)
 */
export function getWeatherWeight(
  placeKind: CrowdPlaceKind,
  hour: number,
  w: WeatherForCrowd | null,
): number {
  if (!w || w.weatherCode == null) return 1.0

  let m = 1.0
  const pp = w.precipitationProbabilityPct ?? 0
  const precip = w.precipitationMm ?? 0
  const wind = w.windSpeedMs ?? 0
  const rainy = isRainyCode(w.weatherCode) || pp >= 55 || precip >= 2

  if (placeKind === "tour" || placeKind === "other") {
    if (pp >= 60) m *= 0.85
    if (precip >= 3) m *= 0.8
    if (wind >= 8) m *= 0.9
    if (!rainy && pp < 25 && precip < 0.5 && w.weatherCode === 0) m *= 1.05
    return clamp(m, 0.75, 1.08)
  }

  if (placeKind === "restaurant") {
    if (rainy && isLunchDinnerRestaurant(hour)) m *= 1.05
    return clamp(m, 0.94, 1.08)
  }

  // hotel
  if (rainy) m *= 0.99
  else m *= 1.01
  return clamp(m, 0.98, 1.02)
}

/** 요일·주말 가중 (공휴일 목록 있으면 추가) */
export function getDayWeight(date: Date, holidayHit: boolean): number {
  if (holidayHit) return 1.2
  const dow = date.getDay()
  if (dow === 6) return 1.18 // 토
  if (dow === 0) return 1.15 // 일
  if (dow === 5) return 1.05 // 금
  if (dow >= 1 && dow <= 4) return 0.98
  return 1.0
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n))
}
