import { describe, expect, it, vi } from "vitest"

import { getTourProxyResponse } from "../../server/tourProxyShared.mjs"

describe("getTourProxyResponse", () => {
  it("health 경로는 Tour 서버 상태를 반환한다", async () => {
    const url = new URL("https://example.com/api/tour/health")

    const result = await getTourProxyResponse(url)

    expect(result.status).toBe(200)
    expect(result.body).toMatchObject({
      ok: true,
      data: {
        api: "tour",
      },
    })
  })

  it("area-based 경로는 기존 Tour 목록 envelope 계약을 유지한다", async () => {
    const callKorService2 = vi.fn().mockResolvedValue({
      response: {
        body: {
          items: {
            item: [
              {
                contentid: "1",
                contenttypeid: "12",
                title: "해운대",
                mapx: "129.1589",
                mapy: "35.1587",
              },
            ],
          },
          totalCount: 1,
          pageNo: 1,
          numOfRows: 10,
        },
      },
    })

    const url = new URL(
      "https://example.com/api/tour/area-based?areaCode=6&arrange=C&numOfRows=10&pageNo=1",
    )
    const result = await getTourProxyResponse(url, { callKorService2 })

    expect(result.status).toBe(200)
    expect(callKorService2).toHaveBeenCalledWith("areaBasedList2", {
      areaCode: "6",
      arrange: "C",
      numOfRows: "10",
      pageNo: "1",
    })
    expect(result.body).toEqual({
      ok: true,
      data: {
        items: [
          {
            contentid: "1",
            contenttypeid: "12",
            title: "해운대",
            mapx: "129.1589",
            mapy: "35.1587",
          },
        ],
        totalCount: 1,
        pageNo: 1,
        numOfRows: 10,
      },
    })
  })

  it("알 수 없는 경로는 404 JSON을 반환한다", async () => {
    const result = await getTourProxyResponse(new URL("https://example.com/api/tour/nope"))

    expect(result.status).toBe(404)
    expect(result.body).toEqual({
      ok: false,
      error: {
        code: "NOT_FOUND",
        message: "Unknown tour route",
      },
    })
  })
})
