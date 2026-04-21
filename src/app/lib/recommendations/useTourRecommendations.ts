import { useEffect, useRef, useState } from "react"
import type { AppLocale } from "../../i18n/constants"
import type { NormalizedRecommendation } from "./recommendationModel"
import { getRecommendationsCached, type RecommendProfileKey } from "../recommend/getRecommend"
import { SEARCH_DEBOUNCE_MS } from "../config/uiTiming"

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
  /** 동일 조건 재요청 시 캐시 히트율 향상 */
  profile?: RecommendProfileKey
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

      getRecommendationsCached({
        busanAreaId: params.busanAreaId,
        locale: params.locale,
        signal: ac.signal,
        profile: params.profile,
      })
        .then((res) => {
          if (ac.signal.aborted) return
          if (import.meta.env.DEV) {
            const resultLog = {
              count: res.items.length,
              usedFallback: res.usedFallback,
              companions: params.profile?.companionsKey ?? "",
            }
            // eslint-disable-next-line no-console
            console.log(`[TourRecommendations] result: ${JSON.stringify(resultLog)}`)
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
          const normalized =
            msg.includes("응답 형식") || msg.includes("INVALID_RESPONSE")
              ? "TourAPI 응답 형식 불일치"
              : msg.includes("MISSING_SERVICE_KEY") || msg.includes("환경변수")
                ? "환경변수 누락 가능"
                : msg.includes("TourAPI item 없음") || msg.includes("EMPTY_ITEMS")
                  ? "TourAPI item 없음"
                  : msg.includes("HTTP_") || msg.includes("프록시")
                    ? "TourAPI 프록시 호출 실패"
                    : msg
          setState({
            status: "error",
            message: normalized || "추천 데이터를 불러오지 못했습니다",
          })
        })
    }, SEARCH_DEBOUNCE_MS)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      abortRef.current?.abort()
    }
  }, [
    params.busanAreaId,
    params.locale,
    params.profile?.travelTime,
    params.profile?.departureTime,
    params.profile?.groupKey,
    params.profile?.companionsKey,
    params.profile?.supportKey,
    params.profile?.purposeKey,
    params.profile?.indoorPref,
    params.profile?.accessibilityKey,
  ])

  return state
}
