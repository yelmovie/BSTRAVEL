import { CONFIDENCE_LABEL, METHODOLOGY_LINE_KO, SOURCE_LABEL_KO } from "./crowdRules"
import { CROWD_FOOTER_DISCLAIMER_KO } from "./crowdReasons"
import type { CrowdPredictionResult } from "./types"

/** 계산 예외 시 보통 등급 + 지연 안내 (실시간 혼잡 표현 금지) */
export function crowdPredictionDegraded(): CrowdPredictionResult {
  const msg =
    "일부 데이터가 지연되고 있습니다. 참고용으로만 확인해 주세요."
  return {
    level: "medium",
    label: "보통",
    displayTier: "normal",
    officialDateLabel: "보통",
    crowdRibbonLabelKo: "AI 추정 포함",
    officialExplanationKo: msg,
    estimateExplanationKo:
      "시간대·환경 보정을 적용하지 못했습니다. 네트워크가 안정되면 다시 시도해 주세요.",
    evidenceOfficialKo: "공공 분류 정보를 일시적으로 불러오지 못했습니다.",
    evidenceEstimateKo: "추정 규칙 적용을 건너뛰었습니다.",
    contextBadges: [{ id: "delay", label: "일시 지연" }],
    primaryNarrative: msg,
    secondaryNarrative:
      "시간대·환경 보정을 적용하지 못했습니다. 네트워크가 안정되면 다시 시도해 주세요.",
    chips: [{ id: "delay", label: "참고: 지연 · 보통 표시" }],
    reason: msg,
    summaryLine: "일부 데이터가 지연되어 기본 수준으로 표시했습니다.",
    confidence: "limited",
    sourceLabel: SOURCE_LABEL_KO,
    methodologyLine: METHODOLOGY_LINE_KO,
    confidenceLabelKo: CONFIDENCE_LABEL.limited,
    footerDisclaimerKo: CROWD_FOOTER_DISCLAIMER_KO,
  }
}
