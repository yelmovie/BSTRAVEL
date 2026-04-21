export {}

declare global {
  namespace kakao {
    namespace maps {
      class LatLng {
        constructor(latitude: number, longitude: number)
      }
      class Map {
        constructor(container: HTMLElement, options: { center: LatLng; level: number })
        setCenter(c: LatLng): void
        panTo(c: LatLng): void
      }
      class Marker {
        constructor(options: { position: LatLng; map?: Map | null })
        setMap(m: Map | null): void
      }
      class InfoWindow {
        constructor(options: { content: string; removable?: boolean })
        open(map: Map, marker: Marker): void
        close(): void
        setContent(html: string): void
      }
      namespace event {
        function addListener(target: Marker, type: string, handler: () => void): void
      }
      function load(cb: () => void): void
    }
  }
  interface Window {
    kakao?: typeof kakao
  }
}
