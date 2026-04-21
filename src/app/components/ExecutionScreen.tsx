import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, CheckCircle, ChevronRight, Shield,
  Navigation, Map, MapPin, Phone, Clock, Footprints,
  RefreshCw, ArrowRight, Activity, Database,
  Coffee, Car, Flag, Cloud, Users, Zap,
  ChevronDown, Star, Battery, Signal, Wifi,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";
import { CelebrationMascot } from "./MascotVariants";

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + query)}`, "_blank");
}

function openKakaoRoute(name: string, lat?: number, lng?: number) {
  if (lat && lng) {
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`, "_blank");
  } else {
    window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + name)}`, "_blank");
  }
}

/* ── Live status mock data ────────────────────────────── */
const LIVE_STATUS: Record<string, {
  weather: { label: string; icon: string; level: "ok" | "warn"; temp: string };
  crowd: { label: string; pct: number; level: "ok" | "warn" };
  eta: string;
}> = {
  haeundae: {
    weather: { label: "맑음", icon: "☀️", level: "ok", temp: "22°C" },
    crowd: { label: "한산", pct: 28, level: "ok" },
    eta: "15:30",
  },
  gamcheon: {
    weather: { label: "구름 조금", icon: "⛅", level: "ok", temp: "21°C" },
    crowd: { label: "다소 혼잡", pct: 62, level: "warn" },
    eta: "16:10",
  },
  citizenpark: {
    weather: { label: "맑음", icon: "☀️", level: "ok", temp: "23°C" },
    crowd: { label: "한산", pct: 19, level: "ok" },
    eta: "15:10",
  },
  dongrae: {
    weather: { label: "맑음", icon: "☀️", level: "ok", temp: "20°C" },
    crowd: { label: "여유", pct: 22, level: "ok" },
    eta: "15:40",
  },
};

const STEP_COLORS: Record<string, string> = {
  start: "#5B54D6",
  place: "#3D8B7A",
  rest: "#B07AAF",
  meal: "#C4793C",
  end: "#4A7BBF",
};
const STEP_LABELS: Record<string, string> = {
  start: "출발", place: "관광", rest: "휴식", meal: "식사", end: "도착",
};

/* ── Mini map route component ─────────────────────────── */
function MiniRouteMap({
  steps,
  currentIdx,
}: {
  steps: typeof PLACES[0]["courseSteps"];
  currentIdx: number;
}) {
  // Create a simple 2D layout based on step indices
  const W = 280;
  const H = 120;
  const pts = steps.map((_, i) => {
    const x = 24 + (i / Math.max(steps.length - 1, 1)) * (W - 48);
    const y = H / 2 + (i % 2 === 0 ? -18 : 18);
    return { x, y };
  });

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ display: "block" }}>
      {/* Route line — done */}
      {pts.slice(0, currentIdx + 1).map((pt, i) => {
        if (i === 0) return null;
        const prev = pts[i - 1];
        return (
          <line
            key={`done-${i}`}
            x1={prev.x} y1={prev.y} x2={pt.x} y2={pt.y}
            stroke="#5B54D6" strokeWidth={3} strokeLinecap="round"
          />
        );
      })}
      {/* Route line — upcoming */}
      {pts.slice(currentIdx).map((pt, i) => {
        const absI = currentIdx + i;
        if (absI === 0) return null;
        const prev = pts[absI - 1];
        return (
          <line
            key={`upcoming-${absI}`}
            x1={prev.x} y1={prev.y} x2={pt.x} y2={pt.y}
            stroke="#E0E1EC" strokeWidth={2.5} strokeLinecap="round"
            strokeDasharray={absI > currentIdx ? "4 3" : undefined}
          />
        );
      })}
      {/* Step dots */}
      {pts.map((pt, i) => {
        const step = steps[i];
        const color = STEP_COLORS[step.type] ?? "#5B54D6";
        const isDone = i < currentIdx;
        const isActive = i === currentIdx;
        return (
          <g key={i}>
            {isActive && (
              <>
                <circle cx={pt.x} cy={pt.y} r={14} fill={`${color}20`} />
                <circle cx={pt.x} cy={pt.y} r={10} fill={`${color}40`} />
              </>
            )}
            <circle
              cx={pt.x} cy={pt.y} r={isActive ? 7 : 5}
              fill={isDone ? "#3D8B7A" : isActive ? color : "#D4D6E4"}
              stroke={isActive ? color : isDone ? "#3D8B7A" : "#C0C2D4"}
              strokeWidth={2}
            />
            {isDone && (
              <text x={pt.x} y={pt.y + 1} textAnchor="middle" dominantBaseline="middle"
                fill="white" fontSize={7} fontWeight={700}>✓</text>
            )}
          </g>
        );
      })}
      {/* Labels */}
      {pts.map((pt, i) => {
        const isActive = i === currentIdx;
        if (!isActive && i !== 0 && i !== pts.length - 1) return null;
        const step = steps[i];
        const color = STEP_COLORS[step.type] ?? "#5B54D6";
        const yLabel = pt.y > H / 2 ? pt.y + 16 : pt.y - 14;
        const name = step.name.length > 7 ? step.name.slice(0, 7) + ".." : step.name;
        return (
          <text key={`label-${i}`} x={pt.x} y={yLabel}
            textAnchor="middle" fill={isActive ? color : "#A0A2B8"}
            fontSize={isActive ? 9 : 8} fontWeight={isActive ? 700 : 400}>
            {name}
          </text>
        );
      })}
    </svg>
  );
}

/* ── Main component ───────────────────────────────────── */
export function ExecutionScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [showPlanB, setShowPlanB] = useState(false);
  const [showTimeline, setShowTimeline] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [tick, setTick] = useState(0);

  // Simulated clock tick (for live feel)
  useEffect(() => {
    const t = setInterval(() => setTick(p => p + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const placeSteps = place.courseSteps;
  const currentStep = placeSteps[currentStepIdx];
  const progress = ((currentStepIdx) / (placeSteps.length - 1)) * 100;
  const liveStatus = LIVE_STATUS[place.id] ?? LIVE_STATUS["haeundae"];

  const highRisks = place.feasibility.risks.filter((r) => r.riskLevel === "high");
  const mediumRisks = place.feasibility.risks.filter((r) => r.riskLevel === "medium");

  const stepColor = STEP_COLORS[currentStep.type] ?? "#5B54D6";

  const doneCount = completedSteps.size;
  const placesDone = [...completedSteps].filter(i => placeSteps[i]?.type === "place").length;
  const totalPlaces = placeSteps.filter(s => s.type === "place").length;

  function handleNext() {
    if (currentStepIdx < placeSteps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStepIdx]));
      setCurrentStepIdx(currentStepIdx + 1);
    } else {
      // Last step – go to completion
      setCompletedSteps(prev => new Set([...prev, currentStepIdx]));
      navigate("/mobile/recommendations");
    }
  }

  function handlePrev() {
    if (currentStepIdx > 0) {
      setCurrentStepIdx(currentStepIdx - 1);
    }
  }

  const isLast = currentStepIdx === placeSteps.length - 1;
  const isFirst = currentStepIdx === 0;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="코스 실행 중" />
      <StepIndicator current={5} />

      {/* ── Status bar (simulated device style) ── */}
      <div style={{
        background: stepColor,
        padding: "8px 20px 10px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 8px",
          }}>
            <div style={{
              width: 6, height: 6, borderRadius: "50%",
              background: "#4ADE80", boxShadow: "0 0 6px #4ADE80",
            }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>실행 중</span>
          </div>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.8)" }}>
            {currentStepIdx + 1}/{placeSteps.length} 지점
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
            {liveStatus.weather.icon} {liveStatus.weather.temp}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={11} color="rgba(255,255,255,0.8)" />
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>
              도착 예정 {liveStatus.eta}
            </span>
          </div>
        </div>
      </div>

      {/* ── Progress ── */}
      <div style={{ background: "white", padding: "10px 20px 12px", borderBottom: "1px solid #EBEBF2" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Flag size={12} color={stepColor} />
            <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>
              {place.name.split(" ")[0]} 코스
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: stepColor }}>
            {Math.round(progress)}% 완료
          </span>
        </div>
        <div style={{ height: 8, borderRadius: 4, background: "#F0F1F5", overflow: "hidden" }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            style={{
              height: "100%", borderRadius: 4,
              background: `linear-gradient(90deg, ${stepColor}, ${stepColor}BB)`,
            }}
          />
        </div>
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          {[
            { icon: <CheckCircle size={11} color="#3D8B7A" />, label: `완료 ${doneCount}곳` },
            { icon: <MapPin size={11} color="#3D8B7A" />, label: `관광지 ${placesDone}/${totalPlaces}` },
            { icon: <Footprints size={11} color="#A0A2B8" />, label: place.estimatedSteps },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              {item.icon}
              <span style={{ fontSize: 10, color: "#7A7A8E", fontWeight: 500 }}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 160 }}>

        {/* ── Mini Map ── */}
        <div style={{ background: "white", margin: "12px 16px 0", borderRadius: 16, overflow: "hidden", border: "1px solid #E4E5EE" }}>
          <div style={{
            padding: "10px 14px 6px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Map size={12} color="#5B54D6" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "#4A4A6A" }}>경로 미리보기</span>
            </div>
            <button
              onClick={() => openKakaoMap(place.name)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                background: "#F9A825", borderRadius: 6, padding: "4px 10px",
                border: "none", cursor: "pointer",
              }}
            >
              <Navigation size={10} color="white" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "white" }}>카카오맵</span>
            </button>
          </div>
          {/* Route SVG */}
          <div style={{ padding: "6px 14px 12px", overflowX: "auto" }}>
            <MiniRouteMap steps={placeSteps} currentIdx={currentStepIdx} />
          </div>
        </div>

        {/* ── Current Step Card ── */}
        <motion.div
          key={currentStepIdx}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          style={{ margin: "12px 16px 0" }}
        >
          <div style={{
            background: "white", borderRadius: 18,
            border: `2px solid ${stepColor}`,
            overflow: "hidden",
            boxShadow: `0 6px 24px ${stepColor}20`,
          }}>
            {/* Step header */}
            <div style={{
              background: `linear-gradient(135deg, ${stepColor} 0%, ${stepColor}CC 100%)`,
              padding: "18px 20px",
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
            }}>
              <div style={{ flex: 1 }}>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 8px",
                  marginBottom: 8,
                }}>
                  <span style={{ fontSize: 10, color: "white", fontWeight: 700 }}>
                    {STEP_LABELS[currentStep.type] ?? "진행 중"}
                  </span>
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "white", letterSpacing: -0.5, marginBottom: 4 }}>
                  {currentStep.name}
                </div>
                {currentStep.subname && (
                  <div style={{ fontSize: 13, color: "rgba(255,255,255,0.85)" }}>
                    {currentStep.subname}
                  </div>
                )}
              </div>
              {/* GPS pulse dot */}
              <div style={{ position: "relative", width: 36, height: 36, flexShrink: 0, marginLeft: 12 }}>
                <motion.div
                  animate={{ scale: [1, 1.6, 1], opacity: [0.5, 0, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{
                    position: "absolute", inset: 0, borderRadius: "50%",
                    background: "rgba(255,255,255,0.35)",
                  }}
                />
                <div style={{
                  position: "absolute", inset: 6,
                  borderRadius: "50%", background: "white",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <MapPin size={12} color={stepColor} />
                </div>
              </div>
            </div>

            {/* Step body */}
            <div style={{ padding: "14px 20px" }}>
              {/* Time row */}
              <div style={{
                display: "flex", alignItems: "center", gap: 16, marginBottom: 14,
                padding: "10px 14px", background: "#F8F9FC", borderRadius: 10,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <Clock size={13} color={stepColor} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
                    {currentStep.time}
                  </span>
                </div>
                {currentStep.duration && (
                  <>
                    <div style={{ width: 1, height: 14, background: "#E0E1EC" }} />
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Footprints size={13} color="#A0A2B8" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#4A4A6A" }}>
                        {currentStep.duration}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Transport to next */}
              {currentStep.transport && currentStepIdx < placeSteps.length - 1 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  background: "#EEEDFA", borderRadius: 10, padding: "10px 14px",
                  marginBottom: 14, border: "1px solid #D4D0F0",
                }}>
                  <ArrowRight size={13} color="#5B54D6" />
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6" }}>
                      다음 장소까지
                    </span>
                    <span style={{ fontSize: 12, color: "#7A78CC", marginLeft: 4 }}>
                      {currentStep.transport} {currentStep.transportTime}
                    </span>
                  </div>
                  {currentStepIdx + 1 < placeSteps.length && (
                    <span style={{
                      marginLeft: "auto", fontSize: 11, fontWeight: 600,
                      color: "#5B54D6", background: "white",
                      borderRadius: 6, padding: "3px 8px",
                    }}>
                      {placeSteps[currentStepIdx + 1].name}
                    </span>
                  )}
                </div>
              )}

              {/* CTA buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => openKakaoRoute(currentStep.name, currentStep.lat, currentStep.lng)}
                  style={{
                    flex: 1, padding: "13px", borderRadius: 11, border: "none",
                    background: "#F9A825", color: "white",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    boxShadow: "0 3px 10px rgba(249,168,37,0.3)",
                  }}
                >
                  <Navigation size={15} />
                  카카오 길찾기
                </button>
                <button
                  onClick={() => openKakaoMap(currentStep.name)}
                  style={{
                    flex: 1, padding: "13px", borderRadius: 11,
                    border: "1.5px solid #E4E5EE", background: "white",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    color: "#4A4A6A",
                  }}
                >
                  <Map size={15} color="#5B54D6" />
                  지도 보기
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Live Status Cards ── */}
        <div style={{ margin: "12px 16px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {/* Weather */}
          <div style={{
            background: liveStatus.weather.level === "ok" ? "#EDF7F2" : "#FFF8ED",
            border: `1.5px solid ${liveStatus.weather.level === "ok" ? "#C3E8D4" : "#FDDCAD"}`,
            borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#A0A2B8", marginBottom: 6 }}>현재 날씨</div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 20 }}>{liveStatus.weather.icon}</span>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>{liveStatus.weather.temp}</div>
                <div style={{ fontSize: 11, color: liveStatus.weather.level === "ok" ? "#2D8A6B" : "#D97706", fontWeight: 600 }}>
                  {liveStatus.weather.label}
                </div>
              </div>
            </div>
          </div>
          {/* Crowd */}
          <div style={{
            background: liveStatus.crowd.level === "ok" ? "#EDF7F2" : "#FFF8ED",
            border: `1.5px solid ${liveStatus.crowd.level === "ok" ? "#C3E8D4" : "#FDDCAD"}`,
            borderRadius: 12, padding: "12px 14px",
          }}>
            <div style={{ fontSize: 10, fontWeight: 600, color: "#A0A2B8", marginBottom: 6 }}>혼잡도</div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{
                fontSize: 14, fontWeight: 800,
                color: liveStatus.crowd.level === "ok" ? "#1A1A2E" : "#D97706",
              }}>
                {liveStatus.crowd.label}
              </span>
              <span style={{
                fontSize: 12, fontWeight: 700,
                color: liveStatus.crowd.level === "ok" ? "#3D8B7A" : "#D97706",
              }}>
                {liveStatus.crowd.pct}%
              </span>
            </div>
            <div style={{ height: 4, background: "#E0E1EC", borderRadius: 2, overflow: "hidden" }}>
              <motion.div
                animate={{ width: `${liveStatus.crowd.pct}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                style={{
                  height: "100%", borderRadius: 2,
                  background: liveStatus.crowd.level === "ok" ? "#3D8B7A" : "#D97706",
                }}
              />
            </div>
          </div>
        </div>

        {/* ── Risk Alerts ── */}
        {(highRisks.length > 0 || mediumRisks.length > 0) && (
          <div style={{ margin: "12px 16px 0" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 8, display: "flex", alignItems: "center", gap: 5 }}>
              <AlertTriangle size={13} color="#D97706" />
              사전 위험 경고
            </div>
            {[...highRisks, ...mediumRisks].slice(0, 2).map((risk, i) => {
              const isHigh = risk.riskLevel === "high";
              return (
                <motion.div
                  key={risk.name}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  style={{
                    background: isHigh ? "#FFF4F4" : "#FFF8F0",
                    border: `1.5px solid ${isHigh ? "#FECACA" : "#FDDCAD"}`,
                    borderRadius: 12, padding: "12px 14px", marginBottom: 8,
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}
                >
                  <AlertTriangle size={15} color={isHigh ? "#D05050" : "#C4793C"} style={{ flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: isHigh ? "#D05050" : "#92400E", marginBottom: 2 }}>
                      {risk.name}
                    </div>
                    <div style={{ fontSize: 11, color: "#6A6A7E", lineHeight: 1.5 }}>
                      {risk.description}
                    </div>
                    <div style={{
                      marginTop: 6, display: "inline-flex", alignItems: "center", gap: 5,
                      background: "#E8F7F2", borderRadius: 6, padding: "3px 8px",
                    }}>
                      <CheckCircle size={10} color="#2D8A6B" />
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#2D6B52" }}>대안: {risk.alternative}</span>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* ── Course Timeline (collapsible) ── */}
        <div style={{ margin: "12px 16px 0" }}>
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 12,
              border: "1.5px solid #E4E5EE", background: "white",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "space-between",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <Activity size={14} color="#5B54D6" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>전체 여행사슬</span>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#5B54D6",
                background: "#EEEDFA", borderRadius: 5, padding: "2px 6px",
              }}>
                {doneCount}/{placeSteps.length}
              </span>
            </div>
            <ChevronDown
              size={15} color="#A0A2B8"
              style={{ transform: showTimeline ? "rotate(180deg)" : "none", transition: "transform 0.2s" }}
            />
          </button>

          <AnimatePresence>
            {showTimeline && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{
                  background: "white", borderRadius: "0 0 12px 12px",
                  border: "1.5px solid #E4E5EE", borderTop: "none",
                  overflow: "hidden",
                }}>
                  {placeSteps.map((step, i) => {
                    const isActive = i === currentStepIdx;
                    const isDone = completedSteps.has(i);
                    const color = STEP_COLORS[step.type] ?? "#5B54D6";
                    return (
                      <button
                        key={i}
                        onClick={() => setCurrentStepIdx(i)}
                        style={{
                          width: "100%",
                          display: "flex", alignItems: "center", gap: 10,
                          padding: "11px 14px",
                          background: isActive ? "#F6F5FF" : isDone ? "#F9FAF9" : "white",
                          border: "none",
                          borderBottom: i < placeSteps.length - 1 ? "1px solid #F0F1F6" : "none",
                          cursor: "pointer", textAlign: "left",
                          borderLeft: `3px solid ${isActive ? color : isDone ? "#3D8B7A" : "transparent"}`,
                        }}
                      >
                        <div style={{
                          width: 22, height: 22, borderRadius: "50%",
                          background: isActive ? color : isDone ? "#3D8B7A" : "#E8E9EF",
                          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                        }}>
                          {isDone
                            ? <CheckCircle size={12} color="white" />
                            : <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? "white" : "#A0A0B0" }}>{i + 1}</span>
                          }
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            fontSize: 12, fontWeight: isActive ? 700 : 500,
                            color: isActive ? color : isDone ? "#7A7A8E" : "#1A1A2E",
                            textDecoration: isDone ? "line-through" : "none",
                          }}>
                            {step.name}
                          </div>
                          <div style={{ fontSize: 10, color: "#A0A0B0" }}>{step.time}</div>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 600,
                          color: isActive ? color : isDone ? "#3D8B7A" : "#B0B2C4",
                          background: isActive ? "#EEEDFA" : isDone ? "#EDF7F2" : "transparent",
                          borderRadius: 4, padding: "2px 6px",
                        }}>
                          {STEP_LABELS[step.type] ?? ""}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Plan B ── */}
        <div style={{ margin: "12px 16px 0" }}>
          <button
            onClick={() => setShowPlanB(!showPlanB)}
            style={{
              width: "100%", padding: "12px 14px", borderRadius: 14,
              border: "1.5px solid #E4E2F5", background: showPlanB ? "#F6F5FF" : "white",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 10,
              textAlign: "left",
            }}
          >
            <div style={{
              width: 34, height: 34, borderRadius: 10, background: "#5B54D6",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>B</span>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#5B54D6" }}>돌발 상황 시 대체 경로 (Plan B)</div>
              <div style={{ fontSize: 11, color: "#7A79CC" }}>기상 악화·혼잡·시설 제한 시 대안 안내</div>
            </div>
            <ChevronRight size={15} color="#5B54D6"
              style={{ transform: showPlanB ? "rotate(90deg)" : "none", transition: "transform 0.2s" }} />
          </button>

          <AnimatePresence>
            {showPlanB && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <div style={{ paddingTop: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                  {/* A vs B comparison */}
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: "#FAFAFA", borderRadius: 12, border: "1px solid #E8E9EE", padding: "12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#A0A0B0", marginBottom: 4 }}>현재 코스 A</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>{place.name.split(" ").slice(0, 2).join(" ")}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Star size={11} color="#5B54D6" fill="#5B54D6" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6" }}>{place.feasibility.successRate}%</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      <ArrowRight size={16} color="#5B54D6" />
                    </div>
                    <div style={{ flex: 1, background: "#E8F7F2", borderRadius: 12, border: "1.5px solid #C5E8DC", padding: "12px" }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#3D8B7A", marginBottom: 4 }}>Plan B 대안</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", marginBottom: 4 }}>
                        {place.id === "haeundae" ? "광안리 수변공원" :
                         place.id === "gamcheon" ? "국제시장·용두산" :
                         place.id === "citizenpark" ? "부산시립미술관" : "온천장 족욕"}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <Activity size={11} color="#2D8A6B" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#2D8A6B" }}>
                          {Math.min(place.feasibility.successRate + 4, 98)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reason */}
                  <div style={{ background: "#FFF8F0", borderRadius: 10, padding: "10px 12px", border: "1px solid #FDDCAD" }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>대체 사유</div>
                    <div style={{ fontSize: 11, color: "#6A6A7E", lineHeight: 1.5 }}>
                      {highRisks.length > 0
                        ? `${highRisks[0].name} 위험 감지 — 보다 안전한 대안 코스로 전환 권장`
                        : mediumRisks.length > 0
                        ? `${mediumRisks[0].name} 주의 요소 — 상황에 따라 대안 코스 활용 가능`
                        : "기상 악화 또는 시설 제한 시 자동 전환 권장"}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      onClick={() => navigate(`/mobile/alternatives/${place.id}`)}
                      style={{
                        flex: 1, padding: "11px", borderRadius: 11,
                        border: "none", background: "#5B54D6",
                        color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                      }}
                    >
                      <RefreshCw size={13} />대안 코스로 변경
                    </button>
                    <button
                      onClick={() => setShowPlanB(false)}
                      style={{
                        flex: 1, padding: "11px", borderRadius: 11,
                        border: "1.5px solid #E8E9EE", background: "white",
                        color: "#4A4A6A", fontSize: 12, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      현재 코스 유지
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Emergency + KTO note ── */}
        <div style={{ margin: "12px 16px 0" }}>
          <div style={{
            background: "white", borderRadius: 12, border: "1px solid #FECACA",
            padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
          }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, background: "#FEF2F2",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Phone size={16} color="#D05050" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>긴급 연락처</div>
              <div style={{ fontSize: 11, color: "#7A7A8E" }}>부산 관광안내 <strong>1330</strong> · 응급 <strong>119</strong> · 경찰 <strong>112</strong></div>
            </div>
          </div>
        </div>

        {/* KTO note */}
        <div style={{ padding: "10px 16px 4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
            <Database size={10} color="#9EA0B8" />
            <span style={{ fontSize: 10, color: "#B0B2C4" }}>
              한국관광공사 OpenAPI 기반 · 현장 상황에 따라 변경될 수 있습니다
            </span>
          </div>
        </div>
      </div>

      {/* ── Bottom navigation ── */}
      <div style={{
        position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)",
        width: "100%", maxWidth: 520,
        background: "white", borderTop: "1px solid #E8E9EE",
        padding: "12px 16px 28px",
      }}>
        {/* Celebration mascot shown on last step */}
        {isLast && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, padding: "8px 12px", background: "#EDF7F2", borderRadius: 12, border: "1px solid #C3E8D4" }}>
            <CelebrationMascot style={{ width: 48, height: 48, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#2D8A6B" }}>여행 완주까지 한 걸음!</div>
              <div style={{ fontSize: 11, color: "#3D8B7A" }}>모든 코스를 완료했어요 🎉</div>
            </div>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={handlePrev}
            disabled={isFirst}
            style={{
              flex: 1, padding: "13px", borderRadius: 12,
              border: "1.5px solid #E8E9EE",
              background: isFirst ? "#F6F7FB" : "white",
              color: isFirst ? "#C0C0CC" : "#4A4A6A",
              fontSize: 13, fontWeight: 600, cursor: isFirst ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            이전 지점
          </button>
          <button
            onClick={handleNext}
            style={{
              flex: 2, padding: "13px", borderRadius: 12,
              border: "none",
              background: isLast
                ? "linear-gradient(135deg, #3D8B7A, #5DA870)"
                : `linear-gradient(135deg, ${stepColor}EE 0%, ${stepColor} 100%)`,
              color: "white", fontSize: 14, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              boxShadow: `0 4px 16px ${stepColor}40`,
            }}
          >
            {isLast ? (
              <><CheckCircle size={16} />여행 완료</>
            ) : (
              <>다음 지점 <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}