import { createContext, useContext, useMemo, type ReactNode } from "react"
import { useApp } from "./AppContext"
import { useI18n } from "../i18n/I18nContext"
import {
  useTourRecommendations,
  type TourRecommendationsState,
} from "../lib/recommendations/useTourRecommendations"

const TourRecommendationsContext = createContext<TourRecommendationsState | null>(null)

/**
 * `useTourRecommendations`를 루트에서 한 번만 호출해
 * 모바일/데스크톱 추천 화면이 동일 캐시(같은 busanArea·locale)를 공유합니다.
 */
export function TourRecommendationsProvider({ children }: { children: ReactNode }) {
  const {
    busanArea,
    companions,
    supportOptions,
    travelTime,
    departureTime,
    groupComposition,
    purpose,
    indoorPref,
    accessibilityFilters,
  } = useApp()
  const { locale } = useI18n()
  const profile = useMemo(
    () => ({
      travelTime,
      departureTime,
      groupKey: JSON.stringify(groupComposition),
      companionsKey: [...companions].sort().join(","),
      supportKey: JSON.stringify(supportOptions),
      purposeKey: [...purpose].sort().join(","),
      indoorPref,
      accessibilityKey: [...accessibilityFilters].sort().join(","),
    }),
    [
      travelTime,
      departureTime,
      groupComposition,
      companions,
      supportOptions,
      purpose,
      indoorPref,
      accessibilityFilters,
    ],
  )
  const state = useTourRecommendations({ busanAreaId: busanArea, locale, profile })
  return (
    <TourRecommendationsContext.Provider value={state}>
      {children}
    </TourRecommendationsContext.Provider>
  )
}

export function useTourRecommendationsState(): TourRecommendationsState {
  const v = useContext(TourRecommendationsContext)
  if (v == null) {
    throw new Error("useTourRecommendationsState는 TourRecommendationsProvider 내부에서만 사용하세요.")
  }
  return v
}

export function useOptionalTourRecommendationsState(): TourRecommendationsState | null {
  return useContext(TourRecommendationsContext)
}
