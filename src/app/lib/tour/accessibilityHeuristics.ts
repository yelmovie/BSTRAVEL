/**
 * 시설·키워드·유형별 가감점 — 거리 로직과 분리(SRP)
 */

const POSITIVE_KEYWORDS = [
  "주차",
  "휴게",
  "엘리베이터",
  "유모차",
  "휠체어",
  "편의시설",
  "경사로",
  "실내",
]

const CAFE_KEYWORD_RE = /카페|커피|라운지|베이커리|cafe|coffee/i

export function keywordLike(text: string, keywords: readonly string[]): boolean {
  return keywords.some((k) => text.includes(k))
}

function parseContentTypeId(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export type DeltaReason = {
  delta: number
  reasons: string[]
}

/** 무장애·주차·키워드·이동 보조 필드 */
export function computeFacilityScore(place: Record<string, unknown>): DeltaReason {
  let delta = 0
  const reasons: string[] = []

  const text = `${place.title ?? ""} ${place.overview ?? ""}`

  if (place.barrierFreeInfo) {
    delta += 35
    reasons.push("무장애·편의 정보 확인")
  }

  if (place.parking) {
    delta += 8
    reasons.push("주차 정보 있음")
  }

  if (place.elevator || place.wheelchair || place.stroller) {
    delta += 10
    reasons.push("이동 보조 정보 있음")
  }

  if (keywordLike(text, POSITIVE_KEYWORDS)) {
    delta += 15
    reasons.push("편의 관련 표현 포함")
  }

  return { delta, reasons }
}

/** 실내·카페·TourAPI 유형 코드 */
export function computeCategoryAdjustment(place: Record<string, unknown>): DeltaReason {
  let delta = 0
  const reasons: string[] = []

  const text = `${place.title ?? ""} ${place.overview ?? ""}`
  const cat = place.category
  const cid = parseContentTypeId(place.contentTypeId)

  const indoorLike =
    cat === "lodging" ||
    cat === "food" ||
    cid === 14

  if (indoorLike) {
    delta += 10
    reasons.push("실내 이용 가능성 높음")
  }

  if (cat === "food" && CAFE_KEYWORD_RE.test(text)) {
    delta += 6
    reasons.push("휴식형 공간 가능성")
  }

  if (cid === 28) {
    delta -= 20
    reasons.push("레포츠 유형")
  }

  if (cid === 25) {
    delta -= 10
    reasons.push("여행코스 유형")
  }

  return { delta, reasons }
}

/** 안내 필드가 거의 없을 때 보수적 감점 */
export function computeSparsePenalty(place: Record<string, unknown>): DeltaReason {
  const overview = String(place.overview ?? "").trim()
  const sparse =
    overview.length === 0 &&
    !place.parking &&
    !place.elevator &&
    !place.wheelchair &&
    !place.stroller &&
    !place.barrierFreeInfo &&
    !place.introInfo &&
    !place.detailInfo

  if (!sparse) return { delta: 0, reasons: [] }

  return {
    delta: -10,
    reasons: ["편의 정보 부족"],
  }
}
