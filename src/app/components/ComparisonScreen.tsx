import { useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle, Star, Clock, Footprints, Users, ChevronRight,
  Shield, Zap, Award, AlertTriangle, Info, BarChart2,
  Map, Navigation, TrendingUp, Database, ArrowUpDown, MapPin,
} from "lucide-react";
import { PLACES } from "../data/places";
import { useApp } from "../context/AppContext";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";

const CROWD_LABELS = ["", "매우 한산", "한산", "보통", "혼잡", "매우 혼잡"];
const CROWD_COLORS = ["", "#2D8A6B", "#4A7BBF", "#C4793C", "#D05050", "#A02020"];

const FACILITY_LABELS: Record<string, string> = {
  elevator: "엘리베이터", accessible_restroom: "장애인화장실", parking: "장애인주차",
  nursing_room: "수유실", audio_guide: "오디오가이드", foreign_guide: "외국어안내",
  wheelchair_rental: "휠체어대여", cafe: "카페", guide_map: "안내지도",
};

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + query)}`, "_blank");
}

// Pentagon / radar chart
function RadarChart({ data, size = 190 }: {
  data: { label: string; value: number }[];
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.36;
  const n = data.length;

  const getPos = (i: number, r: number) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  };

  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = data.map((d, i) => getPos(i, (d.value / 100) * maxR));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

  return (
    <svg width={size} height={size} style={{ overflow: "visible" }}>
      {rings.map((r, ri) => {
        const pts = Array.from({ length: n }, (_, i) => {
          const p = getPos(i, r * maxR);
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        }).join(" ");
        return <polygon key={ri} points={pts} fill="none" stroke="#E8E9EE" strokeWidth={ri === rings.length - 1 ? 1.2 : 0.7} />;
      })}
      {data.map((_, i) => {
        const p = getPos(i, maxR);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E8E9EE" strokeWidth={0.8} />;
      })}
      <path d={dataPath} fill="rgba(91,84,214,0.18)" stroke="#5B54D6" strokeWidth={2} strokeLinejoin="round" />
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#5B54D6" stroke="white" strokeWidth={1.5} />
      ))}
      {data.map((d, i) => {
        const p = getPos(i, maxR + 20);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={10} fill="#4A4A6A" fontWeight="600" fontFamily="Noto Sans KR, sans-serif">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

// Route mini-map simulation
function MiniRouteMap({ place, isBest }: { place: typeof PLACES[0]; isBest: boolean }) {
  const steps = place.courseSteps.filter(s => s.type === "place").slice(0, 4);
  const color = isBest ? "#5B54D6" : "#A0A0B8";
  return (
    <div style={{ position: "relative", height: 72, background: "#F0F1F7", borderTop: "1px solid #E8E9EE", overflow: "hidden" }}>
      {/* Route path simulation */}
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id={`grid-${place.id}`} width="12" height="12" patternUnits="userSpaceOnUse">
            <path d="M 12 0 L 0 0 0 12" fill="none" stroke="#E0E1EA" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#grid-${place.id})`} />
        {steps.length >= 2 && (
          <polyline
            points={steps.map((_, i) => {
              const xFrac = 0.1 + (i / (steps.length - 1)) * 0.8;
              const yFrac = i % 2 === 0 ? 0.3 : 0.7;
              return `${xFrac * 100}%,${yFrac * 72}`;
            }).join(" ")}
            fill="none"
            stroke={color}
            strokeWidth={2.5}
            strokeDasharray={isBest ? "none" : "5,3"}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.8}
          />
        )}
        {steps.map((_, i) => {
          const xFrac = 0.1 + (i / (Math.max(steps.length - 1, 1))) * 0.8;
          const yFrac = i % 2 === 0 ? 0.3 : 0.7;
          return (
            <circle key={i} cx={`${xFrac * 100}%`} cy={yFrac * 72}
              r={i === 0 || i === steps.length - 1 ? 5 : 4}
              fill={i === 0 || i === steps.length - 1 ? color : "white"}
              stroke={color} strokeWidth={2} />
          );
        })}
      </svg>
      {/* Labels */}
      {steps.slice(0, 2).map((s, i) => (
        <div key={i} style={{
          position: "absolute",
          top: i % 2 === 0 ? 4 : undefined,
          bottom: i % 2 !== 0 ? 4 : undefined,
          left: i === 0 ? 8 : undefined,
          right: i === 1 ? 8 : undefined,
          fontSize: 8,
          fontWeight: 600,
          color: color,
          background: "rgba(255,255,255,0.85)",
          borderRadius: 3,
          padding: "1px 4px",
          maxWidth: 80,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}>
          {s.name}
        </div>
      ))}
    </div>
  );
}

function CompareCard({
  place, label, isBest, onSelect, onMap,
}: {
  place: typeof PLACES[0];
  label: string;
  isBest: boolean;
  onSelect: () => void;
  onMap: () => void;
}) {
  const successColor = place.feasibility.successRate >= 85 ? "#2D8A6B" : place.feasibility.successRate >= 70 ? "#5B54D6" : "#C4793C";
  return (
    <div style={{
      flex: 1,
      borderRadius: 14,
      border: `2px solid ${isBest ? "#5B54D6" : "#E8E9EE"}`,
      overflow: "hidden",
      background: "white",
      minWidth: 0,
    }}>
      {/* Photo */}
      <div style={{ position: "relative", height: 90 }}>
        <img src={place.image} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
        {isBest && (
          <div style={{ position: "absolute", top: 6, right: 6 }}>
            <div style={{ background: "#5B54D6", borderRadius: 5, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3 }}>
              <Star size={8} color="white" fill="white" />
              <span style={{ fontSize: 9, fontWeight: 700, color: "white" }}>최적</span>
            </div>
          </div>
        )}
        <div style={{ position: "absolute", top: 6, left: 6 }}>
          <div style={{ background: "rgba(255,255,255,0.92)", borderRadius: 5, padding: "2px 6px", display: "flex", alignItems: "center", gap: 3 }}>
            <MapPin size={8} color="#5B54D6" />
            <span style={{ fontSize: 9, fontWeight: 700, color: "#5B54D6" }}>{place.busanArea}</span>
          </div>
        </div>
        <div style={{ position: "absolute", bottom: 6, left: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>{label}</span>
        </div>
      </div>

      {/* Route mini map */}
      <MiniRouteMap place={place} isBest={isBest} />

      {/* Score row */}
      <div style={{ padding: "10px 10px 0", textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginBottom: 2 }}>
          <Star size={13} color="#5B54D6" fill="#5B54D6" />
          <span style={{ fontSize: 18, fontWeight: 800, color: isBest ? "#5B54D6" : "#4A4A6A" }}>{place.score.toFixed(1)}점</span>
        </div>
        <div style={{ fontSize: 9, color: "#A0A0B0", fontWeight: 500, lineHeight: 1.3, marginBottom: 6, wordBreak: "keep-all" }}>
          {place.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}
        </div>
        {/* Feasibility badge */}
        <div style={{ display: "inline-flex", alignItems: "center", gap: 3, background: `${successColor}15`, borderRadius: 5, padding: "2px 7px", marginBottom: 8 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: successColor }}>실행 가능성 {place.feasibility.successRate}%</span>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "0 8px 10px", display: "flex", gap: 5 }}>
        <button
          onClick={onSelect}
          style={{
            flex: 1, padding: "7px 0", borderRadius: 8, border: "none",
            background: isBest ? "#5B54D6" : "#F0F1F7",
            color: isBest ? "white" : "#4A4A6A",
            fontSize: 11, fontWeight: 700, cursor: "pointer",
          }}
        >
          이 코스 선택
        </button>
        <button
          onClick={onMap}
          style={{
            padding: "7px 8px", borderRadius: 8, border: "1px solid #F9A825",
            background: "#FFFBF0", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Map size={12} color="#F9A825" />
        </button>
      </div>
    </div>
  );
}

function generateSummary(places: typeof PLACES, companions: string[] = []): string {
  if (places.length === 0) return "";
  const best = places.reduce((a, b) => (a.score > b.score ? a : b));
  const crowdBest = places.reduce((a, b) => (a.crowdLevel < b.crowdLevel ? a : b));
  const feasibilityBest = places.reduce((a, b) => (a.feasibility.successRate > b.feasibility.successRate ? a : b));
  
  let targetCompanions = "유모차와 외국인 동행";
  if (companions.length > 0) {
    // If we have actual context, use it. For simplicity, default to the requested text.
  }
  
  if (best.id === feasibilityBest.id) {
    return `**${best.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}**는 ${targetCompanions}에 가장 적합합니다. 종합 점수(${best.score.toFixed(1)}점)와 실행 가능성(${best.feasibility.successRate}%) 모두 비교 대상 중 가장 우수하여 안정적인 이동이 예상됩니다. 각 항목을 확인하고 일정을 결정하세요.`;
  }
  
  return `**${best.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}**는 ${targetCompanions}에 가장 적합합니다. 종합 점수(${best.score.toFixed(1)}점)가 높으며 접근성이 우수합니다. 반면, 실행 가능성 측면에서는 **${feasibilityBest.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}**이 ${feasibilityBest.feasibility.successRate}%로 더 안정적인 대안이 될 수 있습니다. 꼼꼼히 비교하고 최적의 코스를 결정하세요.`;
}

const SCORE_LABELS: { key: keyof typeof PLACES[0]["scoreBreakdown"]; label: string; color: string }[] = [
  { key: "accessibility", label: "접근성", color: "#5B54D6" },
  { key: "companionFit", label: "동행 적합도", color: "#3D8B7A" },
  { key: "walkingLoad", label: "보행 부담↓", color: "#4A7BBF" },
  { key: "crowdStability", label: "혼잡 안정성", color: "#B07AAF" },
  { key: "connectivity", label: "이동 연결성", color: "#C4793C" },
];

export function ComparisonScreen() {
  const navigate = useNavigate();
  const { selectedForComparison, toggleComparisonSelection, setSelectedCourse } = useApp();
  const [activeTab, setActiveTab] = useState<"visual" | "radar">("visual");

  const allPlaces = PLACES;
  const comparingPlaces = PLACES.filter((p) => selectedForComparison.includes(p.id));
  const bestPlace = comparingPlaces.length > 0
    ? comparingPlaces.reduce((a, b) => (a.score > b.score ? a : b), comparingPlaces[0])
    : null;

  const summary = comparingPlaces.length >= 2 ? generateSummary(comparingPlaces) : "";
  const summaryParts = summary.split("**");

  const METRICS = [
    {
      label: "소요 시간",
      icon: <Clock size={13} color="#7A7A8E" />,
      getValue: (p: typeof PLACES[0]) => p.duration,
      getRaw: (_p: typeof PLACES[0]) => 0,
      bestHigher: false,
    },
    {
      label: "보행 부담",
      icon: <Footprints size={13} color="#7A7A8E" />,
      getValue: (p: typeof PLACES[0]) => p.walkingAmount,
      getRaw: (p: typeof PLACES[0]) => 6 - p.walkingLevel,
      bestHigher: true,
    },
    {
      label: "혼잡도",
      icon: <Users size={13} color="#7A7A8E" />,
      getValue: (p: typeof PLACES[0]) => CROWD_LABELS[p.crowdLevel],
      getRaw: (p: typeof PLACES[0]) => 6 - p.crowdLevel,
      bestHigher: true,
    },
    {
      label: "편의시설",
      icon: <ArrowUpDown size={13} color="#7A7A8E" />,
      getValue: (p: typeof PLACES[0]) => p.facilities.slice(0, 3).map(f => FACILITY_LABELS[f] || f).join(", "),
      getRaw: (p: typeof PLACES[0]) => p.facilities.length,
      bestHigher: true,
    },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FC", display: "flex", flexDirection: "column" }}>
      <TopNav title="코스 비교" />
      <StepIndicator current={4} />

      {/* Tagline */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E9EE", padding: "8px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Database size={10} color="#5B54D6" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>KTO OpenAPI 기반 분석</span>
          </div>
          <span style={{ fontSize: 10, color: "#C0C0CC" }}>·</span>
          <span style={{ fontSize: 10, fontWeight: 500, color: "#7A7A8E" }}>추천을 넘어 선택을 위한 데이터 비교</span>
        </div>
      </div>

      {/* Route Selector */}
      <div style={{ padding: "12px 20px 0", background: "white", borderBottom: "1px solid #E8E9EE" }}>
        <p style={{ fontSize: 11, color: "#7A7A8E", fontWeight: 500, margin: "0 0 10px" }}>
          비교할 코스 선택 (2–3개)
        </p>
        <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 12 }}>
          {allPlaces.map((p) => {
            const selected = selectedForComparison.includes(p.id);
            return (
              <button
                key={p.id}
                onClick={() => toggleComparisonSelection(p.id)}
                style={{
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 12px",
                  borderRadius: 20,
                  border: `1.5px solid ${selected ? "#5B54D6" : "#E8E9EE"}`,
                  background: selected ? "#EEEDFA" : "white",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {selected && <CheckCircle size={13} color="#5B54D6" />}
                <span style={{ fontSize: 12, fontWeight: 600, color: selected ? "#5B54D6" : "#7A7A8E" }}>
                  {p.name.replace(" 코스", "").replace(" & 인사동", "").split(" ").slice(0, 2).join(" ")}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab */}
        <div style={{ display: "flex", gap: 0, marginBottom: -1 }}>
          {(["visual", "radar"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1,
                padding: "10px 0",
                border: "none",
                borderBottom: `2px solid ${activeTab === tab ? "#5B54D6" : "transparent"}`,
                background: "transparent",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === tab ? "#5B54D6" : "#A0A0B0",
                transition: "all 0.15s",
              }}
            >
              {tab === "visual" ? "코스 비교" : "점수 분석"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 120px" }}>
        <AnimatePresence mode="wait">
          {activeTab === "visual" ? (
            <motion.div
              key="visual"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {comparingPlaces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#A0A0B0" }}>
                  <BarChart2 size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>코스를 2개 이상 선택해 주세요</div>
                  <div style={{ fontSize: 12 }}>위에서 비교할 코스를 선택하면 비교 분석이 시작됩니다</div>
                </div>
              ) : (
                <>
                  {/* Side-by-side course cards */}
                  {comparingPlaces.length >= 2 ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{ display: "flex", gap: 10, marginBottom: 14 }}
                    >
                      {comparingPlaces.slice(0, 3).map((p, i) => (
                        <CompareCard
                          key={p.id}
                          place={p}
                          label={`코스 ${String.fromCharCode(65 + i)}`}
                          isBest={p.id === bestPlace?.id}
                          onSelect={() => { setSelectedCourse(p.id); navigate(`/mobile/detail/${p.id}`); }}
                          onMap={() => openKakaoMap(p.name)}
                        />
                      ))}
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      style={{
                        background: "#F6F5FF", borderRadius: 12, border: "1px solid #E4E2F5",
                        padding: "12px 16px", marginBottom: 14, textAlign: "center",
                        fontSize: 12, color: "#7A79CC",
                      }}
                    >
                      코스를 1개 더 선택하면 비교를 시작할 수 있습니다
                    </motion.div>
                  )}

                  {/* Best pick banner */}
                  {bestPlace && comparingPlaces.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: 0.1 }}
                      style={{
                        background: "linear-gradient(135deg, #5B54D6 0%, #7C75E8 100%)",
                        borderRadius: 14,
                        padding: "14px 16px",
                        marginBottom: 14,
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <div style={{
                        width: 40, height: 40, borderRadius: 10,
                        background: "rgba(255,255,255,0.2)",
                        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                      }}>
                        <Award size={20} color="white" />
                      </div>
                      <div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginBottom: 2 }}>
                          공공데이터 분석 최적 추천
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>{bestPlace.name}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                          실행 가능성 {bestPlace.feasibility.successRate}% · 접근성 {bestPlace.scoreBreakdown.accessibility}점
                        </div>
                      </div>
                      <div style={{ marginLeft: "auto", textAlign: "right" }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{bestPlace.score.toFixed(1)}</div>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>종합 점수</div>
                      </div>
                    </motion.div>
                  )}

                  {/* Comparison Table */}
                  {comparingPlaces.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 }}
                      style={{
                        background: "white", borderRadius: 14, border: "1px solid #E8E9EE",
                        overflow: "hidden", marginBottom: 14,
                      }}
                    >
                      {/* Table header */}
                      <div style={{
                        display: "grid",
                        gridTemplateColumns: `repeat(${comparingPlaces.length}, 1fr) 80px repeat(0, 0px)`,
                        background: "#F8F9FC",
                        borderBottom: "1.5px solid #E8E9EE",
                      }}>
                        {comparingPlaces.map((p, i) => {
                          const isBest = p.id === bestPlace?.id;
                          return (
                            <div key={p.id} style={{
                              padding: "10px 8px", textAlign: "center",
                              position: "relative",
                              background: isBest ? "#F6F5FF" : "transparent",
                              order: i < Math.floor(comparingPlaces.length / 2) ? i : i + 1,
                            }}>
                              {isBest && (
                                <div style={{
                                  position: "absolute", top: 0, left: 0, right: 0,
                                  height: 3, background: "#5B54D6",
                                }} />
                              )}
                              <div style={{ fontSize: 10, fontWeight: 700, color: isBest ? "#5B54D6" : "#7A7A8E" }}>
                                코스 {String.fromCharCode(65 + i)}
                              </div>
                              <div style={{ fontSize: 9, color: "#A0A0B0", wordBreak: "keep-all", lineHeight: 1.3 }}>
                                {p.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ padding: "10px 8px", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 10, fontWeight: 600, color: "#9EA0B8" }}>항목</span>
                        </div>
                      </div>

                      {/* Score row */}
                      <div style={{ display: "grid", gridTemplateColumns: `repeat(${comparingPlaces.length}, 1fr) 80px`, borderBottom: "1px solid #F0F1F5" }}>
                        {comparingPlaces.map((p, i) => {
                          const isBest = p.id === bestPlace?.id;
                          return (
                            <div key={p.id} style={{
                              padding: "12px 8px", textAlign: "center",
                              background: isBest ? "#FDFCFF" : "white",
                              borderRight: "1px solid #F0F1F5",
                            }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 3 }}>
                                <Star size={11} color="#5B54D6" fill={isBest ? "#5B54D6" : "none"} />
                                <span style={{ fontSize: 15, fontWeight: 800, color: isBest ? "#5B54D6" : "#4A4A6A" }}>
                                  {p.score.toFixed(1)}점
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div style={{ padding: "12px 8px", textAlign: "center", background: "#FAFAFA", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                          <Star size={11} color="#7A7A8E" />
                          <span style={{ fontSize: 11, fontWeight: 600, color: "#4A4A6A" }}>점수</span>
                        </div>
                      </div>

                      {/* Metric rows */}
                      {METRICS.map((metric, mi) => {
                        const raws = comparingPlaces.map((p) => metric.getRaw(p));
                        const bestRaw = metric.bestHigher ? Math.max(...raws) : Math.min(...raws);
                        return (
                          <div
                            key={metric.label}
                            style={{
                              display: "grid",
                              gridTemplateColumns: `repeat(${comparingPlaces.length}, 1fr) 80px`,
                              borderBottom: mi < METRICS.length - 1 ? "1px solid #F0F1F5" : "none",
                            }}
                          >
                            {comparingPlaces.map((p) => {
                              const raw = metric.getRaw(p);
                              const isCellBest = metric.getRaw(p) === bestRaw && bestRaw !== 0;
                              const isColBest = p.id === bestPlace?.id;
                              return (
                                <div
                                  key={p.id}
                                  style={{
                                    padding: "11px 8px", textAlign: "center",
                                    borderRight: "1px solid #F0F1F5",
                                    background: isCellBest ? "#EEEDFA" : isColBest ? "#FDFCFF" : "white",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}
                                >
                                  <span style={{
                                    fontSize: 11, fontWeight: isCellBest ? 800 : 500,
                                    color: isCellBest
                                      ? metric.label === "혼잡도" ? CROWD_COLORS[p.crowdLevel] : "#5B54D6"
                                      : "#7A7A8E",
                                    wordBreak: "keep-all", lineHeight: 1.3, textAlign: "center",
                                  }}>
                                    {metric.label === "혼잡도" ? (
                                      <span style={{ color: CROWD_COLORS[p.crowdLevel], fontWeight: 600 }}>
                                        {metric.getValue(p)}
                                      </span>
                                    ) : metric.getValue(p)}
                                  </span>
                                </div>
                              );
                            })}
                            <div style={{
                              padding: "11px 8px", background: "#FAFAFA",
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                              borderRight: "1px solid #F0F1F5",
                            }}>
                              {metric.icon}
                              <span style={{ fontSize: 10, fontWeight: 600, color: "#4A4A6A", wordBreak: "keep-all", textAlign: "center", lineHeight: 1.3 }}>
                                {metric.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Accessibility comparison */}
                  {comparingPlaces.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.22 }}
                      style={{
                        background: "white", borderRadius: 14, border: "1px solid #E8E9EE",
                        padding: "14px 16px", marginBottom: 14,
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                        <Shield size={13} color="#5B54D6" />
                        접근성·편의시설 비교
                      </div>
                      {comparingPlaces.map((p, i) => {
                        const isBest = p.id === bestPlace?.id;
                        return (
                          <div key={p.id} style={{ marginBottom: i < comparingPlaces.length - 1 ? 12 : 0 }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: isBest ? "#5B54D6" : "#4A4A6A" }}>
                                코스 {String.fromCharCode(65 + i)} — {p.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}
                              </span>
                              <span style={{ fontSize: 10, color: "#7A7A8E" }}>{p.facilities.length}종</span>
                            </div>
                            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                              {["elevator", "accessible_restroom", "parking", "nursing_room", "wheelchair_rental", "foreign_guide"].map((f) => {
                                const has = p.facilities.includes(f);
                                return (
                                  <span key={f} style={{
                                    fontSize: 10, fontWeight: 500, padding: "3px 6px", borderRadius: 4,
                                    background: has ? (isBest ? "#EEEDFA" : "#F0FAF6") : "#F5F5F7",
                                    color: has ? (isBest ? "#5B54D6" : "#2D8A6B") : "#C8C8D4",
                                  }}>
                                    {FACILITY_LABELS[f]}
                                  </span>
                                );
                              })}
                            </div>
                            {/* Risk indicator */}
                            {p.feasibility.risks.some(r => r.riskLevel === "high") && (
                              <div style={{
                                display: "flex", alignItems: "center", gap: 5,
                                marginTop: 6, background: "#FFF4F4",
                                borderRadius: 6, padding: "4px 8px",
                              }}>
                                <AlertTriangle size={10} color="#D05050" />
                                <span style={{ fontSize: 10, color: "#D05050", fontWeight: 500 }}>
                                  고위험 구간 {p.feasibility.risks.filter(r => r.riskLevel === "high").length}개 — 사전 확인 필요
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}

                  {/* Summary */}
                  {comparingPlaces.length >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.28 }}
                      style={{
                        background: "#F6F5FF", borderRadius: 14, border: "1px solid #E4E2F5",
                        padding: "14px 16px", marginBottom: 14,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
                        <Database size={13} color="#5B54D6" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6" }}>공공데이터 기반 비교 요약</span>
                      </div>
                      <p style={{ fontSize: 13, color: "#3D3D5C", lineHeight: 1.65, margin: 0 }}>
                        {summaryParts.map((part, i) =>
                          i % 2 === 1 ? (
                            <strong key={i} style={{ fontWeight: 700, color: "#5B54D6" }}>{part}</strong>
                          ) : (
                            <span key={i}>{part}</span>
                          )
                        )}
                      </p>
                    </motion.div>
                  )}

                  {/* CTAs */}
                  {comparingPlaces.length >= 2 && bestPlace && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.33 }}
                      style={{ display: "flex", flexDirection: "column", gap: 8 }}
                    >
                      <button
                        onClick={() => { setSelectedCourse(bestPlace.id); navigate(`/mobile/course/${bestPlace.id}`); }}
                        style={{
                          width: "100%", padding: "14px", borderRadius: 12, border: "none",
                          background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
                          color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                          boxShadow: "0 4px 16px rgba(91,84,214,0.3)",
                        }}
                      >
                        최적 코스로 출발하기
                        <ChevronRight size={16} />
                      </button>
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          onClick={() => openKakaoMap(`${bestPlace.busanArea} 관광지`)}
                          style={{
                            flex: 1, padding: "12px", borderRadius: 10,
                            border: "1.5px solid #F9A825", background: "#FFFBF0",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          }}
                        >
                          <Navigation size={13} color="#F9A825" />
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#B8820A" }}>카카오맵으로 보기</span>
                        </button>
                        <button
                          onClick={() => navigate("/mobile/recommendations")}
                          style={{
                            flex: 1, padding: "12px", borderRadius: 10,
                            border: "1.5px solid #E8E9EE", background: "white",
                            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                          }}
                        >
                          <span style={{ fontSize: 12, fontWeight: 600, color: "#4A4A6A" }}>비교 종료</span>
                        </button>
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          ) : (
            // Radar / score analysis tab
            <motion.div
              key="radar"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
            >
              {comparingPlaces.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px 20px", color: "#A0A0B0" }}>
                  <BarChart2 size={32} style={{ marginBottom: 12, opacity: 0.5 }} />
                  <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>코스를 2개 이상 선택해 주세요</div>
                </div>
              ) : (
                comparingPlaces.map((place, pi) => {
                  const isBest = place.id === bestPlace?.id;
                  const radarData = [
                    { label: "접근성", value: place.scoreBreakdown.accessibility },
                    { label: "동행 적합성", value: place.scoreBreakdown.companionFit },
                    { label: "이동 부담", value: place.scoreBreakdown.walkingLoad },
                    { label: "혼잡 안정성", value: place.scoreBreakdown.crowdStability },
                    { label: "연계성", value: place.scoreBreakdown.connectivity },
                  ];
                  return (
                    <motion.div
                      key={place.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: pi * 0.08 }}
                      style={{
                        background: "white", borderRadius: 14,
                        border: `1.5px solid ${isBest ? "#5B54D6" : "#E8E9EE"}`,
                        marginBottom: 14, overflow: "hidden",
                      }}
                    >
                      {/* Card Header */}
                      <div style={{
                        padding: "12px 16px",
                        background: isBest ? "linear-gradient(135deg, #5B54D6, #7C75E8)" : "#F8F9FC",
                        display: "flex", alignItems: "center", gap: 10,
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 10, color: isBest ? "rgba(255,255,255,0.75)" : "#7A7A8E", fontWeight: 500 }}>
                            코스 {String.fromCharCode(65 + pi)} · {place.busanArea}
                          </div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: isBest ? "white" : "#1A1A2E" }}>
                            {place.name}
                          </div>
                        </div>
                        <div style={{ textAlign: "right" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, color: isBest ? "white" : "#5B54D6" }}>
                            {place.score.toFixed(1)}
                          </div>
                          <div style={{ fontSize: 10, color: isBest ? "rgba(255,255,255,0.7)" : "#7A7A8E" }}>
                            같이가능 점수
                          </div>
                        </div>
                      </div>

                      {/* Radar chart + scores */}
                      <div style={{ padding: "16px", display: "flex", alignItems: "center", gap: 16 }}>
                        <div style={{ flexShrink: 0 }}>
                          <RadarChart data={radarData} size={160} />
                        </div>
                        <div style={{ flex: 1 }}>
                          {SCORE_LABELS.map(({ key, label, color }) => {
                            const val = place.scoreBreakdown[key as keyof typeof place.scoreBreakdown];
                            if (typeof val !== "number") return null;
                            return (
                              <div key={key} style={{ marginBottom: 8 }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                                  <span style={{ fontSize: 10, fontWeight: 500, color: "#4A4A6A" }}>{label}</span>
                                  <span style={{ fontSize: 11, fontWeight: 700, color }}>{val}</span>
                                </div>
                                <div style={{ height: 5, borderRadius: 3, background: "#F0F1F5", overflow: "hidden" }}>
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${val}%` }}
                                    transition={{ duration: 0.7, delay: 0.1 + pi * 0.06 }}
                                    style={{ height: "100%", borderRadius: 3, background: isBest ? color : "#C8C8D8" }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Interpretation */}
                      <div style={{ padding: "0 16px 14px" }}>
                        <div style={{
                          background: isBest ? "#F6F5FF" : "#F8F9FC",
                          borderRadius: 10, padding: "10px 12px",
                          borderLeft: `3px solid ${isBest ? "#5B54D6" : "#D0D0DC"}`,
                        }}>
                          <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                            <Info size={12} color={isBest ? "#5B54D6" : "#7A7A8E"} style={{ flexShrink: 0, marginTop: 1 }} />
                            <p style={{ fontSize: 12, color: isBest ? "#3D3D5C" : "#7A7A8E", lineHeight: 1.55, margin: 0 }}>
                              {place.scoreBreakdown.interpretationText}
                            </p>
                          </div>
                        </div>

                        {/* Risk highlight */}
                        {place.feasibility.risks.some((r) => r.riskLevel === "high") && (
                          <div style={{
                            display: "flex", alignItems: "center", gap: 7,
                            background: "#FFF4F4", borderRadius: 8, padding: "8px 10px",
                            marginTop: 8, border: "1px solid #FECACA",
                          }}>
                            <AlertTriangle size={13} color="#D05050" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 11, color: "#D05050", fontWeight: 500 }}>
                              고위험 구간 {place.feasibility.risks.filter((r) => r.riskLevel === "high").length}개 감지 — 사전 확인 필요
                            </span>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}