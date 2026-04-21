/** TourAPI(KorWithService2) 프록시 응답 → UI용 정규화 타입 (One Source of Truth) */

/** 관광 API 텍스트의 출처·한계 표시용 (UI 번역과 별도) */
export type TourContentQuality = "api_native" | "api_fallback_ko"

/** 필드별 데이터 출처 (TourAPI 공식 다국어 vs 한국어 원문) */
export type TourTextFieldKey = "title" | "address" | "accessibleInfo" | "overview"

export type TourFieldProvenance =
  /** TourAPI 다국어 필드로 제공된 것으로 간주 */
  | "api_official"
  /** 한국어 UI 또는 한국어 원문 그대로 */
  | "original_korean"

export type TourApiErrorPayload = {
  code: string
  message: string
}

export type TourListPayload = {
  items: Record<string, unknown>[]
  totalCount: number
  pageNo?: string | number
  numOfRows?: string | number
}

export type TourDetailCommonPayload = {
  item: Record<string, unknown> | null
  rawCount: number
}

export type TourApiSuccess<T> = { ok: true; data: T }
export type TourApiFailure = { ok: false; error: TourApiErrorPayload }
export type TourApiEnvelope<T> = TourApiSuccess<T> | TourApiFailure

/** 목록·지도·상세 패널에서 공통으로 사용하는 관광지 모델 */
export type NormalizedTourPlace = {
  id: string
  contentTypeId: string
  title: string
  address: string
  areaCode: string
  sigunguCode: string
  lat: number | null
  lng: number | null
  hasValidCoordinates: boolean
  image: string
  thumbnail: string
  overview: string
  tel: string
  homepage: string
  accessibleInfo: string
  /** 목록 응답에 대표 이미지 URL이 없어 placeholder를 쓴 경우 */
  missingOriginalImage: boolean
  /** 선택 UI 언어 대비 관광 API 텍스트가 한국어 원문 위주일 가능성 */
  contentQuality?: TourContentQuality
  /** 마지막 요청에 사용한 TourAPI `lang` 쿼리 값(없으면 기본 한국어 계열) */
  tourApiLangRequested?: string
  /** 필드별 데이터 출처(추천 목록·상세 등) */
  fieldProvenance?: Partial<Record<TourTextFieldKey, TourFieldProvenance>>
  /** 목록(areaBased/searchKeyword) 원본 item */
  raw: Record<string, unknown>
}

/** 기존 코드 호환 — NormalizedTourPlace 와 동일 */
export type NormalizedTourSpot = NormalizedTourPlace
