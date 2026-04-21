import { CompanionFilterBar } from '../CompanionFilterBar'
import type { CompanionFilterState } from '../../lib/tour/companionFilterTypes'
import { hasAnyCompanionFilter } from '../../lib/tour/companionFilterConfig'

type Props = {
  value: CompanionFilterState
  onChange: (f: CompanionFilterState) => void
  excludedCount: number
}

export function TourCompanionFilterStrip({ value, onChange, excludedCount }: Props) {
  const active = hasAnyCompanionFilter(value)
  return (
    <div
      style={{
        flexShrink: 0,
        background: 'white',
        borderRadius: 12,
        padding: '10px 12px',
        border: '1px solid #E8E9EF',
        boxShadow: '0 1px 2px rgba(26,26,46,0.04)',
      }}
    >
      <CompanionFilterBar value={value} onChange={onChange} />
      {active && excludedCount > 0 && (
        <div style={{ fontSize: 11, color: '#A05600', marginTop: 6 }}>
          필터로 목록·지도에서 제외 <strong>{excludedCount}</strong>건
        </div>
      )}
    </div>
  )
}
