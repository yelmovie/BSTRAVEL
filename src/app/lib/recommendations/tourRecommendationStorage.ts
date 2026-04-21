import type { NormalizedRecommendation } from "./recommendationModel"
import { derivePlaceKind } from "./recommendationPlaceKind"
import { enrichSingleRecommendationAccessibility } from "./enrichRecommendationAccessibility"
import { mapContentTypeIdToCategory } from "../tour/accessibilityScore"

const KEY_PREFIX = "bstravel:tourRec:"

function hydrateRecommendation(parsed: NormalizedRecommendation): NormalizedRecommendation {
  const placeKind = derivePlaceKind({
    contentTypeId: parsed.contentTypeId ?? "",
    title: parsed.title ?? "",
    category: parsed.category ?? null,
    tags: parsed.tags ?? [],
  })
  const merged: NormalizedRecommendation = {
    ...parsed,
    thumbnailUrl: parsed.thumbnailUrl ?? parsed.imageUrl ?? null,
    placeKind,
    accessibleScore: parsed.accessibleScore ?? 0,
    accessibilityReason: parsed.accessibilityReason ?? [],
    accessibilityReasons: parsed.accessibilityReasons ?? parsed.accessibilityReason ?? [],
    placeCategory: parsed.placeCategory ?? mapContentTypeIdToCategory(parsed.contentTypeId ?? ""),
    isAccessibleCandidate: parsed.isAccessibleCandidate ?? false,
    accessibilityMetrics: parsed.accessibilityMetrics ?? null,
    routeMetrics: parsed.routeMetrics ?? null,
  }
  return enrichSingleRecommendationAccessibility(merged)
}

export function persistTourRecommendation(item: NormalizedRecommendation): void {
  try {
    sessionStorage.setItem(KEY_PREFIX + item.id, JSON.stringify(item))
  } catch {
    /* ignore */
  }
}

export function loadTourRecommendation(id: string): NormalizedRecommendation | null {
  try {
    const raw = sessionStorage.getItem(KEY_PREFIX + id)
    if (!raw) return null
    const parsed = JSON.parse(raw) as NormalizedRecommendation
    if (!parsed?.id || parsed.id !== id) return null
    return hydrateRecommendation(parsed)
  } catch {
    return null
  }
}
