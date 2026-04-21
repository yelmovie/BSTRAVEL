import type { NormalizedRecommendation } from "./recommendationModel"
import { deriveNumericScore } from "./liveCardDerive"

export type CompanionPreferenceProfile = {
  companions: string[]
  support: {
    stroller: number
    wheelchair: number
    foreignLanguage: boolean
  }
  accessibilityFilters: string[]
}

export type CompanionCandidateDebug = {
  id: string
  title: string
  contentTypeId: string
  cat3: string
  baseScore: number
  accessibilityScore: number
  effectiveAccessibilityScore: number
  accessibilityFit: number
  mobilityFit: number
  safetyFit: number
  multilingualFit: number
  familyFit: number
  companionFit: number
  finalScore: number
  allowed: boolean
  strongExclude: boolean
  semiHardExclude: boolean
  penalty: number
  reasons: string[]
}

export type CompanionPreferenceResult = {
  items: NormalizedRecommendation[]
  appliedFilters: string[]
  candidateDebug: CompanionCandidateDebug[]
  companionFallbackUsed: boolean
  excludedCount: number
}

const HARD_EXCLUDE_KEYWORDS = {
  wheelchair: ["휠체어 불가", "wheelchair not", "wheelchair unavailable"],
  stroller: ["유모차 불가", "stroller not"],
  steepTerrain: ["급경사", "가파른", "돌계단", "계단 많", "산길", "등산"],
} as const
/**
 * NOTE(2026-04): hard exclude / override 경로는 코드상 활성화되어 있으나,
 * 최근 10/50 샘플 회귀 로그에서 트리거 신호가 거의 없어 실증 카운트가 0으로 관측됨.
 * 이는 즉시 로직 결함으로 단정하지 말고, 구조화 접근성/명시적 불가 데이터 확보 후 재검증이 필요함.
 */

const POSITIVE_KEYWORDS = {
  wheelchair: ["휠체어", "무장애", "barrier-free", "경사로"],
  elevator: ["엘리베이터", "승강기", "elevator", "lift"],
  accessibleRestroom: ["장애인화장실", "accessible restroom", "무장애 화장실"],
  stroller: ["유모차", "stroller", "무단차", "완만한", "ramp"],
  lowMobility: ["노약자", "평지", "단거리", "휴식", "완만"],
  multilingual: ["영문", "다국어", "외국어", "english", "multilingual", "guide"],
  family: ["어린이", "가족", "키즈", "수유", "휴게", "체험"],
  safety: ["안전", "조명", "방범", "cctv", "관리"],
} as const

const FIT_SCORE = {
  base: 50,
  strongBonus: 22,
  mediumBonus: 12,
  lightBonus: 6,
  mediumPenalty: 14,
  strongPenalty: 26,
  criticalPenalty: 40,
} as const

const FINAL_SCORE_WEIGHT = {
  baseScore: 0.34,
  effectiveAccessibility: 0.28,
  companionFit: 0.38,
} as const

const COMBINATION_RULES = {
  strollerWheelchair: {
    /** 복수 제약은 min-fit 기반으로 보수 적용 */
    sharedAccessibilityBonus: 4,
    strongestPenaltyWeight: 0.4,
  },
  elderlyWheelchair: {
    crowdRiskPenalty: 6,
  },
  familyStroller: {
    familySafetyBonus: 6,
  },
} as const

const CATEGORY_RISK_RULES = {
  wheelchair: {
    riskyContentTypeIds: ["28", "25"],
    riskyCat3Codes: ["A01011300", "A02050600"],
    riskyKeywords: ["산", "봉", "전망대", "등산", "해변", "섬", "스카이워크", "출렁다리", "둘레길"],
  },
  stroller: {
    riskyContentTypeIds: ["28", "25"],
    riskyCat3Codes: ["A01011300", "A02050600"],
    riskyKeywords: ["산", "봉", "전망대", "등산", "해변", "섬", "비포장", "트레킹", "둘레길"],
  },
  elderly: {
    riskyContentTypeIds: ["28", "15"],
    riskyCat3Codes: ["A02050600"],
    riskyKeywords: ["산", "봉", "등산", "장거리", "축제", "행사", "혼잡", "대기"],
  },
} as const

function containsAny(text: string, list: string[]): boolean {
  const t = text.toLowerCase()
  return list.some((kw) => t.includes(kw.toLowerCase()))
}

function buildTextBlob(item: NormalizedRecommendation): string {
  const raw = item.mergedRaw ?? {}
  return [
    item.title,
    item.category ?? "",
    item.overview ?? "",
    item.accessibilityNote ?? "",
    String(raw.expguide ?? ""),
    String(raw.chkcbcnvn ?? ""),
    String(raw.chkcwbchn ?? ""),
    item.tags.join(" "),
  ]
    .join(" ")
    .toLowerCase()
}

function parseStructuredFlag(rawValue: unknown): "yes" | "no" | "unknown" {
  const v = String(rawValue ?? "").trim().toLowerCase()
  if (!v) return "unknown"
  if (
    v.includes("불가") ||
    v.includes("없음") ||
    v.includes("x") ||
    v === "n" ||
    v === "no"
  ) return "no"
  if (
    v.includes("가능") ||
    v.includes("있음") ||
    v.includes("o") ||
    v === "y" ||
    v === "yes"
  ) return "yes"
  return "unknown"
}

function inferAccessibilityScore(item: NormalizedRecommendation, blob: string): number {
  let scoreByKind = 44
  if (item.placeKind === "lodging") scoreByKind = 62
  else if (item.placeKind === "food") scoreByKind = 58
  else if (item.placeKind === "convenience") scoreByKind = 64
  else if (item.placeKind === "attraction") scoreByKind = 46

  let delta = 0
  if (containsAny(blob, ["무장애", "휠체어", "유모차", "경사로", "엘리베이터", "승강기"])) delta += 18
  if (containsAny(blob, ["주차", "restroom", "화장실", "편의시설", "실내"])) delta += 8
  if (containsAny(blob, ["계단", "가파른", "급경사", "등산", "산길", "비탈"])) delta -= 26
  if (containsAny(blob, ["전망대", "봉", "섬", "해변"])) delta -= 10
  return Math.max(0, Math.min(100, scoreByKind + delta))
}

function clampScore(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)))
}

function componentAverage(parts: number[]): number {
  if (parts.length === 0) return FIT_SCORE.base
  return clampScore(parts.reduce((acc, cur) => acc + cur, 0) / parts.length)
}

function detectCrowdLikeRisk(blob: string): boolean {
  return containsAny(blob, ["혼잡", "대기", "붐비", "축제", "행사"])
}

function pickStr(v: unknown): string {
  return String(v ?? "").trim()
}

function hasAccessiblePositiveSignal(args: {
  effectiveAccessibilityScore: number
  structuredWheelchair: "yes" | "no" | "unknown"
  structuredStroller: "yes" | "no" | "unknown"
  structuredElevator: "yes" | "no" | "unknown"
  structuredRestroom: "yes" | "no" | "unknown"
  wheelchairPositive: boolean
  strollerPositive: boolean
  elevatorPositive: boolean
  accessibleRestroomPositive: boolean
}): boolean {
  if (args.effectiveAccessibilityScore >= 72) return true
  if (args.structuredWheelchair === "yes" || args.structuredStroller === "yes") return true
  if (args.structuredElevator === "yes" || args.structuredRestroom === "yes") return true
  if (args.wheelchairPositive || args.strollerPositive) return true
  if (args.elevatorPositive || args.accessibleRestroomPositive) return true
  return false
}

function isRouteBurdenHigh(item: NormalizedRecommendation): boolean {
  const m = item.routeMetrics
  if (!m) return false
  if (typeof m.estimatedWalkMinutes === "number" && m.estimatedWalkMinutes >= 45) return true
  if (typeof m.distanceKm === "number" && m.distanceKm >= 2.8) return true
  if (m.slopeAvailable && typeof m.slopeScore === "number" && m.slopeScore < 40) return true
  return false
}

function isRouteBurdenVeryHigh(item: NormalizedRecommendation): boolean {
  const m = item.routeMetrics
  if (!m) return false
  if (typeof m.estimatedWalkMinutes === "number" && m.estimatedWalkMinutes >= 65) return true
  if (typeof m.distanceKm === "number" && m.distanceKm >= 4.2) return true
  if (m.slopeAvailable && typeof m.slopeScore === "number" && m.slopeScore < 28) return true
  return false
}

function isCategoryRisk(rule: {
  riskyContentTypeIds: readonly string[]
  riskyCat3Codes?: readonly string[]
  riskyKeywords: readonly string[]
}, contentTypeId: string, cat3: string, blob: string): boolean {
  if (rule.riskyContentTypeIds.includes(contentTypeId)) return true
  if (rule.riskyCat3Codes?.includes(cat3)) return true
  return containsAny(blob, [...rule.riskyKeywords])
}

function evaluateCandidate(
  item: NormalizedRecommendation,
  profile: CompanionPreferenceProfile,
): CompanionCandidateDebug {
  const blob = buildTextBlob(item)
  const raw = item.mergedRaw ?? {}
  const contentTypeId = pickStr(item.contentTypeId || (raw as Record<string, unknown>).contenttypeid)
  const cat3 = pickStr((raw as Record<string, unknown>).cat3)
  const accessibilityScore = item.accessibleScore ?? 0
  const inferredAccessibility = inferAccessibilityScore(item, blob)
  const effectiveAccessibilityScore = Math.max(accessibilityScore, inferredAccessibility)
  const baseScore = deriveNumericScore(item)
  let penalty = 0
  let bonus = 0
  let allowed = true
  let strongExclude = false
  let semiHardExclude = false
  const reasons: string[] = []

  const companions = new Set(profile.companions.map((v) => (v === "family" ? "children" : v)))
  if (profile.support.stroller > 0) companions.add("stroller")
  if (profile.support.wheelchair > 0) companions.add("wheelchair")
  if (profile.support.foreignLanguage) companions.add("foreigner")

  const explicitNoWheelchair = containsAny(blob, [...HARD_EXCLUDE_KEYWORDS.wheelchair])
  const explicitNoStroller = containsAny(blob, [...HARD_EXCLUDE_KEYWORDS.stroller])
  const steepTerrain = containsAny(blob, [...HARD_EXCLUDE_KEYWORDS.steepTerrain])
  const wheelchairPositive = containsAny(blob, [...POSITIVE_KEYWORDS.wheelchair, ...POSITIVE_KEYWORDS.elevator])
  const strollerPositive = containsAny(blob, [...POSITIVE_KEYWORDS.stroller])
  const seniorPositive = containsAny(blob, [...POSITIVE_KEYWORDS.lowMobility])
  const foreignerPositive = containsAny(blob, [...POSITIVE_KEYWORDS.multilingual])
  const familyPositive = containsAny(blob, [...POSITIVE_KEYWORDS.family])
  const safetyPositive = containsAny(blob, [...POSITIVE_KEYWORDS.safety])
  const elevatorPositive = containsAny(blob, [...POSITIVE_KEYWORDS.elevator])
  const accessibleRestroomPositive = containsAny(blob, [...POSITIVE_KEYWORDS.accessibleRestroom])

  const structuredWheelchair = parseStructuredFlag(raw.chkcwbchn)
  const structuredStroller = parseStructuredFlag(raw.chkcbcnvn)
  const structuredElevator = parseStructuredFlag(raw.elevator)
  const structuredRestroom = parseStructuredFlag(raw.restroom)
  const hasStrongAccessibilityOverride = hasAccessiblePositiveSignal({
    effectiveAccessibilityScore,
    structuredWheelchair,
    structuredStroller,
    structuredElevator,
    structuredRestroom,
    wheelchairPositive,
    strollerPositive,
    elevatorPositive,
    accessibleRestroomPositive,
  })

  let accessibilityFit = FIT_SCORE.base + (effectiveAccessibilityScore - 50) * 0.8
  if (structuredWheelchair === "yes" || structuredStroller === "yes") accessibilityFit += FIT_SCORE.strongBonus
  if (structuredWheelchair === "no" || structuredStroller === "no") accessibilityFit -= FIT_SCORE.criticalPenalty
  if (elevatorPositive || structuredElevator === "yes") accessibilityFit += FIT_SCORE.mediumBonus
  if (accessibleRestroomPositive || structuredRestroom === "yes") accessibilityFit += FIT_SCORE.lightBonus
  if (structuredElevator === "no" || structuredRestroom === "no") accessibilityFit -= FIT_SCORE.mediumPenalty
  accessibilityFit = clampScore(accessibilityFit)

  let mobilityFit = FIT_SCORE.base
  if (steepTerrain) mobilityFit -= FIT_SCORE.criticalPenalty
  if (strollerPositive || seniorPositive) mobilityFit += FIT_SCORE.mediumBonus
  if (wheelchairPositive) mobilityFit += FIT_SCORE.lightBonus
  if (item.placeKind === "attraction" && steepTerrain) mobilityFit -= FIT_SCORE.strongPenalty
  mobilityFit = clampScore(mobilityFit)

  let safetyFit = FIT_SCORE.base
  if (safetyPositive) safetyFit += FIT_SCORE.mediumBonus
  if (familyPositive) safetyFit += FIT_SCORE.lightBonus
  if (steepTerrain) safetyFit -= FIT_SCORE.mediumPenalty
  safetyFit = clampScore(safetyFit)

  let multilingualFit = FIT_SCORE.base
  if (foreignerPositive) multilingualFit += FIT_SCORE.strongBonus
  if (containsAny(blob, ["관광안내소", "관광지", "visitor"])) multilingualFit += FIT_SCORE.lightBonus
  multilingualFit = clampScore(multilingualFit)

  let familyFit = FIT_SCORE.base
  if (familyPositive) familyFit += FIT_SCORE.strongBonus
  if (accessibleRestroomPositive || structuredRestroom === "yes") familyFit += FIT_SCORE.mediumBonus
  if (steepTerrain) familyFit -= FIT_SCORE.mediumPenalty
  familyFit = clampScore(familyFit)

  const wheelchairFitRaw = clampScore(Math.round(accessibilityFit * 0.65 + mobilityFit * 0.35))
  const strollerFitRaw = clampScore(Math.round(mobilityFit * 0.5 + familyFit * 0.25 + safetyFit * 0.25))
  const elderlyFitRaw = clampScore(Math.round(mobilityFit * 0.45 + safetyFit * 0.35 + accessibilityFit * 0.2))
  const foreignerFitRaw = clampScore(Math.round(multilingualFit * 0.7 + safetyFit * 0.3))
  const familyFitRaw = clampScore(Math.round(familyFit * 0.5 + safetyFit * 0.3 + mobilityFit * 0.2))

  if (companions.has("wheelchair")) {
    if (explicitNoWheelchair || structuredWheelchair === "no") {
      allowed = false
      strongExclude = true
      penalty += 120
      reasons.push("wheelchair-explicit-no")
    } else {
      if (steepTerrain && !wheelchairPositive && structuredWheelchair !== "yes") {
        allowed = false
        strongExclude = true
        penalty += 120
        reasons.push("wheelchair-terrain-hard-exclude")
      } else {
        if (!wheelchairPositive && structuredWheelchair !== "yes") penalty += FIT_SCORE.mediumPenalty
        if (effectiveAccessibilityScore < 35) penalty += 42
        else if (effectiveAccessibilityScore < 50) penalty += 18
        else bonus += 16
      }
      reasons.push("wheelchair-applied")
    }
  }

  if (companions.has("stroller")) {
    if (explicitNoStroller || structuredStroller === "no") {
      allowed = false
      strongExclude = true
      penalty += 80
      reasons.push("stroller-explicit-no")
    } else {
      if (steepTerrain && !strollerPositive && structuredStroller !== "yes") {
        allowed = false
        strongExclude = true
        penalty += 90
        reasons.push("stroller-terrain-hard-exclude")
      } else {
        if (!strollerPositive && structuredStroller !== "yes") penalty += FIT_SCORE.mediumPenalty
        if (effectiveAccessibilityScore < 38) penalty += 28
        else if (effectiveAccessibilityScore >= 55) bonus += 12
      }
      reasons.push("stroller-applied")
    }
  }

  if (companions.has("elderly")) {
    if (!seniorPositive) penalty += FIT_SCORE.lightBonus
    if (effectiveAccessibilityScore < 50) penalty += 16
    else bonus += 8
    if (detectCrowdLikeRisk(blob)) {
      penalty += FIT_SCORE.lightBonus
      reasons.push("elderly-high-crowd-risk")
    }
    if (isRouteBurdenHigh(item)) {
      penalty += FIT_SCORE.mediumPenalty
      reasons.push("elderly-heavy-walk-risk")
    }
    reasons.push("elderly-applied")
  }

  if (companions.has("foreigner")) {
    if (!foreignerPositive) penalty += 12
    else bonus += 8
    reasons.push("foreigner-applied")
  }

  if (companions.has("children")) {
    if (!familyPositive) penalty += FIT_SCORE.lightBonus
    else bonus += 8
    reasons.push("family-applied")
  }

  for (const f of profile.accessibilityFilters) {
    if (f === "stroller_friendly" && !strollerPositive) penalty += 12
    if (f === "elevator" && !containsAny(blob, ["엘리베이터", "승강기", "elevator"])) penalty += 10
    if (f === "accessible_restroom" && !containsAny(blob, ["장애인화장실", "accessible restroom"])) penalty += 10
  }

  if (effectiveAccessibilityScore >= 70) bonus += 10
  if (effectiveAccessibilityScore < 30) {
    penalty += 20
    reasons.push("low-accessibility-score")
  }
  if (
    effectiveAccessibilityScore < 42 &&
    structuredWheelchair === "unknown" &&
    structuredStroller === "unknown" &&
    structuredElevator === "unknown" &&
    structuredRestroom === "unknown"
  ) {
    penalty += FIT_SCORE.mediumPenalty
    reasons.push("missing-accessibility-info")
  }

  // Semi-hard exclude: 카테고리/유형 고위험 + 구조화 접근성 신호 부재
  const wheelchairCategoryRisk =
    isCategoryRisk(CATEGORY_RISK_RULES.wheelchair, contentTypeId, cat3, blob)
  const strollerCategoryRisk =
    isCategoryRisk(CATEGORY_RISK_RULES.stroller, contentTypeId, cat3, blob)
  const elderlyCategoryRisk =
    isCategoryRisk(CATEGORY_RISK_RULES.elderly, contentTypeId, cat3, blob)

  if (allowed && companions.has("wheelchair") && wheelchairCategoryRisk && !hasStrongAccessibilityOverride) {
    semiHardExclude = true
    reasons.push("wheelchair-category-risk")
    if (companions.has("stroller") || effectiveAccessibilityScore < 55 || isRouteBurdenHigh(item)) {
      allowed = false
      reasons.push("category-risk-no-override")
    } else {
      penalty += FIT_SCORE.strongPenalty
    }
  } else if (companions.has("wheelchair") && wheelchairCategoryRisk && hasStrongAccessibilityOverride) {
    reasons.push("category-risk-overridden-by-accessibility")
  }
  if (allowed && companions.has("stroller") && strollerCategoryRisk && !hasStrongAccessibilityOverride) {
    semiHardExclude = true
    reasons.push("stroller-category-risk")
    if (companions.has("wheelchair") || effectiveAccessibilityScore < 58 || isRouteBurdenHigh(item)) {
      allowed = false
      reasons.push("category-risk-no-override")
    } else {
      penalty += FIT_SCORE.strongPenalty
    }
  } else if (companions.has("stroller") && strollerCategoryRisk && hasStrongAccessibilityOverride) {
    reasons.push("category-risk-overridden-by-accessibility")
  }
  if (allowed && companions.has("elderly") && elderlyCategoryRisk && !hasStrongAccessibilityOverride) {
    semiHardExclude = true
    if (isRouteBurdenHigh(item) || detectCrowdLikeRisk(blob) || effectiveAccessibilityScore < 52) {
      allowed = false
      reasons.push("category-risk-no-override")
    } else {
      penalty += FIT_SCORE.mediumPenalty
      reasons.push("elderly-heavy-walk-risk")
    }
  } else if (companions.has("elderly") && elderlyCategoryRisk && hasStrongAccessibilityOverride) {
    reasons.push("category-risk-overridden-by-accessibility")
  }

  if (
    allowed &&
    companions.has("wheelchair") &&
    companions.has("stroller") &&
    !hasStrongAccessibilityOverride &&
    (wheelchairCategoryRisk || strollerCategoryRisk || isRouteBurdenVeryHigh(item))
  ) {
    semiHardExclude = true
    allowed = false
    reasons.push("category-risk-no-override")
    reasons.push("combo-stroller-wheelchair-semi-hard-exclude")
  }

  const fitParts: number[] = []
  if (companions.has("wheelchair")) fitParts.push(wheelchairFitRaw)
  if (companions.has("stroller")) fitParts.push(strollerFitRaw)
  if (companions.has("elderly")) fitParts.push(elderlyFitRaw)
  if (companions.has("foreigner")) fitParts.push(foreignerFitRaw)
  if (companions.has("children")) fitParts.push(familyFitRaw)
  if (fitParts.length === 0) fitParts.push(FIT_SCORE.base)

  let componentFitBase = componentAverage(fitParts)

  if (companions.has("stroller") && companions.has("wheelchair")) {
    const pairMin = Math.min(wheelchairFitRaw, strollerFitRaw)
    const strongestPenalty = Math.round(penalty * COMBINATION_RULES.strollerWheelchair.strongestPenaltyWeight)
    componentFitBase = clampScore(
      pairMin + COMBINATION_RULES.strollerWheelchair.sharedAccessibilityBonus - strongestPenalty,
    )
    reasons.push("combo-stroller-wheelchair-conservative")
  }
  if (companions.has("elderly") && companions.has("wheelchair") && detectCrowdLikeRisk(blob)) {
    penalty += COMBINATION_RULES.elderlyWheelchair.crowdRiskPenalty
    reasons.push("combo-elderly-wheelchair-crowd-penalty")
  }
  if (companions.has("children") && companions.has("stroller")) {
    bonus += COMBINATION_RULES.familyStroller.familySafetyBonus
    reasons.push("combo-family-stroller-bonus")
  }

  const companionFit = clampScore(componentFitBase - penalty * 0.22 + bonus * 0.34)
  const finalScore = Math.round(
    baseScore * FINAL_SCORE_WEIGHT.baseScore +
      effectiveAccessibilityScore * FINAL_SCORE_WEIGHT.effectiveAccessibility +
      companionFit * FINAL_SCORE_WEIGHT.companionFit,
  )
  return {
    id: item.id,
    title: item.title,
    contentTypeId,
    cat3,
    baseScore,
    accessibilityScore,
    effectiveAccessibilityScore,
    accessibilityFit,
    mobilityFit,
    safetyFit,
    multilingualFit,
    familyFit,
    companionFit,
    finalScore,
    allowed,
    strongExclude,
    semiHardExclude,
    penalty,
    reasons,
  }
}

export function applyCompanionPreferences(
  items: NormalizedRecommendation[],
  profile: CompanionPreferenceProfile,
): CompanionPreferenceResult {
  const hasCompanionConstraints =
    profile.companions.length > 0 ||
    profile.support.stroller > 0 ||
    profile.support.wheelchair > 0 ||
    profile.support.foreignLanguage ||
    profile.accessibilityFilters.length > 0

  if (!hasCompanionConstraints) {
    return {
      items,
      appliedFilters: [],
      candidateDebug: items.map((i) => ({
        id: i.id,
        title: i.title,
        contentTypeId: i.contentTypeId,
        cat3: pickStr(i.mergedRaw?.cat3),
        baseScore: deriveNumericScore(i),
        accessibilityScore: i.accessibleScore ?? 0,
        effectiveAccessibilityScore: i.accessibleScore ?? 0,
        accessibilityFit: FIT_SCORE.base,
        mobilityFit: FIT_SCORE.base,
        safetyFit: FIT_SCORE.base,
        multilingualFit: FIT_SCORE.base,
        familyFit: FIT_SCORE.base,
        companionFit: 50,
        finalScore: Math.round(deriveNumericScore(i) * 0.38 + (i.accessibleScore ?? 0) * 0.32 + 50 * 0.3),
        allowed: true,
        strongExclude: false,
        semiHardExclude: false,
        penalty: 0,
        reasons: ["no-companion-constraints"],
      })),
      companionFallbackUsed: false,
      excludedCount: 0,
    }
  }

  const candidateDebug = items.map((i) => evaluateCandidate(i, profile))
  const byId = new Map(candidateDebug.map((d) => [d.id, d]))
  const ranked = [...items].sort((a, b) => {
    const ad = byId.get(a.id)!
    const bd = byId.get(b.id)!
    const av = (ad.allowed ? 0 : -999) + ad.finalScore
    const bv = (bd.allowed ? 0 : -999) + bd.finalScore
    return bv - av
  })

  const filtered = ranked.filter((it) => byId.get(it.id)?.allowed)
  const companionFallbackUsed = filtered.length === 0
  return {
    items: companionFallbackUsed ? ranked : filtered,
    appliedFilters: [
      ...profile.companions.map((c) => `companion:${c}`),
      ...(profile.support.stroller > 0 ? ["support:stroller"] : []),
      ...(profile.support.wheelchair > 0 ? ["support:wheelchair"] : []),
      ...(profile.support.foreignLanguage ? ["support:foreignLanguage"] : []),
      ...profile.accessibilityFilters.map((f) => `accessibility:${f}`),
    ],
    candidateDebug,
    companionFallbackUsed,
    excludedCount: candidateDebug.filter((c) => !c.allowed).length,
  }
}
