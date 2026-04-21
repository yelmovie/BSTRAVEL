/**
 * 앱의 부산 권역 선택값 → TourAPI(areaBasedList2 / searchKeyword2) 파라미터
 * 잘못된 시군구 코드로 빈 목록이 나오는 것을 피하기 위해 권역별로 키워드 검색을 우선합니다.
 */

export type BusanTourFetchPlan =
  | {
      kind: "areaBasedList2"
      params: {
        areaCode: string
        sigunguCode?: string
        arrange?: string
      }
    }
  | {
      kind: "searchKeyword2"
      params: {
        keyword: string
        areaCode: string
      }
    }

/** 키워드 결과가 비었을 때만 시도할 넓은 조회 */
export function getBusanFallbackPlan(): BusanTourFetchPlan {
  return {
    kind: "areaBasedList2",
    params: { areaCode: "6", arrange: "C" },
  }
}

/**
 * @param busanAreaId AppContext busanArea (예: busan-all, busan-haeundae)
 */
export function planTourFetchForBusanArea(busanAreaId: string): BusanTourFetchPlan {
  switch (busanAreaId) {
    case "busan-haeundae":
      return {
        kind: "searchKeyword2",
        params: { keyword: "해운대", areaCode: "6" },
      }
    case "busan-junggu":
      return {
        kind: "searchKeyword2",
        params: { keyword: "자갈치", areaCode: "6" },
      }
    case "busan-seomyeon":
      return {
        kind: "searchKeyword2",
        params: { keyword: "서면", areaCode: "6" },
      }
    case "busan-dongrae":
      return {
        kind: "searchKeyword2",
        params: { keyword: "동래", areaCode: "6" },
      }
    case "busan-all":
    default:
      return {
        kind: "areaBasedList2",
        params: { areaCode: "6", arrange: "C" },
      }
  }
}
