import type { CrowdPlaceKind, CrowdPredictionInput, CrowdPredictionResult, CrowdWeatherSnapshot } from "./types"
import { hashStringToKey } from "../cache/stringHash"
import { CONFIDENCE_LABEL, METHODOLOGY_LINE_KO, SOURCE_LABEL_KO } from "./crowdRules"
import { inferCrowdProfileFromText } from "./inferCrowdProfile"
import { calculateCrowdScore, type CrowdResolvedInput } from "./crowdScore"
import { crowdPlaceKindFromHints } from "./crowdPlaceKind"
import { getOfficialBaseFromProfile } from "./getCrowd"
import {
  buildCrowdReasons,
  buildCrowdSummaryFromTier,
  CROWD_FOOTER_DISCLAIMER_KO,
} from "./crowdReasons"
import { crowdPredictionDegraded } from "./crowdFallbackResult"

function resolveDefaults(raw: CrowdPredictionInput): CrowdResolvedInput & Pick<CrowdPredictionInput, "visitAt"> {
  const now = new Date()
  const visitAt = raw.visitAt ?? now
  const visitHour = raw.visitHour ?? visitAt.getHours()
  /** 시간·요일 보정과 서술을 맞추기 위해 방문 일시 요일만 사용 */
  const isWeekend = visitAt.getDay() === 0 || visitAt.getDay() === 6

  const inferred = inferCrowdProfileFromText({
    category: raw.category,
    titleHint: raw.titleHint,
    crowdLevelHint: raw.crowdLevelHint,
  })

  return {
    ...raw,
    visitAt,
    visitHour,
    isWeekend,
    indoorOutdoor: raw.indoorOutdoor ?? inferred.indoorOutdoor,
    popularityTier: raw.popularityTier ?? inferred.popularityTier,
    stayPattern: raw.stayPattern ?? inferred.stayPattern,
  }
}

function mergeWeatherSnapshot(raw: CrowdPredictionInput): CrowdWeatherSnapshot | null {
  if (raw.weatherSnapshot) return raw.weatherSnapshot
  if (raw.weatherCode != null && !Number.isNaN(Number(raw.weatherCode))) {
    return { weatherCode: raw.weatherCode }
  }
  return null
}

function resolveConfidence(raw: CrowdPredictionInput): CrowdPredictionResult["confidence"] {
  const hasText = Boolean(raw.category?.trim() || raw.titleHint?.trim())
  const snap = raw.weatherSnapshot
  const hasWxDetail =
    snap?.precipitationMm != null ||
    snap?.precipitationProbabilityPct != null ||
    snap?.windSpeedMs != null ||
    snap?.temperatureC != null
  const hasWxCode = raw.weatherCode != null || snap?.weatherCode != null || snap?.weatherCode === 0
  if (hasText && hasWxDetail) return "strong"
  if (hasText && hasWxCode) return "medium"
  if (hasText) return "medium"
  return "limited"
}

function resolvePlaceKind(raw: CrowdPredictionInput): CrowdPlaceKind {
  return raw.placeKind ?? crowdPlaceKindFromHints(raw.category, raw.titleHint)
}

function stablePlaceKey(raw: CrowdPredictionInput): string {
  if (raw.cachePlaceKey?.trim()) return raw.cachePlaceKey.trim()
  return `np:${hashStringToKey(
    `${raw.category ?? ""}|${raw.titleHint ?? ""}|${raw.popularityTier ?? ""}|${raw.indoorOutdoor ?? ""}|${raw.stayPattern ?? ""}`,
  )}`
}

/**
 * 공공 메타데이터·시간대·요일·내부 환경 규칙 기반 참고용 추정 (실측 유동인구 아님, 날씨 API는 혼잡 UI 근거로 쓰지 않음)
 */
export function predictCrowdLevel(raw: CrowdPredictionInput): CrowdPredictionResult {
  try {
    const mergedWx = mergeWeatherSnapshot(raw)
    const rawWithWx: CrowdPredictionInput = {
      ...raw,
      ...(mergedWx ? { weatherSnapshot: mergedWx } : {}),
      weatherCode: mergedWx?.weatherCode ?? raw.weatherCode ?? null,
    }

    const input = resolveDefaults(rawWithWx)
    const placeKind = resolvePlaceKind(raw)
    const visitDate = input.visitAt ?? new Date()
    const visitHour = input.visitHour

    const placeKey = stablePlaceKey(rawWithWx)

    const officialBase = getOfficialBaseFromProfile(input, placeKey, visitDate)

    const breakdown = calculateCrowdScore({
      resolvedInput: input,
      placeKind,
      visitDate,
      visitHour,
      rawInput: rawWithWx,
      cachedOfficialRatio: officialBase,
    })

    const narratives = buildCrowdReasons({
      breakdown,
      placeKind,
      visitDate,
      visitHour,
    })

    const confidence = resolveConfidence(rawWithWx)
    const reason = [narratives.primaryNarrative, narratives.secondaryNarrative].join(" ")

    return {
      level: breakdown.legacyLevel,
      label: breakdown.finalLabelKo,
      displayTier: breakdown.finalTier,
      officialDateLabel: breakdown.officialLabelKo,
      crowdRibbonLabelKo: narratives.crowdRibbonLabelKo,
      officialExplanationKo: narratives.officialExplanationKo,
      estimateExplanationKo: narratives.estimateExplanationKo,
      evidenceOfficialKo: narratives.evidenceOfficialKo,
      evidenceEstimateKo: narratives.evidenceEstimateKo,
      contextBadges: narratives.contextBadges,
      primaryNarrative: narratives.primaryNarrative,
      secondaryNarrative: narratives.secondaryNarrative,
      chips: narratives.chips,
      reason,
      summaryLine: buildCrowdSummaryFromTier(breakdown.finalTier),
      confidence,
      sourceLabel: SOURCE_LABEL_KO,
      methodologyLine: METHODOLOGY_LINE_KO,
      confidenceLabelKo: CONFIDENCE_LABEL[confidence],
      footerDisclaimerKo: CROWD_FOOTER_DISCLAIMER_KO,
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error("[predictCrowdLevel]", e)
    }
    return crowdPredictionDegraded()
  }
}
