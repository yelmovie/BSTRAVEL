import { useEffect, useRef, useState } from "react"
import type { AppLocale } from "../../i18n/constants"
import type { NormalizedRecommendation } from "./recommendationModel"
import { fetchRecommendationsForBusan } from "./fetchRecommendationPipeline"

const DEBOUNCE_MS = 420

export type TourRecommendationsState =
  | { status: "idle" }
  | { status: "loading" }
  | {
      status: "ok"
      items: NormalizedRecommendation[]
      fetchedAt: string
      usedFallback: boolean
    }
  | { status: "error"; message: string }
  | { status: "empty"; fetchedAt: string }

export function useTourRecommendations(params: {
  busanAreaId: string
  locale: AppLocale
}) {
  const [state, setState] = useState<TourRecommendationsState>({ status: "loading" })
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    abortRef.current?.abort()

    debounceRef.current = setTimeout(() => {
      const ac = new AbortController()
      abortRef.current = ac
      setState({ status: "loading" })

      fetchRecommendationsForBusan({
        busanAreaId: params.busanAreaId,
        locale: params.locale,
        signal: ac.signal,
      })
        .then((res) => {
          if (ac.signal.aborted) return
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.log(
              "[TourRecommendations] fetch OK",
              res.items.length,
              "items · fallback:",
              res.usedFallback,
            )
          }
          if (res.items.length === 0) {
            setState({ status: "empty", fetchedAt: res.fetchedAt })
          } else {
            setState({
              status: "ok",
              items: res.items,
              fetchedAt: res.fetchedAt,
              usedFallback: res.usedFallback,
            })
          }
        })
        .catch((e: unknown) => {
          if (ac.signal.aborted) return
          if (import.meta.env.DEV) {
            // eslint-disable-next-line no-console
            console.warn("[TourRecommendations] fetch failed", e)
          }
          if (e instanceof Error && e.name === "AbortError") return
          const msg =
            e instanceof Error
              ? e.message
              : typeof e === "object" && e && "message" in e
                ? String((e as { message: unknown }).message)
                : "알 수 없는 오류"
          setState({
            status: "error",
            message: msg || "추천 데이터를 불러오지 못했습니다",
          })
        })
    }, DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [params.busanAreaId, params.locale])

  return state
}
