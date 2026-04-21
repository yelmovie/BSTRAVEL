/**
 * 거리·이동 시간·경사 — 외부 라우팅·고도 API는 선택 주입만 (TODO)
 *
 * 핵심 의도: 시설 라벨이 아니라 실제 이동 부담(거리·시간·향후 경사)을 반영하기 위함.
 * 경사: 고도/경사 원천 데이터가 없으면 slopeScore는 null 유지 · 추정 금지 · 점수 미반영.
 */

/** 하드코딩 분산 방지용 상수 */
export const ROUTE_PARAMS = {
  /** 도보 페이스 후보(km/h): 고령·유모차·휠체어 가능성 참고 범위 */
  walkPaceSlowKmh: 3.0,
  walkPaceDefaultKmh: 3.5,
  walkPaceCityKmh: 4.0,
  /** 시내 차량 단순 추정 */
  driveUrbanSlowKmh: 25,
  driveUrbanNominalKmh: 30,
  /** 거리·시간 가감점 합계 상한 (중복 과대평가 방지) */
  routeScoreDeltaMin: -20,
  routeScoreDeltaMax: 25,
} as const

export interface RouteMetrics {
  distanceKm: number | null
  estimatedWalkMinutes: number | null
  estimatedDriveMinutes: number | null
  slopeScore: number | null
  slopeAvailable: boolean
}

export type TransportMode = "walk" | "drive" | "mixed"

/** --- A. 좌표 파싱 (string/number/null 안전, 유효 범위 밖이면 null) --- */

export function parseLatitude(v: unknown): number | null {
  const n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string" && v.trim() !== ""
        ? Number(v.trim())
        : NaN
  if (!Number.isFinite(n)) return null
  if (n < -90 || n > 90) return null
  return n
}

export function parseLongitude(v: unknown): number | null {
  const n =
    typeof v === "number" && Number.isFinite(v)
      ? v
      : typeof v === "string" && v.trim() !== ""
        ? Number(v.trim())
        : NaN
  if (!Number.isFinite(n)) return null
  if (n < -180 || n > 180) return null
  return n
}

/** 레코드에서 위경도 추출 — mapx=경도·mapy=위도 관례 */
export function lngLatFromRecord(o: Record<string, unknown>): { lng: number; lat: number } | null {
  const lat = parseLatitude(o.lat ?? o.latitude ?? o.mapy)
  const lng = parseLongitude(o.lng ?? o.longitude ?? o.mapx)
  if (lat == null || lng == null) return null
  return { lng, lat }
}

/** --- B. 거리 Haversine (km) --- */

export function computeDistanceKm(
  a: Record<string, unknown>,
  b: Record<string, unknown>,
): number | null {
  const pa = lngLatFromRecord(a)
  const pb = lngLatFromRecord(b)
  if (!pa || !pb) return null
  const R = 6371
  const φ1 = (pa.lat * Math.PI) / 180
  const φ2 = (pb.lat * Math.PI) / 180
  const Δφ = ((pb.lat - pa.lat) * Math.PI) / 180
  const Δλ = ((pb.lng - pa.lng) * Math.PI) / 180
  const x =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2
  const c = 2 * Math.asin(Math.min(1, Math.sqrt(x)))
  const km = R * c
  return Number.isFinite(km) ? km : null
}

/** --- C. 이동 시간 추정 --- */

export function estimateWalkMinutes(
  distanceKm: number | null,
  paceKmh: number = ROUTE_PARAMS.walkPaceDefaultKmh,
): number | null {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0 || paceKmh <= 0) return null
  const hours = distanceKm / paceKmh
  return Math.round(hours * 60)
}

export function estimateDriveMinutes(
  distanceKm: number | null,
  avgKmh: number = ROUTE_PARAMS.driveUrbanSlowKmh,
): number | null {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0 || avgKmh <= 0) return null
  const hours = distanceKm / avgKmh
  return Math.round(hours * 60)
}

/** 고도 입력이 있을 때만 의미 있는 경사 대표 점수 — 없으면 null 유지 */

export interface ElevationDataLike {
  ascentM?: number | null
  gradePercent?: number | null
}

/**
 * TODO: 경사 데이터 source 연결 시 — elevation API 또는 지도 SDK DEM 주입 후 0~100 산출
 * 현재 고도 미제공 시 항상 null (추정 금지, 점수·reasons 미반영)
 */
export function computeSlopeScore(
  _from: { lat: number; lng: number },
  _to: { lat: number; lng: number },
  elevationData?: ElevationDataLike | null,
): number | null {
  if (elevationData == null) return null
  const g = elevationData.gradePercent
  const a = elevationData.ascentM
  if (g != null && Number.isFinite(g)) {
    const abs = Math.min(Math.abs(g), 30)
    return Math.max(0, Math.min(100, Math.round(100 - abs * 3)))
  }
  if (a != null && Number.isFinite(a)) {
    const pen = Math.min(Math.abs(a), 200)
    return Math.max(0, Math.min(100, Math.round(100 - pen / 5)))
  }
  return null
}

/** --- E. 통합 RouteMetrics --- */

export function buildRouteMetrics(
  previousPlace: Record<string, unknown> | null,
  currentPlace: Record<string, unknown>,
  transportMode: TransportMode,
  opts?: {
    walkPaceKmh?: number
    driveAvgKmh?: number
    elevationBetween?: ElevationDataLike | null
  },
): RouteMetrics {
  void transportMode

  const distanceKm =
    previousPlace != null ? computeDistanceKm(previousPlace, currentPlace) : null

  const pace =
    opts?.walkPaceKmh ?? ROUTE_PARAMS.walkPaceDefaultKmh
  const driveKmh = opts?.driveAvgKmh ?? ROUTE_PARAMS.driveUrbanSlowKmh

  const estimatedWalkMinutes = estimateWalkMinutes(distanceKm, pace)
  const estimatedDriveMinutes = estimateDriveMinutes(distanceKm, driveKmh)

  let slopeScore: number | null = null
  let slopeAvailable = false

  const pa = lngLatFromRecord(previousPlace ?? {})
  const pb = lngLatFromRecord(currentPlace)
  if (
    previousPlace != null &&
    pa &&
    pb &&
    opts?.elevationBetween != null &&
    opts.elevationBetween !== undefined
  ) {
    const s = computeSlopeScore(pa, pb, opts.elevationBetween)
    if (s != null) {
      slopeScore = s
      slopeAvailable = true
    }
  }

  return {
    distanceKm,
    estimatedWalkMinutes,
    estimatedDriveMinutes,
    slopeScore,
    slopeAvailable,
  }
}

export type RouteScoreContribution = {
  delta: number
  reasons: string[]
}

/** 거리·도보·차량 시간 규칙 + transportMode 가중 + 상한 ± */
export function computeRouteScoreContribution(
  metrics: RouteMetrics,
  transportMode: TransportMode = "mixed",
): RouteScoreContribution {
  const reasons: string[] = []
  const capMin = ROUTE_PARAMS.routeScoreDeltaMin
  const capMax = ROUTE_PARAMS.routeScoreDeltaMax

  let distDelta = 0
  const d = metrics.distanceKm
  if (d != null && Number.isFinite(d)) {
    if (d <= 0.8) {
      distDelta += 20
      reasons.push("이전 장소와 거리 짧음")
    } else if (d <= 1.5) {
      distDelta += 12
      reasons.push("이전 장소와 거리 비교적 가까움")
    } else if (d <= 3.0) {
      distDelta += 5
      reasons.push("직선거리 무난할 수 있음")
    }
    if (d > 8.0) {
      distDelta -= 18
      reasons.push("이전 장소와 거리 매우 멀 수 있음")
    } else if (d > 5.0) {
      distDelta -= 10
      reasons.push("이전 장소와 거리 멀 수 있음")
    }
  }

  let walkDelta = 0
  const wm = metrics.estimatedWalkMinutes
  if (wm != null) {
    if (wm <= 15) {
      walkDelta += 15
      reasons.push("도보 소요 시간 상대적으로 짧을 수 있음")
    } else if (wm <= 30) {
      walkDelta += 8
      reasons.push("도보 소요 시간 무난할 수 있음")
    } else if (wm > 70) {
      walkDelta -= 18
      reasons.push("도보 소요 시간 길 수 있음")
    } else if (wm > 45) {
      walkDelta -= 10
      reasons.push("도보 소요 시간 다소 길 수 있음")
    }
  }

  let driveDelta = 0
  const dm = metrics.estimatedDriveMinutes
  if (dm != null) {
    if (dm <= 10) {
      driveDelta += 8
      reasons.push("차량 이동 시간 비교적 짧을 수 있음")
    } else if (dm <= 20) {
      driveDelta += 4
      reasons.push("차량 이동 시간 무난할 수 있음")
    } else if (dm > 35) {
      driveDelta -= 6
      reasons.push("차량 이동 시간 길 수 있음")
    }
  }

  let slopeDelta = 0
  if (metrics.slopeAvailable && metrics.slopeScore != null) {
    const ss = metrics.slopeScore
    slopeDelta += Math.round((ss - 50) * 0.12)
    if (slopeDelta !== 0) reasons.push("경사·고도 차 반영(참고)")
  }

  let combined: number

  if (transportMode === "walk") {
    combined = distDelta + walkDelta + driveDelta * 0.15
  } else if (transportMode === "drive") {
    combined = distDelta + driveDelta + walkDelta * 0.15
  } else {
    // mixed: 직선거리(distDelta)와 도보·차량 시간이 동일 신호원이므로 거리 비중↑·시간 비중↓
    combined = distDelta * 0.7 + walkDelta * 0.3 + driveDelta * 0.3
  }

  combined += slopeDelta

  const delta = Math.max(capMin, Math.min(capMax, Math.round(combined)))

  return {
    delta,
    reasons: [...new Set(reasons)],
  }
}
