import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MapPin, ArrowLeft, Train, Bus, Footprints,
  ChevronRight, Layers, Navigation,
} from "lucide-react";
import { PLACES } from "../../data/places";

/* ── Mock SVG map data per place ──────────────────────── */
const MAP_ROUTES: Record<string, {
  nodes: { x: number; y: number; label: string; type: string; time: string }[];
  lines: { x1: number; y1: number; x2: number; y2: number; mode: "walk" | "transit" }[];
}> = {
  botanical: {
    nodes: [
      { x: 90,  y: 280, label: "마곡나루역",   type: "start", time: "10:00" },
      { x: 200, y: 200, label: "서울 식물원",   type: "place", time: "10:05" },
      { x: 220, y: 310, label: "호수공원 카페", type: "rest",  time: "12:00" },
      { x: 350, y: 240, label: "여의도 식당가", type: "meal",  time: "13:00" },
      { x: 440, y: 180, label: "한강공원",      type: "place", time: "14:15" },
      { x: 530, y: 260, label: "여의도역",      type: "end",   time: "15:35" },
    ],
    lines: [
      { x1: 90, y1: 280, x2: 200, y2: 200, mode: "walk" },
      { x1: 200, y1: 200, x2: 220, y2: 310, mode: "walk" },
      { x1: 220, y1: 310, x2: 350, y2: 240, mode: "transit" },
      { x1: 350, y1: 240, x2: 440, y2: 180, mode: "walk" },
      { x1: 440, y1: 180, x2: 530, y2: 260, mode: "walk" },
    ],
  },
  museum: {
    nodes: [
      { x: 90,  y: 250, label: "이촌역",        type: "start", time: "10:00" },
      { x: 210, y: 190, label: "국립중앙박물관", type: "place", time: "10:05" },
      { x: 240, y: 290, label: "박물관 카페",   type: "rest",  time: "12:30" },
      { x: 360, y: 230, label: "용산 식당가",   type: "meal",  time: "13:15" },
      { x: 460, y: 170, label: "이촌 한강공원", type: "place", time: "14:30" },
      { x: 540, y: 260, label: "이촌역",        type: "end",   time: "15:35" },
    ],
    lines: [
      { x1: 90, y1: 250, x2: 210, y2: 190, mode: "walk" },
      { x1: 210, y1: 190, x2: 240, y2: 290, mode: "walk" },
      { x1: 240, y1: 290, x2: 360, y2: 230, mode: "walk" },
      { x1: 360, y1: 230, x2: 460, y2: 170, mode: "walk" },
      { x1: 460, y1: 170, x2: 540, y2: 260, mode: "walk" },
    ],
  },
  palace: {
    nodes: [
      { x: 90,  y: 260, label: "경복궁역",    type: "start", time: "10:00" },
      { x: 200, y: 180, label: "경복궁",      type: "place", time: "10:05" },
      { x: 320, y: 210, label: "인사동 점심", type: "meal",  time: "12:15" },
      { x: 420, y: 170, label: "인사동 거리", type: "place", time: "13:30" },
      { x: 480, y: 270, label: "전통 찻집",   type: "rest",  time: "15:10" },
      { x: 560, y: 240, label: "종로3가역",   type: "end",   time: "15:45" },
    ],
    lines: [
      { x1: 90, y1: 260, x2: 200, y2: 180, mode: "walk" },
      { x1: 200, y1: 180, x2: 320, y2: 210, mode: "walk" },
      { x1: 320, y1: 210, x2: 420, y2: 170, mode: "walk" },
      { x1: 420, y1: 170, x2: 480, y2: 270, mode: "walk" },
      { x1: 480, y1: 270, x2: 560, y2: 240, mode: "walk" },
    ],
  },
};

const NODE_CFG: Record<string, { color: string; bg: string }> = {
  start: { color: "#5B54D6", bg: "#EEEDFA" },
  place: { color: "#3D8B7A", bg: "#EDF7F2" },
  rest:  { color: "#B07AAF", bg: "#F5EEF8" },
  meal:  { color: "#C4793C", bg: "#FEF3EA" },
  end:   { color: "#4A7BBF", bg: "#EFF6FF" },
};

export function MapPage() {
  const { id = "botanical" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find(p => p.id === id) ?? PLACES[0];
  const route = MAP_ROUTES[id] ?? MAP_ROUTES.botanical;
  const [activeNode, setActiveNode] = useState<number | null>(null);
  const [showAlt, setShowAlt] = useState(false);

  return (
    <div style={{
      minHeight: "calc(100dvh - 62px)",
      display: "flex", flexDirection: "column",
    }}>
      {/* Sub-header */}
      <div style={{
        background: "white", borderBottom: "1.5px solid #E4E6EF",
        padding: "14px 40px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate(`/desktop/timeline/${id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "none", background: "#F6F7FB", borderRadius: 8,
              padding: "7px 12px", cursor: "pointer",
              color: "#6B6B88", fontSize: 12, fontWeight: 600,
            }}
          >
            <ArrowLeft size={12} />타임라인
          </button>
          <div>
            <span style={{ fontSize: 11, color: "#8E90A8" }}>지도 탐색 · </span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>{place.name}</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setShowAlt(!showAlt)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px", borderRadius: 8,
              border: `1.5px solid ${showAlt ? "#5B54D6" : "#E4E6EF"}`,
              background: showAlt ? "#EEEDFA" : "white",
              color: showAlt ? "#5B54D6" : "#6B6B88",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Layers size={13} />대체 경로 토글
          </button>
          <button
            onClick={() => navigate(`/desktop/departure/${id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 18px", borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
              color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
            }}
          >
            출발 준비 <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Map + sidebar */}
      <div style={{ flex: 1, display: "flex" }}>
        {/* Left sidebar */}
        <div style={{
          width: 280, flexShrink: 0,
          background: "white", borderRight: "1.5px solid #E4E6EF",
          padding: "20px 18px", overflowY: "auto",
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14,
          }}>
            경로 정류장
          </div>
          {route.nodes.map((node, i) => {
            const cfg = NODE_CFG[node.type] ?? NODE_CFG.place;
            const isActive = activeNode === i;
            return (
              <motion.div
                key={i}
                whileHover={{ x: 2 }}
                onClick={() => setActiveNode(isActive ? null : i)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 10px", borderRadius: 10, cursor: "pointer",
                  background: isActive ? cfg.bg : "transparent",
                  border: `1.5px solid ${isActive ? cfg.color : "transparent"}`,
                  marginBottom: 4, transition: "all 0.15s",
                }}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%",
                  background: cfg.bg, border: `2px solid ${cfg.color}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 10, fontWeight: 800, color: cfg.color, flexShrink: 0,
                }}>
                  {i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1B2E" }}>{node.label}</div>
                  <div style={{ fontSize: 10, color: "#A0A2B8" }}>{node.time}</div>
                </div>
                <MapPin size={10} color={cfg.color} />
              </motion.div>
            );
          })}

          {/* Legend */}
          <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid #F0F1F6" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "#A0A2B8", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 }}>
              범례
            </div>
            {[
              { color: "#5B54D6", label: "도보 이동", Icon: Footprints },
              { color: "#3D8B7A", label: "대중교통",  Icon: Train },
            ].map(({ color, label, Icon }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 20, height: 3, background: color, borderRadius: 2 }} />
                <Icon size={10} color={color} />
                <span style={{ fontSize: 11, color: "#6B6B88" }}>{label}</span>
              </div>
            ))}
            {showAlt && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <div style={{ width: 20, height: 3, background: "#D97706", borderRadius: 2, borderStyle: "dashed" }} />
                <Navigation size={10} color="#D97706" />
                <span style={{ fontSize: 11, color: "#6B6B88" }}>대체 경로</span>
              </div>
            )}
          </div>
        </div>

        {/* SVG Map */}
        <div style={{
          flex: 1, background: "#EEF2F7",
          position: "relative", overflow: "hidden",
        }}>
          {/* Map bg grid */}
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.3 }}>
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#9EA0B8" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>

          {/* Route SVG */}
          <svg
            viewBox="0 0 640 420"
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
            }}
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Route lines */}
            {route.lines.map((line, i) => (
              <g key={i}>
                <motion.line
                  x1={line.x1} y1={line.y1} x2={line.x2} y2={line.y2}
                  stroke={line.mode === "transit" ? "#3D8B7A" : "#5B54D6"}
                  strokeWidth={3}
                  strokeDasharray={line.mode === "transit" ? "6,4" : "none"}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: i * 0.12 }}
                />
              </g>
            ))}

            {/* Alt route (dashed orange) */}
            {showAlt && route.lines.slice(1, 3).map((line, i) => (
              <motion.line
                key={`alt-${i}`}
                x1={line.x1 + 15} y1={line.y1 - 20}
                x2={line.x2 + 15} y2={line.y2 - 20}
                stroke="#D97706" strokeWidth={2.5}
                strokeDasharray="5,3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
              />
            ))}

            {/* Nodes */}
            {route.nodes.map((node, i) => {
              const cfg = NODE_CFG[node.type] ?? NODE_CFG.place;
              const isActive = activeNode === i;
              return (
                <g key={i} style={{ cursor: "pointer" }} onClick={() => setActiveNode(isActive ? null : i)}>
                  <motion.circle
                    cx={node.x} cy={node.y} r={isActive ? 18 : 13}
                    fill={cfg.bg}
                    stroke={cfg.color}
                    strokeWidth={2.5}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.1, type: "spring" }}
                  />
                  <text
                    x={node.x} y={node.y + 4}
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="800"
                    fill={cfg.color}
                  >
                    {i + 1}
                  </text>
                  {/* Label */}
                  <text
                    x={node.x} y={node.y + 26}
                    textAnchor="middle" fontSize="9"
                    fill="#4A4A6A" fontWeight="600"
                  >
                    {node.label.length > 6 ? node.label.slice(0, 6) + "…" : node.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Active node tooltip */}
          {activeNode !== null && (() => {
            const node = route.nodes[activeNode];
            const cfg  = NODE_CFG[node.type] ?? NODE_CFG.place;
            return (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  position: "absolute", bottom: 24, left: "50%",
                  transform: "translateX(-50%)",
                  background: "white", borderRadius: 14,
                  padding: "14px 20px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  border: `2px solid ${cfg.color}`,
                  minWidth: 200,
                  textAlign: "center",
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1B2E" }}>{node.label}</div>
                <div style={{ fontSize: 11, color: "#8E90A8", marginTop: 3 }}>{node.time} · {place.courseSteps[activeNode]?.duration}</div>
              </motion.div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
