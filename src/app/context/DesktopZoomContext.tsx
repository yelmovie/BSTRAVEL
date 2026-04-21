import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react"

export type DesktopZoomPct = 100 | 118 | 136 | 154 | 172

type DesktopZoomValue = {
  zoomPct: DesktopZoomPct
  cycleZoom: () => void
  zoomButtonLabel: string
}

const DesktopZoomContext = createContext<DesktopZoomValue | null>(null)

export function DesktopZoomProvider({ children }: { children: ReactNode }) {
  const [zoomPct, setZoomPct] = useState<DesktopZoomPct>(100)
  const zoomSteps: DesktopZoomPct[] = [100, 118, 136, 154, 172]

  const cycleZoom = useCallback(() => {
    setZoomPct((z) => {
      const idx = zoomSteps.indexOf(z)
      const nextIdx = idx >= 0 ? (idx + 1) % zoomSteps.length : 0
      return zoomSteps[nextIdx]
    })
  }, [zoomSteps])

  const zoomButtonLabel =
    zoomPct === 100 ? "화면 확대" : zoomPct === 172 ? "원래 크기" : "더 크게"

  const value = useMemo(
    () => ({ zoomPct, cycleZoom, zoomButtonLabel }),
    [zoomPct, cycleZoom, zoomButtonLabel],
  )

  return (
    <DesktopZoomContext.Provider value={value}>{children}</DesktopZoomContext.Provider>
  )
}

export function useDesktopZoom(): DesktopZoomValue {
  const v = useContext(DesktopZoomContext)
  if (!v) throw new Error("useDesktopZoom must be used within DesktopZoomProvider")
  return v
}
