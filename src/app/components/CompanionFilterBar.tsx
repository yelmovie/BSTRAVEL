import type { CompanionFilterState } from '../lib/tour/companionFilterTypes'
import { EMPTY_COMPANION_FILTERS } from '../lib/tour/companionFilterTypes'

type ChipDef = {
  key: keyof CompanionFilterState
  label: string
  hint?: string
}

const CHIPS: ChipDef[] = [
  { key: 'seniorFriendly', label: '노약자' },
  { key: 'strollerFriendly', label: '유모차' },
  { key: 'wheelchairFriendly', label: '휠체어' },
  { key: 'childFriendly', label: '아이 동반' },
  { key: 'parkingNeeded', label: '주차 중요' },
  { key: 'indoorPreferred', label: '실내 선호' },
  { key: 'lowWalkingLoad', label: '이동 부담 낮음' },
  { key: 'restroomImportant', label: '화장실 중요' },
]

type Props = {
  value: CompanionFilterState
  onChange: (next: CompanionFilterState) => void
}

export function CompanionFilterBar({ value, onChange }: Props) {
  const toggle = (key: keyof CompanionFilterState) => {
    onChange({ ...value, [key]: !value[key] })
  }

  const reset = () => onChange({ ...EMPTY_COMPANION_FILTERS })

  const anyOn = CHIPS.some((c) => value[c.key])

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, gap: 8 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4A6A' }}>관광약자 맞춤 필터</div>
        <button
          type="button"
          onClick={reset}
          disabled={!anyOn}
          style={{
            height: 36,
            padding: '0 12px',
            borderRadius: 8,
            border: '1px solid #E8E9EF',
            background: anyOn ? 'white' : '#F4F5F9',
            fontSize: 11,
            fontWeight: 600,
            color: anyOn ? '#5B54D6' : '#B4B6C8',
            cursor: anyOn ? 'pointer' : 'default',
          }}
        >
          초기화
        </button>
      </div>
      {/* 유모차: Tour API 공식 필드 기준. 휠체어·주차 등: 개요·안내 문구 기반 보조(추론). */}
      <p style={{ margin: '0 0 10px', fontSize: 10, color: '#8E90A8', lineHeight: 1.45 }}>
        유모차 가능 여부는 공식 정보 기준으로 반영합니다. 휠체어·주차 등은 안내 문에서 찾은 힌트로만 보조하며, 현장과 다를 수 있습니다.
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {CHIPS.map((c) => {
          const on = value[c.key]
          return (
            <button
              key={c.key}
              type="button"
              onClick={() => toggle(c.key)}
              title={c.hint}
              style={{
                minHeight: 40,
                padding: '8px 14px',
                borderRadius: 999,
                border: on ? '2px solid #5B54D6' : '1px solid #E8E9EF',
                background: on ? '#F6F5FF' : 'white',
                fontSize: 12,
                fontWeight: 700,
                color: on ? '#5B54D6' : '#6B6B88',
                cursor: 'pointer',
              }}
            >
              {c.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
