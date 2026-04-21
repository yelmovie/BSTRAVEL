import type { NormalizedRecommendation } from "./recommendationModel"
import type { NormalizedTourPlace } from "../tour/tourTypes"
import { formatTourAddress } from "../tour/formatTourAddress"

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim()
  }
  return ""
}

/** 상세 common2 병합(mergeDetailCommonIntoPlace)용 최소 NormalizedTourPlace */
export function recommendationToTourPlace(r: NormalizedRecommendation): NormalizedTourPlace {
  const raw = r.mergedRaw
  const addr1 = pickStr(raw, "addr1", "addr")
  const addr2 = pickStr(raw, "addr2")
  const address = r.address?.trim() || formatTourAddress(addr1, addr2) || ""

  return {
    id: r.id,
    contentTypeId: r.contentTypeId,
    title: r.title,
    address,
    areaCode: pickStr(raw, "areacode") || "26",
    sigunguCode: pickStr(raw, "sigungucode") || "",
    lat: r.lat,
    lng: r.lng,
    hasValidCoordinates: r.lat != null && r.lng != null,
    image: r.imageUrl ?? r.thumbnailUrl ?? "",
    thumbnail: r.thumbnailUrl ?? r.imageUrl ?? "",
    overview: r.overview ?? "",
    tel: pickStr(raw, "tel"),
    homepage: pickStr(raw, "homepage"),
    accessibleInfo: r.accessibilityNote ?? "",
    missingOriginalImage: !(r.imageUrl ?? r.thumbnailUrl),
    raw,
  }
}
