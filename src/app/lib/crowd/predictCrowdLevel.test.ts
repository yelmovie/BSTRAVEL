import { describe, expect, it } from "vitest"
import { predictCrowdLevel } from "./predictCrowdLevel"

describe("predictCrowdLevel", () => {
  it("평일 오전 · 실내(박물관) 성향 → 여유 또는 보통 (실측 수치 없음)", () => {
    const r = predictCrowdLevel({
      category: "박물관",
      titleHint: "국립부산박물관 상설전시",
      visitAt: new Date("2026-04-15T10:00:00+09:00"),
      visitHour: 10,
      indoorOutdoor: "indoor",
      popularityTier: "major",
      weatherCode: 1,
    })
    expect(["low", "medium"]).toContain(r.level)
    expect(r.label).toMatch(/여유|보통/)
    expect(r.reason.length).toBeGreaterThan(10)
    expect(r.summaryLine).toBeTruthy()
    expect(r.sourceLabel).toContain("예측")
    expect(r.methodologyLine.length).toBeGreaterThan(20)
  })

  it("주말 오후 · 대표 실외 관광지 → 혼잡 또는 보통", () => {
    const r = predictCrowdLevel({
      category: "관광지",
      titleHint: "해운대 해수욕장 일대",
      visitAt: new Date("2026-04-18T15:00:00+09:00"),
      visitHour: 15,
      indoorOutdoor: "outdoor",
      popularityTier: "major",
      weatherCode: 0,
    })
    expect(["medium", "high"]).toContain(r.level)
    expect(r.confidenceLabelKo).toMatch(/기준 충분|참고용 예측|데이터 제한/)
  })

  it("비 오는 날 · 실외 → 혼잡 완화 요인 반영", () => {
    const slot = new Date("2026-04-19T14:00:00+09:00")
    const rainy = predictCrowdLevel({
      titleHint: "광안리 해변 산책",
      visitAt: slot,
      visitHour: 14,
      indoorOutdoor: "outdoor",
      popularityTier: "standard",
      weatherCode: 61,
    })
    const clear = predictCrowdLevel({
      titleHint: "광안리 해변 산책",
      visitAt: slot,
      visitHour: 14,
      indoorOutdoor: "outdoor",
      popularityTier: "standard",
      weatherCode: 0,
    })
    const rank = { low: 0, medium: 1, high: 2 } as const
    expect(rank[rainy.level]).toBeLessThanOrEqual(rank[clear.level])
  })

  it("카테고리 부족 시 제한 신뢰도", () => {
    const r = predictCrowdLevel({
      visitAt: new Date("2026-04-16T12:00:00+09:00"),
      visitHour: 12,
      weatherCode: null,
    })
    expect(r.confidence).toBe("limited")
  })

  it("결과에 퍼센트·실측 인구 문자열 없음", () => {
    const r = predictCrowdLevel({
      category: "시장",
      titleHint: "부산 국제 시장",
      visitAt: new Date("2026-04-19T13:00:00+09:00"),
      visitHour: 13,
      weatherCode: 2,
    })
    expect(JSON.stringify(r)).not.toMatch(/%\s*\d|\d+\s*명/)
  })
})
