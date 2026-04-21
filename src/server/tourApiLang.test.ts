import { describe, expect, it } from "vitest"

import {
  buildTourService2Request,
  normalizeTourQueryLang,
} from "../../server/tourApiLang.mjs"

describe("normalizeTourQueryLang", () => {
  it("중국어 별칭을 정규화한다", () => {
    expect(normalizeTourQueryLang("zh")).toBe("zh-CN")
    expect(normalizeTourQueryLang("zh-cn")).toBe("zh-CN")
    expect(normalizeTourQueryLang("zh_tw")).toBe("zh-TW")
  })

  it("지원하지 않는 언어는 null을 반환한다", () => {
    expect(normalizeTourQueryLang("ar")).toBeNull()
    expect(normalizeTourQueryLang("ru")).toBeNull()
  })
})

describe("buildTourService2Request", () => {
  it("영어는 EngService2로 라우팅하고 upstream query에서 lang를 제거한다", () => {
    const request = buildTourService2Request("areaBasedList2", {
      areaCode: "6",
      pageNo: "1",
      numOfRows: "10",
      lang: "en",
    })

    expect(request.baseUrl).toBe("https://apis.data.go.kr/B551011/EngService2")
    expect(request.params).toEqual({
      areaCode: "6",
      pageNo: "1",
      numOfRows: "10",
    })
    expect(request.requestedLang).toBe("en")
  })

  it("한국어 기본 요청은 KorService2를 유지한다", () => {
    const request = buildTourService2Request("searchKeyword2", {
      keyword: "서면",
      areaCode: "6",
    })

    expect(request.baseUrl).toBe("https://apis.data.go.kr/B551011/KorService2")
    expect(request.params).toEqual({
      keyword: "서면",
      areaCode: "6",
    })
    expect(request.requestedLang).toBe("ko")
  })

  it("번체 중국어는 ChtService2로 라우팅한다", () => {
    const request = buildTourService2Request("detailCommon2", {
      contentId: "123",
      contentTypeId: "12",
      lang: "zh-TW",
    })

    expect(request.baseUrl).toBe("https://apis.data.go.kr/B551011/ChtService2")
    expect(request.params).toEqual({
      contentId: "123",
      contentTypeId: "12",
    })
    expect(request.requestedLang).toBe("zh-TW")
  })
})
