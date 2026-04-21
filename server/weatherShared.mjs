/**
 * Open-Meteo 단일 진입 — Node(tourApi)·Vercel(api/weather) 공용.
 * 캐시/dedupe는 프로세스(또는 함수 인스턴스) 단위 메모리.
 */
const WEATHER_CACHE_TTL_MS = 30 * 60 * 1000

const WEATHER_DEV =
  process.env.NODE_ENV !== 'production' || process.env.WEATHER_CACHE_DEBUG === '1'

function wlog(tag, msg) {
  if (WEATHER_DEV) {
    // eslint-disable-next-line no-console
    console.log(`[${tag}]`, msg ?? '')
  }
}

/** @type {Map<string, { expiry: number, value: unknown }>} */
const weatherCache = new Map()
/** @type {Map<string, Promise<unknown>>} */
const weatherInflight = new Map()

function roundCoordKey(n) {
  return Number(n).toFixed(2)
}

function getCached(key) {
  const e = weatherCache.get(key)
  if (e && e.expiry > Date.now()) return e.value
  return null
}

function setCached(key, value) {
  weatherCache.set(key, { expiry: Date.now() + WEATHER_CACHE_TTL_MS, value })
}

async function runDeduped(key, factory) {
  const existing = weatherInflight.get(key)
  if (existing) {
    wlog('dedupe-hit', key)
    return existing
  }
  const pending = factory().finally(() => {
    if (weatherInflight.get(key) === pending) weatherInflight.delete(key)
  })
  weatherInflight.set(key, pending)
  return pending
}

function weatherCodeToSummaryKo(code) {
  if (code === 0) return '맑음'
  if (code <= 3) return '구름 많음'
  if (code <= 48) return '안개'
  if (code <= 57) return '이슬비'
  if (code <= 67) return '비'
  if (code <= 77) return '눈'
  if (code <= 82) return '소나기'
  if (code <= 86) return '눈 소나기'
  if (code <= 99) return '뇌우'
  return `기상코드 ${code}`
}

/**
 * @param {number} lat
 * @param {number} lng
 */
async function fetchCurrentFromOpenMeteo(lat, lng) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: 'Asia/Seoul',
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'weather_code',
      'apparent_temperature',
      'uv_index',
    ].join(','),
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params}`
  wlog('external-fetch', url.split('?')[0])
  const res = await fetch(url)
  const text = await res.text()
  /** @type {{ current?: Record<string, unknown> }} */
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error('Open-Meteo JSON 파싱 실패')
  }
  if (!res.ok) throw new Error(`Open-Meteo HTTP ${res.status}`)
  const cur = json.current
  if (!cur || typeof cur.temperature_2m !== 'number') {
    throw new Error('Open-Meteo current 없음')
  }
  const wc = typeof cur.weather_code === 'number' ? cur.weather_code : 0
  return {
    temperatureC: cur.temperature_2m,
    relativeHumidityPct: typeof cur.relative_humidity_2m === 'number' ? cur.relative_humidity_2m : 0,
    weatherCode: wc,
    summaryKo: weatherCodeToSummaryKo(wc),
    apparentTemperatureC: typeof cur.apparent_temperature === 'number' ? cur.apparent_temperature : null,
    uvIndex: cur.uv_index != null && typeof cur.uv_index === 'number' ? cur.uv_index : null,
    observationTimeDisplay: typeof cur.time === 'string' ? cur.time : '',
    fetchedAtIso: new Date().toISOString(),
  }
}

/**
 * @param {number} lat
 * @param {number} lng
 * @param {Date} when
 */
async function fetchHourlySlotFromOpenMeteo(lat, lng, when) {
  const dayStr = when.toLocaleDateString('en-CA', { timeZone: 'Asia/Seoul' })
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    timezone: 'Asia/Seoul',
    hourly: [
      'temperature_2m',
      'weather_code',
      'precipitation',
      'precipitation_probability',
      'wind_speed_10m',
    ].join(','),
    start_date: dayStr,
    end_date: dayStr,
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params}`
  wlog('external-fetch', url.split('?')[0])
  const res = await fetch(url)
  const text = await res.text()
  /** @type {{ hourly?: { time?: string[], temperature_2m?: unknown[], weather_code?: unknown[], precipitation?: unknown[], precipitation_probability?: unknown[], wind_speed_10m?: unknown[] } }} */
  let json
  try {
    json = JSON.parse(text)
  } catch {
    return null
  }
  if (!res.ok) return null
  const h = json.hourly
  const times = h?.time
  if (!times?.length || !h?.temperature_2m?.length) return null

  const targetMs = when.getTime()
  let bestI = 0
  let bestDelta = Infinity
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i])
    if (Number.isNaN(t)) continue
    const d = Math.abs(t - targetMs)
    if (d < bestDelta) {
      bestDelta = d
      bestI = i
    }
  }

  const wcRaw = h.weather_code?.[bestI]
  const wc = typeof wcRaw === 'number' ? wcRaw : 0
  const tempRaw = h.temperature_2m?.[bestI]
  if (typeof tempRaw !== 'number') return null

  const precip = h.precipitation?.[bestI]
  const pprob = h.precipitation_probability?.[bestI]
  const wind = h.wind_speed_10m?.[bestI]
  const slotTime = times[bestI] ? new Date(times[bestI]) : when
  const timeLabelKo = slotTime.toLocaleString('ko-KR', {
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'Asia/Seoul',
  })

  return {
    temperatureC: tempRaw,
    weatherCode: wc,
    summaryKo: weatherCodeToSummaryKo(wc),
    precipitationMm: typeof precip === 'number' ? precip : null,
    precipitationProbabilityPct: typeof pprob === 'number' ? pprob : null,
    windSpeedMs: typeof wind === 'number' ? wind : null,
    timeLabelKo,
  }
}

function hourlyCacheKey(lat, lng, dateStr, hourStr) {
  return `weather:${roundCoordKey(lat)}:${roundCoordKey(lng)}:${dateStr}:${hourStr}`
}

function currentCacheKey(lat, lng) {
  return `weather:current:${roundCoordKey(lat)}:${roundCoordKey(lng)}`
}

/**
 * UI·클라이언트 호환 기존 형태: { ok, kind, source, cached, data } 또는 오류 envelope
 * @param {URL} url — searchParams 에 lat,lng[,mode,date,hour]
 * @returns {Promise<{ status: number, body: object }>}
 */
export async function getWeatherJsonForRequest(url) {
  const lat = parseFloat(url.searchParams.get('lat') ?? '')
  const lng = parseFloat(url.searchParams.get('lng') ?? '')
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return {
      status: 400,
      body: { ok: false, error: { code: 'BAD_REQUEST', message: 'lat, lng required' } },
    }
  }

  const mode = (url.searchParams.get('mode') ?? '').trim()
  if (mode === 'current') {
    const key = currentCacheKey(lat, lng)
    let data = getCached(key)
    let fromServerCache = false
    if (data) {
      fromServerCache = true
      wlog('cache-hit', key)
    }
    if (!data) {
      try {
        data = await runDeduped(key, async () => {
          const again = getCached(key)
          if (again) {
            wlog('cache-hit', `${key} (race)`)
            return again
          }
          const cur = await fetchCurrentFromOpenMeteo(lat, lng)
          setCached(key, cur)
          return cur
        })
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Open-Meteo 실패'
        return {
          status: 502,
          body: { ok: false, error: { code: 'WEATHER_UPSTREAM', message: msg } },
        }
      }
    }
    return {
      status: 200,
      body: {
        ok: true,
        kind: 'current',
        source: 'open-meteo',
        cached: fromServerCache,
        data,
      },
    }
  }

  const date = (url.searchParams.get('date') ?? '').trim()
  const hour = (url.searchParams.get('hour') ?? '').trim()
  if (!date || !hour) {
    return {
      status: 400,
      body: {
        ok: false,
        error: { code: 'BAD_REQUEST', message: 'hourly requires date, hour (or mode=current)' },
      },
    }
  }

  const hourPadded = hour.length >= 2 ? hour : hour.padStart(2, '0')
  const when = new Date(`${date}T${hourPadded}:00:00+09:00`)
  const key = hourlyCacheKey(lat, lng, date, hourPadded)

  let data = getCached(key)
  let fromServerCache = false
  if (data) {
    fromServerCache = true
    wlog('cache-hit', key)
  }
  if (!data) {
    try {
      data = await runDeduped(key, async () => {
        const again = getCached(key)
        if (again) {
          wlog('cache-hit', `${key} (race)`)
          return again
        }
        const slot = await fetchHourlySlotFromOpenMeteo(lat, lng, when)
        if (slot) {
          setCached(key, slot)
          return slot
        }
        return null
      })
    } catch {
      data = null
    }
  }

  if (!data) {
    return {
      status: 502,
      body: { ok: false, error: { code: 'WEATHER_HOURLY_EMPTY', message: '시간대 예보 없음' } },
    }
  }

  return {
    status: 200,
    body: {
      ok: true,
      kind: 'hourly',
      source: 'open-meteo',
      cached: fromServerCache,
      data,
    },
  }
}
