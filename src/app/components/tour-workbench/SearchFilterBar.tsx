import { Database, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { motion } from 'motion/react'

type Mode = 'area' | 'keyword'

type Props = {
  health: string
  kakaoReady: boolean
  kakaoError: string | null
  mode: Mode
  onModeChange: (m: Mode) => void
  areaCode: string
  onAreaCodeChange: (v: string) => void
  keyword: string
  onKeywordChange: (v: string) => void
  onSearch: () => void
  listLoading: boolean
  listError: string | null
  total: number
  rawPlacesCount: number
  coordsCount: number
}

export function SearchFilterBar({
  health,
  kakaoReady,
  kakaoError,
  mode,
  onModeChange,
  areaCode,
  onAreaCodeChange,
  keyword,
  onKeywordChange,
  onSearch,
  listLoading,
  listError,
  total,
  rawPlacesCount,
  coordsCount,
}: Props) {
  const tourStatus = (() => {
    if (health.includes('인증키가 설정')) return { ok: true as const, label: '관광정보 연동' }
    if (health.includes('VISITKOREA') || health.includes('없음')) return { ok: false as const, label: '관광정보 연동을 위해 서버 설정이 필요합니다' }
    return { ok: false as const, label: '관광정보 상태를 확인할 수 없습니다' }
  })()

  return (
    <div
      style={{
        flexShrink: 0,
        background: 'white',
        borderRadius: 12,
        padding: 12,
        border: '1px solid #E8E9EF',
        boxShadow: '0 1px 2px rgba(26,26,46,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 10,
          alignItems: 'center',
          marginBottom: 12,
          paddingBottom: 10,
          borderBottom: '1px solid #eef0f6',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Database size={16} color="#5B54D6" />
          <span style={{ fontSize: 12, color: '#4A4A6A' }}>
            <strong>관광정보</strong>{' '}
            {tourStatus.ok ? (
              <span style={{ color: '#2D6B52', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <CheckCircle size={14} /> {tourStatus.label}
              </span>
            ) : (
              <span style={{ color: '#A05600', fontWeight: 600 }}>{tourStatus.label}</span>
            )}
          </span>
        </div>
        <span style={{ color: '#D8DAE5' }}>|</span>
        <span style={{ fontSize: 12, color: '#4A4A6A' }}>
          <strong>지도</strong>{' '}
          {kakaoError ? (
            <span style={{ color: '#B42318', fontWeight: 600 }}>지도를 불러오지 못했습니다</span>
          ) : kakaoReady ? (
            <span style={{ color: '#2D6B52', fontWeight: 600 }}>지도 준비됨</span>
          ) : (
            <span style={{ color: '#7A7A8E' }}>지도 불러오는 중…</span>
          )}
        </span>
      </div>

      <div style={{ fontSize: 12, fontWeight: 700, color: '#4A4A6A', marginBottom: 8 }}>검색 · 지역</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
        {(['area', 'keyword'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            style={{
              flex: '1 1 120px',
              height: 44,
              borderRadius: 10,
              border: mode === m ? '2px solid #5B54D6' : '1px solid #E8E9EF',
              background: mode === m ? '#F6F5FF' : 'white',
              fontWeight: 700,
              fontSize: 13,
              color: mode === m ? '#5B54D6' : '#6B6B88',
              cursor: 'pointer',
            }}
          >
            {m === 'area' ? '지역 기반' : '키워드'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <label style={{ flex: '1 1 100px', fontSize: 11, color: '#7A7A8E' }}>
          지역코드
          <input
            value={areaCode}
            onChange={(e) => onAreaCodeChange(e.target.value)}
            placeholder="예: 6"
            style={{
              marginTop: 4,
              width: '100%',
              height: 44,
              borderRadius: 10,
              border: '1px solid #E8E9EF',
              padding: '0 12px',
              fontSize: 14,
            }}
          />
        </label>
        {mode === 'keyword' && (
          <label style={{ flex: '1 1 160px', fontSize: 11, color: '#7A7A8E' }}>
            검색어
            <input
              value={keyword}
              onChange={(e) => onKeywordChange(e.target.value)}
              placeholder="관광지 키워드"
              style={{
                marginTop: 4,
                width: '100%',
                height: 44,
                borderRadius: 10,
                border: '1px solid #E8E9EF',
                padding: '0 12px',
                fontSize: 14,
              }}
            />
          </label>
        )}
      </div>

      <button
        type="button"
        onClick={onSearch}
        disabled={listLoading || (mode === 'keyword' && !keyword.trim())}
        style={{
          width: '100%',
          height: 48,
          borderRadius: 12,
          border: 'none',
          background: listLoading ? '#C4C6D4' : '#5B54D6',
          color: 'white',
          fontWeight: 800,
          fontSize: 15,
          cursor: listLoading ? 'default' : 'pointer',
        }}
      >
        {listLoading ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-flex' }}
            >
              <Loader2 size={18} />
            </motion.span>
            불러오는 중
          </span>
        ) : (
          '결과 불러오기'
        )}
      </button>

      {listError && (
        <div style={{ marginTop: 10, display: 'flex', gap: 8, alignItems: 'flex-start', color: '#B42318', fontSize: 12 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          <span>{listError}</span>
        </div>
      )}

      {rawPlacesCount > 0 && (
        <div style={{ marginTop: 10, fontSize: 11, color: '#8E90A8' }}>
          전체 <strong>{total}</strong>건 중 <strong>{rawPlacesCount}</strong>건을 표시합니다. 지도에 표시할 수 있는 곳은 <strong>{coordsCount}</strong>곳입니다.
        </div>
      )}
    </div>
  )
}
