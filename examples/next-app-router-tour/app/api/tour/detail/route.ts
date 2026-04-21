import { NextRequest, NextResponse } from 'next/server'
import { korWithGet, parseDetailBody } from '../../../../lib/tourapi/serverFetch'
import { mergeDetailCommon, normalizeListItem } from '../../../../lib/tourapi/normalize'
import type { TourPlace } from '../../../../types/tour'

export const dynamic = 'force-dynamic'

const ALLOW = [
  'contentId',
  'contentTypeId',
  'defaultYN',
  'firstImageYN',
  'areacodeYN',
  'catcodeYN',
  'addrinfoYN',
  'mapinfoYN',
  'overviewYN',
] as const

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const params: Record<string, string> = {}
  for (const k of ALLOW) {
    const v = sp.get(k)
    if (v != null && v !== '') params[k] = v
  }
  if (!params.defaultYN) params.defaultYN = 'Y'
  if (!params.firstImageYN) params.firstImageYN = 'Y'
  if (!params.addrinfoYN) params.addrinfoYN = 'Y'
  if (!params.mapinfoYN) params.mapinfoYN = 'Y'
  if (!params.overviewYN) params.overviewYN = 'Y'

  if (!params.contentId || !params.contentTypeId) {
    return NextResponse.json(
      { ok: false, error: { code: 'BAD_REQUEST', message: 'contentId and contentTypeId are required' } },
      { status: 400 },
    )
  }

  const up = await korWithGet('detailCommon2', params)
  if (!up.ok) {
    const st = up.error.code === 'MISSING_SERVICE_KEY' ? 503 : 502
    return NextResponse.json({ ok: false, error: up.error }, { status: st })
  }

  const item = parseDetailBody(up.data)
  if (!item) {
    return NextResponse.json({ ok: true, data: { place: null as TourPlace | null } })
  }

  const base = normalizeListItem(item as Record<string, unknown>)
  const place = mergeDetailCommon(base, item as Record<string, unknown>)

  return NextResponse.json({ ok: true, data: { place } })
}
