import type { Place } from "../../data/places"
import type { NormalizedRecommendation } from "../recommendations/recommendationModel"
import type { CrowdPredictionInput } from "./types"
import { crowdPlaceKindFromRecommendation } from "./crowdPlaceKind"

/**
 * TourAPI 정규화 항목 → 예측 입력 (상세 페이지)
 */
export function crowdInputFromRecommendation(
  r: NormalizedRecommendation,
  opts?: {
    weatherCode?: number | null
    visitHour?: number
    isWeekend?: boolean
    visitAt?: Date
    weatherSnapshot?: CrowdPredictionInput["weatherSnapshot"]
    placeKind?: CrowdPredictionInput["placeKind"]
    cachePlaceKey?: string
  },
): CrowdPredictionInput {
  const visitAt = opts?.visitAt
  const visitHour =
    opts?.visitHour ?? (visitAt != null ? visitAt.getHours() : undefined)
  const isWeekend =
    opts?.isWeekend ??
    (visitAt != null ? visitAt.getDay() === 0 || visitAt.getDay() === 6 : undefined)
  return {
    category: r.category ?? undefined,
    titleHint: r.title,
    weatherCode: opts?.weatherCode ?? null,
    visitHour,
    isWeekend,
    visitAt,
    weatherSnapshot: opts?.weatherSnapshot,
    placeKind: opts?.placeKind ?? crowdPlaceKindFromRecommendation(r),
    cachePlaceKey: opts?.cachePlaceKey ?? r.id,
  }
}

/**
 * 로컬 PLACES 코스 → 예측 입력
 */
export function crowdInputFromPlace(
  p: Place,
  opts?: {
    weatherCode?: number | null
    visitHour?: number
    isWeekend?: boolean
    visitAt?: Date
    weatherSnapshot?: CrowdPredictionInput["weatherSnapshot"]
    placeKind?: CrowdPredictionInput["placeKind"]
  },
): CrowdPredictionInput {
  const visitAt = opts?.visitAt
  return {
    category: p.subtitle,
    titleHint: p.name,
    crowdLevelHint: p.crowdLevel,
    weatherCode: opts?.weatherCode ?? null,
    visitHour: opts?.visitHour ?? visitAt?.getHours(),
    isWeekend:
      opts?.isWeekend ??
      (visitAt != null ? visitAt.getDay() === 0 || visitAt.getDay() === 6 : undefined),
    visitAt,
    weatherSnapshot: opts?.weatherSnapshot,
    placeKind: opts?.placeKind,
    cachePlaceKey: opts?.cachePlaceKey ?? p.id,
  }
}
