import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { CheckCircle, Loader } from "lucide-react";
import { LoadingMascot } from "../LoadingMascot";
import { useI18n } from "../../i18n/I18nContext";

export function GeneratingPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [done, setDone] = useState(false);

  const analysisSteps = [
    "step1",
    "step2",
    "step3",
    "step4",
    "step5",
    "step6",
  ].map((step) => ({
    label: t(`desktopPages.generating.steps.${step}.label`),
    src: t(`desktopPages.generating.steps.${step}.src`),
  }));

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
    if (stepIndex < analysisSteps.length - 1) {
      const t = setTimeout(() => setStepIndex(i => i + 1), 500);
      return () => clearTimeout(t);
    }
  }, [analysisSteps.length, stepIndex]);

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
            {done ? t("desktopPages.generating.titleDone") : t("desktopPages.generating.titleLoading")}
          </h2>
          <p style={{ fontSize: 14, color: "#8E90A8", margin: 0, lineHeight: 1.5 }}>
            {done
              ? t("desktopPages.generating.descDone")
              : t("desktopPages.generating.descLoading")}
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
          {analysisSteps.map((step, i) => {
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
                      borderBottom: i < analysisSteps.length - 1 ? "1px solid #F4F5FA" : "none",
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
                          {t("desktopPages.generating.sourceLabel")} {step.src}
                        </div>
                      )}
                    </div>
                    {isComplete && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: "#3D8B7A",
                        background: "#EDF7F2", borderRadius: 4, padding: "2px 6px",
                      }}>
                        {t("desktopPages.generating.completeBadge")}
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
          {t("desktopPages.generating.footnote")}
        </p>
      </div>
    </div>
  );
}
