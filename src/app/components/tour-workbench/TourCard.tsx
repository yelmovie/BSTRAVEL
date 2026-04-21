import { MapPin } from 'lucide-react'
import type { RankedTourPlace } from '../../lib/tour/companionFilterTypes'
import { TourSuitabilityBadge } from '../TourSuitabilityBadge'

type Props = {
  place: RankedTourPlace
  selected: boolean
  showCompanionBadge: boolean
  onSelect: () => void
}

function oneLineSummary(p: RankedTourPlace): string {
  if (p.overview.trim()) return p.overview.replace(/\s+/g, ' ').slice(0, 72) + (p.overview.length > 72 ? '…' : '')
  const t = p.accessibleInfo.replace(/\s+/g, ' ')
  if (t && t !== '세부 접근성 텍스트 필드가 응답에 없습니다') return t.slice(0, 72) + (t.length > 72 ? '…' : '')
  return '소개 문구가 아직 없습니다. 선택 시 상세를 불러옵니다.'
}

export function TourCard({ place, selected, showCompanionBadge, onSelect }: Props) {
  return (
    <button
      type="button"
      onClick={onSelect}
      style={{
        textAlign: 'left',
        width: '100%',
        padding: 10,
        borderRadius: 10,
        border: selected ? '2px solid #5B54D6' : '1px solid #E8E9EF',
        background: selected ? '#F6F5FF' : '#FAFBFF',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 1px rgba(91, 84, 214, 0.12)' : 'none',
        transition: 'border-color 0.15s ease, background 0.15s ease',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
        <div
          style={{
            width: 64,
            height: 52,
            borderRadius: 8,
            overflow: 'hidden',
            flexShrink: 0,
            background: '#E8E9EF',
            border: selected ? '2px solid #5B54D6' : '1px solid #eef0f6',
          }}
        >
          <img src={place.thumbnail || place.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', letterSpacing: -0.2 }}>{place.title}</span>
            <TourSuitabilityBadge label={place.suitabilityLabel} compact />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <MapPin size={11} color="#5B54D6" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: '#6B6B88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {place.address || '주소 없음'}
            </span>
          </div>
          <p
            style={{
              margin: '6px 0 0',
              fontSize: 10,
              color: '#8e90a8',
              lineHeight: 1.35,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {oneLineSummary(place)}
          </p>
          <div style={{ marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {!place.hasValidCoordinates && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#A05600', background: '#FFF4E5', padding: '2px 6px', borderRadius: 4 }}>
                좌표 없음
              </span>
            )}
            {place.missingOriginalImage && (
              <span style={{ fontSize: 9, fontWeight: 700, color: '#6B6B88', background: '#F0F1F5', padding: '2px 6px', borderRadius: 4 }}>
                이미지 없음
              </span>
            )}
          </div>
          {showCompanionBadge && place.suitabilityReasons.length > 0 && (
            <div style={{ marginTop: 6, fontSize: 10, color: '#6B6B88', lineHeight: 1.4 }}>
              {place.suitabilityReasons.slice(0, 1).map((line, i) => (
                <div key={i}>· {line}</div>
              ))}
            </div>
          )}
        </div>
      </div>
    </button>
  )
}
