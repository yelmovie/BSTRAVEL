import { useEffect, useState } from "react"
import { BUSAN_COORDS, type OpenMeteoCurrentWeather } from "../lib/weather/openMeteoClient"
import { getWeatherCurrentCached } from "../lib/weather/getWeather"

/** 관광지 좌표 기준 격자 예보 · 좌표 없으면 부산 시 대표 좌표 */
export function usePlaceWeather(lat: number | null | undefined, lng: number | null | undefined): {
  data: OpenMeteoCurrentWeather | null
  error: string | null
  loading: boolean
} {
  const [data, setData] = useState<OpenMeteoCurrentWeather | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const la = lat ?? BUSAN_COORDS.latitude
    const ln = lng ?? BUSAN_COORDS.longitude
    setLoading(true)
    setError(null)
    getWeatherCurrentCached(la, ln)
      .then((w) => {
        if (!cancelled) setData(w)
      })
      .catch((e: unknown) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "날씨 없음")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [lat, lng])

  return { data, error, loading }
}
