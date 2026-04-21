import type { NormalizedRecommendation } from "./recommendationModel"

/**
 * TourAPI 목록만으로는 점수가 없으므로, 접근성·태그·요약 길이로 내부 정렬용 점수를 산출합니다.
 */
export function deriveNumericScore(item: NormalizedRecommendation): number {
  let s = 48
  if (item.accessibilityNote?.trim()) s += 26
  s += Math.min(18, item.tags.length * 4)
  s += Math.min(16, Math.floor((item.overview?.length ?? 0) / 45))
  return Math.min(98, Math.max(52, Math.round(s)))
}

export type LiveDisplayFields = {
  scoreLabel: string
  durationLabel: string
  walkingLabel: string
  tags: string[]
  reason: string
}

/** 태그: category + tag 병합, 비어 있으면 기본 라벨 1개 확보 */
function normalizeTags(item: NormalizedRecommendation): string[] {
  const tagSet = new Set<string>()
  if (item.category?.trim()) tagSet.add(item.category.trim())
  for (const t of item.tags) {
    if (t.trim()) tagSet.add(t.trim())
  }
  const arr = [...tagSet].slice(0, 6)
  if (arr.length === 0) arr.push("부산 관광")
  return arr
}

/**
 * API에 객관 점수가 없을 때 카드 첫 칸에 넣는「유형」라벨(숫자·점수 금지)
 */
export function deriveScorePresentationLabel(item: NormalizedRecommendation): string {
  const acc = item.accessibilityNote?.trim() ?? ""
  const accLen = acc.length
  const tagCount = item.tags.filter((t) => t.trim()).length
  const hasCat = Boolean(item.category?.trim())

  if (accLen >= 48) return "편의·이동 안내가 상대적으로 풍부한 후보"
  if (accLen >= 16 && tagCount >= 2) return "균형형 후보"
  if (accLen >= 16) return "이동·편의 정보를 고려한 후보"
  if (hasCat && tagCount >= 3) return "균형형 후보"
  if (tagCount >= 2) return "조건을 반영한 후보"
  return "균형형 후보"
}

function buildRecommendationReason(item: NormalizedRecommendation, tags: string[]): string {
  const overview = item.overview?.trim() ?? ""
  const cat = item.category?.trim()
  const acc = item.accessibilityNote?.trim()
  const keywordTags = tags.filter((t) => t !== "부산 관광")

  const parts: string[] = []

  if (overview.length >= 28) {
    parts.push(overview.length > 200 ? `${overview.slice(0, 197)}…` : overview)
  }

  if (cat) {
    parts.push(`${cat} 분류에 부합하는 장소입니다.`)
  }

  if (keywordTags.length > 0) {
    const slice = keywordTags.slice(0, 4).join(" · ")
    parts.push(`추천 키워드: ${slice}.`)
  }

  if (acc) {
    const short = acc.length > 96 ? `${acc.slice(0, 93)}…` : acc
    parts.push(`무장애·접근성: ${short}`)
  }

  if (overview.length > 0 && overview.length < 28) {
    parts.unshift(overview)
  }

  let merged = parts.join(" ").replace(/\s+/g, " ").trim()

  if (merged.length < 28) {
    const fallbackBits = [
      cat ? `${cat} 장소입니다.` : "",
      keywordTags.length ? `연관 태그 ${keywordTags.slice(0, 3).join(", ")}.` : "",
      acc ? "관광공사 무장애 정보가 제공됩니다." : "한국관광공사 TourAPI 기반으로 목록에 포함되었습니다.",
    ].filter(Boolean)
    merged = fallbackBits.join(" ").replace(/\s+/g, " ").trim()
  }

  if (merged.length < 15) {
    merged =
      "한국관광공사 TourAPI 및 무장애 여행정보를 바탕으로 동행 조건에 맞게 제안합니다."
  }

  return merged.length > 220 ? `${merged.slice(0, 217)}…` : merged
}

/** 카드 3열 지표·태그·추천 이유 — 빈 문자열·대시 금지 */
export function liveRecToDisplayFields(item: NormalizedRecommendation): LiveDisplayFields {
  const tags = normalizeTags(item)
  const scoreLabel = deriveScorePresentationLabel(item)
  const durationLabel = "시간 정보 없음"
  const acc = item.accessibilityNote?.trim()
  const walkingLabel = acc
    ? acc.length > 22
      ? `${acc.slice(0, 22)}…`
      : acc
    : "접근성 안내 없음"

  const reason = buildRecommendationReason(item, tags)

  return { scoreLabel, durationLabel, walkingLabel, tags, reason }
}
