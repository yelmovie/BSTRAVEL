'use client'

import type { TourPlace } from '../../types/tour'

type Props = {
  places: TourPlace[]
  selectedId: string | null
  loading: boolean
  error: string | null
  onSelect: (p: TourPlace) => void
}

export function TourList({ places, selectedId, loading, error, onSelect }: Props) {
  if (loading) return <p style={{ fontSize: 13, color: '#666' }}>목록 로딩…</p>
  if (error) return <p style={{ fontSize: 13, color: '#b42318' }}>{error}</p>
  if (places.length === 0) return <p style={{ fontSize: 13, color: '#888' }}>결과가 없습니다.</p>

  return (
    <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {places.map((p) => (
        <li key={p.id}>
          <button
            type="button"
            onClick={() => onSelect(p)}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: 10,
              borderRadius: 10,
              border: selectedId === p.id ? '2px solid #5B54D6' : '1px solid #e8e9ef',
              background: selectedId === p.id ? '#f6f5ff' : '#fff',
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14 }}>{p.title}</div>
            <div style={{ fontSize: 11, color: '#666', marginTop: 4 }}>{p.address || '주소 없음'}</div>
            <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {!p.hasValidCoordinates && (
                <span style={{ fontSize: 10, color: '#a05600', background: '#fff4e5', padding: '2px 6px', borderRadius: 4 }}>
                  좌표 없음
                </span>
              )}
              {p.missingOriginalImage && (
                <span style={{ fontSize: 10, color: '#666', background: '#f0f1f5', padding: '2px 6px', borderRadius: 4 }}>
                  이미지 없음
                </span>
              )}
            </div>
          </button>
        </li>
      ))}
    </ul>
  )
}
