import { useEffect, useState } from "react"
import type { OpenMeteoCurrentWeather } from "../lib/weather/openMeteoClient"
import { BUSAN_COORDS } from "../lib/weather/openMeteoClient"
import { getWeatherCurrentCached } from "../lib/weather/getWeather"

export type OpenMeteoHookState =
  | { status: "loading" }
  | { status: "ok"; data: OpenMeteoCurrentWeather }
  | { status: "error"; message: string }

export function useOpenMeteoBusan(): OpenMeteoHookState {
  const [state, setState] = useState<OpenMeteoHookState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })
    getWeatherCurrentCached(BUSAN_COORDS.latitude, BUSAN_COORDS.longitude)
      .then((data) => {
        if (!cancelled) setState({ status: "ok", data })
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setState({
            status: "error",
            message: e instanceof Error ? e.message : "날씨 정보를 불러오지 못했습니다",
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return state
}
