import { Outlet, useLocation, useNavigate, Navigate } from "react-router";
import { motion } from "motion/react";
import { Route, Home, ChevronRight, Check } from "lucide-react";
import { DesktopFlowProvider, useDesktopFlow } from "../../context/DesktopFlowContext";
import { useI18n } from "../../i18n/I18nContext";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";

const STEPS = [
  { stepKey: "onboarding" as const, paths: ["/desktop/onboarding"] },
  { stepKey: "conditions" as const, paths: ["/desktop/conditions"] },
  { stepKey: "generating" as const, paths: ["/desktop/generating"] },
  { stepKey: "results" as const, paths: ["/desktop/results", "/desktop/compare", "/desktop/feasibility"] },
  { stepKey: "detail" as const, paths: ["/desktop/course", "/desktop/timeline", "/desktop/map"] },
  { stepKey: "departure" as const, paths: ["/desktop/departure", "/desktop/live"] },
];

function getStep(pathname: string): number {
  for (let i = 0; i < STEPS.length; i++) {
    if (STEPS[i].paths.some(p => pathname.startsWith(p))) return i;
  }
  return 0;
}

export function DesktopRoot() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { t } = useI18n();
  const { selectedCourse } = useDesktopFlow();
  const currentStep = getStep(location.pathname);

  // Redirect /desktop to /desktop/onboarding
  if (location.pathname === "/desktop" || location.pathname === "/desktop/") {
    return <Navigate to="/desktop/onboarding" replace />;
  }

  /** Resolve the navigation URL for a step, injecting :id where needed */
  function resolveStepPath(stepKey: (typeof STEPS)[number]["stepKey"]): string {
    const courseId = selectedCourse || "botanical";
    switch (stepKey) {
      case "detail":    return `/desktop/course/${courseId}`;
      case "departure": return `/desktop/departure/${courseId}`;
      default:          return STEPS.find(s => s.stepKey === stepKey)?.paths[0] ?? "/desktop/onboarding";
    }
  }

  return (
    <DesktopFlowProvider>
      <div style={{
        minHeight: "100dvh", background: "#F6F7FB",
        fontFamily: "'Noto Sans KR', -apple-system, sans-serif",
        display: "flex", flexDirection: "column",
      }}>
        {/* ── Top bar ── */}
        <header style={{
          height: 62, background: "white",
          borderBottom: "1.5px solid #E4E6EF",
          display: "flex", alignItems: "center",
          padding: "0 32px", flexShrink: 0, zIndex: 50,
          position: "sticky", top: 0,
        }}>
          {/* Logo */}
          <button
            onClick={() => navigate("/")}
            style={{
              display: "flex", alignItems: "center", gap: 9,
              marginRight: 40, flexShrink: 0,
              border: "none", background: "transparent", cursor: "pointer", padding: 0,
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8,
              background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Route size={15} color="white" />
            </div>
            <div>
              <span style={{ fontSize: 16, fontWeight: 800, color: "#1A1B2E", letterSpacing: -0.5 }}>
                {t("common.appName")}
              </span>
            </div>
            <span style={{
              fontSize: 10, fontWeight: 700, color: "#5B54D6",
              background: "#EEEDFA", borderRadius: 4, padding: "2px 7px", letterSpacing: 0,
            }}>
              {t("common.pilotBadge")}
            </span>
          </button>

          {/* Step progress */}
          <div style={{
            flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", gap: 0,
          }}>
            {STEPS.map((step, i) => {
              const isActive = i === currentStep;
              const isDone   = i < currentStep;
              const color    = isActive ? "#5B54D6" : isDone ? "#3D8B7A" : "#C0C2D4";
              const label = t(`desktop.steps.${step.stepKey}`);
              return (
                <div key={step.stepKey} style={{ display: "flex", alignItems: "center" }}>
                  <motion.div
                    whileHover={isDone ? { scale: 1.04 } : {}}
                    style={{
                      display: "flex", alignItems: "center", gap: 7,
                      padding: "6px 14px", borderRadius: 20,
                      background: isActive ? "#EEEDFA" : isDone ? "#EDF7F2" : "transparent",
                      cursor: isDone ? "pointer" : "default",
                      transition: "background 0.2s",
                    }}
                    onClick={() => isDone && navigate(resolveStepPath(step.stepKey))}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
                      background: isActive ? "#5B54D6" : isDone ? "#3D8B7A" : "#EEF0F6",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 10, fontWeight: 700,
                      color: isActive || isDone ? "white" : "#B0B2C4",
                    }}>
                      {isDone ? <Check size={10} strokeWidth={3} /> : i + 1}
                    </div>
                    <span style={{
                      fontSize: 12, fontWeight: isActive ? 700 : isDone ? 600 : 500,
                      color, whiteSpace: "nowrap",
                    }}>
                      {label}
                    </span>
                  </motion.div>
                  {i < STEPS.length - 1 && (
                    <div style={{
                      width: 28, height: 1.5,
                      background: isDone ? "#3D8B7A40" : "#E4E6EF",
                    }} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexShrink: 0, marginLeft: 32 }}>
            <LanguageSwitcher variant="compact" />
            <button
              type="button"
              onClick={() => navigate("/")}
              style={{
                display: "flex", alignItems: "center", gap: 5,
                padding: "7px 14px", borderRadius: 8,
                border: "1.5px solid #E4E6EF", background: "white",
                fontSize: 12, fontWeight: 600, color: "#6B6B88", cursor: "pointer",
              }}
            >
              <Home size={12} />{t("common.home")}
            </button>
          </div>
        </header>

        {/* Content */}
        <div style={{ flex: 1 }}>
          <Outlet />
        </div>
      </div>
    </DesktopFlowProvider>
  );
}