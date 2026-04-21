import { formatTourAddress } from './formatTourAddress'
import { parseWgs84FromTourMapStrings } from './tourCoordinates'
import type { NormalizedTourPlace } from './tourTypes'
import { buildAccessibleSummary } from './tourAccessibleSummary'

const KORWITH_ACCESS_KEYS = ['chkcbcnvn', 'chkpetnvn', 'expguide'] as const

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return ''
}

/** detailCommon2 단일 item을 목록 항목에 병합 */
export function mergeDetailCommonIntoPlace(
  place: NormalizedTourPlace,
  detail: Record<string, unknown> | null,
): NormalizedTourPlace {
  if (!detail) return place

  const overview = pickStr(detail, 'overview', 'Overview') || place.overview
  const tel = pickStr(detail, 'tel') || place.tel
  const homepage = pickStr(detail, 'homepage', 'Homepage') || place.homepage
  const addr1 = pickStr(detail, 'addr1', 'addr') || pickStr(place.raw, 'addr1', 'addr')
  const addr2 = pickStr(detail, 'addr2') || pickStr(place.raw, 'addr2')
  const address = formatTourAddress(addr1, addr2) || place.address

  const mx = pickStr(detail, 'mapx', 'mapX')
  const my = pickStr(detail, 'mapy', 'mapY')
  const parsed = mx && my ? parseWgs84FromTourMapStrings(mx, my) : null
  const lat = parsed?.lat ?? place.lat
  const lng = parsed?.lng ?? place.lng
  const hasValidCoordinates = lat !== null && lng !== null

  const img = pickStr(detail, 'firstimage', 'firstImage')
  const img2 = pickStr(detail, 'firstimage2', 'firstImage2')
  const image = img || place.image
  const thumbnail = img2 || img || place.thumbnail

  const detailHasImage = Boolean(pickStr(detail as Record<string, unknown>, 'firstimage', 'firstImage'))

  const mergedRaw: Record<string, unknown> = { ...place.raw }
  for (const k of KORWITH_ACCESS_KEYS) {
    const v = (detail as Record<string, unknown>)[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') mergedRaw[k] = v
  }

  return {
    ...place,
    address,
    overview,
    tel,
    homepage,
    lat,
    lng,
    hasValidCoordinates,
    image,
    thumbnail,
    missingOriginalImage: detailHasImage ? false : place.missingOriginalImage,
    accessibleInfo: buildAccessibleSummary(mergedRaw),
    raw: mergedRaw,
  }
}
