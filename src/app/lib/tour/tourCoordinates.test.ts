import { describe, expect, it } from 'vitest'
import { parseWgs84FromTourMapStrings } from './tourCoordinates'

describe('parseWgs84FromTourMapStrings', () => {
  it('소수 문자열 mapx/mapy', () => {
    const r = parseWgs84FromTourMapStrings('129.0756', '35.1796')
    expect(r).toEqual({ lat: 35.1796, lng: 129.0756 })
  })

  it('TourAPI 고정소수점 정수(÷1e7)', () => {
    const r = parseWgs84FromTourMapStrings('1291659636', '351698185')
    expect(r?.lng).toBeCloseTo(129.1659636, 5)
    expect(r?.lat).toBeCloseTo(35.1698185, 5)
  })

  it('비정상 값은 null', () => {
    expect(parseWgs84FromTourMapStrings('', '35')).toBeNull()
    expect(parseWgs84FromTourMapStrings('999', '999')).toBeNull()
  })
})
