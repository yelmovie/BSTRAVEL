import { useState } from "react"
import { useNavigate } from "react-router"
import { motion } from "motion/react"
import { ChevronRight, ChevronDown, ArrowUpDown } from "lucide-react"
import { PLACES } from "../../data/places"
import {
  sortSimulationPlaces,
  simulationPlaceToCardDisplay,
  type SimulationSortKey,
} from "../../data/simulationCourses"
import { CourseCardItem } from "./CourseCardItem"
import { useApp } from "../../context/AppContext"
type Variant = "mobile" | "desktop"

/**
 * 부산 고정 시뮬레이션 코스(PLACES) — 접기 섹션 단일 구현
 */
export function SimulationCoursesCollapsible({ variant }: { variant: Variant }) {
  const navigate = useNavigate()
  const { setSelectedCourse } = useApp()
  const [open, setOpen] = useState(false)
  const [sortBy, setSortBy] = useState<SimulationSortKey>("score")

  const sorted = sortSimulationPlaces(PLACES, sortBy)

  const gridStyle =
    variant === "desktop"
      ? ({
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          gap: 18,
          alignItems: "start",
        } as const)
      : ({ display: "flex", flexDirection: "column", gap: 12 } as const)

  const togglePad = variant === "desktop" ? "12px 16px" : "11px 14px"
  const panelPad = variant === "desktop" ? "16px 16px 20px" : "12px 12px 16px"

  function goDetail(placeId: string) {
    setSelectedCourse(placeId)
    navigate(variant === "desktop" ? `/desktop/course/${placeId}` : `/mobile/detail/${placeId}`)
  }

  return (
    <div style={variant === "desktop" ? { maxWidth: 1100, margin: "32px auto 0" } : { marginTop: 8 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: togglePad,
          borderRadius: open ? "12px 12px 0 0" : 12,
          border: "1.5px solid #E5E7EB",
          background: "#FAFAFA",
          cursor: "pointer",
          ...(variant === "desktop" ? { transition: "background 0.15s" } : {}),
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              padding: variant === "desktop" ? "4px 9px" : "3px 8px",
              borderRadius: 7,
              border: "1px solid #E5E7EB",
              background: "#F3F4F6",
              color: "#4B5563",
            }}
          >
            예시 데이터
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#4A4A6A" }}>
            예시 시나리오 코스 (TourAPI 추천과 무관)
          </span>
          {variant === "desktop" ? (
            <span style={{ fontSize: 11, color: "#9CA3AF", fontWeight: 400 }}>
              · 로컬 시연 전용
            </span>
          ) : null}
        </div>
        {open ? <ChevronDown size={16} color="#8E90A8" /> : <ChevronRight size={16} color="#8E90A8" />}
      </button>

      {open && (
        <div
          style={{
            border: "1.5px solid #E4E6EF",
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            background: "#F8F9FC",
            padding: panelPad,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#A0A2B8",
              marginBottom: variant === "desktop" ? 16 : 12,
              lineHeight: 1.5,
            }}
          >
            아래는 시연용 예시 시나리오이며, TourAPI 기반 추천·공공 수치가 아닙니다. 지표·동선은 앱이 만든 참고용입니다.
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: variant === "desktop" ? 8 : 6,
              marginBottom: variant === "desktop" ? 16 : 12,
            }}
          >
            <ArrowUpDown size={variant === "desktop" ? 13 : 12} color="#8E90A8" />
            {variant === "desktop" ? (
              <span style={{ fontSize: 12, color: "#8E90A8" }}>정렬:</span>
            ) : null}
            {(["score", "walking", "duration"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSortBy(s)}
                style={{
                  padding: variant === "desktop" ? "5px 12px" : "4px 10px",
                  borderRadius: variant === "desktop" ? 8 : 7,
                  border: `1.5px solid ${sortBy === s ? "#5B54D6" : "#E4E6EF"}`,
                  background: sortBy === s ? "#EEEDFA" : "white",
                  fontSize: variant === "desktop" ? 12 : 11,
                  fontWeight: sortBy === s ? 700 : 500,
                  color: sortBy === s ? "#5B54D6" : "#6B6B88",
                  cursor: "pointer",
                }}
              >
                {{ score: "점수순", walking: "보행순", duration: "시간순" }[s]}
              </button>
            ))}
          </div>

          <div style={gridStyle}>
            {sorted.map((place, i) => (
              <motion.div
                key={place.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <CourseCardItem
                  {...simulationPlaceToCardDisplay(place, i + 1)}
                  onDetail={() => goDetail(place.id)}
                />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
