/**
 * 하위 호환 별칭 — 마커 로직은 `KakaoMapView` 의 `places` 로 통합됨.
 */
import type { TourMapMarkerPlace } from '../../lib/tour/tourMapMarkers'

import { KakaoMapView, type KakaoMapViewProps } from './KakaoMapView'

export type KakaoTourPlacesMapProps = Omit<KakaoMapViewProps, 'places'> & {
  markers: TourMapMarkerPlace[]
}

export function KakaoTourPlacesMap({
  markers,
  ...rest
}: KakaoTourPlacesMapProps) {
  return <KakaoMapView places={markers} {...rest} />
}
