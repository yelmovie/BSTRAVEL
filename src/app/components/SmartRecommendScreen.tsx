import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  Sparkles, ChevronRight, Check, Leaf, Landmark, Trees,
  Zap, ShoppingBag, BookOpen, Database, Wifi, Shield,
  BarChart2, Route, Star,
} from "lucide-react";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";
import purposeCharacter from "../../assets/1.png";

const PURPOSES = [
  { id: "healing",   label: "힐링·휴식",   sub: "편안한 여행",   icon: Leaf,       color: "#3D8B7A" },
  { id: "history",   label: "역사·문화",   sub: "배움의 시간",   icon: Landmark,   color: "#C4793C" },
  { id: "nature",    label: "자연·산책",   sub: "자연 속으로",   icon: Trees,      color: "#4A7BBF" },
  { id: "activity",  label: "체험·활동",   sub: "즐거운 경험",   icon: Zap,        color: "#B07AAF" },
  { id: "shopping",  label: "쇼핑·관광",   sub: "도시 탐험",    icon: ShoppingBag, color: "#E05C6A" },
  { id: "education", label: "교육·학습",   sub: "지식 탐구",    icon: BookOpen,   color: "#5B54D6" },
];

const DATA_SOURCES = [
  { label: "한국관광공사 무장애 여행정보 OpenAPI",    detail: "접근성·배리어프리 인증 데이터", primary: true },
  { label: "국문 관광정보 서비스 OpenAPI",          detail: "시설 · 편의정보 매칭", primary: true },
  { label: "다국어 관광정보 서비스 OpenAPI",        detail: "외국인 안내 서비스 지원", primary: true },
  { label: "관광지별 연관 관광지 정보 OpenAPI",     detail: "코스 연결 최적화", primary: true },
  { label: "카카오맵 API",                         detail: "지도·길찾기 연동", primary: false },
];

const ANALYSIS_STEPS = [
  { icon: Database, text: "동행자 조건 분석 중" },
  { icon: Shield,   text: "부산 관광 접근성 데이터 매칭 중" },
  { icon: BarChart2, text: "위험 구간 탐지 중" },
  { icon: Route,    text: "대안 코스 가능성 계산 중" },
  { icon: Wifi,     text: "보행 부담과 편의시설 종합 분석 중" },
  { icon: Star,     text: "부산 맞춤 코스 분석 완료!" },
];

export function SmartRecommendScreen() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>([]);
  const [phase, setPhase] = useState<"select" | "generating">("select");
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [currentStep, setCurrentStep] = useState(-1);
  const [progress, setProgress] = useState(0);

  const toggle = (id: string) =>
    setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const startGeneration = () => {
    if (selected.length === 0) return;
    setPhase("generating");
  };

  useEffect(() => {
    if (phase !== "generating") return;
    let step = 0;
    const tick = () => {
      setCurrentStep(step);
      setProgress(Math.round(((step + 1) / ANALYSIS_STEPS.length) * 100));
      setTimeout(() => {
        setCompletedSteps((p) => [...p, step]);
        step++;
        if (step < ANALYSIS_STEPS.length) {
          setTimeout(tick, 480);
        } else {
          setTimeout(() => navigate("/mobile/recommendations"), 800);
        }
      }, 460);
    };
    setTimeout(tick, 300);
  }, [phase, navigate]);

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F8F9FC" }}>
      <TopNav title={phase === "select" ? "여행 목적 선택" : "코스 분석 중"} />
      <StepIndicator current={phase === "select" ? 2 : 3} />

      <AnimatePresence mode="wait">
        {phase === "select" ? (
          <motion.div
            key="select"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
          >
            {/* ── Header ── */}
            <div style={{ padding: "22px 20px 16px" }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
                borderRadius: 8, padding: "4px 12px", marginBottom: 14,
              }}>
                <Database size={11} color="white" />
                <span style={{ fontSize: 11, color: "white", fontWeight: 700, letterSpacing: 0.3 }}>
                  KTO OpenAPI 기반 분석
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <img
                  src={purposeCharacter}
                  alt="여행 목적을 안내하는 캐릭터"
                  width={64}
                  height={80}
                  style={{
                    width: 64,
                    height: 80,
                    objectFit: "contain",
                    flexShrink: 0,
                    display: "block",
                  }}
                />
                <div>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", margin: 0, letterSpacing: -0.5, lineHeight: 1.35 }}>
                    부산에서 어떤 여행을<br />원하시나요?
                  </h1>
                  <p style={{ fontSize: 13, color: "#8E90A8", margin: "4px 0 0", letterSpacing: -0.2 }}>
                    목적을 선택하면 OpenAPI 기반으로 코스를 분석합니다
                  </p>
                </div>
              </div>
            </div>

            <div style={{ padding: "0 20px", flex: 1, overflowY: "auto" }}>
              {/* ── Purpose grid ── */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 9, marginBottom: 20 }}>
                {PURPOSES.map((p, i) => {
                  const isOn = selected.includes(p.id);
                  const Icon = p.icon;
                  return (
                    <motion.button
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.04 + i * 0.045 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => toggle(p.id)}
                      style={{
                        padding: "15px 8px",
                        borderRadius: 14,
                        border: isOn ? `2px solid ${p.color}` : "1.5px solid #E8E9EF",
                        background: isOn ? `${p.color}0D` : "white",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 8,
                        position: "relative" as const,
                        transition: "all 0.15s ease",
                      }}
                    >
                      {isOn && (
                        <div style={{
                          position: "absolute", top: 6, right: 6,
                          width: 16, height: 16, borderRadius: "50%",
                          background: p.color,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          <Check size={9} color="white" strokeWidth={3} />
                        </div>
                      )}
                      <div style={{
                        width: 40, height: 40, borderRadius: 12,
                        background: isOn ? p.color : "#F0F1F6",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.15s ease",
                        boxShadow: isOn ? `0 2px 8px ${p.color}40` : "none",
                      }}>
                        <Icon size={18} color={isOn ? "white" : "#8E90A8"} />
                      </div>
                      <div style={{ textAlign: "center" as const }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: isOn ? p.color : "#1A1A2E", letterSpacing: -0.3 }}>
                          {p.label}
                        </div>
                        <div style={{ fontSize: 10, color: isOn ? `${p.color}AA` : "#9EA0B8", marginTop: 1 }}>
                          {p.sub}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {/* ── Data sources card ── */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                style={{
                  background: "white", borderRadius: 14, border: "1px solid #E8E9EF",
                  padding: "14px 16px", marginBottom: 24,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 7,
                    background: "#F0EFFC",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Database size={12} color="#5B54D6" />
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
                    추천 기준 (공공데이터 소스)
                  </span>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {DATA_SOURCES.map((src, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: src.primary ? "#5B54D6" : "#B0B2C0", flexShrink: 0,
                      }} />
                      <div>
                        <span style={{ fontSize: 11, fontWeight: src.primary ? 600 : 400, color: src.primary ? "#4A4A6A" : "#9EA0B8" }}>{src.label}</span>
                        <span style={{ fontSize: 10, color: "#A0A2B8", marginLeft: 5 }}>— {src.detail}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* ── CTA ── */}
            <div style={{ padding: "0 20px 44px" }}>
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileTap={{ scale: 0.98 }}
                onClick={startGeneration}
                style={{
                  width: "100%", padding: "17px", borderRadius: 14, border: "none",
                  background: selected.length > 0
                    ? "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)"
                    : "#C4C5D8",
                  color: "white", fontSize: 15, fontWeight: 700,
                  cursor: selected.length > 0 ? "pointer" : "not-allowed",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  letterSpacing: -0.3,
                  boxShadow: selected.length > 0 ? "0 4px 20px rgba(91,84,214,0.35)" : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <Database size={15} />
                부산 추천 코스 분석 시작
                <ChevronRight size={15} />
              </motion.button>
              {selected.length === 0 && (
                <p style={{ textAlign: "center", fontSize: 12, color: "#9EA0B8", margin: "8px 0 0" }}>
                  여행 목적을 하나 이상 선택해주세요
                </p>
              )}
            </div>
          </motion.div>
        ) : (
          /* ── Generating phase ── */
          <motion.div
            key="generating"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              flex: 1, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              padding: "32px 28px",
            }}
          >
            {/* Animated rings */}
            <div style={{ position: "relative", width: 88, height: 88, marginBottom: 32 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", inset: 0,
                  borderRadius: "50%",
                  border: "3px solid #EEEDFA",
                  borderTopColor: "#5B54D6",
                }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "linear" }}
                style={{
                  position: "absolute", inset: 10,
                  borderRadius: "50%",
                  border: "2px solid #F0F1F6",
                  borderTopColor: "#8B84E0",
                }}
              />
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Sparkles size={22} color="#5B54D6" />
              </div>
            </div>

            <div style={{ fontSize: 19, fontWeight: 700, color: "#1A1A2E", marginBottom: 5, letterSpacing: -0.4 }}>
              부산 코스 실행 가능성 분석 중
            </div>
            <div style={{ fontSize: 13, color: "#8E90A8", marginBottom: 28, letterSpacing: -0.2 }}>
              {currentStep >= 0 ? ANALYSIS_STEPS[currentStep]?.text : "공공데이터 연동을 시작합니다..."}
            </div>

            {/* Progress bar */}
            <div style={{ width: "100%", maxWidth: 310, marginBottom: 28 }}>
              <div style={{ height: 7, background: "#E8E9EF", borderRadius: 4, overflow: "hidden" }}>
                <motion.div
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  style={{
                    height: "100%",
                    background: "linear-gradient(90deg, #6C66E0, #5B54D6)",
                    borderRadius: 4,
                  }}
                />
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
                <span style={{ fontSize: 10, color: "#A0A2B8" }}>분석 중</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#5B54D6" }}>{progress}%</span>
              </div>
            </div>

            {/* Step list */}
            <div style={{ width: "100%", maxWidth: 310, display: "flex", flexDirection: "column", gap: 9 }}>
              {ANALYSIS_STEPS.map((step, i) => {
                const isDone = completedSteps.includes(i);
                const isCurrent = currentStep === i && !isDone;
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isDone || isCurrent ? 1 : 0.28 }}
                    style={{ display: "flex", alignItems: "center", gap: 10 }}
                  >
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: isDone ? "#5B54D6" : isCurrent ? "#F0EFFC" : "#F4F5FA",
                      border: isCurrent ? "1.5px solid #5B54D6" : "none",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                      transition: "all 0.2s ease",
                    }}>
                      {isDone ? (
                        <Check size={11} color="white" strokeWidth={3} />
                      ) : (
                        <Icon size={11} color={isCurrent ? "#5B54D6" : "#C0C2D8"} />
                      )}
                    </div>
                    <span style={{
                      fontSize: 12,
                      fontWeight: isDone ? 600 : 400,
                      color: isDone ? "#1A1A2E" : isCurrent ? "#5B54D6" : "#B0B2C8",
                      letterSpacing: -0.2,
                      transition: "all 0.2s ease",
                    }}>
                      {step.text}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}