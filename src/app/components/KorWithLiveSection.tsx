import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { motion } from 'motion/react'
import { MapPin, Loader2, AlertCircle, Database } from 'lucide-react'
import { fetchTourAreaBased } from '../lib/tour/tourApiClient'
import { normalizeTourItem } from '../lib/tour/normalizeTourItem'
import type { NormalizedTourPlace } from '../lib/tour/tourTypes'
import { useI18n } from '../i18n/I18nContext'
import { localeToTourApiLang } from '../i18n/tourLang'
import { TourApiDataLanguageStrip } from './tour-workbench/TourApiDataLanguageStrip'
import { finalizeTourPlacesFromTourApiOnly } from '../lib/tour/tourPlacesTourApiOnly'

type Status = 'loading' | 'ok' | 'empty' | 'error'

export function KorWithLiveSection() {
  const { locale } = useI18n()
  const [status, setStatus] = useState<Status>('loading')
  const [items, setItems] = useState<NormalizedTourPlace[]>([])
  const [message, setMessage] = useState('')
  const [lastFetchedAt, setLastFetchedAt] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    ;(async () => {
      setStatus('loading')
      setMessage('')
      setLastFetchedAt(null)
      setItems([])

      try {
        const lang = localeToTourApiLang(locale)
        const data = await fetchTourAreaBased({
          areaCode: '6',
          numOfRows: 10,
          pageNo: 1,
          arrange: 'C',
          ...(lang ? { lang } : {}),
        })
        if (cancelled) return

        const normalized = data.items.map((r) =>
          normalizeTourItem(r as Record<string, unknown>, { uiLocale: locale, apiLang: lang }),
        )
        const finalized = finalizeTourPlacesFromTourApiOnly(normalized, locale, lang)
        const fetched = new Date().toISOString()

        if (finalized.length === 0) {
          setStatus('empty')
          setItems([])
          setLastFetchedAt(fetched)
        } else {
          setStatus('ok')
          setItems(finalized)
          setLastFetchedAt(fetched)
        }
      } catch (e) {
        if (cancelled) return
        setStatus('error')
        setItems([])
        setMessage(e instanceof Error ? e.message : '연동 오류')
      }
    })()

    return () => {
      cancelled = true
    }
  }, [locale])

  return (
    <div
      style={{
        marginBottom: 16,
        background: 'white',
        borderRadius: 14,
        border: '1px solid #E4E6EF',
        padding: '14px 14px 12px',
      }}
    >
      <div style={{ marginBottom: 10 }}>
        <TourApiDataLanguageStrip variant="compact" />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Database size={14} color="#5B54D6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E' }}>KorWith 실시간 (부산)</span>
          </div>
          <span style={{ fontSize: 10, color: '#9EA0B8', paddingLeft: 20, lineHeight: 1.35 }}>
            출처 API: 한국관광공사 <code style={{ fontSize: 10 }}>KorWithService2/areaBasedList2</code> · 프록시{' '}
            <code style={{ fontSize: 10 }}>/api/tour/area-based</code>
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Link
            to="/mobile/tour-debug"
            style={{ fontSize: 11, fontWeight: 600, color: '#5B54D6', textDecoration: 'none' }}
          >
            연동 테스트 →
          </Link>
        </div>
      </div>

      {status === 'loading' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7A7A8E', fontSize: 12 }}>
          <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }} style={{ display: 'inline-flex' }}>
            <Loader2 size={16} />
          </motion.span>
          한국관광공사 API에서 불러오는 중…
        </div>
      )}

      {status === 'error' && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, color: '#B42318', fontSize: 12 }}>
          <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>연동 실패</div>
            <div style={{ lineHeight: 1.45 }}>{message}</div>
            <div style={{ marginTop: 6, color: '#7A7A8E', fontWeight: 500 }}>
              아래 데모 코스는 그대로 이용할 수 있습니다. 서버 키는 <code style={{ fontSize: 11 }}>.env.local</code>를 확인하세요.
            </div>
          </div>
        </div>
      )}

      {status === 'empty' && (
        <div>
          <div style={{ fontSize: 12, color: '#7A7A8E', marginBottom: 6 }}>API는 성공했으나 조건에 맞는 관광지가 없습니다.</div>
          <div style={{ fontSize: 10, color: '#9EA0B8' }}>
            갱신: {lastFetchedAt ? new Date(lastFetchedAt).toLocaleString('ko-KR') : '—'}
          </div>
        </div>
      )}

      {status === 'ok' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: '#0D5A2A', background: '#F0FAF6', border: '1px solid #C8E9D9', borderRadius: 8, padding: '6px 10px' }}>
            실연동 응답 · 갱신 시각: {lastFetchedAt ? new Date(lastFetchedAt).toLocaleString('ko-KR') : '—'} · 항목 {items.length}건
          </div>
          {items.map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                gap: 10,
                borderRadius: 10,
                border: '1px solid #F0F1F5',
                overflow: 'hidden',
                background: '#FAFBFF',
              }}
            >
              <div style={{ width: 88, flexShrink: 0, height: 72, background: '#E8E9EF' }}>
                <img src={p.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, padding: '6px 8px 6px 0' }}>
                <div
                  style={{
                    marginBottom: 4,
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#1A1A2E', letterSpacing: -0.2, flex: '1 1 140px', minWidth: 0 }}>
                    {p.title}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0, flex: 1 }}>
                    <MapPin size={10} color="#5B54D6" style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 11, color: '#6B6B88', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {p.address || '주소 정보 없음'}
                    </span>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: '#8E90A8', lineHeight: 1.35, flex: 1 }}>{p.accessibleInfo}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
