import { TourKakaoMap } from '../TourKakaoMap'
import type { NormalizedTourPlace } from '../../lib/tour/tourTypes'
import type { SuitabilityLabel } from '../../lib/tour/companionFilterTypes'

type Props = {
  kakaoReady: boolean
  kakaoError: string | null
  sdkReady: boolean
  places: NormalizedTourPlace[]
  selectedPlaceId: string | null
  onMarkerSelect: (id: string) => void
  suitabilityById?: Record<string, SuitabilityLabel>
  listLoading: boolean
}

export function KakaoMapPanel({
  kakaoReady,
  kakaoError,
  sdkReady,
  places,
  selectedPlaceId,
  onMarkerSelect,
  suitabilityById,
  listLoading,
}: Props) {
  return (
    <section className="tw-panel tw-col-map" aria-label="지도">
      <div className="tw-panel-head" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span>지도</span>
        {listLoading && <span style={{ fontSize: 10, fontWeight: 600, color: '#8e90a8' }}>목록 갱신 중…</span>}
      </div>
      <div className="tw-map-inner">
        {!kakaoReady && !kakaoError && (
          <div style={{ fontSize: 12, color: '#7A7A8E', padding: 12, flex: 1, display: 'flex', alignItems: 'center' }}>지도 준비 중입니다…</div>
        )}
        {kakaoError && (
          <div style={{ fontSize: 12, color: '#B42318', padding: 12, background: '#FFF4F4', borderRadius: 10, flex: 1 }}>
            지도를 불러오지 못했습니다
          </div>
        )}
        {kakaoReady && listLoading && places.length === 0 && (
          <div
            style={{
              flex: 1,
              minHeight: 260,
              borderRadius: 10,
              background: '#eef0f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#6b6b88',
              fontWeight: 600,
            }}
          >
            검색 결과를 불러오면 지도가 표시됩니다.
          </div>
        )}
        {kakaoReady && places.length === 0 && !listLoading && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              color: '#8e90a8',
              textAlign: 'center',
              padding: 16,
              minHeight: 200,
            }}
          >
            표시할 마커가 없습니다.
            <br />
            좌표가 있는 관광지만 지도에 나타납니다. 필터를 조정해 보세요.
          </div>
        )}
        {kakaoReady && places.length > 0 && (
          <div style={{ flex: 1, minHeight: 260, position: 'relative' }}>
            <TourKakaoMap
              sdkReady={sdkReady}
              places={places}
              selectedId={selectedPlaceId}
              onMarkerSelect={onMarkerSelect}
              suitabilityById={suitabilityById}
            />
          </div>
        )}
      </div>
    </section>
  )
}
