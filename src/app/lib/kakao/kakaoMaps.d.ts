/**
 * 카카오맵 JavaScript API — 앱에서 사용하는 최소 타입만 선언
 * 전체 정의는 공식 타입 패키지 또는 문서를 참고
 */
export {}

declare global {
  namespace kakao {
    namespace maps {
      class Size {
        constructor(width: number, height: number)
      }

      class MarkerImage {
        constructor(src: string, size: Size)
      }

      class LatLng {
        constructor(latitude: number, longitude: number)
        getLat(): number
        getLng(): number
      }

      interface MapOptions {
        center: LatLng
        level: number
      }

      class LatLngBounds {
        extend(latlng: LatLng): void
      }

      class Map {
        constructor(container: HTMLElement, options: MapOptions)
        setCenter(latlng: LatLng): void
        getLevel(): number
        setLevel(level: number): void
        setBounds(bounds: LatLngBounds): void
        panTo(latlng: LatLng): void
        relayout(): void
      }

      interface MarkerOptions {
        position: LatLng
        map?: Map | null
        image?: MarkerImage
      }

      interface PolylineOptions {
        path: LatLng[]
        strokeWeight?: number
        strokeColor?: string
        strokeOpacity?: number
        strokeStyle?: 'solid' | 'shortdash' | 'dash' | 'longdash' | 'dot'
        /** 지도 미지정 시 setMap 으로 나중에 연결 가능 */
        map?: Map | null
      }

      class Polyline {
        constructor(options: PolylineOptions)
        setMap(map: Map | null): void
      }

      class Marker {
        constructor(options: MarkerOptions)
        setMap(map: Map | null): void
        getPosition(): LatLng
      }

      interface InfoWindowOptions {
        content: string
        removable?: boolean
      }

      class InfoWindow {
        constructor(options: InfoWindowOptions)
        open(map: Map, marker: Marker): void
        close(): void
        setContent(content: string): void
      }

      namespace event {
        function addListener(target: Marker, type: string, handler: () => void): void
      }

      function load(callback: () => void): void
    }
  }

  interface Window {
    kakao?: typeof kakao
  }
}
