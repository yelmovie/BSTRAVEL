import type { AppLocale } from '../../i18n/constants'
import { formatTourAddress } from './formatTourAddress'
import { parseWgs84FromTourMapStrings } from './tourCoordinates'
import { applyTourContentQuality } from './inferTourContentQuality'
import type { NormalizedTourPlace } from './tourTypes'
import { buildAccessibleSummary } from './tourAccessibleSummary'

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="240" viewBox="0 0 400 240">
      <rect fill="#E8E9EF" width="400" height="240"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#9A9CB0" font-family="system-ui" font-size="14">No image</text>
    </svg>`,
  )

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k]
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v)
  }
  return ''
}

export type NormalizeTourItemOptions = {
  uiLocale: AppLocale
  apiLang?: string
}

export function normalizeTourItem(
  raw: Record<string, unknown>,
  opts?: NormalizeTourItemOptions,
): NormalizedTourPlace {
  const id = pickStr(raw, 'contentid', 'contentId')
  const contentTypeId = pickStr(raw, 'contenttypeid', 'contentTypeId')
  const title = pickStr(raw, 'title')
  const addr1 = pickStr(raw, 'addr1', 'addr')
  const addr2 = pickStr(raw, 'addr2')
  const address = formatTourAddress(addr1, addr2)
  const areaCode = pickStr(raw, 'areacode', 'areaCode')
  const sigunguCode = pickStr(raw, 'sigungucode', 'sigunguCode')
  const mapx = pickStr(raw, 'mapx', 'mapX')
  const mapy = pickStr(raw, 'mapy', 'mapY')
  const parsed = mapx && mapy ? parseWgs84FromTourMapStrings(mapx, mapy) : null
  const lat = parsed?.lat ?? null
  const lng = parsed?.lng ?? null
  const hasValidCoordinates = lat !== null && lng !== null

  const hadListImage = Boolean(pickStr(raw, 'firstimage', 'firstImage'))
  let image = pickStr(raw, 'firstimage', 'firstImage')
  let thumbnail = pickStr(raw, 'firstimage2', 'firstImage2')
  if (!image) image = PLACEHOLDER_IMAGE
  if (!thumbnail) thumbnail = image

  const base: NormalizedTourPlace = {
    id: id || `unknown-${Math.random().toString(36).slice(2, 9)}`,
    contentTypeId,
    title: title || '(제목 없음)',
    address,
    areaCode,
    sigunguCode,
    lat,
    lng,
    hasValidCoordinates,
    image,
    thumbnail,
    overview: '',
    tel: pickStr(raw, 'tel'),
    homepage: pickStr(raw, 'homepage', 'Homepage'),
    accessibleInfo: buildAccessibleSummary(raw),
    missingOriginalImage: !hadListImage,
    raw,
  }
  if (!opts) return base
  return applyTourContentQuality(base, opts.uiLocale, opts.apiLang)
}
