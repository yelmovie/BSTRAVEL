import { useEffect, useMemo, useState } from "react"
import { useLocation } from "react-router"
import {
  subscribeApiDebug,
  getApiDebugEntries,
  clearApiDebugEntries,
  type ApiDebugEntry,
} from "../../lib/apiDebug/apiDebug"

function fmtTime(at: number): string {
  return new Date(at).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  })
}

export function ApiDebugPanel() {
  const location = useLocation()
  const [version, setVersion] = useState(0)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    return subscribeApiDebug(() => setVersion((v) => v + 1))
  }, [])

  const rows = useMemo(() => getApiDebugEntries(), [location.pathname, version])

  if (!import.meta.env.DEV) return null

  return (
    <div
      style={{
        position: "fixed",
        right: open ? 12 : 12,
        bottom: 12,
        zIndex: 99999,
        fontFamily: "'Noto Sans KR', sans-serif",
        maxWidth: open ? 380 : "auto",
      }}
    >
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          style={{
            padding: "10px 14px",
            borderRadius: 12,
            border: "1px solid #C7C9D9",
            background: "rgba(255,255,255,0.96)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            fontSize: 12,
            fontWeight: 700,
            color: "#1A1B2E",
            cursor: "pointer",
          }}
        >
          API 디버그
        </button>
      ) : (
        <div
          style={{
            background: "rgba(255,255,255,0.98)",
            border: "1px solid #E4E6EF",
            borderRadius: 14,
            boxShadow: "0 12px 36px rgba(0,0,0,0.14)",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            maxHeight: "min(70vh, 420px)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "10px 12px",
              background: "#F6F7FB",
              borderBottom: "1px solid #E4E6EF",
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1B2E" }}>API 디버그 (개발 전용)</div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                type="button"
                onClick={() => clearApiDebugEntries()}
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  border: "none",
                  background: "transparent",
                  color: "#5B54D6",
                  cursor: "pointer",
                }}
              >
                비우기
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  color: "#6B6B88",
                }}
              >
                닫기
              </button>
            </div>
          </div>
          <div style={{ padding: "8px 12px", fontSize: 10, color: "#6B6B88", borderBottom: "1px solid #F0F1F6" }}>
            현재 경로: <span style={{ fontWeight: 700, color: "#1A1B2E" }}>{location.pathname}</span>
          </div>
          <div style={{ overflowY: "auto", padding: "8px 10px 12px", flex: 1 }}>
            {rows.length === 0 ? (
              <div style={{ fontSize: 11, color: "#9EA0B8", padding: 8 }}>아직 기록된 호출이 없습니다. 화면을 조작하면 Tour/Open-Meteo 요청이 쌓입니다.</div>
            ) : (
              rows.map((e: ApiDebugEntry) => (
                <div
                  key={e.id}
                  style={{
                    marginBottom: 8,
                    padding: "8px 10px",
                    borderRadius: 10,
                    background: e.ok ? "#F6FAF7" : "#FEF2F2",
                    border: `1px solid ${e.ok ? "#D8EDE3" : "#FECACA"}`,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1B2E" }}>{e.label}</span>
                    <span style={{ fontSize: 10, color: "#6B6B88" }}>{fmtTime(e.at)}</span>
                  </div>
                  <div style={{ fontSize: 10, color: "#5B54D6", wordBreak: "break-all", marginBottom: 4 }}>
                    {e.url}
                  </div>
                  <div style={{ fontSize: 10, color: "#4A4A6A" }}>
                    {e.ok ? (
                      <>
                        성공 · {e.ms}ms{e.status != null ? ` · HTTP ${e.status}` : ""}
                      </>
                    ) : (
                      <>
                        실패 · {e.ms}ms{e.error ? ` · ${e.error}` : ""}
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
