import { instrumentedFetch } from "../apiDebug/instrumentedFetch"

/** 서버 `GET /api/tour/test-lang` 응답 — 수동 점검용(요청당 상위 TourAPI 호출 3회·부하 주의) */
export type TourLangTestPayload = {
  success: boolean
  timestamp: string
  ko: string | null
  en: string | null
  ja: string | null
  error?: string
  details?: Partial<Record<"ko" | "en" | "ja", string>>
  meta?: { areaCode?: string; ms?: number }
}

export async function fetchTourLangTest(params?: {
  areaCode?: string
  signal?: AbortSignal
}): Promise<{ res: Response; json: TourLangTestPayload }> {
  const qs = new URLSearchParams()
  if (params?.areaCode) qs.set("areaCode", params.areaCode)
  const suffix = qs.toString() ? `?${qs.toString()}` : ""
  const res = await instrumentedFetch(
    `/api/tour/test-lang${suffix}`,
    { signal: params?.signal },
    { label: "TourAPI GET /api/tour/test-lang (ko/en/ja 스모크)" },
  )
  let json: TourLangTestPayload
  try {
    json = (await res.json()) as TourLangTestPayload
  } catch {
    json = {
      success: false,
      timestamp: new Date().toISOString(),
      ko: null,
      en: null,
      ja: null,
      error: "Invalid JSON from proxy",
    }
  }
  return { res, json }
}

/** 콘솔에 결과·언어 간 차이 여부 출력 (개발·디버깅용) */
export function logTourLangTestResult(payload: TourLangTestPayload): void {
  const { ko, en, ja, success, timestamp, error, details } = payload
  console.groupCollapsed("[TourAPI test-lang]")
  console.log("success:", success, "·", timestamp)
  console.log(" ko:", ko)
  console.log(" en:", en)
  console.log(" ja:", ja)
  const nonempty = [ko, en, ja].filter((t) => t != null && String(t).trim() !== "")
  const uniq = new Set(nonempty)
  if (uniq.size >= 2) {
    console.info("→ 언어별 title 이 서로 다릅니다 (멀티링구얼 필드 제공 가능).")
  } else if (nonempty.length >= 2) {
    console.warn("→ 값은 있으나 동일할 수 있습니다 — 항목·조건을 바꿔 확인하세요.")
  } else {
    console.warn("→ 일부 비어 있거나 단일 값만 반환되었습니다.")
  }
  if (error) console.warn("server error:", error)
  if (details) console.warn("per-lang:", details)
  console.groupEnd()
}

/** 한 번 호출 후 로그까지 출력 */
export async function runTourLangSmokeTest(params?: { areaCode?: string }) {
  const { json } = await fetchTourLangTest(params)
  logTourLangTestResult(json)
  return json
}
