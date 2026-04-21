import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, CheckCircle, ChevronRight, Shield, TrendingUp,
  Users, Footprints, Zap, ArrowRight, Info, Activity, Flag,
  Database, Map,
} from "lucide-react";
import { PLACES, RiskSegment } from "../data/places";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";

const RISK_TYPE_CONFIG: Record<
  RiskSegment["riskType"],
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  crowd: {
    label: "혼잡 위험",
    color: "#D05050",
    bg: "#FFF4F4",
    icon: <Users size={14} />,
  },
  slope: {
    label: "경사 주의",
    color: "#C4793C",
    bg: "#FFF8F0",
    icon: <TrendingUp size={14} />,
  },
  accessibility: {
    label: "접근성 이슈",
    color: "#8B54D6",
    bg: "#F8F4FF",
    icon: <Shield size={14} />,
  },
  distance: {
    label: "거리 부담",
    color: "#4A7BBF",
    bg: "#F0F6FF",
    icon: <Footprints size={14} />,
  },
  weather: {
    label: "날씨 변수",
    color: "#3D8B7A",
    bg: "#F0FAF6",
    icon: <Zap size={14} />,
  },
};

const RISK_LEVEL_CONFIG: Record<RiskSegment["riskLevel"], { label: string; color: string; bg: string; barColor: string }> = {
  low: { label: "낮음", color: "#2D8A6B", bg: "#E8F7F2", barColor: "#2D8A6B" },
  medium: { label: "보통", color: "#C4793C", bg: "#FFF1E3", barColor: "#C4793C" },
  high: { label: "높음", color: "#D05050", bg: "#FFE8E8", barColor: "#D05050" },
};

function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / 100) * circumference;

  const color = value >= 85 ? "#2D8A6B" : value >= 70 ? "#5B54D6" : value >= 55 ? "#C4793C" : "#D05050";
  const label = value >= 85 ? "매우 높음" : value >= 70 ? "높음" : value >= 55 ? "보통" : "낮음";

  return (
    <div style={{ position: "relative", width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0F1F5"
          strokeWidth={10}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={10}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        />
      </svg>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div style={{ fontSize: 26, fontWeight: 800, color, lineHeight: 1 }}>{value}%</div>
          <div style={{ fontSize: 11, color: "#7A7A8E", fontWeight: 500, textAlign: "center", marginTop: 2 }}>{label}</div>
        </motion.div>
      </div>
    </div>
  );
}

function RiskCard({ risk, index }: { risk: RiskSegment; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const typeConfig = RISK_TYPE_CONFIG[risk.riskType];
  const levelConfig = RISK_LEVEL_CONFIG[risk.riskLevel];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.5 + index * 0.08 }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          background: risk.riskLevel === "high" ? "#FFFBFB" : "white",
          border: `1.5px solid ${risk.riskLevel === "high" ? "#FCA5A5" : "#E8E9EE"}`,
          borderRadius: 14,
          cursor: "pointer",
          textAlign: "left",
          overflow: "hidden",
          transition: "box-shadow 0.15s",
          boxShadow: risk.riskLevel === "high" ? "0 4px 12px rgba(208,80,80,0.08)" : "none",
        }}
      >
        {/* Card header */}
        <div style={{ padding: "14px 16px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: typeConfig.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                color: typeConfig.color,
              }}
            >
              {typeConfig.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{risk.name}</span>
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: typeConfig.color,
                    background: typeConfig.bg,
                    borderRadius: 4,
                    padding: "2px 7px",
                  }}
                >
                  {typeConfig.label}
                </span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: levelConfig.color,
                    background: levelConfig.bg,
                    borderRadius: 4,
                    padding: "2px 7px",
                    display: "flex",
                    alignItems: "center",
                    gap: 3,
                  }}
                >
                  {risk.riskLevel === "high" && <AlertTriangle size={9} />}
                  위험도 {levelConfig.label}
                </span>
              </div>
            </div>
            <motion.div
              animate={{ rotate: expanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              style={{ flexShrink: 0 }}
            >
              <ChevronRight size={16} color="#A0A0B0" />
            </motion.div>
          </div>

          {/* Risk level bar */}
          <div style={{ marginTop: 10, height: 5, borderRadius: 3, background: "#F0F1F5", overflow: "hidden" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: risk.riskLevel === "low" ? "33%" : risk.riskLevel === "medium" ? "66%" : "100%" }}
              transition={{ duration: 0.7, delay: 0.6 + index * 0.08 }}
              style={{ height: "100%", borderRadius: 3, background: levelConfig.barColor }}
            />
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              style={{ overflow: "hidden" }}
            >
              <div
                style={{
                  borderTop: "1px solid #F0F1F5",
                  padding: "12px 16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7A8E", marginBottom: 4 }}>위험 상세</div>
                  <div
                    style={{
                      background: "#FAFAFA",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      gap: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <AlertTriangle size={12} color={typeConfig.color} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: "#4A4A6A", lineHeight: 1.5 }}>{risk.description}</span>
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7A8E", marginBottom: 4 }}>대안 제안</div>
                  <div
                    style={{
                      background: "#F0FAF6",
                      borderRadius: 8,
                      padding: "8px 10px",
                      display: "flex",
                      gap: 6,
                      alignItems: "flex-start",
                    }}
                  >
                    <CheckCircle size={12} color="#2D8A6B" style={{ flexShrink: 0, marginTop: 1 }} />
                    <span style={{ fontSize: 12, color: "#2D6B52", lineHeight: 1.5 }}>{risk.alternative}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </button>
    </motion.div>
  );
}

// Pentagon / radar chart for score breakdown
function PentagonChart({ data, size = 200, score }: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  score: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size * 0.34;
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
    <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "#5B54D6", marginBottom: 4 }}>
        총점 {(score * 10).toFixed(0)}점
      </div>
      <svg width={size} height={size} style={{ overflow: "visible" }}>
        {rings.map((r, ri) => {
          const pts = Array.from({ length: n }, (_, i) => {
            const p = getPos(i, r * maxR);
            return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
          }).join(" ");
          return <polygon key={ri} points={pts} fill="none" stroke="#E0E1EA" strokeWidth={ri === rings.length - 1 ? 1.5 : 0.8} />;
        })}
        {data.map((_, i) => {
          const p = getPos(i, maxR);
          return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#E0E1EA" strokeWidth={0.8} />;
        })}
        {/* Ring value labels */}
        {[20, 40, 60, 80, 100].map((v, ri) => {
          const pos = getPos(0, (v / 100) * maxR);
          return (
            <text key={ri} x={pos.x + 3} y={pos.y} fontSize={7} fill="#C0C0CC" fontFamily="Noto Sans KR, sans-serif">{v}</text>
          );
        })}
        <path d={dataPath} fill="rgba(91,84,214,0.18)" stroke="#5B54D6" strokeWidth={2} strokeLinejoin="round" />
        {dataPoints.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={4} fill="#5B54D6" stroke="white" strokeWidth={1.5} />
        ))}
        {data.map((d, i) => {
          const p = getPos(i, maxR + 22);
          return (
            <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
              fontSize={10} fill="#3D3D5C" fontWeight="700" fontFamily="Noto Sans KR, sans-serif">
              {d.label}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + query)}`, "_blank");
}

export function FeasibilityScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const { successRate, interpretation, risks } = place.feasibility;

  const highRisks = risks.filter((r) => r.riskLevel === "high");
  const mediumRisks = risks.filter((r) => r.riskLevel === "medium");
  const lowRisks = risks.filter((r) => r.riskLevel === "low");

  const successColor =
    successRate >= 85 ? "#2D8A6B" : successRate >= 70 ? "#5B54D6" : successRate >= 55 ? "#C4793C" : "#D05050";

  const pentagonData = [
    { label: "접근성", value: place.scoreBreakdown.accessibility, color: "#5B54D6" },
    { label: "동행 적합성", value: place.scoreBreakdown.companionFit, color: "#3D8B7A" },
    { label: "이동 부담", value: place.scoreBreakdown.walkingLoad, color: "#4A7BBF" },
    { label: "혼잡 안정성", value: place.scoreBreakdown.crowdStability, color: "#B07AAF" },
    { label: "연계성", value: place.scoreBreakdown.connectivity, color: "#C4793C" },
  ];

  const BREAKDOWN_STATS = [
    { label: "이동 부담", key: "walkingLoad" as const, value: place.scoreBreakdown.walkingLoad, color: "#4A7BBF", icon: <Footprints size={13} /> },
    { label: "동행 적합성", key: "companionFit" as const, value: place.scoreBreakdown.companionFit, color: "#3D8B7A", icon: <Users size={13} /> },
    { label: "혼잡 안정성", key: "crowdStability" as const, value: place.scoreBreakdown.crowdStability, color: "#B07AAF", icon: <Zap size={13} /> },
    { label: "접근성", key: "accessibility" as const, value: place.scoreBreakdown.accessibility, color: "#5B54D6", icon: <Shield size={13} /> },
    { label: "연계성", key: "connectivity" as const, value: place.scoreBreakdown.connectivity, color: "#C4793C", icon: <TrendingUp size={13} /> },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FC", display: "flex", flexDirection: "column" }}>
      <TopNav title="실행 가능성 판단" />
      <StepIndicator current={4} />

      <div style={{ flex: 1, overflowY: "auto", paddingBottom: 120 }}>
        {/* Hero section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{ background: "white", borderBottom: "1px solid #E8E9EE", padding: "20px 24px" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <Database size={11} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6" }}>KTO OpenAPI 기반 분석 · 판단</span>
          </div>
          <div style={{ fontSize: 12, color: "#7A7A8E", fontWeight: 500, marginBottom: 3 }}>{place.subtitle}</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", marginBottom: 20, letterSpacing: -0.3 }}>
            {place.name}
          </div>

          {/* Main result */}
          <div style={{
            display: "flex", alignItems: "center", gap: 20,
            background: "#F8F9FC", borderRadius: 16, padding: "20px",
            border: "1px solid #E8E9EE",
          }}>
            <CircularProgress value={successRate} size={110} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: "#9EA0B8", marginBottom: 2, textTransform: "uppercase" as const, letterSpacing: 0.5 }}>
                실행 가능성 · 현재 예측
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: successColor, marginBottom: 4 }}>
                {successRate >= 85 ? "매우 가능" : successRate >= 70 ? "가능" : successRate >= 55 ? "일부 주의" : "다소 어려움"}
              </div>
              <div style={{ fontSize: 12, color: "#7A7A8E", lineHeight: 1.5, marginBottom: 8 }}>
                {highRisks.length > 0
                  ? `고위험 ${highRisks.length}개 구간 감지됨`
                  : mediumRisks.length > 0
                  ? `주의 구간 ${mediumRisks.length}개 확인 필요`
                  : "모든 구간 안전 예측"}
              </div>
              {/* Execution feasibility badge */}
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: `${successColor}15`, borderRadius: 6, padding: "4px 10px",
                border: `1px solid ${successColor}30`,
              }}>
                <Activity size={11} color={successColor} />
                <span style={{ fontSize: 12, fontWeight: 700, color: successColor }}>
                  실행 가능성 {successRate}%
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Interpretation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          style={{ padding: "16px 20px 0" }}
        >
          <div style={{
            background: `${successColor}10`, borderRadius: 12, padding: "12px 14px",
            border: `1px solid ${successColor}30`,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}>
            <Activity size={14} color={successColor} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 13, color: "#3D3D5C", lineHeight: 1.6, margin: 0 }}>{interpretation}</p>
          </div>
        </motion.div>

        {/* Pentagon radar chart */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.22 }}
          style={{ padding: "16px 20px 0" }}
        >
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E9EE", overflow: "hidden" }}>
            <div style={{
              background: "linear-gradient(135deg, #5B54D6, #7C75E8)",
              padding: "12px 18px",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginBottom: 1 }}>
                  판단 지표 — 5개 항목 종합
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "white" }}>같이가능 점수 분석</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 26, fontWeight: 800, color: "white" }}>{place.score.toFixed(1)}</span>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginLeft: 4 }}>/10</span>
              </div>
            </div>
            <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <PentagonChart data={pentagonData} size={200} score={place.score} />
              <div style={{ marginTop: 14, background: "#F6F5FF", borderRadius: 8, padding: "10px 12px", width: "100%", textAlign: "center", border: "1px solid #E4E2F5" }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6", display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
                  <Activity size={12} color="#5B54D6" />
                  {successRate >= 70 
                    ? "종합 판단: 이 코스는 동행 조건 기준으로 안정적인 이동이 가능합니다."
                    : "종합 판단: 주의 구간이 있어 대안 코스 활용을 함께 고려하세요."}
                </span>
              </div>
            </div>
            {/* Score rows */}
            <div style={{ padding: "0 16px 16px" }}>
              {BREAKDOWN_STATS.map((stat, i) => (
                <div key={stat.label} style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <span style={{ color: stat.color }}>{stat.icon}</span>
                      <span style={{ fontSize: 12, fontWeight: 500, color: "#4A4A6A" }}>{stat.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                  </div>
                  <div style={{ height: 6, borderRadius: 3, background: "#F0F1F5", overflow: "hidden" }}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      transition={{ duration: 0.8, delay: 0.3 + i * 0.06, ease: "easeOut" }}
                      style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${stat.color}, ${stat.color}BB)` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Risk segments */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          style={{ padding: "16px 20px 0" }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>위험 구간 분석</div>
            <div style={{ display: "flex", gap: 6 }}>
              {highRisks.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#D05050", background: "#FFE8E8", borderRadius: 4, padding: "2px 7px" }}>
                  위험 {highRisks.length}
                </span>
              )}
              {mediumRisks.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#C4793C", background: "#FFF1E3", borderRadius: 4, padding: "2px 7px" }}>
                  주의 {mediumRisks.length}
                </span>
              )}
              {lowRisks.length > 0 && (
                <span style={{ fontSize: 10, fontWeight: 600, color: "#2D8A6B", background: "#E8F7F2", borderRadius: 4, padding: "2px 7px" }}>
                  양호 {lowRisks.length}
                </span>
              )}
            </div>
          </div>

          {risks.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                background: "#F0FAF6", borderRadius: 14, border: "1px solid #C5E8DC",
                padding: "20px", textAlign: "center",
              }}
            >
              <CheckCircle size={32} color="#2D8A6B" style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 14, fontWeight: 700, color: "#2D8A6B", marginBottom: 4 }}>위험 구간 없음</div>
              <div style={{ fontSize: 13, color: "#5A9A7F" }}>모든 구간이 안전하게 분석되었습니다</div>
            </motion.div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[...highRisks, ...mediumRisks, ...lowRisks].map((risk, i) => (
                <RiskCard key={risk.name} risk={risk} index={i} />
              ))}
            </div>
          )}
        </motion.div>

        {/* Plan B section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.5 }}
          style={{ padding: "16px 20px 0" }}
        >
          <div style={{
            background: "white", borderRadius: 14, border: "1.5px solid #E4E2F5",
            overflow: "hidden",
          }}>
            {/* Plan B header */}
            <div style={{ background: "#F6F5FF", padding: "12px 16px", borderBottom: "1px solid #E4E2F5" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: "#5B54D6", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: "white" }}>B</span>
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6" }}>대체 코스 Plan B</div>
                  <div style={{ fontSize: 10, color: "#7A79CC" }}>이 코스가 어려우면 대안 코스로 전환하기</div>
                </div>
              </div>
            </div>

            {/* Route visualization (Plan B concept) */}
            <div style={{ padding: "14px 16px" }}>
              {/* Route A (current) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B54D6", flexShrink: 0 }} />
                <div style={{ flex: 1, height: 2, background: "#5B54D6", borderRadius: 1 }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: "#5B54D6", background: "#EEEDFA", borderRadius: 4, padding: "2px 7px" }}>
                  현재 코스 A
                </div>
                <div style={{ flex: 1, height: 2, background: "#5B54D6", borderRadius: 1 }} />
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#5B54D6", flexShrink: 0 }} />
              </div>

              {/* Risk zone indicator */}
              {highRisks.length > 0 && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 6,
                  background: "#FFF4F4", borderRadius: 8, padding: "8px 12px", marginBottom: 10,
                  border: "1px solid #FECACA",
                }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#FECACA", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <AlertTriangle size={11} color="#D05050" />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#D05050" }}>위험 구간 감지</div>
                    <div style={{ fontSize: 10, color: "#D05050", opacity: 0.8 }}>
                      {highRisks[0]?.name} — Plan B 코스로 전환 권장
                    </div>
                  </div>
                </div>
              )}

              {/* Route B (alternative) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#3D8B7A", flexShrink: 0 }} />
                <div style={{ flex: 1, height: 2, background: "#3D8B7A", borderRadius: 1, opacity: 0.6, backgroundImage: "repeating-linear-gradient(90deg, #3D8B7A 0, #3D8B7A 4px, transparent 4px, transparent 8px)" }} />
                <div style={{ fontSize: 10, fontWeight: 600, color: "#3D8B7A", background: "#E8F7F2", borderRadius: 4, padding: "2px 7px" }}>
                  Plan B
                </div>
                <div style={{ flex: 1, height: 2, background: "#3D8B7A", borderRadius: 1, opacity: 0.6, backgroundImage: "repeating-linear-gradient(90deg, #3D8B7A 0, #3D8B7A 4px, transparent 4px, transparent 8px)" }} />
                <div style={{ fontSize: 10, fontWeight: 700, color: "#3D8B7A", background: "#E8F7F2", borderRadius: 6, padding: "3px 7px" }}>
                  대체 코스
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => navigate(`/mobile/alternatives/${place.id}`)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    border: "1.5px solid #5B54D6", background: "#5B54D6",
                    color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                    boxShadow: "0 2px 8px rgba(91,84,214,0.3)",
                  }}
                >
                  대안 코스 확인하기
                  <ChevronRight size={14} color="white" />
                </button>
                <button
                  onClick={() => openKakaoMap(`${place.busanArea} 대안 코스`)}
                  style={{
                    flex: 1, padding: "11px 0", borderRadius: 10,
                    border: "1.5px solid #F9A825", background: "#FFFBF0",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <Map size={13} color="#F9A825" />
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#B8820A" }}>대안 코스 지도 보기</span>
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Risk tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          style={{ padding: "16px 20px 0" }}
        >
          <div style={{
            background: "#F6F5FF", borderRadius: 12, border: "1px solid #E4E2F5",
            padding: "12px 14px", display: "flex", gap: 8,
          }}>
            <Info size={14} color="#5B54D6" style={{ flexShrink: 0, marginTop: 1 }} />
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#5B54D6", marginBottom: 3 }}>분석 기준</div>
              <div style={{ fontSize: 12, color: "#5A5280", lineHeight: 1.5 }}>
                무장애 여행정보 등 공공 접근성 텍스트와 코스별 시뮬레이션 지표를 바탕으로 실행 가능성을 참고 분석합니다. 실제 혼잡·현장 여건은 별도 연동 전까지 반영되지 않을 수 있습니다.
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Sticky CTA */}
      <div style={{
        position: "sticky", bottom: 0, background: "white",
        borderTop: "1px solid #E8E9EE", padding: "14px 20px 32px",
        display: "flex", flexDirection: "column", gap: 10, zIndex: 50,
      }}>
        <button
          onClick={() => navigate(`/mobile/course/${place.id}`)}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: successRate >= 70 ? "linear-gradient(135deg, #5B54D6, #7C75E8)" : "#E8E9EE",
            color: successRate >= 70 ? "white" : "#7A7A8E",
            fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <Flag size={17} />
          {successRate >= 70 ? "이 코스로 출발하기" : "그래도 이 코스로 가기"}
        </button>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={() => navigate(`/mobile/compare`)}
            style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: "1.5px solid #E8E9EE", background: "white",
              color: "#4A4A6A", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            코스 비교하기
            <ArrowRight size={14} />
          </button>
          <button
            onClick={() => navigate(`/mobile/alternatives/${place.id}`)}
            style={{
              flex: 1, padding: "12px", borderRadius: 10,
              border: "1.5px solid #E8E9EE", background: "white",
              color: "#4A4A6A", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            대안 코스
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}