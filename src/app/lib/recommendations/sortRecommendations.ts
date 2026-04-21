import type { NormalizedRecommendation } from "./recommendationModel"
import { deriveNumericScore } from "./liveCardDerive"

export type LiveSortKey = "score" | "duration" | "walking"

function walkingRank(item: NormalizedRecommendation): number {
  let w = 0
  if (item.accessibilityNote?.trim()) w += 100
  w += Math.min(40, item.tags.filter((t) => t.trim()).length * 8)
  return w
}

export function sortRecommendations(
  items: NormalizedRecommendation[],
  sortBy: LiveSortKey,
): NormalizedRecommendation[] {
  const copy = [...items]
  if (sortBy === "score") {
    copy.sort((a, b) => {
      const ds = deriveNumericScore(b) - deriveNumericScore(a)
      if (ds !== 0) return ds
      return a.title.localeCompare(b.title, "ko")
    })
  } else if (sortBy === "walking") {
    copy.sort((a, b) => {
      const dw = walkingRank(b) - walkingRank(a)
      if (dw !== 0) return dw
      return deriveNumericScore(b) - deriveNumericScore(a)
    })
  } else {
    /* 실시간 데이터에 체류시간 필드가 없어 사용자에게는「이름순」으로 표시 */
    copy.sort((a, b) => {
      const c = a.title.localeCompare(b.title, "ko")
      if (c !== 0) return c
      return deriveNumericScore(b) - deriveNumericScore(a)
    })
  }
  return copy
}
