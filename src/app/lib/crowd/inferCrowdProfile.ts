import type { CrowdPredictionInput } from "./types"
import { WEIGHT } from "./crowdRules"

export type InferredProfile = {
  indoorOutdoor: NonNullable<CrowdPredictionInput["indoorOutdoor"]>
  popularityTier: NonNullable<CrowdPredictionInput["popularityTier"]>
  stayPattern: NonNullable<CrowdPredictionInput["stayPattern"]>
}

const joinText = (a?: string, b?: string) => [a, b].filter(Boolean).join(" ").toLowerCase()

/**
 * TourAPI category, 제목, PLACES의 crowdLevel(1~5) 힌트로 프로필 추론
 */
export function inferCrowdProfileFromText(input: {
  category?: string
  titleHint?: string
  /** 1(한산)~5(매우 혼잡) — PLACES의 `crowdLevel` 등 */
  crowdLevelHint?: number
}): InferredProfile {
  const t = joinText(input.category, input.titleHint)

  let indoorOutdoor: InferredProfile["indoorOutdoor"] = "mixed"
  let popularityTier: InferredProfile["popularityTier"] = "standard"
  let stayPattern: InferredProfile["stayPattern"] = "medium"

  if (/(해변|해수욕|광안|해운대|동백|송정|다대포)/.test(t)) {
    indoorOutdoor = "outdoor"
    popularityTier = "major"
    stayPattern = "long"
  } else if (/(시장|국수|상가|자갈치|부산대)/.test(t)) {
    indoorOutdoor = "outdoor"
    popularityTier = "standard"
    stayPattern = "short"
  } else if (/(박물관|미술관|아쿠아|수족|전시|트릭아이|아쿠아리움)/.test(t)) {
    indoorOutdoor = "indoor"
    popularityTier = "major"
    stayPattern = "long"
  } else if (/(전망|타워|누리마|용두|망월)/.test(t)) {
    indoorOutdoor = "outdoor"
    popularityTier = "standard"
    stayPattern = "short"
  } else if (/(공원|수목|낙동|시민공원|황령)/.test(t)) {
    indoorOutdoor = "outdoor"
    popularityTier = "standard"
    stayPattern = "medium"
  } else if (/(감천|마을|골목|어촌|기장)/.test(t)) {
    indoorOutdoor = "outdoor"
    popularityTier = "standard"
    stayPattern = "long"
  } else if (/(사찰|백양|해동|용궁|서면|캐릭터)/.test(t)) {
    indoorOutdoor = "mixed"
    popularityTier = "standard"
    stayPattern = "medium"
  }

  const cl = input.crowdLevelHint
  if (typeof cl === "number" && cl >= 1 && cl <= 5) {
    if (cl >= 4) popularityTier = "major"
    if (cl <= 2) popularityTier = "small"
  }

  return { indoorOutdoor, popularityTier, stayPattern }
}

export function scoreForPopularity(tier: InferredProfile["popularityTier"]): number {
  return WEIGHT.popularity[tier]
}
