import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Loader } from "lucide-react";
import { LoadingMascot } from "../LoadingMascot";

const ANALYSIS_STEPS = [
  { label: "동행자 조건 · 코스 메타데이터와 매칭",     src: "클라이언트 시뮬 (API 일괄 호출 아님)" },
  { label: "혼잡·날씨 이슈는 본 화면에서 직접 수집하지 않음", src: "시연용 단계 문구" },
  { label: "KorWith TourAPI는 추천/연동 테스트 화면에서 호출", src: "KorWithService2 (서버 프록시 + 키)" },
  { label: "부산 권역 날씨는 Open-Meteo(다른 화면)에서 수신", src: "Open-Meteo (기상청과 동일 아님)" },
  { label: "배리어프리 가정·시뮬 문구",                 src: "데모 시나리오" },
  { label: "최적 코스 점수·정렬 (로컬)",              src: "앱 내 데모 데이터" },
];

export function GeneratingPage() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Progress bar: 0 → 100 over ~3.2s
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) { clearInterval(interval); return 100; }
        return prev + 2.5;
      });
    }, 80);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Reveal steps every ~0.5s
    if (stepIndex < ANALYSIS_STEPS.length - 1) {
      const t = setTimeout(() => setStepIndex(i => i + 1), 500);
      return () => clearTimeout(t);
    }
  }, [stepIndex]);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(() => {
        setDone(true);
        setTimeout(() => navigate("/desktop/results"), 700);
      }, 200);
      return () => clearTimeout(t);
    }
  }, [progress, navigate]);

  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div style={{
      minHeight: "calc(100dvh - 62px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "#F6F7FB",
      padding: "48px 32px",
    }}>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", maxWidth: 680, width: "100%" }}>
        {/* Mascot illustration */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          style={{ marginBottom: 32, maxWidth: 240 }}
        >
          <LoadingMascot />
        </motion.div>

        {/* Gauge */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ position: "relative", width: 140, height: 140, marginBottom: 36 }}
        >
          <svg width={140} height={140}>
            <circle cx={70} cy={70} r={54} fill="none" stroke="#E8E9EF" strokeWidth={10} />
            <motion.circle
              cx={70} cy={70} r={54} fill="none"
              stroke={done ? "#3D8B7A" : "#5B54D6"} strokeWidth={10}
              strokeLinecap="round"
              strokeDasharray={circumference}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.1, ease: "linear" }}
              transform="rotate(-90 70 70)"
            />
          </svg>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          }}>
            {done ? (
              <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <CheckCircle size={36} color="#3D8B7A" />
              </motion.div>
            ) : (
              <>
                <span style={{ fontSize: 26, fontWeight: 900, color: "#5B54D6", letterSpacing: -1 }}>
                  {Math.round(progress)}
                </span>
                <span style={{ fontSize: 11, color: "#A0A2B8", fontWeight: 600 }}>%</span>
              </>
            )}
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{ textAlign: "center", marginBottom: 8 }}
        >
          <h2 style={{
            fontSize: 26, fontWeight: 800, color: "#1A1B2E",
            letterSpacing: -0.6, margin: "0 0 8px",
          }}>
            {done ? "최적 코스 분석 완료!" : "최적 코스를 분석하고 있습니다"}
          </h2>
          <p style={{ fontSize: 14, color: "#8E90A8", margin: 0, lineHeight: 1.5 }}>
            {done
              ? "동행자 조건에 맞는 3개의 코스를 찾았습니다."
              : "아래 단계 목록은 진행 연출용입니다. 공공 API를 이 화면에서 동시에 호출하지 않습니다."}
          </p>
        </motion.div>

        {/* Progress bar */}
        <div style={{
          width: "100%", maxWidth: 480, height: 5,
          background: "#E8E9EF", borderRadius: 3, overflow: "hidden",
          marginBottom: 40,
        }}>
          <motion.div
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
            style={{
              height: "100%",
              background: done
                ? "linear-gradient(90deg, #3D8B7A, #52B89A)"
                : "linear-gradient(90deg, #6C66E0, #5B54D6)",
              borderRadius: 3,
            }}
          />
        </div>

        {/* Step list */}
        <div style={{
          width: "100%", maxWidth: 520,
          background: "white", borderRadius: 18,
          border: "1.5px solid #E4E6EF",
          padding: "24px 28px",
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          {ANALYSIS_STEPS.map((step, i) => {
            const isVisible  = i <= stepIndex;
            const isComplete = i < stepIndex || done;
            const isActive   = i === stepIndex && !done;

            return (
              <AnimatePresence key={`analysis-step-${i}`}>
                {isVisible && (
                  <motion.div
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25 }}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "10px 0",
                      borderBottom: i < ANALYSIS_STEPS.length - 1 ? "1px solid #F4F5FA" : "none",
                    }}
                  >
                    <div style={{ width: 22, height: 22, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {isComplete ? (
                        <CheckCircle size={18} color="#3D8B7A" />
                      ) : isActive ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        >
                          <Loader size={18} color="#5B54D6" />
                        </motion.div>
                      ) : (
                        <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#E4E6EF" }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 13, fontWeight: isActive ? 700 : 500,
                        color: isComplete ? "#4A4A6A" : isActive ? "#1A1B2E" : "#A0A2B8",
                      }}>
                        {step.label}
                      </div>
                      {(isActive || isComplete) && (
                        <div style={{ fontSize: 10, color: "#A0A2B8", marginTop: 1 }}>
                          출처: {step.src}
                        </div>
                      )}
                    </div>
                    {isComplete && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: "#3D8B7A",
                        background: "#EDF7F2", borderRadius: 4, padding: "2px 6px",
                      }}>
                        완료
                      </span>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            );
          })}
        </div>

        <p style={{
          fontSize: 11, color: "#9EA0B8", marginTop: 20, textAlign: "center", lineHeight: 1.5, maxWidth: 480, marginLeft: "auto", marginRight: "auto",
        }}>
          이 화면의 단계/퍼센트는 UI 시뮬레이션입니다. TourAPI·Open-Meteo 실연동 여부는 추천(KorWith), 날씨 위젯, <code style={{ fontSize: 10 }}>/mobile/tour-debug</code> 및 개발 모드 「API 디버그」패널로 확인할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
