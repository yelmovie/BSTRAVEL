import { NextRequest, NextResponse } from 'next/server'
import { korWithGet, parseListBody } from '../../../../lib/tourapi/serverFetch'
import { normalizeListItem } from '../../../../lib/tourapi/normalize'

export const dynamic = 'force-dynamic'

const ALLOW = [
  'areaCode',
  'sigunguCode',
  'numOfRows',
  'pageNo',
  'arrange',
  'listYN',
  'cat1',
  'cat2',
  'cat3',
  'modifiedtime',
  'eventStartDate',
  'eventEndDate',
] as const

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const params: Record<string, string> = {}
  for (const k of ALLOW) {
    const v = sp.get(k)
    if (v != null && v !== '') params[k] = v
  }
  if (!params.listYN) params.listYN = 'Y'
  if (!params.pageNo) params.pageNo = '1'
  if (!params.numOfRows) params.numOfRows = '10'

  const up = await korWithGet('areaBasedList2', params)
  if (!up.ok) {
    const st = up.error.code === 'MISSING_SERVICE_KEY' ? 503 : 502
    return NextResponse.json({ ok: false, error: up.error }, { status: st })
  }

  const { items, totalCount, pageNo, numOfRows } = parseListBody(up.data)
  const places = items.map((r) => normalizeListItem(r))

  return NextResponse.json({
    ok: true,
    data: { places, totalCount, pageNo, numOfRows },
  })
}
