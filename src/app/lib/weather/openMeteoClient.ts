/**
 * Open-Meteo: 인증 없이 사용 가능한 오픈 날씨 API (격자 보간 예보).
 * 대한민국 공식 기상청 단기예보와 동일 데이터가 아닙니다 — UI에 반드시 출처를 표시합니다.
 * @see https://open-meteo.com/
 */
import { instrumentedFetch } from "../apiDebug/instrumentedFetch"

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
  /** API current.time (예: Asia/Seoul 타임존 문자열) */
  observationTimeDisplay: string
  /** 클라이언트 수신 완료(ISO) */
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

type OpenMeteoJson = {
  current?: {
    time?: string
    temperature_2m?: number
    relative_humidity_2m?: number
    weather_code?: number
    apparent_temperature?: number
    uv_index?: number | null
  }
}

export async function fetchBusanCurrentWeather(): Promise<OpenMeteoCurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(BUSAN_COORDS.latitude),
    longitude: String(BUSAN_COORDS.longitude),
    timezone: "Asia/Seoul",
    current: [
      "temperature_2m",
      "relative_humidity_2m",
      "weather_code",
      "apparent_temperature",
      "uv_index",
    ].join(","),
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await instrumentedFetch(url, undefined, {
    label: "Open-Meteo forecast (부산 좌표)",
  })
  const text = await res.text()
  let json: OpenMeteoJson
  try {
    json = JSON.parse(text) as OpenMeteoJson
  } catch {
    throw new Error("Open-Meteo 응답 JSON 파싱 실패")
  }
  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP ${res.status}`)
  }
  const cur = json.current
  if (!cur || typeof cur.temperature_2m !== "number") {
    throw new Error("Open-Meteo 응답에 current 기온이 없습니다")
  }
  const wc = typeof cur.weather_code === "number" ? cur.weather_code : 0
  const fetchedAtIso = new Date().toISOString()

  return {
    temperatureC: cur.temperature_2m,
    relativeHumidityPct:
      typeof cur.relative_humidity_2m === "number" ? cur.relative_humidity_2m : 0,
    weatherCode: wc,
    summaryKo: weatherCodeToSummaryKo(wc),
    apparentTemperatureC:
      typeof cur.apparent_temperature === "number" ? cur.apparent_temperature : null,
    uvIndex: cur.uv_index != null && typeof cur.uv_index === "number" ? cur.uv_index : null,
    observationTimeDisplay: typeof cur.time === "string" ? cur.time : "",
    fetchedAtIso,
  }
}
