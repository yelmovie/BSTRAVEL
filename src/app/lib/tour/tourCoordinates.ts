/**
 * TourAPI(KorWith 등) mapx/mapy → WGS84 숫자 좌표
 * 공식 문서: mapx = 경도(X), mapy = 위도(Y)
 * 목록 API는 소수 문자열 또는 고정소수점 정수(÷10^7) 형태를 섞어 쓰는 경우가 많습니다.
 * 값이 비정상이면 null 반환 (임의 좌표 생성 금지).
 */

export type ParsedWgs84 = { lat: number; lng: number } | null

type Axis = 'lat' | 'lng'

const SCALED_INT_MIN = 1_000_000

function parseTourAxis(raw: string, axis: Axis): number | null {
  const t = String(raw).trim()
  if (t === '') return null
  const n = Number(t)
  if (!Number.isFinite(n)) return null
  const limit = axis === 'lat' ? 90 : 180
  if (Math.abs(n) <= limit) return n
  if (Math.abs(n) < SCALED_INT_MIN) return null
  const scaled = n / 10000000
  if (!Number.isFinite(scaled)) return null
  if (Math.abs(scaled) <= limit) return scaled
  return null
}

/** mapx=경도, mapy=위도 문자열을 검증 후 { lat, lng } 반환 */
export function parseWgs84FromTourMapStrings(mapx: string, mapy: string): ParsedWgs84 {
  const lng = parseTourAxis(mapx, 'lng')
  const lat = parseTourAxis(mapy, 'lat')
  if (lat === null || lng === null) return null
  return { lat, lng }
}
