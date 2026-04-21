/**
 * 날씨 UI 모델 — 브라우저 번들에는 본 파일만 포함하고,
 * 외부 격자 API 호출은 Node `server/weatherApi.mjs` 단일 진입만 사용합니다.
 */
/** 부산 시청 인근 대표 좌표 (시연·동일 지역 고정) */
export const BUSAN_COORDS = { latitude: 35.1796, longitude: 129.0756 } as const

export const OPEN_METEO_ATTRIBUTION =
  "Open-Meteo (격자 예보·키 불필요, 기상청 단기예보와 동일하지 않을 수 있음)"

export type OpenMeteoCurrentWeather = {
  temperatureC: number
  relativeHumidityPct: number
  weatherCode: number
  summaryKo: string
  apparentTemperatureC: number | null
  uvIndex: number | null
  observationTimeDisplay: string
  fetchedAtIso: string
}

/** WMO Weather interpretation codes (Open-Meteo) — 요약 한글 */
export function weatherCodeToSummaryKo(code: number): string {
  if (code === 0) return "맑음"
  if (code <= 3) return "구름 많음"
  if (code <= 48) return "안개"
  if (code <= 57) return "이슬비"
  if (code <= 67) return "비"
  if (code <= 77) return "눈"
  if (code <= 82) return "소나기"
  if (code <= 86) return "눈 소나기"
  if (code <= 99) return "뇌우"
  return `기상코드 ${code}`
}

/** Open-Meteo 시간열 슬롯 (Asia/Seoul 근사 시각 매칭 결과) */
export type OpenMeteoHourlySlot = {
  temperatureC: number
  weatherCode: number
  summaryKo: string
  precipitationMm: number | null
  precipitationProbabilityPct: number | null
  windSpeedMs: number | null
  timeLabelKo: string
}
