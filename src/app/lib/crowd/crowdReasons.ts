import type { CrowdDisplayTier, CrowdPlaceKind, CrowdChip, CrowdRibbonLabelKo } from "./types"
import type { CrowdComputationBreakdown } from "./crowdScore"

export const CROWD_FOOTER_DISCLAIMER_KO =
  "현장 혼잡은 행사·교통·기상 변화로 달라질 수 있습니다. 이 혼잡도는 측정치가 아니라 공공 메타데이터와 내부 규칙을 섞은 참고용 추정이며, 날씨 예보 수치와는 별개로 다룹니다."

function tierRank(t: CrowdDisplayTier): number {
  const m: Record<CrowdDisplayTier, number> = {
    relaxed: 0,
    normal: 1,
    somewhat_busy: 2,
    busy: 3,
  }
  return m[t]
}

function weekdayLabelKo(d: Date): string {
  const names = ["일", "월", "화", "수", "목", "금", "토"]
  return `${names[d.getDay()]}요일`
}

function describeTimeBand(placeKind: CrowdPlaceKind, hour: number): string {
  if (placeKind === "restaurant") {
    if (hour >= 11 && hour < 14) return "점심 피크"
    if (hour >= 17 && hour < 21) return "저녁 피크"
    if (hour >= 8 && hour < 10) return "오전 식사"
    return "비피크 시간대"
  }
  if (placeKind === "hotel") {
    if (hour >= 15 && hour < 18) return "체크인 무렵"
    if (hour >= 19 && hour < 21) return "저녁 시간대"
    return "일반 시간대"
  }
  if (hour >= 14 && hour < 17) return "오후 피크"
  if (hour >= 11 && hour < 13) return "점심 무렵"
  if (hour >= 9 && hour < 11) return "오전"
  if (hour >= 17 && hour < 19) return "저녁 이전"
  return "이른·늦은 시간대"
}

/** 혼잡도 카드 근거 칩 — 예보 출처 명시 금지, 규칙 요약만 */
function estimateFactorChip(weightWeather: number, placeKind: CrowdPlaceKind): string | null {
  if (Math.abs(weightWeather - 1) < 0.035) return null
  if (placeKind === "restaurant" && weightWeather > 1.02) return "추정: 실내 수요 패턴 가능성"
  if (weightWeather < 1) return "추정: 실외 동선 부담 완화 쪽 규칙"
  return "추정: 동선 여유 가능 쪽 규칙"
}

function resolveRibbonLabel(weightTime: number): CrowdRibbonLabelKo {
  return Math.abs(weightTime - 1) >= 0.07 ? "시간대 보정 적용" : "AI 추정 포함"
}

/**
 * 카드 문구 — 공식(일·분류)과 추정(시간 등) 분리, 외부 예보 명칭 없음
 */
export function buildCrowdReasons(params: {
  breakdown: CrowdComputationBreakdown
  placeKind: CrowdPlaceKind
  visitDate: Date
  visitHour: number
}): {
  officialExplanationKo: string
  estimateExplanationKo: string
  evidenceOfficialKo: string
  evidenceEstimateKo: string
  crowdRibbonLabelKo: CrowdRibbonLabelKo
  primaryNarrative: string
  secondaryNarrative: string
  chips: CrowdChip[]
  contextBadges: CrowdChip[]
} {
  const { breakdown, placeKind, visitDate, visitHour } = params
  const { officialLabelKo, finalLabelKo, officialTier, finalTier, weightDay, weightTime, weightWeather } =
    breakdown

  const diff = tierRank(finalTier) - tierRank(officialTier)
  const timeBand = describeTimeBand(placeKind, visitHour)
  const dayName = weekdayLabelKo(visitDate)
  const hh = String(visitHour).padStart(2, "0")

  const officialExplanationKo = `한국관광공사 공개 목록의 분류·유형만으로 본 해당 일 방문 경향 추정은 「${officialLabelKo}」에 가깝습니다. 실시간 방문 집중률이나 인원 수가 아니라 공개 메타데이터 규칙입니다.`

  let estimateExplanationKo = ""

  const lowOfficialHighFinal = tierRank(officialTier) <= 1 && tierRank(finalTier) >= 2

  if (lowOfficialHighFinal) {
    estimateExplanationKo = `선택한 ${dayName} ${hh}시 전후·장소 유형 기준으로, 시간대·요일 규칙을 더한 체감 추정은 「${finalLabelKo}」에 가깝게 올라갈 수 있습니다(일 정보보다 붐빌 수 있는 시간대로 가정). 단정은 하지 않습니다.`
    if (weightWeather < 0.96 && (placeKind === "tour" || placeKind === "other")) {
      estimateExplanationKo += ` 강수·강풍 가능성은 혼잡 규칙 안에서만 반영했으며, 날씨 표시와 출처는 혼잡도 근거와 분리했습니다.`
    }
    if (weightDay >= 1.15) {
      estimateExplanationKo += ` 주말·휴일 요일 패턴을 가볍게 넣었습니다.`
    }
  } else if (diff === 0) {
    estimateExplanationKo = `같은 일에 대해 시간대(${timeBand})·요일·장소 유형·내부 환경 규칙까지 합친 체감 추정도 「${finalLabelKo}」 근처로 보입니다. 일 추정과 크게 어긋나지 않습니다.`
  } else if (diff > 0) {
    estimateExplanationKo = `시간대(${timeBand})·요일·장소 유형·환경 규칙을 더하면 체감 추정은 「${finalLabelKo}」쪽으로 올라갈 수 있습니다.`
    if (weightWeather < 0.96 && (placeKind === "tour" || placeKind === "other")) {
      estimateExplanationKo += ` 실외 동선 부담을 줄이는 쪽으로만 반영했으며, 예보 출처와 혼잡도 근거는 분리했습니다.`
    }
    if (weightDay >= 1.15) {
      estimateExplanationKo += ` 주말·휴일 패턴을 반영했습니다.`
    }
  } else {
    estimateExplanationKo = `시간대·요일·환경 규칙을 적용하면 체감 추정은 「${finalLabelKo}」쪽으로 내려갈 수 있습니다. 일 단위 추정보다 여유로 보일 수 있습니다.`
  }

  const evidenceOfficialKo = `공공 분류·유형 기준 일 추정 등급: 「${officialLabelKo}」(관광공사 공개 목록 메타데이터)`
  const evidenceEstimateKo = `선택 시각·요일·유형·환경 규칙으로 만든 체감 추정 등급: 「${finalLabelKo}」(내부 규칙·추정, 날씨 예보와 별개)`

  const chips: CrowdChip[] = [
    { id: "official", label: `일·유형(공공): ${officialLabelKo}` },
    { id: "time", label: `시간대 추정: ${timeBand}` },
    { id: "dow", label: `요일: ${dayName}` },
  ]
  const envChip = estimateFactorChip(weightWeather, placeKind)
  if (envChip && Math.abs(weightWeather - 1) >= 0.035) {
    chips.push({ id: "env", label: envChip })
  }
  const trimmed = chips.slice(0, 4)

  const crowdRibbonLabelKo = resolveRibbonLabel(weightTime)

  const contextBadges: CrowdChip[] = [{ id: "base", label: "공공 메타데이터" }]
  if (Math.abs(weightTime - 1) >= 0.07) {
    contextBadges.push({ id: "time", label: "시간대 보정" })
  }
  if (Math.abs(weightWeather - 1) >= 0.04) {
    contextBadges.push({ id: "wx", label: "환경 규칙" })
  }
  if (Math.abs(weightDay - 1) >= 0.06) {
    contextBadges.push({ id: "day", label: "요일·휴일" })
  }
  if (diff !== 0) {
    contextBadges.push({ id: "est", label: "추정 포함" })
  }

  return {
    officialExplanationKo,
    estimateExplanationKo,
    evidenceOfficialKo,
    evidenceEstimateKo,
    crowdRibbonLabelKo,
    primaryNarrative: `${officialExplanationKo} ${estimateExplanationKo}`,
    secondaryNarrative: estimateExplanationKo,
    chips: trimmed,
    contextBadges: contextBadges.slice(0, 4),
  }
}

export function buildCrowdSummaryFromTier(tier: CrowdDisplayTier): string {
  if (tier === "relaxed") return "이 조건이면 동선을 짜기 비교적 수월할 수 있습니다."
  if (tier === "normal") return "일부 구간에서 잠깐 몰릴 수 있어 여유를 두면 좋습니다."
  if (tier === "somewhat_busy") return "대기나 이동이 늘어날 수 있어 일정에 여유를 권합니다."
  return "밀집이 커질 수 있어 대체 동선·시간대를 검토하는 편이 좋습니다."
}
