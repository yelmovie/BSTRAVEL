/** 앱 내부용 관광지 모델 (One Source of Truth) */

export type TourPlace = {
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
  missingOriginalImage: boolean
  raw: Record<string, unknown>
}
