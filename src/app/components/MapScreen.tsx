import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Train, Footprints, Clock, Flag, MapPin,
  Coffee, UtensilsCrossed, ChevronRight, Navigation,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";

/* ─────────────────────────────────────────
   SVG Map Layout per place
───────────────────────────────────────── */

interface WaypointSVG {
  x: number;
  y: number;
  type: "start" | "place" | "rest" | "meal" | "end";
  label: string;
  sub: string;
}

interface MapLayout {
  /* Background regions */
  water?: { x: number; y: number; w: number; h: number };
  parks: { x: number; y: number; w: number; h: number }[];
  buildings: { x: number; y: number; w: number; h: number }[];
  /* Route */
  waypoints: WaypointSVG[];
  /* Transport between consecutive waypoints */
  transports: ("walk" | "transit")[];
}

const MAP_LAYOUTS: Record<string, MapLayout> = {
  botanical: {
    water:     { x: 0, y: 215, w: 340, h: 48 },
    parks:     [
      { x: 14, y: 92, w: 122, h: 118 },   // Botanical Garden
      { x: 194, y: 155, w: 130, h: 56 },  // Yeouido park
    ],
    buildings: [
      { x: 150, y: 82, w: 36, h: 44 },
      { x: 198, y: 82, w: 48, h: 68 },
      { x: 256, y: 98, w: 32, h: 32 },
      { x: 0, y: 42, w: 80, h: 44 },
      { x: 148, y: 275, w: 60, h: 40 },
      { x: 220, y: 270, w: 50, h: 35 },
    ],
    waypoints: [
      { x: 62,  y: 385, type: "start", label: "마곡나루역",    sub: "9호선 출발" },
      { x: 68,  y: 148, type: "place", label: "서울 식물원",   sub: "온실·야외 정원" },
      { x: 142, y: 162, type: "rest",  label: "호수공원 카페", sub: "휴식 30분" },
      { x: 255, y: 296, type: "meal",  label: "여의도 식사",   sub: "접근성 식당가" },
      { x: 270, y: 172, type: "place", label: "여의도 한강공원", sub: "평지 산책" },
      { x: 272, y: 310, type: "end",   label: "여의도역",      sub: "5/9호선 도착" },
    ],
    transports: ["transit", "walk", "walk", "walk", "walk"],
  },
  museum: {
    water:     { x: 0, y: 200, w: 340, h: 44 },
    parks:     [
      { x: 44, y: 140, w: 130, h: 56 },   // Ichon Hangang
    ],
    buildings: [
      { x: 58, y: 240, w: 148, h: 96 },   // Museum
      { x: 218, y: 248, w: 80, h: 60 },
      { x: 218, y: 100, w: 60, h: 50 },
      { x: 0, y: 82, w: 50, h: 60 },
      { x: 60, y: 80, w: 80, h: 50 },
    ],
    waypoints: [
      { x: 112, y: 385, type: "start", label: "이촌역",        sub: "4호선 출발" },
      { x: 118, y: 272, type: "place", label: "국립중앙박물관", sub: "상설전시 관람" },
      { x: 162, y: 258, type: "rest",  label: "박물관 카페",   sub: "내부 카페 휴식" },
      { x: 232, y: 310, type: "meal",  label: "용산 식사",     sub: "근처 식당" },
      { x: 100, y: 162, type: "place", label: "이촌 한강공원", sub: "강변 산책" },
      { x: 112, y: 385, type: "end",   label: "이촌역",        sub: "4호선 도착" },
    ],
    transports: ["walk", "walk", "walk", "walk", "walk"],
  },
  palace: {
    water:     undefined,
    parks:     [
      { x: 0, y: 0, w: 340, h: 72 },      // Bukhansan
      { x: 52, y: 116, w: 165, h: 155 },  // Palace grounds
    ],
    buildings: [
      { x: 226, y: 118, w: 90, h: 60 },
      { x: 226, y: 188, w: 80, h: 55 },
      { x: 276, y: 258, w: 50, h: 50 },
      { x: 0, y: 78, w: 48, h: 36 },
      { x: 0, y: 298, w: 48, h: 80 },
    ],
    waypoints: [
      { x: 118, y: 390, type: "start", label: "경복궁역",    sub: "3호선 출발" },
      { x: 128, y: 196, type: "place", label: "경복궁",      sub: "궁 전체 관람" },
      { x: 208, y: 185, type: "meal",  label: "인사동 점심", sub: "전통 한식" },
      { x: 238, y: 168, type: "place", label: "인사동 거리", sub: "전통 문화" },
      { x: 254, y: 175, type: "rest",  label: "전통 찻집",   sub: "차 한 잔" },
      { x: 296, y: 306, type: "end",   label: "종로3가역",   sub: "1/3호선 도착" },
    ],
    transports: ["walk", "walk", "walk", "walk", "walk"],
  },
};

const TYPE_COLORS: Record<string, string> = {
  start: "#5B54D6",
  place: "#3D8B7A",
  rest:  "#B07AAF",
  meal:  "#C4793C",
  end:   "#4A7BBF",
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  start: <Train size={11} color="white" />,
  place: <MapPin size={11} color="white" />,
  rest:  <Coffee size={11} color="white" />,
  meal:  <UtensilsCrossed size={11} color="white" />,
  end:   <Flag size={11} color="white" />,
};

function buildRoutePath(pts: WaypointSVG[], transports: ("walk" | "transit")[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x} ${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const prev = pts[i - 1];
    const curr = pts[i];
    // Curved path
    const mx = (prev.x + curr.x) / 2;
    const my = (prev.y + curr.y) / 2;
    const cpx = mx;
    const cpy = prev.y;
    d += ` Q ${cpx} ${cpy} ${curr.x} ${curr.y}`;
  }
  return d;
}

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */

export function MapScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const layout = MAP_LAYOUTS[place.id] ?? MAP_LAYOUTS.botanical;
  const [selectedWp, setSelectedWp] = useState<number | null>(null);
  const [transportMode, setTransportMode] = useState<"walk" | "transit">("transit");

  const routePath = buildRoutePath(layout.waypoints, layout.transports);

  const totalWalking = layout.transports.filter((t) => t === "walk").length;
  const totalTransit = layout.transports.filter((t) => t === "transit").length;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="코스 지도" />

      {/* ── Mode toggle ── */}
      <div style={{
        padding: "10px 20px",
        background: "white",
        borderBottom: "1px solid #E8E9EF",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#4A4A6A", letterSpacing: -0.2 }}>
          {place.name}
        </span>
        <div style={{
          display: "flex",
          background: "#F0F1F6",
          borderRadius: 10,
          padding: 3,
          gap: 3,
        }}>
          {([["transit", "대중교통"], ["walk", "도보"]] as const).map(([mode, label]) => (
            <button
              key={mode}
              onClick={() => setTransportMode(mode)}
              style={{
                padding: "5px 12px", borderRadius: 8, border: "none",
                background: transportMode === mode ? "white" : "transparent",
                color: transportMode === mode ? "#5B54D6" : "#8E90A8",
                fontSize: 11, fontWeight: 700, cursor: "pointer",
                boxShadow: transportMode === mode ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SVG Map ── */}
      <div style={{ position: "relative", background: "#E8ECF2", overflow: "hidden" }}>
        <svg
          viewBox="0 0 340 440"
          width="100%"
          style={{ display: "block", maxHeight: "54dvh" }}
        >
          {/* Background */}
          <rect width="340" height="440" fill="#EEF0F5" />

          {/* Grid lines */}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320, 360, 400, 440].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="340" y2={y} stroke="#E0E3EA" strokeWidth="0.5" />
          ))}
          {[0, 40, 80, 120, 160, 200, 240, 280, 320].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="440" stroke="#E0E3EA" strokeWidth="0.5" />
          ))}

          {/* Buildings */}
          {layout.buildings.map((b, i) => (
            <rect key={i} x={b.x + 2} y={b.y + 2} width={b.w - 4} height={b.h - 4}
              fill="#D4D8E4" rx="2"
              opacity="0.7"
            />
          ))}

          {/* Water */}
          {layout.water && (
            <rect
              x={layout.water.x} y={layout.water.y}
              width={layout.water.w} height={layout.water.h}
              fill="#B8D4F0" rx="2" opacity="0.8"
            />
          )}

          {/* Parks */}
          {layout.parks.map((p, i) => (
            <rect key={i} x={p.x} y={p.y} width={p.w} height={p.h}
              fill="#C8E6C4" rx="4" opacity="0.8"
            />
          ))}

          {/* Mountain label */}
          {place.id === "palace" && (
            <text x="165" y="42" textAnchor="middle" fontSize="9"
              fill="#7A9A78" fontWeight="600">북악산 · 북한산</text>
          )}

          {/* Water label */}
          {layout.water && (
            <text x="170" y={layout.water.y + layout.water.h / 2 + 4}
              textAnchor="middle" fontSize="9" fill="#5B9BD5" fontWeight="600">
              한강
            </text>
          )}

          {/* Route path (shadow) */}
          <path
            d={routePath}
            fill="none"
            stroke="rgba(0,0,0,0.15)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Route path (dashed for transit segments) */}
          <path
            d={routePath}
            fill="none"
            stroke="#5B54D6"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={transportMode === "transit" ? "8 4" : "none"}
          />

          {/* Waypoints */}
          {layout.waypoints.map((wp, i) => {
            const isSelected = selectedWp === i;
            const color = TYPE_COLORS[wp.type];
            return (
              <g key={i} style={{ cursor: "pointer" }} onClick={() => setSelectedWp(isSelected ? null : i)}>
                {/* Pulse ring on selected */}
                {isSelected && (
                  <circle cx={wp.x} cy={wp.y} r="18" fill={color} opacity="0.15" />
                )}
                {/* Main circle */}
                <circle
                  cx={wp.x} cy={wp.y} r="12"
                  fill="white"
                  stroke={color}
                  strokeWidth={isSelected ? 3 : 2}
                />
                {/* Inner colored circle */}
                <circle cx={wp.x} cy={wp.y} r="8" fill={color} />
                {/* Step number */}
                <text
                  x={wp.x} y={wp.y + 4}
                  textAnchor="middle"
                  fontSize="8"
                  fontWeight="700"
                  fill="white"
                >
                  {i + 1}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Waypoint tooltip ── */}
        {selectedWp !== null && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              position: "absolute",
              bottom: 12,
              left: "50%",
              transform: "translateX(-50%)",
              background: "white",
              borderRadius: 14,
              padding: "12px 16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
              width: "calc(100% - 40px)",
              maxWidth: 320,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {(() => {
              const wp = layout.waypoints[selectedWp];
              const color = TYPE_COLORS[wp.type];
              return (
                <>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {TYPE_ICONS[wp.type]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3 }}>
                      {wp.label}
                    </div>
                    <div style={{ fontSize: 11, color: "#9EA0B8" }}>{wp.sub}</div>
                  </div>
                  <div style={{
                    width: 22, height: 22, borderRadius: "50%",
                    background: "#F0F1F6",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 9, fontWeight: 800, color: "#5B54D6",
                    flexShrink: 0,
                  }}>
                    {selectedWp + 1}
                  </div>
                </>
              );
            })()}
          </motion.div>
        )}
      </div>

      {/* ── Bottom info panel ── */}
      <div style={{
        flex: 1, overflowY: "auto",
        padding: "14px 20px 0",
      }}>

        {/* Stats row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 14 }}>
          {[
            { icon: Clock,      label: "총 소요",   value: place.duration },
            { icon: Footprints, label: "예상 보행", value: place.estimatedSteps },
            { icon: Navigation, label: "코스",       value: `${layout.waypoints.length}개 장소` },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} style={{
                background: "white", borderRadius: 12, padding: "11px 10px",
                border: "1px solid #E8E9EF", textAlign: "center" as const,
              }}>
                <Icon size={14} color="#5B54D6" style={{ marginBottom: 4 }} />
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
                  {item.value}
                </div>
                <div style={{ fontSize: 9, color: "#9EA0B8", marginTop: 1 }}>{item.label}</div>
              </div>
            );
          })}
        </div>

        {/* Waypoint list */}
        <div style={{
          background: "white", borderRadius: 14, border: "1px solid #E8E9EF",
          padding: "12px 14px", marginBottom: 20,
        }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4A4A6A", marginBottom: 10, letterSpacing: -0.1 }}>
            코스 순서
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {layout.waypoints.map((wp, i) => {
              const color = TYPE_COLORS[wp.type];
              const isLast = i === layout.waypoints.length - 1;
              const transport = layout.transports[i];
              return (
                <div key={i}>
                  <div
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "8px 0",
                      cursor: "pointer",
                    }}
                    onClick={() => setSelectedWp(selectedWp === i ? null : i)}
                  >
                    <div style={{
                      width: 24, height: 24, borderRadius: 7,
                      background: color,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      {TYPE_ICONS[wp.type]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>
                        {wp.label}
                      </span>
                    </div>
                    <div style={{
                      width: 16, height: 16, borderRadius: "50%",
                      background: "#F0F1F6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 9, fontWeight: 700, color: "#8E90A8",
                    }}>
                      {i + 1}
                    </div>
                  </div>
                  {!isLast && (
                    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 0 0 8px", marginBottom: 2 }}>
                      <div style={{ width: 8, height: 1, background: "#D0D2DC" }} />
                      <span style={{ fontSize: 9, color: "#B0B2C8" }}>
                        {transport === "transit" ? "대중교통 이동" : "도보 이동"}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Go to timeline */}
        <button
          onClick={() => navigate(`/mobile/course/${place.id}`)}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
            color: "white", fontSize: 14, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            letterSpacing: -0.3, marginBottom: 32,
            boxShadow: "0 4px 16px rgba(91,84,214,0.3)",
          }}
        >
          <Flag size={14} />
          코스 타임라인으로 이동
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
