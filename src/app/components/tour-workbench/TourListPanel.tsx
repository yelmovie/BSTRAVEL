import type { RankedTourPlace } from '../../lib/tour/companionFilterTypes'
import { hasAnyCompanionFilter } from '../../lib/tour/companionFilterConfig'
import type { CompanionFilterState } from '../../lib/tour/companionFilterTypes'
import { TourCard } from './TourCard'

type Props = {
  companionFilter: CompanionFilterState
  listLoading: boolean
  forList: RankedTourPlace[]
  rawPlacesCount: number
  selectedPlaceId: string | null
  onSelectPlace: (p: RankedTourPlace) => void
}

function ListSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 4 }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            height: 88,
            borderRadius: 10,
            background: 'linear-gradient(90deg, #eef0f6 25%, #f6f7fb 50%, #eef0f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'tw-shimmer 1.2s ease-in-out infinite',
          }}
        />
      ))}
      <style>{`@keyframes tw-shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }`}</style>
    </div>
  )
}

export function TourListPanel({ companionFilter, listLoading, forList, rawPlacesCount, selectedPlaceId, onSelectPlace }: Props) {
  const showBadge = hasAnyCompanionFilter(companionFilter)

  return (
    <section className="tw-panel tw-col-list" aria-label="관광지 목록">
      <div className="tw-panel-head">관광지 목록</div>
      <div className="tw-panel-scroll" style={{ padding: 10 }}>
        {listLoading && <ListSkeleton />}
        {!listLoading && rawPlacesCount === 0 && (
          <div style={{ fontSize: 12, color: '#8E90A8', padding: 8 }}>상단에서 지역 또는 키워드로 검색해 주세요.</div>
        )}
        {!listLoading && rawPlacesCount > 0 && forList.length === 0 && (
          <div style={{ fontSize: 12, color: '#B42318', padding: 8 }}>
            조건에 맞는 장소가 없습니다. 조건을 변경해 다시 확인해 주세요.
          </div>
        )}
        {!listLoading && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {forList.map((p) => (
              <TourCard
                key={p.id}
                place={p}
                selected={selectedPlaceId === p.id}
                showCompanionBadge={showBadge}
                onSelect={() => onSelectPlace(p)}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
