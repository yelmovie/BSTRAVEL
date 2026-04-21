/**

 * 혼잡도 참고용 카드 — 실측 혼잡 UI 금지. 날씨 예보와 근거 분리.

 */

import type { CrowdPredictionResult } from "../../lib/crowd/types"



function tierAccent(tier: CrowdPredictionResult["displayTier"]): {

  bg: string

  border: string

  status: string

} {

  if (tier === "relaxed") {

    return {

      bg: "#F0FDFA",

      border: "#99F6E4",

      status: "#0D9488",

    }

  }

  if (tier === "normal") {

    return {

      bg: "#F5F3FF",

      border: "#DDD6FE",

      status: "#4F46E5",

    }

  }

  if (tier === "somewhat_busy") {

    return {

      bg: "#FFF7ED",

      border: "#FDBA74",

      status: "#C2410C",

    }

  }

  return {

    bg: "#FEF2F2",

    border: "#FCA5A5",

    status: "#B91C1C",

  }

}



export type CrowdPredictionCardProps = {

  result: CrowdPredictionResult

}



export function CrowdPredictionCard({ result }: CrowdPredictionCardProps) {

  const c = tierAccent(result.displayTier)



  return (

    <div

      style={{

        borderRadius: 14,

        border: `1px solid ${c.border}`,

        background: c.bg,

        padding: "16px 18px",

        boxShadow: "0 2px 10px rgba(26,26,46,0.05)",

        fontFamily: '"Noto Sans KR", system-ui, sans-serif',

      }}

    >

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>

        <span

          style={{

            fontSize: 10,

            fontWeight: 800,

            letterSpacing: 0.4,

            color: "#5B54D6",

            background: "#EEF2FF",

            border: "1px solid #C7D2FE",

            padding: "4px 9px",

            borderRadius: 8,

          }}

        >

          예상 혼잡도

        </span>

        <span

          style={{

            fontSize: 10,

            fontWeight: 700,

            color: "#6B7280",

            background: "#F9FAFB",

            border: "1px solid #E5E7EB",

            padding: "3px 8px",

            borderRadius: 6,

          }}

        >

          {result.confidenceLabelKo}

        </span>

      </div>



      <div style={{ marginBottom: 12 }}>

        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>

          <span style={{ fontSize: 22, fontWeight: 900, color: "#1A1A2E", letterSpacing: -0.3 }}>

            혼잡도: <span style={{ color: c.status }}>{result.label}</span>

          </span>

          <span

            style={{

              fontSize: 10,

              fontWeight: 800,

              color: "#6D28D9",

              background: "white",

              border: "1px solid #DDD6FE",

              padding: "4px 8px",

              borderRadius: 8,

            }}

          >

            {result.crowdRibbonLabelKo}

          </span>

        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: "#64748B", marginTop: 6 }}>{result.summaryLine}</div>

      </div>



      <div

        style={{

          borderRadius: 10,

          background: "rgba(255,255,255,0.75)",

          border: "1px solid #E2E8F0",

          padding: "10px 12px",

        }}

      >

        <div style={{ fontSize: 11, fontWeight: 800, color: "#0F766E", marginBottom: 4 }}>공식 데이터</div>

        <p style={{ fontSize: 12, color: "#475569", lineHeight: 1.55, margin: 0 }}>{result.evidenceOfficialKo}</p>

        <div style={{ fontSize: 10, color: "#94A3B8", marginTop: 6 }}>{result.sourceLabel}</div>

      </div>

    </div>

  )

}


