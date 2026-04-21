import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  CheckCircle, Star, Clock, Footprints, Users, ChevronRight,
  Shield, Zap, Award, AlertTriangle, BarChart2, TrendingUp,
  Database, ArrowUpDown, MapPin, Map,
} from "lucide-react";
import { PLACES } from "../../data/places";
import { useApp } from "../../context/AppContext";

const CROWD_LABELS = ["", "매우 한산", "한산", "보통", "혼잡", "매우 혼잡"];
const CROWD_COLORS = ["", "#2D8A6B", "#4A7BBF", "#C4793C", "#D05050", "#A02020"];

const SCORE_LABELS: { key: keyof typeof PLACES[0]["scoreBreakdown"]; label: string; color: string }[] = [
  { key: "accessibility", label: "접근성", color: "#5B54D6" },
  { key: "companionFit", label: "동행 적합도", color: "#3D8B7A" },
  { key: "walkingLoad", label: "보행 부담↓", color: "#4A7BBF" },
  { key: "crowdStability", label: "혼잡 안정성", color: "#B07AAF" },
  { key: "connectivity", label: "이동 연결성", color: "#C4793C" },
];

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + query)}`, "_blank");
}

function RadarChart({ data, size = 220 }: { data: { label: string; value: number }[]; size?: number }) {
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
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(" ") + " Z";

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
        const p = getPos(i, maxR + 22);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle"
            fontSize={11} fill="#4A4A6A" fontWeight="600" fontFamily="Noto Sans KR, sans-serif">
            {d.label}
          </text>
        );
      })}
    </svg>
  );
}

export function DesktopComparisonPage() {
  const navigate = useNavigate();
  const { selectedForComparison, toggleComparisonSelection, setSelectedCourse } = useApp();

  const comparingPlaces = PLACES.filter((p) => selectedForComparison.includes(p.id));
  const bestPlace = comparingPlaces.length > 0
    ? comparingPlaces.reduce((a, b) => (a.score > b.score ? a : b), comparingPlaces[0])
    : null;

  return (
    <div style={{ padding: "36px 48px 60px", minHeight: "calc(100dvh - 62px)", overflowY: "auto" }}>
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <Database size={12} color="#5B54D6" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#5B54D6", letterSpacing: 1, textTransform: "uppercase" }}>
            KTO OpenAPI 기반 비교 분석
          </span>
        </div>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1A1B2E", margin: "0 0 6px", letterSpacing: -0.8 }}>
          코스 상세 비교
        </h1>
        <p style={{ fontSize: 14, color: "#8E90A8", margin: 0 }}>
          추천을 넘어 선택을 위한 데이터 비교 — 점수·위험요소·편의시설·실행 가능성을 한눈에
        </p>
      </motion.div>

      {/* Course selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" }}>
        {PLACES.map((p) => {
          const selected = selectedForComparison.includes(p.id);
          return (
            <button
              key={p.id}
              onClick={() => toggleComparisonSelection(p.id)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px", borderRadius: 20,
                border: `1.5px solid ${selected ? "#5B54D6" : "#E8E9EE"}`,
                background: selected ? "#EEEDFA" : "white",
                cursor: "pointer",
              }}
            >
              {selected && <CheckCircle size={14} color="#5B54D6" />}
              <span style={{ fontSize: 13, fontWeight: 600, color: selected ? "#5B54D6" : "#7A7A8E" }}>
                {p.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}
              </span>
            </button>
          );
        })}
      </div>

      {comparingPlaces.length < 2 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#A0A0B0" }}>
          <BarChart2 size={40} style={{ marginBottom: 16, opacity: 0.5 }} />
          <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4 }}>코스를 2개 이상 선택해 주세요</div>
          <div style={{ fontSize: 13 }}>위에서 비교할 코스를 선택하면 비교 분석이 시작됩니다</div>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: Cards + Table */}
          <div>
            {/* Best pick banner */}
            {bestPlace && (
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  background: "linear-gradient(135deg, #5B54D6 0%, #7C75E8 100%)",
                  borderRadius: 16, padding: "18px 22px", marginBottom: 20,
                  display: "flex", alignItems: "center", gap: 16,
                }}
              >
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "rgba(255,255,255,0.2)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Award size={22} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginBottom: 2 }}>
                    공공데이터 분석 최적 추천
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{bestPlace.name}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                    실행 가능성 {bestPlace.feasibility.successRate}% · 접근성 {bestPlace.scoreBreakdown.accessibility}점
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: "white" }}>{bestPlace.score.toFixed(1)}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)" }}>종합 점수</div>
                </div>
              </motion.div>
            )}

            {/* Comparison Table */}
            <div style={{
              background: "white", borderRadius: 16, border: "1px solid #E8E9EE",
              overflow: "hidden",
            }}>
              {/* Header */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `100px repeat(${comparingPlaces.length}, 1fr)`,
                background: "#F8F9FC", borderBottom: "1.5px solid #E8E9EE",
              }}>
                <div style={{ padding: "12px 14px", fontSize: 11, fontWeight: 600, color: "#9EA0B8" }}>항목</div>
                {comparingPlaces.map((p, i) => {
                  const isBest = p.id === bestPlace?.id;
                  return (
                    <div key={p.id} style={{
                      padding: "12px", textAlign: "center",
                      background: isBest ? "#F6F5FF" : "transparent",
                      position: "relative",
                    }}>
                      {isBest && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "#5B54D6" }} />}
                      <div style={{ fontSize: 11, fontWeight: 700, color: isBest ? "#5B54D6" : "#4A4A6A" }}>
                        코스 {String.fromCharCode(65 + i)}
                      </div>
                      <div style={{ fontSize: 10, color: "#A0A0B0" }}>
                        {p.name.replace(" 코스", "").split(" ").slice(0, 2).join(" ")}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Score row */}
              <div style={{
                display: "grid",
                gridTemplateColumns: `100px repeat(${comparingPlaces.length}, 1fr)`,
                borderBottom: "1px solid #F0F1F5",
              }}>
                <div style={{ padding: "14px", display: "flex", alignItems: "center", gap: 5 }}>
                  <Star size={12} color="#7A7A8E" />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#4A4A6A" }}>종합 점수</span>
                </div>
                {comparingPlaces.map((p) => {
                  const isBest = p.id === bestPlace?.id;
                  return (
                    <div key={p.id} style={{
                      padding: "14px", textAlign: "center",
                      background: isBest ? "#FDFCFF" : "white",
                    }}>
                      <span style={{ fontSize: 18, fontWeight: 800, color: isBest ? "#5B54D6" : "#4A4A6A" }}>
                        {p.score.toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Metric rows */}
              {[
                { label: "실행 가능성", getValue: (p: typeof PLACES[0]) => `${p.feasibility.successRate}%` },
                { label: "소요 시간", getValue: (p: typeof PLACES[0]) => p.duration },
                { label: "보행 부담", getValue: (p: typeof PLACES[0]) => p.walkingAmount },
                { label: "혼잡도", getValue: (p: typeof PLACES[0]) => CROWD_LABELS[p.crowdLevel] },
                { label: "편의시설", getValue: (p: typeof PLACES[0]) => `${p.facilities.length}개` },
                { label: "위험요소", getValue: (p: typeof PLACES[0]) => `${p.feasibility.risks.length}건` },
              ].map((metric, mi) => (
                <div key={metric.label} style={{
                  display: "grid",
                  gridTemplateColumns: `100px repeat(${comparingPlaces.length}, 1fr)`,
                  borderBottom: mi < 5 ? "1px solid #F0F1F5" : "none",
                }}>
                  <div style={{ padding: "12px 14px", fontSize: 12, fontWeight: 500, color: "#7A7A8E" }}>
                    {metric.label}
                  </div>
                  {comparingPlaces.map((p) => (
                    <div key={p.id} style={{
                      padding: "12px", textAlign: "center",
                      fontSize: 13, fontWeight: 600, color: "#4A4A6A",
                    }}>
                      {metric.getValue(p)}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
              {comparingPlaces.map((p) => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedCourse(p.id); navigate(`/desktop/course/${p.id}`); }}
                  style={{
                    flex: 1, padding: "12px", borderRadius: 12,
                    border: p.id === bestPlace?.id ? "none" : "1.5px solid #E8E9EE",
                    background: p.id === bestPlace?.id ? "linear-gradient(135deg, #6C66E0, #5B54D6)" : "white",
                    color: p.id === bestPlace?.id ? "white" : "#4A4A6A",
                    fontSize: 13, fontWeight: 700, cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  {p.name.split(" ").slice(0, 2).join(" ")} 선택
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Score Analysis */}
          <div>
            {/* Radar charts */}
            {comparingPlaces.slice(0, 2).map((p, idx) => {
              const isBest = p.id === bestPlace?.id;
              const radarData = SCORE_LABELS.map((s) => ({
                label: s.label,
                value: p.scoreBreakdown[s.key] as number,
              }));
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  style={{
                    background: "white", borderRadius: 16,
                    border: `1.5px solid ${isBest ? "#5B54D6" : "#E8E9EE"}`,
                    overflow: "hidden", marginBottom: 16,
                  }}
                >
                  <div style={{
                    padding: "14px 18px",
                    background: isBest ? "#F6F5FF" : "#FAFAFA",
                    borderBottom: "1px solid #E8E9EE",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                  }}>
                    <div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: "#A0A0B0", marginBottom: 2 }}>
                        코스 {String.fromCharCode(65 + idx)} {isBest ? "· 최적 추천" : ""}
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>
                        {p.name.split(" ").slice(0, 2).join(" ")}
                      </div>
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: isBest ? "#5B54D6" : "#4A4A6A" }}>
                      {p.score.toFixed(1)}
                    </div>
                  </div>
                  <div style={{ padding: "16px", display: "flex", justifyContent: "center" }}>
                    <RadarChart data={radarData} size={200} />
                  </div>
                  {/* Score bars */}
                  <div style={{ padding: "0 18px 16px" }}>
                    {SCORE_LABELS.map((s) => (
                      <div key={s.key} style={{ marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: "#7A7A8E" }}>{s.label}</span>
                          <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>
                            {p.scoreBreakdown[s.key]}
                          </span>
                        </div>
                        <div style={{ height: 5, borderRadius: 3, background: "#F0F1F5", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${p.scoreBreakdown[s.key]}%` }}
                            transition={{ duration: 0.6 }}
                            style={{ height: "100%", borderRadius: 3, background: s.color }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
