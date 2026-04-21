/**
 * TourAPI contentTypeId → 추천 카드·지도 공통 분류 (한글 라벨은 라벨 함수만 사용)
 *
 * 한국관광공사 KorService2 분류 참고:
 * 12 관광지, 14 문화시설, 15 축제공연행사, 25 여행코스, 28 레포츠,
 * 32 숙박, 38 쇼핑, 39 음식점
 */

import type { NormalizedRecommendation, RecommendationPlaceKind } from "./recommendationModel"
import { isAccessibleCandidate } from "../tour/accessibilityScore"

export type { RecommendationPlaceKind }

/** 상단 필터 탭 */
export type CategoryFilterTab =
  | "all"
  | "attraction"
  | "food"
  | "lodging"
  | "convenience"
  | "accessible"

export const CATEGORY_FILTER_TABS: CategoryFilterTab[] = [
  "all",
  "attraction",
  "food",
  "lodging",
  "convenience",
  "accessible",
]

export function categoryFilterTabLabelKo(tab: CategoryFilterTab): string {
  const m: Record<CategoryFilterTab, string> = {
    all: "전체",
    attraction: "관광지",
    food: "식사",
    lodging: "숙박",
    convenience: "휴식·편의",
    accessible: "이동편한 곳",
  }
  return m[tab]
}

const CAFE_KEYWORD_RE = /카페|커피|cafe|coffee/i

/** contentTypeId만으로 1차 분류(음식점·카페 구분 없음) */
export function placeKindFromContentTypeId(contentTypeId: string): RecommendationPlaceKind {
  const id = String(contentTypeId).trim()
  if (id === "32") return "lodging"
  if (id === "39") return "food"
  if (id === "38") return "convenience"
  if (id === "12" || id === "14" || id === "15" || id === "25" || id === "28") return "attraction"
  if (id === "") return "other"
  return "other"
}

/**
 * 제목·분류·태그까지 반영한 최종 유형 (카페 등은 휴식·편의로 보냄)
 */
export function derivePlaceKind(input: {
  contentTypeId: string
  title: string
  category: string | null
  tags: string[]
}): RecommendationPlaceKind {
  const base = placeKindFromContentTypeId(input.contentTypeId)
  const textBlob = [input.title, input.category ?? "", ...input.tags].join(" ")
  if (base === "food" && CAFE_KEYWORD_RE.test(textBlob)) return "convenience"
  return base
}

/** 호환용 — 「이동편한 곳」탭과 동일하게 `accessibleScore`(임계 이상) 기준 */
export function isAccessibleRecommendation(item: NormalizedRecommendation): boolean {
  return isAccessibleCandidate(item)
}


/** 섹션·그룹 순서: 관광 → 식사 → 휴식·편의 → 숙박 → 기타 */
export const PLACE_KIND_SECTION_ORDER: RecommendationPlaceKind[] = [
  "attraction",
  "food",
  "convenience",
  "lodging",
  "other",
]

export function sectionTitleForKind(kind: RecommendationPlaceKind): string {
  const m: Record<RecommendationPlaceKind, string> = {
    attraction: "관광지",
    food: "식사",
    lodging: "숙박",
    convenience: "휴식·편의",
    other: "기타",
  }
  return m[kind]
}

/** 카드·지도 팝업용 짧은 뱃지 문구 */
export function placeKindBadgeLabelKo(kind: RecommendationPlaceKind): string {
  return sectionTitleForKind(kind)
}

/** 섹션 블록 제목 (소제목) */
export function sectionHeadingForKind(kind: RecommendationPlaceKind): string {
  const m: Record<RecommendationPlaceKind, string> = {
    attraction: "관광지 추천",
    food: "식사 추천",
    lodging: "숙박 추천",
    convenience: "휴식·편의 추천",
    other: "기타 추천",
  }
  return m[kind]
}

export function matchesCategoryFilter(item: NormalizedRecommendation, tab: CategoryFilterTab): boolean {
  if (tab === "all") return true
  if (tab === "accessible") return isAccessibleCandidate(item)
  if (tab === "convenience") return item.placeKind === "convenience"
  if (tab === "food") return item.placeKind === "food"
  if (tab === "lodging") return item.placeKind === "lodging"
  if (tab === "attraction") return item.placeKind === "attraction"
  return true
}

export function countByPlaceKind(items: NormalizedRecommendation[]): Record<RecommendationPlaceKind, number> {
  const c: Record<RecommendationPlaceKind, number> = {
    attraction: 0,
    food: 0,
    lodging: 0,
    convenience: 0,
    other: 0,
  }
  for (const it of items) {
    c[it.placeKind]++
  }
  return c
}

/** 요약 바 한 줄 — 0인 유형은 생략 (표시 순서: 관광 → 식사 → 휴식 → 숙박) */
export function formatKindSummaryLine(counts: Record<RecommendationPlaceKind, number>): string {
  const parts: string[] = []
  if (counts.attraction > 0) parts.push(`관광지 ${counts.attraction}`)
  if (counts.food > 0) parts.push(`식사 ${counts.food}`)
  if (counts.convenience > 0) parts.push(`휴식 ${counts.convenience}`)
  if (counts.lodging > 0) parts.push(`숙박 ${counts.lodging}`)
  if (counts.other > 0) parts.push(`기타 ${counts.other}`)
  return parts.join(" · ")
}

export function composeDescriptionLine(counts: Record<RecommendationPlaceKind, number>): string {
  const line = formatKindSummaryLine(counts)
  if (!line) return ""
  return `이번 추천은 ${line}로 구성되어 있어요.`
}

/** 필터·정렬 순서 유지한 채 유형별 버킷 (비어 있는 유형 제외) */
export function groupItemsByPlaceKindOrdered(
  items: NormalizedRecommendation[],
): { kind: RecommendationPlaceKind; items: NormalizedRecommendation[] }[] {
  const buckets = new Map<RecommendationPlaceKind, NormalizedRecommendation[]>()
  for (const k of PLACE_KIND_SECTION_ORDER) buckets.set(k, [])
  for (const it of items) {
    const k = it.placeKind
    if (buckets.has(k)) buckets.get(k)!.push(it)
    else buckets.get("other")!.push(it)
  }
  return PLACE_KIND_SECTION_ORDER.map((kind) => ({
    kind,
    items: buckets.get(kind) ?? [],
  })).filter((s) => s.items.length > 0)
}
