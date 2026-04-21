import { buildAccessibleSummary } from "../tour/tourAccessibleSummary"
import type { NormalizedTourPlace } from "../tour/tourTypes"
import type { NormalizedRecommendation } from "./recommendationModel"
import { derivePlaceKind } from "./recommendationPlaceKind"
import { mapContentTypeIdToCategory } from "../tour/accessibilityScore"

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim()
  }
  return ""
}

const CONTENT_TYPE_LABEL: Record<string, string> = {
  "12": "관광지",
  "14": "문화시설",
  "15": "축제공연행사",
  "25": "여행코스",
  "28": "레포츠",
  "32": "숙박",
  "38": "쇼핑",
  "39": "음식점",
}

function categoryLabel(contentTypeId: string, raw: Record<string, unknown>): string | null {
  const fromMap = CONTENT_TYPE_LABEL[contentTypeId]
  if (fromMap) return fromMap
  const cat3 = pickStr(raw, "cat3", "cat2", "cat1")
  return cat3 || null
}

function collectTags(raw: Record<string, unknown>): string[] {
  const out: string[] = []
  for (const k of ["cat1", "cat2", "cat3"]) {
    const v = pickStr(raw, k)
    if (v) out.push(v)
  }
  return [...new Set(out)].slice(0, 4)
}

function accessibilityNoteForRecommendation(merged: Record<string, unknown>): string | null {
  const hasField = ["chkcbcnvn", "chkpetnvn", "expguide", "chkcbbchn", "chkcwbchn"].some(
    (k) => merged[k] != null && String(merged[k]).trim() !== "",
  )
  if (hasField) {
    const s = buildAccessibleSummary(merged)
    if (s && !s.includes("세부 접근성 텍스트 필드가 응답에 없습니다")) return s
  }
  return "접근성 정보 확인 필요 · 공공데이터 기본 필드 위주입니다"
}

function isDataImageUrl(url: string): boolean {
  return url.startsWith("data:image")
}

function sanitizeImageUrl(input: string | null): string | null {
  const raw = input?.trim() ?? ""
  if (!raw || isDataImageUrl(raw)) return null
  try {
    const u = new URL(raw)
    if (!/^https?:$/.test(u.protocol)) return null
    if (!u.hostname || u.hostname.trim() === "") return null
    return u.toString()
  } catch {
    return null
  }
}

/**
 * TourAPI 정규화 `NormalizedTourPlace` → 추천 카드 모델
 */
export function mapNormalizedTourToRecommendation(params: {
  place: NormalizedTourPlace
  fetchedAt: string
}): NormalizedRecommendation {
  const { place, fetchedAt } = params
  const merged: Record<string, unknown> = {
    ...(place.raw as Record<string, unknown>),
  }

  const overview =
    place.overview?.trim() ||
    pickStr(merged, "overview") ||
    null

  let imageUrl: string | null = place.image
  if (place.missingOriginalImage || !imageUrl || isDataImageUrl(imageUrl)) {
    imageUrl = null
  }
  imageUrl = sanitizeImageUrl(imageUrl)

  let thumbnailUrl: string | null = place.thumbnail ?? null
  if (!thumbnailUrl || thumbnailUrl.trim() === "" || isDataImageUrl(thumbnailUrl)) {
    thumbnailUrl = imageUrl
  }
  thumbnailUrl = sanitizeImageUrl(thumbnailUrl) ?? imageUrl

  const address =
    place.address?.trim() ||
    pickStr(merged, "addr1", "addr2") ||
    null

  const category = categoryLabel(place.contentTypeId, merged)
  const tags = collectTags(merged)

  return {
    id: place.id,
    contentTypeId: place.contentTypeId,
    placeKind: derivePlaceKind({
      contentTypeId: place.contentTypeId,
      title: place.title || "",
      category,
      tags,
    }),
    title: place.title || "제목 없음",
    address,
    thumbnailUrl,
    imageUrl,
    overview: overview?.trim() || null,
    lat: place.lat,
    lng: place.lng,
    category,
    tags,
    source: "live",
    fetchedAt,
    accessibilityNote: accessibilityNoteForRecommendation(merged),
    accessibleScore: 0,
    accessibilityReason: [],
    accessibilityReasons: [],
    placeCategory: mapContentTypeIdToCategory(place.contentTypeId),
    isAccessibleCandidate: false,
    accessibilityMetrics: null,
    mergedRaw: merged,
    routeMetrics: null,
  }
}
