import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import './tour-workbench/TourWorkbenchLayout.css'
import { useTourWorkbenchViewModel } from './tour-workbench/useTourWorkbenchViewModel'
import { SearchFilterBar } from './tour-workbench/SearchFilterBar'
import { TourCompanionFilterStrip } from './tour-workbench/TourCompanionFilterStrip'
import { TourListPanel } from './tour-workbench/TourListPanel'
import { KakaoMapPanel } from './tour-workbench/KakaoMapPanel'
import { TourLiveDetailPanel } from './tour-workbench/TourLiveDetailPanel'
import { TourApiDataLanguageStrip } from './tour-workbench/TourApiDataLanguageStrip'

export function TourApiTestScreen() {
  const navigate = useNavigate()
  const vm = useTourWorkbenchViewModel()

  const coordsCount = vm.places.filter((p) => p.hasValidCoordinates).length

  return (
    <div className="tw-page">
      <header
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '12px 16px',
          background: 'white',
          borderBottom: '1px solid #E8E9EF',
          flexShrink: 0,
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            border: '1px solid #E8E9EF',
            background: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <ChevronLeft size={20} color="#1A1A2E" />
        </button>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: '#1A1A2E' }}>동행 조건으로 보는 부산 관광</div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#5B54D6',
              marginTop: 6,
              letterSpacing: 0.02,
            }}
          >
            추천 <span style={{ color: '#D8DAE5', fontWeight: 600, margin: '0 8px' }}>→</span> 탐색{' '}
            <span style={{ color: '#D8DAE5', fontWeight: 600, margin: '0 8px' }}>→</span> 비교
            <span style={{ color: '#8E90A8', fontWeight: 600, marginLeft: 8 }}>· 지금은 탐색</span>
          </div>
          <div style={{ fontSize: 11, color: '#8E90A8', marginTop: 4, lineHeight: 1.45 }}>
            한 화면에서 목록·지도·상세를 오가며 장소를 비교할 수 있습니다. 한국관광공사 공개 관광정보와 지도를 기준으로 합니다.
          </div>
          <div style={{ fontSize: 10, color: '#A0A2B8', marginTop: 6, lineHeight: 1.45, maxWidth: 520 }}>
            추천 화면에서 조건을 정했다면, 여기서 검색 후 동행 맞춤으로 골라 보고 필요하면 비교 화면으로 이어가면 됩니다.
          </div>
        </div>
      </header>

      <div style={{ padding: '0 16px 12px', flexShrink: 0 }}>
        <TourApiDataLanguageStrip variant="comfortable" />
      </div>

      <div className="tw-body">
        <SearchFilterBar
          health={vm.health}
          kakaoReady={vm.kakaoReady}
          kakaoError={vm.kakaoError}
          mode={vm.mode}
          onModeChange={vm.setMode}
          areaCode={vm.areaCode}
          onAreaCodeChange={vm.setAreaCode}
          keyword={vm.searchQuery}
          onKeywordChange={vm.setSearchQuery}
          onSearch={vm.runSearch}
          listLoading={vm.listLoading}
          listError={vm.listError}
          total={vm.total}
          rawPlacesCount={vm.places.length}
          coordsCount={coordsCount}
        />

        <TourCompanionFilterStrip value={vm.filters} onChange={vm.setFilters} excludedCount={vm.excludedCount} />

        <div className="tw-main">
          <TourListPanel
            companionFilter={vm.filters}
            listLoading={vm.listLoading}
            forList={vm.visiblePlaces}
            rawPlacesCount={vm.places.length}
            selectedPlaceId={vm.selectedPlaceId}
            onSelectPlace={vm.selectRankedPlace}
          />

          <KakaoMapPanel
            kakaoReady={vm.kakaoReady}
            kakaoError={vm.kakaoError}
            sdkReady={vm.kakaoReady}
            places={vm.forMap}
            selectedPlaceId={vm.selectedPlaceId}
            onMarkerSelect={vm.onMarkerSelect}
            suitabilityById={vm.suitabilityById}
            listLoading={vm.listLoading}
          />

          <TourLiveDetailPanel
            selectedPlace={vm.selectedPlace}
            selectedRanked={vm.selectedRanked}
            companionFilter={vm.filters}
            detailLoading={vm.detailDataLoading}
            detailError={vm.detailError}
            detailOverview={vm.detailOverview}
          />
        </div>

        <p style={{ fontSize: 11, color: '#A0A2B8', lineHeight: 1.5, margin: 0, flexShrink: 0 }}>
          장소 정보는 한국관광공사 공개 관광정보와 지도 서비스를 바탕으로 표시됩니다. 공개 범위 밖의 세부나 현장 조건과는 다를 수 있습니다.
        </p>
      </div>
    </div>
  )
}
