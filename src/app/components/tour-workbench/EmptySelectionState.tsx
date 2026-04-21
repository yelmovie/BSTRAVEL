import { MapPin } from 'lucide-react'

export function EmptySelectionState() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        textAlign: 'center',
        color: '#8e90a8',
        gap: 10,
      }}
    >
      <MapPin size={28} color="#c4c6d4" />
      <div style={{ fontSize: 13, fontWeight: 700, color: '#6b6b88' }}>선택된 관광지가 없습니다</div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, maxWidth: 280 }}>
        먼저 위에서 검색으로 장소 목록을 불러온 뒤, 왼쪽 카드나 지도 마커를 선택하면 이곳에 장소 정보가 이어서 표시됩니다.
      </p>
    </div>
  )
}
