import type { Place } from "./places"
import type { CardDisplayData } from "../components/recommendations/CourseCardItem"
import {
  CARD_ATTRIBUTION_SIMULATION_KO,
  CARD_FALLBACK_REASON_ONE_LINE_KO,
} from "../lib/copy/trustMessaging"

/** 시뮬레이션 코스 부가 지표 — TourAPI와 무관한 시연 전용 */
export const SIMULATION_COURSE_META: Record<
  string,
  { score: number; weather: string; crowd: string; indoor: number }
> = {
  haeundae: { score: 92, weather: "날씨 무관", crowd: "주말 혼잡 주의", indoor: 65 },
  gamcheon: { score: 87, weather: "우천 시 주의", crowd: "주말 혼잡 주의", indoor: 35 },
  citizenpark: { score: 95, weather: "쉼터 완비", crowd: "현재 한산", indoor: 30 },
  dongrae: { score: 86, weather: "날씨 무관", crowd: "현재 한산", indoor: 70 },
}

export type SimulationSortKey = "score" | "duration" | "walking"

export function sortSimulationPlaces(
  places: Place[],
  sortBy: SimulationSortKey,
): Place[] {
  const copy = [...places]
  if (sortBy === "score") {
    copy.sort(
      (a, b) =>
        (SIMULATION_COURSE_META[b.id]?.score ?? 0) - (SIMULATION_COURSE_META[a.id]?.score ?? 0),
    )
  } else if (sortBy === "walking") {
    copy.sort((a, b) => a.walkingLevel - b.walkingLevel)
  } else {
    copy.sort((a, b) => a.duration.localeCompare(b.duration))
  }
  return copy
}

/** PLACES 시뮬레이션 분기 → CourseCardItem 데이터 */
export function simulationPlaceToCardDisplay(place: Place, rank: number): CardDisplayData {
  const meta = SIMULATION_COURSE_META[place.id]
  const indoorLabel =
    meta?.indoor != null ? `실내 비중 약 ${meta.indoor}%` : "실내 비중 정보 없음"
  const tags = [
    indoorLabel,
    meta?.weather ?? "날씨 정보 참고용",
    meta?.crowd ?? "혼잡도 참고용",
    ...place.tags.slice(0, 2),
  ].filter(Boolean) as string[]

  const durationRaw = place.duration?.replace(/^약\s*/, "").trim()
  const reasonFallback = `${place.subtitle} 코스입니다. ${place.tags.slice(0, 3).join(" · ")} 특성을 반영한 시연용 추천입니다.`
  const merit = Math.round(meta?.score ?? 0)
  const reasonFirst =
    place.recommendReason?.trim().split(/[\n。.]/)[0]?.trim().slice(0, 120) ?? ""

  return {
    id: place.id,
    rank,
    source: "simulation",
    coverImageUrl: place.image,
    attributionLine: CARD_ATTRIBUTION_SIMULATION_KO,
    title: place.name.replace(" 코스", ""),
    categoryLabel: place.subtitle,
    scoreLabel: `이동 편의 점수 ${merit}`,
    summaryRecommendationOneLine:
      reasonFirst.length > 0 ? reasonFirst : CARD_FALLBACK_REASON_ONE_LINE_KO,
    durationLabel: durationRaw || "시간 정보 없음",
    walkingLabel: place.walkingAmount?.trim() || "보행 부담 참고용",
    tags,
    reason: place.recommendReason?.trim() || reasonFallback,
    address: null,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    isSelected: false,
  }
}
