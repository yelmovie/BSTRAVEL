import {
  createContext,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react'

export type RecommendationMapFocusValue = {
  selectedPlaceId: string | null
  setSelectedPlaceId: Dispatch<SetStateAction<string | null>>
}

const RecommendationMapFocusContext = createContext<RecommendationMapFocusValue | null>(null)

export function RecommendationMapFocusProvider({ children }: { children: ReactNode }) {
  const [selectedPlaceId, setSelectedPlaceId] = useState<string | null>(null)
  const value = useMemo(
    () => ({ selectedPlaceId, setSelectedPlaceId }),
    [selectedPlaceId],
  )
  return (
    <RecommendationMapFocusContext.Provider value={value}>
      {children}
    </RecommendationMapFocusContext.Provider>
  )
}

/** 목록·지도가 같은 Provider 안에 있을 때 */
export function useRecommendationMapFocus(): RecommendationMapFocusValue {
  const v = useContext(RecommendationMapFocusContext)
  if (!v) {
    throw new Error('useRecommendationMapFocus는 RecommendationMapFocusProvider 안에서만 사용하세요.')
  }
  return v
}

/** Provider 없으면 null — 선택·지도 연동 비활성 */
export function useOptionalRecommendationMapFocus(): RecommendationMapFocusValue | null {
  return useContext(RecommendationMapFocusContext)
}
