/**
 * 최종 비율 점수 → 4단계 라벨 (상한·하한 clamp 이후 값 기준)
 */
import type { CrowdDisplayTier, CrowdLevel } from "./types"

const TIER_KO: Record<CrowdDisplayTier, string> = {
  relaxed: "여유",
  normal: "보통",
  somewhat_busy: "다소 혼잡",
  busy: "혼잡",
}

/** 구 UI·테스트 호환용 3단계 매핑 */
export function tierToLegacyLevel(tier: CrowdDisplayTier): CrowdLevel {
  if (tier === "relaxed") return "low"
  if (tier === "normal") return "medium"
  return "high"
}

export function getCrowdLabel(score: number): {
  tier: CrowdDisplayTier
  labelKo: string
  legacyLevel: CrowdLevel
} {
  const s = score
  if (s < 0.85) return { tier: "relaxed", labelKo: TIER_KO.relaxed, legacyLevel: "low" }
  if (s <= 1.04) return { tier: "normal", labelKo: TIER_KO.normal, legacyLevel: "medium" }
  if (s <= 1.24) return { tier: "somewhat_busy", labelKo: TIER_KO.somewhat_busy, legacyLevel: "high" }
  return { tier: "busy", labelKo: TIER_KO.busy, legacyLevel: "high" }
}
