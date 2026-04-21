'use client'

import { useCallback, useEffect, useState } from 'react'
import type { TourPlace } from '../../types/tour'
import { loadKakaoMapScript } from '../../lib/kakao/loadKakaoMap'
import { KakaoMapView } from '../../components/map/KakaoMapView'
import { TourList } from '../../components/tour/TourList'
import { TourDetailPanel } from '../../components/tour/TourDetailPanel'

type PlacesRes =
  | { ok: true; data: { places: TourPlace[]; totalCount: number } }
  | { ok: false; error: { message: string } }

export default function TourDemoPage() {
  const [places, setPlaces] = useState<TourPlace[]>([])
  const [listLoading, setListLoading] = useState(false)
  const [listErr, setListErr] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [detail, setDetail] = useState<TourPlace | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailErr, setDetailErr] = useState<string | null>(null)
  const [kakaoReady, setKakaoReady] = useState(false)
  const [kakaoErr, setKakaoErr] = useState<string | null>(null)

  const selected = places.find((p) => p.id === selectedId) ?? null
  const panelPlace = detail && detail.id === selectedId ? detail : selected

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_KAKAO_MAP_JS_KEY
    loadKakaoMapScript(key)
      .then(() => {
        setKakaoReady(true)
        setKakaoErr(null)
      })
      .catch((e) => setKakaoErr(e instanceof Error ? e.message : '카카오 로드 실패'))
  }, [])

  const loadPlaces = useCallback(async () => {
    setListLoading(true)
    setListErr(null)
    setPlaces([])
    setSelectedId(null)
    setDetail(null)
    try {
      const res = await fetch('/api/tour/places?areaCode=6&numOfRows=20&pageNo=1&arrange=C')
      const json = (await res.json()) as PlacesRes
      if (!json.ok) {
        setListErr(json.error.message)
        return
      }
      setPlaces(json.data.places)
    } catch (e) {
      setListErr(e instanceof Error ? e.message : 'fetch 실패')
    } finally {
      setListLoading(false)
    }
  }, [])

  const loadDetail = useCallback(async (p: TourPlace) => {
    setDetailLoading(true)
    setDetailErr(null)
    setDetail(null)
    try {
      const q = new URLSearchParams({
        contentId: p.id,
        contentTypeId: p.contentTypeId,
      })
      const res = await fetch(`/api/tour/detail?${q}`)
      const json = await res.json()
      if (!json.ok) {
        setDetailErr(json.error?.message || '상세 오류')
        return
      }
      const merged = json.data?.place as TourPlace | null
      setDetail(merged)
      if (merged) {
        setPlaces((prev) => prev.map((x) => (x.id === merged.id ? merged : x)))
      }
    } catch (e) {
      setDetailErr(e instanceof Error ? e.message : 'fetch 실패')
    } finally {
      setDetailLoading(false)
    }
  }, [])

  const onSelect = useCallback(
    (p: TourPlace) => {
      setSelectedId(p.id)
      void loadDetail(p)
    },
    [loadDetail],
  )

  const onMarkerSelect = useCallback(
    (id: string) => {
      const p = places.find((x) => x.id === id)
      setSelectedId(id)
      if (p) void loadDetail(p)
    },
    [places, loadDetail],
  )

  return (
    <main style={{ padding: 20, maxWidth: 1100, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20 }}>TourAPI + 카카오맵 (App Router 데모)</h1>
      <p style={{ fontSize: 12, color: '#666' }}>
        API: <code>/api/tour/places</code>, <code>/api/tour/detail</code> · Kakao:{' '}
        {kakaoErr || (kakaoReady ? '준비됨' : '로딩…')}
      </p>
      <button
        type="button"
        onClick={() => void loadPlaces()}
        style={{
          marginBottom: 16,
          padding: '12px 20px',
          fontWeight: 700,
          borderRadius: 10,
          border: 'none',
          background: '#5B54D6',
          color: '#fff',
        }}
      >
        부산(areaCode=6) 목록 불러오기
      </button>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ flex: '1 1 280px' }}>
          <h2 style={{ fontSize: 14 }}>목록</h2>
          <TourList places={places} selectedId={selectedId} loading={listLoading} error={listErr} onSelect={onSelect} />
        </div>
        <div style={{ flex: '1 1 300px' }}>
          <h2 style={{ fontSize: 14 }}>지도</h2>
          {!kakaoReady && !kakaoErr && <p style={{ fontSize: 12 }}>지도 준비 중…</p>}
          {kakaoErr && <p style={{ color: '#b42318', fontSize: 12 }}>{kakaoErr}</p>}
          {kakaoReady && <KakaoMapView places={places} selectedId={selectedId} sdkReady={kakaoReady} onMarkerSelect={onMarkerSelect} />}
        </div>
        <div style={{ flex: '1 1 280px' }}>
          <h2 style={{ fontSize: 14 }}>상세</h2>
          <TourDetailPanel place={panelPlace} loading={detailLoading} error={detailErr} />
        </div>
      </div>
    </main>
  )
}
