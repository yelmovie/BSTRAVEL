/**
 * 최종 accessibleScore·임계·reasons(최대 3개)·routeMetrics — 시설/유형/희박/경로 합성
 *
 * 핵심 의도:
 * 단순 시설 정보가 아니라 「실제 이동 부담」을 반영한 추천 점수로 개선합니다.
 * 경사 데이터가 없으면 추측하지 않고(null) 점수·근거에서 제외합니다 — 상세는 routeMetrics.ts
 */

import type { NormalizedRecommendation, PlaceCategory } from "../recommendations/recommendationModel"
import {
  computeCategoryAdjustment,
  computeFacilityScore,
  computeSparsePenalty,
} from "./accessibilityHeuristics"
import type { RouteMetrics, TransportMode } from "./routeMetrics"
import {
  buildRouteMetrics,
  computeRouteScoreContribution,
} from "./routeMetrics"

export type { PlaceCategory }
export type { RouteMetrics, TransportMode } from "./routeMetrics"

export interface AccessibilityContext {
  previousPlace: Record<string, unknown> | null
  transportMode?: TransportMode
}

export interface AccessibilityResult {
  score: number
  isAccessibleCandidate: boolean
  reasons: string[]
  metrics: RouteMetrics
}

export const ACCESSIBLE_THRESHOLD = 60
export const ACCESSIBLE_SCORE_THRESHOLD = ACCESSIBLE_THRESHOLD

function parseNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v
  if (typeof v === "string" && v.trim() !== "") {
    const n = Number(v)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function mapContentTypeIdToCategory(id?: number | string | null): PlaceCategory {
  const v = parseNumber(id)
  switch (v) {
    case 12:
    case 14:
    case 15:
    case 25:
    case 28:
      return "attraction"
    case 32:
      return "lodging"
    case 39:
      return "food"
    case 38:
      return "convenience"
    default:
      return "unknown"
  }
}

export interface TourPlaceLite {
  id: string | number
  title?: string
  addr1?: string
  addr2?: string
  contentTypeId?: number | string | null
  overview?: string | null
  tel?: string | null
  mapx?: number | null
  mapy?: number | null
  firstimage?: string | null
  firstimage2?: string | null
  category?: PlaceCategory
  barrierFreeInfo?: Record<string, unknown> | null
  introInfo?: Record<string, unknown> | null
  detailInfo?: Record<string, unknown> | null
  parking?: string | null
  restroom?: string | null
  elevator?: string | null
  stroller?: string | null
  wheelchair?: string | null
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim()
  }
  return ""
}

function barrierFreeRecord(raw: Record<string, unknown>): Record<string, unknown> | null {
  const keys = ["chkcbcnvn", "chkpetnvn", "expguide", "chkcbbchn", "chkcwbchn"] as const
  const o: Record<string, unknown> = {}
  for (const k of keys) {
    if (raw[k] != null && String(raw[k]).trim() !== "") o[k] = raw[k]
  }
  return Object.keys(o).length > 0 ? o : null
}

export function tourPlaceLiteFromNormalized(place: NormalizedRecommendation): TourPlaceLite {
  const raw = place.mergedRaw
  const overview =
    place.overview?.trim() ||
    pickStr(raw, "overview") ||
    null

  const latOk = place.lat != null && Number.isFinite(place.lat)
  const lngOk = place.lng != null && Number.isFinite(place.lng)

  return {
    id: place.id,
    title: place.title,
    addr1: pickStr(raw, "addr1"),
    addr2: pickStr(raw, "addr2"),
    contentTypeId: place.contentTypeId,
    overview,
    tel: pickStr(raw, "tel") || null,
    mapx: lngOk ? place.lng : null,
    mapy: latOk ? place.lat : null,
    firstimage: pickStr(raw, "firstimage") || null,
    firstimage2: pickStr(raw, "firstimage2") || null,
    category: mapContentTypeIdToCategory(place.contentTypeId),
    barrierFreeInfo: barrierFreeRecord(raw),
    introInfo: overview ? { overview } : null,
    detailInfo: null,
    parking: pickStr(raw, "parking") || null,
    restroom: pickStr(raw, "restroom") || null,
    elevator: pickStr(raw, "elevator") || null,
    stroller: pickStr(raw, "chkcbcnvn") || null,
    wheelchair: pickStr(raw, "chkcwbchn") || null,
  }
}

export function scoringPayloadForAccessibleScore(p: Record<string, unknown>): Record<string, unknown> {
  const mr = p.mergedRaw
  if (mr && typeof mr === "object" && p.contentTypeId !== undefined && p.contentTypeId !== null) {
    const nr = p as unknown as NormalizedRecommendation
    const lite = tourPlaceLiteFromNormalized(nr)
    return {
      title: lite.title,
      overview: lite.overview,
      barrierFreeInfo: lite.barrierFreeInfo,
      parking: lite.parking,
      elevator: lite.elevator,
      wheelchair: lite.wheelchair,
      stroller: lite.stroller,
      category: lite.category,
      contentTypeId: lite.contentTypeId,
      lat: nr.lat,
      lng: nr.lng,
      mapx: lite.mapx,
      mapy: lite.mapy,
      introInfo: lite.introInfo,
      detailInfo: lite.detailInfo,
    }
  }
  const pc = mapContentTypeIdToCategory(p.contentTypeId as number | string | null | undefined)
  return { ...p, category: pc }
}

/** 설명력 우선으로 최대 N개 */
const REASON_PRIORITY: RegExp[] = [
  /이전 장소|거리|도보|차량/,
  /주차/,
  /무장애|편의 정보|이동 보조/,
  /실내|휴식형/,
]

function rankReasonForSort(r: string): number {
  for (let i = 0; i < REASON_PRIORITY.length; i++) {
    if (REASON_PRIORITY[i].test(r)) return REASON_PRIORITY.length - i
  }
  return 0
}

export function pickTopReasons(all: string[], max = 3): string[] {
  const uniq = [...new Set(all)]
  uniq.sort((a, b) => rankReasonForSort(b) - rankReasonForSort(a) || a.localeCompare(b))
  return uniq.slice(0, max)
}

function debugAccessibilityLog(
  title: string,
  placeCategory: string,
  result: AccessibilityResult,
): void {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.debug("[accessibility-score]", {
    title,
    category: placeCategory,
    score: result.score,
    reasons: result.reasons,
    metrics: result.metrics,
  })
}

/**
 * 최종 점수: 시설·유형·정보 희박 + 거리·시간(·경사 데이터 있을 때만) → 0~100
 */
export function computeAccessibleScore(
  place: Record<string, unknown>,
  context: AccessibilityContext,
): AccessibilityResult {
  const mode: TransportMode = context.transportMode ?? "mixed"
  const prev = context.previousPlace

  const fac = computeFacilityScore(place)
  const cat = computeCategoryAdjustment(place)
  const sparse = computeSparsePenalty(place)

  let score = fac.delta + cat.delta + sparse.delta
  score = Math.max(0, Math.min(100, score))

  const metrics = buildRouteMetrics(prev, place, mode)
  const routeContrib = computeRouteScoreContribution(metrics, mode)

  score = Math.max(0, Math.min(100, Math.round(score + routeContrib.delta)))

  const mergedReasons = pickTopReasons(
    [...fac.reasons, ...cat.reasons, ...sparse.reasons, ...routeContrib.reasons],
    10,
  )
  const reasons = pickTopReasons(mergedReasons, 3)

  const result: AccessibilityResult = {
    score,
    isAccessibleCandidate: score >= ACCESSIBLE_THRESHOLD,
    reasons,
    metrics,
  }

  debugAccessibilityLog(String(place.title ?? ""), String(place.category ?? ""), result)

  return result
}

export type WithAccessibilityEnrichment = {
  placeCategory: PlaceCategory
  accessibleScore: number
  isAccessibleCandidate: boolean
  accessibilityReason: string[]
  accessibilityReasons: string[]
  routeMetrics: RouteMetrics | null
}

export function mapPlacesWithAccessibility<P extends Record<string, unknown>>(
  places: readonly P[],
): Array<P & WithAccessibilityEnrichment> {
  return places.map((p, i) => {
    const pr = p as Record<string, unknown>
    const placeCategory = mapContentTypeIdToCategory(
      pr.contentTypeId as number | string | null | undefined,
    )
    const cur = scoringPayloadForAccessibleScore(pr)
    const prev =
      i > 0 ? scoringPayloadForAccessibleScore(places[i - 1] as Record<string, unknown>) : null

    const acc = computeAccessibleScore({ ...cur, category: placeCategory }, {
      previousPlace: prev,
      transportMode: "mixed",
    })

    return {
      ...p,
      placeCategory,
      accessibleScore: acc.score,
      isAccessibleCandidate: acc.isAccessibleCandidate,
      accessibilityReason: acc.reasons,
      accessibilityReasons: acc.reasons,
      routeMetrics: acc.metrics,
    }
  })
}

export function computeAccessibilityForNormalized(
  rec: NormalizedRecommendation,
  context: { previousPlace: NormalizedRecommendation | null },
  transportMode: TransportMode = "mixed",
): AccessibilityResult {
  const cur = scoringPayloadForAccessibleScore(rec as unknown as Record<string, unknown>)
  const prevPayload = context.previousPlace
    ? scoringPayloadForAccessibleScore(context.previousPlace as unknown as Record<string, unknown>)
    : null

  return computeAccessibleScore(cur, {
    previousPlace: prevPayload,
    transportMode,
  })
}

export function isAccessibleCandidate(place: NormalizedRecommendation): boolean {
  return place.accessibleScore >= ACCESSIBLE_SCORE_THRESHOLD
}
