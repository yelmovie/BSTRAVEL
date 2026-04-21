'use client'

import type { TourPlace } from '../../types/tour'

type Props = {
  place: TourPlace | null
  loading: boolean
  error: string | null
}

export function TourDetailPanel({ place, loading, error }: Props) {
  if (error) return <p style={{ fontSize: 13, color: '#b42318' }}>{error}</p>
  if (!place && !loading) return <p style={{ fontSize: 13, color: '#888' }}>목록 또는 지도에서 선택하세요.</p>
  if (loading && !place) return <p style={{ fontSize: 13, color: '#666' }}>상세 불러오는 중…</p>
  if (loading && place) {
    return (
      <div style={{ fontSize: 13, lineHeight: 1.55 }}>
        <p style={{ margin: '0 0 8px', fontSize: 12, color: '#666' }}>상세 불러오는 중…</p>
        {/* eslint-disable-next-line @next/next/no-img-element -- 데모: 외부/데이터 URL */}
        <img src={place.image} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
        <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{place.title}</h3>
        <p style={{ margin: 0, color: '#444' }}>{place.address || '주소 없음'}</p>
      </div>
    )
  }
  if (!place) return null

  return (
    <div style={{ fontSize: 13, lineHeight: 1.55 }}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 데모: 외부/데이터 URL */}
      <img src={place.image} alt="" style={{ width: '100%', maxHeight: 160, objectFit: 'cover', borderRadius: 8, marginBottom: 10 }} />
      <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>{place.title}</h3>
      <p style={{ margin: '0 0 8px', color: '#444' }}>{place.address || '주소 없음'}</p>
      {place.overview ? (
        <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{place.overview}</p>
      ) : (
        <p style={{ margin: 0, color: '#888' }}>개요 없음</p>
      )}
      {place.tel && <p style={{ margin: '8px 0 0' }}>tel: {place.tel}</p>}
      {place.homepage && (
        <p style={{ margin: '4px 0 0' }}>
          <a href={place.homepage} target="_blank" rel="noreferrer" style={{ color: '#5B54D6' }}>
            홈페이지
          </a>
        </p>
      )}
      <p style={{ margin: '10px 0 0', fontSize: 12, color: '#666' }}>{place.accessibleInfo}</p>
    </div>
  )
}
