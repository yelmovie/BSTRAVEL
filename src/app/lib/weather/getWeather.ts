/**
 * 날씨 — 브라우저는 내부 endpoint만 호출 (`weatherRequestUrl`).
 * 외부 Open-Meteo는 서버(weatherShared)에서만 fetch.
 */
import { instrumentedFetch } from "../apiDebug/instrumentedFetch"
import { getCache, setCache } from "../cache/simpleCache"
import { CACHE_TTL_MS } from "../cache/cacheConfig"
import { runDeduped } from "../cache/requestDedupe"
import { devCacheLog } from "../cache/devCacheLog"
import { dateKeySeoul, hourKeySeoul, roundCoordKey } from "../cache/geoKey"
import type { OpenMeteoCurrentWeather, OpenMeteoHourlySlot } from "./openMeteoTypes"
import { warnIfDevLocalWeatherLikelyMisconfigured, weatherRequestUrl } from "./weatherApiBase"

/** UI·내부 /api/weather 응답용(2분) — 서버 weather: 키와 구분 */
function hourlyCacheKey(lat: number, lng: number, when: Date): string {
  return `weather-ui:${roundCoordKey(lat)}:${roundCoordKey(lng)}:${dateKeySeoul(when)}:${hourKeySeoul(when)}`
}

function currentCacheKey(lat: number, lng: number): string {
  return `weather-ui:current:${roundCoordKey(lat)}:${roundCoordKey(lng)}`
}

function normalizeCurrent(
  raw: Partial<OpenMeteoCurrentWeather> & Record<string, unknown>,
): OpenMeteoCurrentWeather {
  return {
    temperatureC: typeof raw.temperatureC === "number" ? raw.temperatureC : 0,
    relativeHumidityPct: typeof raw.relativeHumidityPct === "number" ? raw.relativeHumidityPct : 0,
    weatherCode: typeof raw.weatherCode === "number" ? raw.weatherCode : -1,
    summaryKo: typeof raw.summaryKo === "string" ? raw.summaryKo : "정보 없음",
    apparentTemperatureC:
      typeof raw.apparentTemperatureC === "number" ? raw.apparentTemperatureC : null,
    uvIndex: typeof raw.uvIndex === "number" ? raw.uvIndex : null,
    observationTimeDisplay:
      typeof raw.observationTimeDisplay === "string" ? raw.observationTimeDisplay : "",
    fetchedAtIso: typeof raw.fetchedAtIso === "string" ? raw.fetchedAtIso : new Date().toISOString(),
  }
}

function normalizeHourly(raw: Partial<OpenMeteoHourlySlot> & Record<string, unknown>): OpenMeteoHourlySlot {
  return {
    temperatureC: typeof raw.temperatureC === "number" ? raw.temperatureC : 0,
    weatherCode: typeof raw.weatherCode === "number" ? raw.weatherCode : -1,
    summaryKo: typeof raw.summaryKo === "string" ? raw.summaryKo : "정보 없음",
    precipitationMm: typeof raw.precipitationMm === "number" ? raw.precipitationMm : null,
    precipitationProbabilityPct:
      typeof raw.precipitationProbabilityPct === "number"
        ? raw.precipitationProbabilityPct
        : null,
    windSpeedMs: typeof raw.windSpeedMs === "number" ? raw.windSpeedMs : null,
    timeLabelKo: typeof raw.timeLabelKo === "string" ? raw.timeLabelKo : "",
  }
}

async function fetchHourlyFromWeatherApi(
  latitude: number,
  longitude: number,
  when: Date,
): Promise<OpenMeteoHourlySlot | null> {
  const date = dateKeySeoul(when)
  const hour = hourKeySeoul(when)
  const qs = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    date,
    hour,
  })
  const url = weatherRequestUrl(`/api/weather?${qs}`)
  const res = await instrumentedFetch(
    url,
    undefined,
    { label: `GET /api/weather hourly (${roundCoordKey(latitude)}, ${roundCoordKey(longitude)})` },
  )
  if (import.meta.env.DEV) warnIfDevLocalWeatherLikelyMisconfigured(res, url)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    return null
  }
  const o = json as {
    ok?: boolean
    kind?: string
    data?: Partial<OpenMeteoHourlySlot> & Record<string, unknown>
  }
  if (!res.ok || !o.ok || o.kind !== "hourly" || !o.data) return null
  return normalizeHourly(o.data)
}

async function fetchCurrentFromWeatherApi(
  latitude: number,
  longitude: number,
): Promise<OpenMeteoCurrentWeather | null> {
  const qs = new URLSearchParams({
    lat: String(latitude),
    lng: String(longitude),
    mode: "current",
  })
  const url = weatherRequestUrl(`/api/weather?${qs}`)
  const res = await instrumentedFetch(url, undefined, {
    label: `GET /api/weather current (${roundCoordKey(latitude)}, ${roundCoordKey(longitude)})`,
  })
  if (import.meta.env.DEV) warnIfDevLocalWeatherLikelyMisconfigured(res, url)
  let json: unknown
  try {
    json = await res.json()
  } catch {
    return null
  }
  const o = json as {
    ok?: boolean
    kind?: string
    data?: Partial<OpenMeteoCurrentWeather> & Record<string, unknown>
  }
  if (!res.ok || !o.ok || o.kind !== "current" || !o.data) return null
  return normalizeCurrent(o.data)
}

/** API 실패·파싱 실패 시 — UI에서 weatherCode -1 로 구분 가능 */
export function weatherCurrentFallback(): OpenMeteoCurrentWeather {
  return {
    temperatureC: 0,
    relativeHumidityPct: 0,
    weatherCode: -1,
    summaryKo: "정보 없음",
    apparentTemperatureC: null,
    uvIndex: null,
    observationTimeDisplay: "",
    fetchedAtIso: new Date().toISOString(),
  }
}

export function weatherHourlyUnavailable(when: Date): OpenMeteoHourlySlot {
  return {
    temperatureC: 0,
    weatherCode: -1,
    summaryKo: "정보 없음",
    precipitationMm: null,
    precipitationProbabilityPct: null,
    windSpeedMs: null,
    timeLabelKo: when.toLocaleString("ko-KR", {
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Seoul",
    }),
  }
}

export async function getWeatherHourlyCached(
  latitude: number,
  longitude: number,
  when: Date,
): Promise<OpenMeteoHourlySlot> {
  const key = hourlyCacheKey(latitude, longitude, when)
  const mem = getCache<OpenMeteoHourlySlot>(key)
  if (mem) return mem

  return runDeduped(key, async () => {
    const inner = getCache<OpenMeteoHourlySlot>(key)
    if (inner) return inner
    try {
      const slot = await fetchHourlyFromWeatherApi(latitude, longitude, when)
      if (slot) {
        setCache(key, slot, CACHE_TTL_MS.weatherClient)
        return slot
      }
    } catch {
      /* fallthrough */
    }
    devCacheLog("fallback-used", key)
    const fb = weatherHourlyUnavailable(when)
    setCache(key, fb, CACHE_TTL_MS.weatherFallback)
    return fb
  })
}

export async function getWeatherCurrentCached(
  latitude: number,
  longitude: number,
): Promise<OpenMeteoCurrentWeather> {
  const key = currentCacheKey(latitude, longitude)
  const mem = getCache<OpenMeteoCurrentWeather>(key)
  if (mem) return mem

  return runDeduped(key, async () => {
    const inner = getCache<OpenMeteoCurrentWeather>(key)
    if (inner) return inner
    try {
      const cur = await fetchCurrentFromWeatherApi(latitude, longitude)
      if (cur) {
        setCache(key, cur, CACHE_TTL_MS.weatherClient)
        return cur
      }
    } catch {
      /* fallthrough */
    }
    devCacheLog("fallback-used", key)
    const fb = weatherCurrentFallback()
    setCache(key, fb, CACHE_TTL_MS.weatherFallback)
    return fb
  })
}
