import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  AlertTriangle, CheckCircle, ChevronRight, Shield, TrendingUp,
  Users, Footprints, Zap, ArrowRight, Activity, Database,
  RefreshCw, Map, ArrowLeft,
} from "lucide-react";
import { PLACES, RiskSegment } from "../../data/places";

const RISK_TYPE_CONFIG: Record<RiskSegment["riskType"], { label: string; color: string; bg: string }> = {
  crowd: { label: "혼잡 위험", color: "#D05050", bg: "#FFF4F4" },
  slope: { label: "경사 주의", color: "#C4793C", bg: "#FFF8F0" },
  accessibility: { label: "접근성 이슈", color: "#8B54D6", bg: "#F8F4FF" },
  distance: { label: "거리 부담", color: "#4A7BBF", bg: "#F0F6FF" },
  weather: { label: "날씨 변수", color: "#3D8B7A", bg: "#F0FAF6" },
};

const RISK_LEVEL_CONFIG: Record<RiskSegment["riskLevel"], { label: string; color: string; bg: string }> = {
  low: { label: "낮음", color: "#2D8A6B", bg: "#E8F7F2" },
  medium: { label: "보통", color: "#C4793C", bg: "#FFF1E3" },
  high: { label: "높음", color: "#D05050", bg: "#FFE8E8" },
};

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + query)}`, "_blank");
}

export function DesktopFeasibilityPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const { successRate, interpretation, risks } = place.feasibility;
  const [showPlanB, setShowPlanB] = useState(false);

  const highRisks = risks.filter((r) => r.riskLevel === "high");
  const mediumRisks = risks.filter((r) => r.riskLevel === "medium");
  const lowRisks = risks.filter((r) => r.riskLevel === "low");

  const successColor =
    successRate >= 85 ? "#2D8A6B" : successRate >= 70 ? "#5B54D6" : successRate >= 55 ? "#C4793C" : "#D05050";

  const BREAKDOWN = [
    { label: "접근성", value: place.scoreBreakdown.accessibility, color: "#5B54D6", icon: <Shield size={14} /> },
    { label: "동행 적합성", value: place.scoreBreakdown.companionFit, color: "#3D8B7A", icon: <Users size={14} /> },
    { label: "이동 부담", value: place.scoreBreakdown.walkingLoad, color: "#4A7BBF", icon: <Footprints size={14} /> },
    { label: "혼잡 안정성", value: place.scoreBreakdown.crowdStability, color: "#B07AAF", icon: <Zap size={14} /> },
    { label: "연계성", value: place.scoreBreakdown.connectivity, color: "#C4793C", icon: <TrendingUp size={14} /> },
  ];

  return (
    <div style={{ minHeight: "calc(100dvh - 62px)", overflowY: "auto" }}>
      {/* Sub-header */}
      <div style={{
        background: "white", borderBottom: "1.5px solid #E4E6EF",
        padding: "14px 48px", display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            border: "none", background: "#F6F7FB", borderRadius: 8,
            padding: "7px 12px", cursor: "pointer",
            color: "#6B6B88", fontSize: 12, fontWeight: 600,
          }}
        >
          <ArrowLeft size={12} />돌아가기
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Database size={11} color="#5B54D6" />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6" }}>실행 가능성 판단</span>
          <span style={{ color: "#C0C0CC" }}>·</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>{place.name}</span>
        </div>
      </div>

      <div style={{ padding: "32px 48px 60px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
          {/* Left: Score + Breakdown */}
          <div>
            {/* Main result */}
            <motion.div
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "white", borderRadius: 20,
                border: `2px solid ${successColor}40`,
                padding: "28px", marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
                {/* Circular progress */}
                <div style={{ position: "relative", width: 130, height: 130 }}>
                  <svg width={130} height={130} style={{ transform: "rotate(-90deg)" }}>
                    <circle cx={65} cy={65} r={54} fill="none" stroke="#F0F1F5" strokeWidth={12} />
                    <motion.circle
                      cx={65} cy={65} r={54} fill="none" stroke={successColor} strokeWidth={12}
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 54}
                      initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 54 * (1 - successRate / 100) }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                    />
                  </svg>
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                  }}>
                    <div style={{ fontSize: 30, fontWeight: 800, color: successColor }}>{successRate}%</div>
                    <div style={{ fontSize: 11, color: "#7A7A8E", fontWeight: 500 }}>
                      {successRate >= 85 ? "매우 높음" : successRate >= 70 ? "높음" : "보통"}
                    </div>
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9EA0B8", marginBottom: 4, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    실행 가능성 · 현재 예측
                  </div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: successColor, marginBottom: 6 }}>
                    {successRate >= 85 ? "매우 가능" : successRate >= 70 ? "가능" : "일부 주의"}
                  </div>
                  <div style={{ fontSize: 13, color: "#7A7A8E", lineHeight: 1.5 }}>
                    {highRisks.length > 0
                      ? `고위험 ${highRisks.length}개 구간 감지됨`
                      : mediumRisks.length > 0
                      ? `주의 구간 ${mediumRisks.length}개 확인 필요`
                      : "모든 구간 안전 예측"}
                  </div>
                </div>
              </div>

              {/* Interpretation */}
              <div style={{
                marginTop: 16, background: `${successColor}10`,
                borderRadius: 12, padding: "12px 16px",
                border: `1px solid ${successColor}30`,
              }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Activity size={14} color={successColor} style={{ flexShrink: 0, marginTop: 2 }} />
                  <p style={{ fontSize: 13, color: "#3D3D5C", lineHeight: 1.6, margin: 0 }}>{interpretation}</p>
                </div>
              </div>
            </motion.div>

            {/* Score breakdown */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              style={{
                background: "white", borderRadius: 16,
                border: "1px solid #E8E9EE", overflow: "hidden",
              }}
            >
              <div style={{
                background: "linear-gradient(135deg, #5B54D6, #7C75E8)",
                padding: "14px 20px",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginBottom: 2 }}>
                    같이가능 점수 — 5개 항목 종합
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>점수 분석</div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{place.score.toFixed(1)}<span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>/10</span></div>
              </div>
              <div style={{ padding: "18px 20px" }}>
                {BREAKDOWN.map((stat, i) => (
                  <div key={stat.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{ color: stat.color }}>{stat.icon}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "#4A4A6A" }}>{stat.label}</span>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color: stat.color }}>{stat.value}</span>
                    </div>
                    <div style={{ height: 7, borderRadius: 4, background: "#F0F1F5", overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${stat.value}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.06 }}
                        style={{ height: "100%", borderRadius: 4, background: stat.color }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right: Risks + Plan B */}
          <div>
            {/* Risk segments */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E" }}>위험 구간 분석</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {highRisks.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#D05050", background: "#FFE8E8", borderRadius: 5, padding: "3px 8px" }}>
                      위험 {highRisks.length}
                    </span>
                  )}
                  {mediumRisks.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#C4793C", background: "#FFF1E3", borderRadius: 5, padding: "3px 8px" }}>
                      주의 {mediumRisks.length}
                    </span>
                  )}
                  {lowRisks.length > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#2D8A6B", background: "#E8F7F2", borderRadius: 5, padding: "3px 8px" }}>
                      양호 {lowRisks.length}
                    </span>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {[...highRisks, ...mediumRisks, ...lowRisks].map((risk, i) => {
                  const typeConfig = RISK_TYPE_CONFIG[risk.riskType];
                  const levelConfig = RISK_LEVEL_CONFIG[risk.riskLevel];
                  return (
                    <motion.div
                      key={risk.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.08 }}
                      style={{
                        background: risk.riskLevel === "high" ? "#FFFBFB" : "white",
                        border: `1.5px solid ${risk.riskLevel === "high" ? "#FCA5A5" : "#E8E9EE"}`,
                        borderRadius: 14, padding: "16px 18px",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>{risk.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: typeConfig.color, background: typeConfig.bg, borderRadius: 4, padding: "2px 7px" }}>
                          {typeConfig.label}
                        </span>
                        <span style={{ fontSize: 10, fontWeight: 600, color: levelConfig.color, background: levelConfig.bg, borderRadius: 4, padding: "2px 7px" }}>
                          위험도 {levelConfig.label}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, color: "#4A4A6A", lineHeight: 1.5, marginBottom: 8 }}>
                        {risk.description}
                      </div>
                      <div style={{
                        background: "#F0FAF6", borderRadius: 8, padding: "8px 10px",
                        display: "flex", gap: 6, alignItems: "flex-start",
                      }}>
                        <CheckCircle size={12} color="#2D8A6B" style={{ flexShrink: 0, marginTop: 1 }} />
                        <span style={{ fontSize: 12, color: "#2D6B52", lineHeight: 1.5 }}>{risk.alternative}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            {/* Plan B */}
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <div style={{
                background: "white", borderRadius: 16,
                border: "1.5px solid #E4E2F5", overflow: "hidden",
              }}>
                <div style={{ background: "#F6F5FF", padding: "14px 18px", borderBottom: "1px solid #E4E2F5" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: 8, background: "#5B54D6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: "white" }}>B</span>
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#5B54D6" }}>대체 코스 Plan B</div>
                      <div style={{ fontSize: 11, color: "#7A79CC" }}>돌발 상황에도 대체 가능한 안전 코스</div>
                    </div>
                  </div>
                </div>
                <div style={{ padding: "16px 18px" }}>
                  <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
                    <button
                      onClick={() => navigate(`/desktop/live/${place.id}`)}
                      style={{
                        flex: 1, padding: "12px", borderRadius: 10, border: "none",
                        background: "#5B54D6", color: "white",
                        fontSize: 13, fontWeight: 700, cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <RefreshCw size={14} />
                      Plan B 대안 코스 보기
                    </button>
                    <button
                      onClick={() => openKakaoMap(place.name)}
                      style={{
                        padding: "12px 16px", borderRadius: 10,
                        border: "1.5px solid #F9A825", background: "#FFFBF0",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <Map size={14} color="#F9A825" />
                      <span style={{ fontSize: 13, fontWeight: 600, color: "#B8820A" }}>지도</span>
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
