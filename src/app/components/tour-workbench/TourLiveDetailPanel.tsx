import { Loader2, AlertCircle, ExternalLink, Navigation } from 'lucide-react'
import type { NormalizedTourPlace } from '../../lib/tour/tourTypes'
import { TourApiDataLanguageStrip } from './TourApiDataLanguageStrip'
import type { RankedTourPlace } from '../../lib/tour/companionFilterTypes'
import { TourSuitabilityBadge } from '../TourSuitabilityBadge'
import { hasAnyCompanionFilter } from '../../lib/tour/companionFilterConfig'
import type { CompanionFilterState } from '../../lib/tour/companionFilterTypes'
import { EmptySelectionState } from './EmptySelectionState'

type Props = {
  selectedPlace: NormalizedTourPlace | null
  selectedRanked: RankedTourPlace | null
  companionFilter: CompanionFilterState
  detailLoading: boolean
  detailError: string | null
  detailOverview: string
}

/** 카카오맵 공식 링크 형식: /link/map/위도,경도 */
function kakaoMapUrl(lat: number, lng: number): string {
  return `https://map.kakao.com/link/map/${lat},${lng}`
}

export function TourLiveDetailPanel({
  selectedPlace,
  selectedRanked,
  companionFilter,
  detailLoading,
  detailError,
  detailOverview,
}: Props) {
  const showCompanion = selectedRanked && hasAnyCompanionFilter(companionFilter)

  return (
    <section className="tw-panel tw-col-detail" aria-label="관광지 상세">
      <div className="tw-panel-scroll">
        <div style={{ padding: '12px 12px 0' }}>
          <TourApiDataLanguageStrip variant="comfortable" />
        </div>

        {!selectedPlace && <EmptySelectionState />}

        {selectedPlace && (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div
              style={{
                width: '100%',
                borderRadius: 12,
                overflow: 'hidden',
                background: '#e8e9ef',
                aspectRatio: '16 / 10',
                maxHeight: 220,
                flexShrink: 0,
              }}
            >
              <img src={selectedPlace.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: '#1A1A2E', letterSpacing: -0.3, lineHeight: 1.25 }}>
                  {selectedPlace.title}
                </h2>
                {selectedRanked && <TourSuitabilityBadge label={selectedRanked.suitabilityLabel} />}
              </div>
              <p style={{ margin: '8px 0 0', fontSize: 12, color: '#6b6b88', lineHeight: 1.45, wordBreak: 'keep-all' }}>
                {selectedPlace.address || '주소 정보 없음'}
              </p>
              <div style={{ marginTop: 10, padding: 10, borderRadius: 8, background: '#fafbff', border: '1px solid #eef0f6' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#4a4a6a', marginBottom: 4 }}>공개 관광정보 요약</div>
                <p style={{ margin: 0, fontSize: 11, color: '#6b6b88', lineHeight: 1.5, wordBreak: 'break-word' }}>{selectedPlace.accessibleInfo}</p>
              </div>
            </div>

            {detailLoading && (
              <div style={{ fontSize: 12, color: '#7A7A8E', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Loader2 size={16} style={{ animation: 'tw-spin 0.9s linear infinite' }} />
                상세 정보를 불러오는 중…
              </div>
            )}
            {detailError && (
              <div style={{ fontSize: 12, color: '#B42318', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                <span>{detailError}</span>
              </div>
            )}

            {!detailLoading && !detailError && (
              <div>
                <h3 style={{ margin: '0 0 6px', fontSize: 12, fontWeight: 700, color: '#4a4a6a' }}>소개</h3>
                {detailOverview ? (
                  <p style={{ margin: 0, fontSize: 12, color: '#3d3d5c', lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                    {detailOverview}
                  </p>
                ) : (
                  <p style={{ margin: 0, fontSize: 12, color: '#8e90a8' }}>개요 필드가 비어 있습니다.</p>
                )}
              </div>
            )}

            <div style={{ fontSize: 12, color: '#4a4a6a', lineHeight: 1.6 }}>
              {selectedPlace.tel && (
                <div>
                  <strong style={{ color: '#6b6b88' }}>전화</strong> {selectedPlace.tel}
                </div>
              )}
              {selectedPlace.homepage && (
                <div style={{ marginTop: 6, wordBreak: 'break-all' }}>
                  <strong style={{ color: '#6b6b88' }}>홈페이지</strong>{' '}
                  <a href={selectedPlace.homepage} target="_blank" rel="noreferrer" style={{ color: '#5B54D6', fontWeight: 600 }}>
                    링크 열기
                  </a>
                </div>
              )}
            </div>

            {showCompanion && selectedRanked && (
              <div
                style={{
                  padding: 12,
                  borderRadius: 10,
                  background: '#fafbff',
                  border: '1px solid #eef0f6',
                  fontSize: 11,
                  color: '#4a4a6a',
                  lineHeight: 1.55,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontWeight: 800 }}>동행 조건 해석</span>
                </div>
                <div style={{ fontWeight: 700, marginBottom: 4, color: '#1A1A2E' }}>표시 이유</div>
                <ul style={{ margin: '0 0 8px', paddingLeft: 16 }}>
                  {selectedRanked.suitabilityReasons.slice(0, 5).map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ul>
                {selectedRanked.cautionNotes.length > 0 && (
                  <>
                    <div style={{ fontWeight: 700, marginBottom: 4 }}>참고·한계</div>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {selectedRanked.cautionNotes.map((t, i) => (
                        <li key={i}>{t}</li>
                      ))}
                    </ul>
                  </>
                )}
                <p style={{ margin: '10px 0 0', fontSize: 10, color: '#8e90a8' }}>
                  유모차·반려동물·시설 안내는 공식 정보 기준입니다. 그 외 표시는 개요·안내 문에서 찾은 힌트이며, 현장과 다를 수 있습니다.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
              {selectedPlace.hasValidCoordinates && selectedPlace.lat != null && selectedPlace.lng != null && (
                <a
                  href={kakaoMapUrl(selectedPlace.lat, selectedPlace.lng)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    height: 48,
                    borderRadius: 12,
                    background: '#5B54D6',
                    color: 'white',
                    fontWeight: 800,
                    fontSize: 14,
                    textDecoration: 'none',
                  }}
                >
                  <Navigation size={18} />
                  카카오맵에서 길찾기
                </a>
              )}
              <a
                href={`https://search.naver.com/search.naver?where=nexearch&sm=top_hty&fbm=0&ie=utf8&query=${encodeURIComponent(selectedPlace.title)}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  height: 48,
                  borderRadius: 12,
                  border: '1px solid #e8e9ef',
                  background: 'white',
                  color: '#1a1a2e',
                  fontWeight: 700,
                  fontSize: 13,
                  textDecoration: 'none',
                }}
              >
                <ExternalLink size={16} />
                웹에서 추가 검색
              </a>
            </div>

            <p style={{ margin: 0, fontSize: 10, color: '#A0A2B8', lineHeight: 1.55, paddingTop: 4 }}>
              본 화면은 한국관광공사 공개 관광정보를 바탕으로 하며, 미공개·변경된 정보는 반영되지 않을 수 있습니다.
            </p>
          </div>
        )}
      </div>
      <style>{`@keyframes tw-spin { to { transform: rotate(360deg); } } .tw-spin { animation: tw-spin 0.9s linear infinite; }`}</style>
    </section>
  )
}
