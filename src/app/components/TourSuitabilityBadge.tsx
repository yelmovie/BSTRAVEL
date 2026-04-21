import type { SuitabilityLabel } from '../lib/tour/companionFilterTypes'

const LABEL_KO: Record<SuitabilityLabel, string> = {
  recommended: '추천',
  partial_match: '일부 충족',
  insufficient_info: '정보 부족',
}

const STYLE: Record<SuitabilityLabel, { bg: string; fg: string }> = {
  recommended: { bg: '#E8F5EE', fg: '#2D6B52' },
  partial_match: { bg: '#FFF4E5', fg: '#A05600' },
  insufficient_info: { bg: '#F0F1F5', fg: '#6B6B88' },
}

type Props = {
  label: SuitabilityLabel
  compact?: boolean
}

export function TourSuitabilityBadge({ label, compact }: Props) {
  const s = STYLE[label]
  return (
    <span
      style={{
        display: 'inline-block',
        fontSize: compact ? 9 : 10,
        fontWeight: 800,
        padding: compact ? '2px 6px' : '3px 8px',
        borderRadius: 6,
        background: s.bg,
        color: s.fg,
        letterSpacing: -0.2,
      }}
    >
      {LABEL_KO[label]}
    </span>
  )
}
