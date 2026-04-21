import type { Place } from "../../data/places"
import type { AppLocale } from "../../i18n/constants"
import { instrumentedFetch } from "../apiDebug/instrumentedFetch"

export const CROWD_STATES = {
  LOADING: "loading",
  DISCONNECTED: "disconnected",
  ERROR: "error",
  EMPTY: "empty",
  SUCCESS: "success",
} as const

export type CrowdState = (typeof CROWD_STATES)[keyof typeof CROWD_STATES]

export type CrowdEnvConfig = {
  enabled: boolean
  configured: boolean
  /** 동일 출처 서버 프록시 경로 (외부 URL 아님) */
  baseUrl: string
  apiKeyPresent: boolean
  timeoutMs: number
}

export type CrowdRequestParams = {
  area: string
  lat: number | null
  lng: number | null
  timeSlot: string
  courseId: string
}

export type CrowdSuccessPayload = {
  level: string
  score: number | null
  message: string
  updatedAt: string | null
}

export type CrowdStatusResult =
  | { state: "disconnected"; debugMessage: string; config: CrowdEnvConfig }
  | { state: "error"; debugMessage: string; config: CrowdEnvConfig; httpStatus?: number; responseText?: string }
  | { state: "empty"; debugMessage: string; config: CrowdEnvConfig; httpStatus: number }
  | { state: "success"; debugMessage: string; config: CrowdEnvConfig; httpStatus: number; data: CrowdSuccessPayload }

type JsonRecord = Record<string, unknown>

const CLIENT_TIMEOUT_MS = 12000

function crowdLog(label: string, value: unknown) {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.debug(`[crowd] ${label}:`, value)
}

function asRecord(value: unknown): JsonRecord | null {
  return value != null && typeof value === "object" && !Array.isArray(value)
    ? (value as JsonRecord)
    : null
}

function pickString(source: JsonRecord | null, keys: string[]): string | null {
  if (!source) return null
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "string" && value.trim() !== "") return value.trim()
  }
  return null
}

function pickNumber(source: JsonRecord | null, keys: string[]): number | null {
  if (!source) return null
  for (const key of keys) {
    const value = source[key]
    if (typeof value === "number" && Number.isFinite(value)) return value
    if (typeof value === "string" && value.trim() !== "" && Number.isFinite(Number(value))) {
      return Number(value)
    }
  }
  return null
}

function unwrapCrowdPayload(json: unknown): JsonRecord | null {
  const root = asRecord(json)
  if (!root) return null

  const nestedCandidates: unknown[] = [
    root.data,
    root.result,
    root.item,
    root.current,
    root.crowd,
    root.payload,
  ]

  for (const candidate of nestedCandidates) {
    const record = asRecord(candidate)
    if (record) return record
    if (Array.isArray(candidate) && candidate.length > 0) {
      const first = asRecord(candidate[0])
      if (first) return first
    }
  }

  if (Array.isArray(root.items) && root.items.length > 0) {
    const first = asRecord(root.items[0])
    if (first) return first
  }

  return root
}

function isBodyEmpty(json: unknown): boolean {
  if (json == null) return true
  if (Array.isArray(json)) return json.length === 0
  const root = asRecord(json)
  if (!root) return false
  if (Array.isArray(root.items)) return root.items.length === 0
  if (Array.isArray(root.data)) return root.data.length === 0
  if (Array.isArray(root.result)) return root.result.length === 0
  const candidate = unwrapCrowdPayload(json)
  return candidate != null && Object.keys(candidate).length === 0
}

function toKoreanLevel(rawLevel: string | null, score: number | null): string {
  if (rawLevel) {
    const normalized = rawLevel.toLowerCase()
    if (normalized.includes("low") || normalized.includes("free") || normalized.includes("relaxed")) return "여유"
    if (normalized.includes("high") || normalized.includes("busy") || normalized.includes("crowded")) return "혼잡"
    if (normalized.includes("medium") || normalized.includes("normal") || normalized.includes("moderate")) return "보통"
    return rawLevel
  }

  if (score == null) return "알 수 없음"
  if (score >= 70) return "혼잡"
  if (score >= 40) return "보통"
  return "여유"
}

function buildSuccessPayload(json: unknown): CrowdSuccessPayload | null {
  const payload = unwrapCrowdPayload(json)
  const score = pickNumber(payload, ["score", "levelScore", "crowdScore", "percent", "value", "congestion"])
  const rawLevel = pickString(payload, ["level", "status", "crowdLevel", "congestionLevel", "label"])
  const message =
    pickString(payload, ["message", "summary", "description", "text", "detail"]) ??
    (score != null ? `현재 혼잡도 지수 ${Math.round(score)}%` : null)
  const updatedAt = pickString(payload, ["updatedAt", "fetchedAt", "timestamp", "observedAt", "measuredAt"])
  const level = toKoreanLevel(rawLevel, score)

  if (!message && score == null && !rawLevel && !updatedAt) return null

  return {
    level,
    score: score != null ? Math.max(0, Math.min(100, Math.round(score))) : null,
    message: message ?? "혼잡도 데이터가 수신되었습니다",
    updatedAt,
  }
}

export function getCrowdEnvConfig(): CrowdEnvConfig {
  return {
    enabled: true,
    configured: true,
    baseUrl: "/api/crowd",
    apiKeyPresent: false,
    timeoutMs: CLIENT_TIMEOUT_MS,
  }
}

export function buildCrowdRequestParams(place: Place): CrowdRequestParams {
  const now = new Date()
  const hour = String(now.getHours()).padStart(2, "0")
  const nextHour = String((now.getHours() + 1) % 24).padStart(2, "0")

  return {
    area: place.busanArea,
    lat: place.lat ?? null,
    lng: place.lng ?? null,
    timeSlot: `${hour}:00-${nextHour}:00`,
    courseId: place.id,
  }
}

export function formatCrowdUpdatedAt(value: string | null, locale: AppLocale): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(
    locale === "ko"
      ? "ko-KR"
      : locale === "ja"
        ? "ja-JP"
        : locale === "zh-CN"
          ? "zh-CN"
          : locale === "zh-TW"
            ? "zh-TW"
            : locale === "ru"
              ? "ru-RU"
              : locale === "ar"
                ? "ar"
                : "en-US",
  )
}

function buildProxyQuery(params: CrowdRequestParams): string {
  const q = new URLSearchParams()
  q.set("area", params.area)
  if (params.lat != null) q.set("lat", String(params.lat))
  if (params.lng != null) q.set("lng", String(params.lng))
  q.set("timeSlot", params.timeSlot)
  q.set("courseId", params.courseId)
  return q.toString()
}

function parseProxyNotConfigured(text: string): boolean {
  try {
    const j = JSON.parse(text) as JsonRecord | null
    const err = j && typeof j.error === "object" && j.error !== null ? (j.error as JsonRecord) : null
    const code = err && typeof err.code === "string" ? err.code : ""
    return code === "NOT_CONFIGURED" || code === "CROWD_DISABLED"
  } catch {
    return false
  }
}

/**
 * 동일 출처 서버 프록시 GET `/api/crowd` 만 호출합니다. 비밀키는 브라우저에 없습니다.
 */
export async function getCrowdStatus(params: CrowdRequestParams): Promise<CrowdStatusResult> {
  const config = getCrowdEnvConfig()
  crowdLog("request params", params)

  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), config.timeoutMs)

  try {
    const qs = buildProxyQuery(params)
    const res = await instrumentedFetch(
      `/api/crowd?${qs}`,
      { signal: controller.signal },
      { label: "Crowd 서버 프록시 (/api/crowd)" },
    )

    const text = await res.text()
    crowdLog("response status", res.status)

    if (res.status === 503 && parseProxyNotConfigured(text)) {
      const result: CrowdStatusResult = {
        state: "disconnected",
        debugMessage: "crowd proxy not configured or disabled on server",
        config,
      }
      crowdLog("resolved state", result.state)
      return result
    }

    let body: unknown = null
    if (text.trim() !== "") {
      try {
        body = JSON.parse(text)
      } catch {
        if (!res.ok) {
          const result: CrowdStatusResult = {
            state: "error",
            debugMessage: "crowd response was not valid JSON",
            config,
            httpStatus: res.status,
            responseText: text,
          }
          crowdLog("resolved state", result.state)
          return result
        }
      }
    }

    if (!res.ok) {
      const result: CrowdStatusResult = {
        state: "error",
        debugMessage: `crowd http ${res.status}`,
        config,
        httpStatus: res.status,
        responseText: text,
      }
      crowdLog("resolved state", result.state)
      return result
    }

    if (isBodyEmpty(body)) {
      const result: CrowdStatusResult = {
        state: "empty",
        debugMessage: "crowd response ok but no usable data",
        config,
        httpStatus: res.status,
      }
      crowdLog("resolved state", result.state)
      return result
    }

    const mapped = buildSuccessPayload(body)
    if (!mapped) {
      const result: CrowdStatusResult = {
        state: "empty",
        debugMessage: "crowd response shape did not include usable fields",
        config,
        httpStatus: res.status,
      }
      crowdLog("resolved state", result.state)
      return result
    }

    const result: CrowdStatusResult = {
      state: "success",
      debugMessage: "crowd data mapped successfully",
      config,
      httpStatus: res.status,
      data: mapped,
    }
    crowdLog("resolved state", result.state)
    return result
  } catch (error) {
    const result: CrowdStatusResult = {
      state: "error",
      debugMessage:
        error instanceof DOMException && error.name === "AbortError"
          ? "crowd request timeout"
          : error instanceof Error
            ? error.message
            : "crowd request failed",
      config,
    }
    crowdLog("resolved state", result.state)
    return result
  } finally {
    window.clearTimeout(timer)
  }
}
