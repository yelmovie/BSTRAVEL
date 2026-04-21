/**
 * Leaflet 기반 관광지 마커 지도 — 활성 추천/결과 흐름에서 사용하는 기본 진입점입니다.
 */
import type { TourMapMarkerPlace } from '../../lib/tour/tourMapMarkers'

import { LeafletMapView, type LeafletMapViewProps } from './LeafletMapView'

export type LeafletTourPlacesMapProps = Omit<LeafletMapViewProps, 'places'> & {
  markers: TourMapMarkerPlace[]
}

export function LeafletTourPlacesMap({
  markers,
  ...rest
}: LeafletTourPlacesMapProps) {
  return <LeafletMapView places={markers} {...rest} />
}
