import type { TourPlace } from '../../types/tour'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240"><rect fill="#E8E9EF" width="400" height="240"/></svg>`,
  )

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return ''
}

/** mapx=경도, mapy=위도 (TourAPI 공통). 범위 밖이면 null */
export function parseWgs84(mapx: string, mapy: string): { lat: number; lng: number } | null {
  const lng = Number(mapx.trim())
  const lat = Number(mapy.trim())
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null
  return { lat, lng }
}

export function formatAddress(addr1: string, addr2: string): string {
  const a = addr1.trim()
  const b = addr2.trim()
  if (a && b) return `${a} ${b}`
  return a || b || ''
}

function accessibleSummary(raw: Record<string, unknown>): string {
  const parts = [pickStr(raw, 'chkcbcnvn'), pickStr(raw, 'chkpetnvn'), pickStr(raw, 'expguide')].filter(Boolean)
  return parts.join(' · ') || ''
}

export function normalizeListItem(raw: Record<string, unknown>): TourPlace {
  const id = pickStr(raw, 'contentid', 'contentId')
  const contentTypeId = pickStr(raw, 'contenttypeid', 'contentTypeId')
  const title = pickStr(raw, 'title')
  const addr1 = pickStr(raw, 'addr1', 'addr')
  const addr2 = pickStr(raw, 'addr2')
  const address = formatAddress(addr1, addr2)
  const mapx = pickStr(raw, 'mapx', 'mapX')
  const mapy = pickStr(raw, 'mapy', 'mapY')
  const pos = mapx && mapy ? parseWgs84(mapx, mapy) : null
  const hadImage = Boolean(pickStr(raw, 'firstimage', 'firstImage'))
  let image = pickStr(raw, 'firstimage', 'firstImage')
  let thumbnail = pickStr(raw, 'firstimage2', 'firstImage2')
  if (!image) image = PLACEHOLDER_IMAGE
  if (!thumbnail) thumbnail = image

  return {
    id: id || `tmp-${Math.random().toString(36).slice(2, 9)}`,
    contentTypeId,
    title: title || '(제목 없음)',
    address,
    areaCode: pickStr(raw, 'areacode', 'areaCode'),
    sigunguCode: pickStr(raw, 'sigungucode', 'sigunguCode'),
    lat: pos?.lat ?? null,
    lng: pos?.lng ?? null,
    hasValidCoordinates: Boolean(pos),
    image,
    thumbnail,
    overview: '',
    tel: pickStr(raw, 'tel'),
    homepage: pickStr(raw, 'homepage', 'Homepage'),
    accessibleInfo: accessibleSummary(raw),
    missingOriginalImage: !hadImage,
    raw,
  }
}

export function mergeDetailCommon(place: TourPlace, detail: Record<string, unknown> | null): TourPlace {
  if (!detail) return place
  const overview = pickStr(detail, 'overview', 'Overview') || place.overview
  const tel = pickStr(detail, 'tel') || place.tel
  const homepage = pickStr(detail, 'homepage', 'Homepage') || place.homepage
  const addr1 = pickStr(detail, 'addr1', 'addr') || pickStr(place.raw, 'addr1', 'addr')
  const addr2 = pickStr(detail, 'addr2') || pickStr(place.raw, 'addr2')
  const address = formatAddress(addr1, addr2) || place.address
  const mx = pickStr(detail, 'mapx', 'mapX')
  const my = pickStr(detail, 'mapy', 'mapY')
  const pos = mx && my ? parseWgs84(mx, my) : null
  const lat = pos?.lat ?? place.lat
  const lng = pos?.lng ?? place.lng
  const img = pickStr(detail, 'firstimage', 'firstImage')
  const img2 = pickStr(detail, 'firstimage2', 'firstImage2')
  const image = img || place.image
  const thumbnail = img2 || img || place.thumbnail
  const detailHasImage = Boolean(img)

  return {
    ...place,
    address,
    overview,
    tel,
    homepage,
    lat,
    lng,
    hasValidCoordinates: lat !== null && lng !== null,
    image,
    thumbnail,
    missingOriginalImage: detailHasImage ? false : place.missingOriginalImage,
    raw: place.raw,
  }
}
