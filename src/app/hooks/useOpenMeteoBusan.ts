import { useEffect, useState } from "react"
import {
  fetchBusanCurrentWeather,
  type OpenMeteoCurrentWeather,
} from "../lib/weather/openMeteoClient"

export type OpenMeteoHookState =
  | { status: "loading" }
  | { status: "ok"; data: OpenMeteoCurrentWeather }
  | { status: "error"; message: string }

export function useOpenMeteoBusan(): OpenMeteoHookState {
  const [state, setState] = useState<OpenMeteoHookState>({ status: "loading" })

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })
    fetchBusanCurrentWeather()
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
