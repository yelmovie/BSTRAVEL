import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { Smartphone, Monitor, MapPin, ArrowRight, Shield, Database, Users, AlertTriangle, BarChart2, Route } from "lucide-react";
import { useI18n } from "../i18n/I18nContext";
import { FIRST_VISIT_STORAGE_KEY } from "../i18n/constants";
import { LanguageSwitcher } from "./i18n/LanguageSwitcher";
import { FirstVisitLanguageModal } from "./i18n/FirstVisitLanguageModal";

export function EntryScreen() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [firstVisitOpen, setFirstVisitOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(FIRST_VISIT_STORAGE_KEY)) {
        setFirstVisitOpen(true);
      }
    } catch {
      setFirstVisitOpen(true);
    }
  }, []);

  const heroTail = t("entry.heroLine2").trim();

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F8F9FC",
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <FirstVisitLanguageModal
        open={firstVisitOpen}
        onClose={() => setFirstVisitOpen(false)}
      />

      {/* Top bar */}
      <div
        style={{
          padding: "20px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: "#5B54D6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Route size={18} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: "#7A7A8E", fontWeight: 500, letterSpacing: 1.5 }}>
              {t("common.pilotRegion")}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3 }}>
              {t("common.appName")}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap", marginLeft: "auto" }}>
          <LanguageSwitcher variant="header" />
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EEEDFA", borderRadius: 6, padding: "4px 10px" }}>
            <Database size={10} color="#5B54D6" />
            <span style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>{t("common.ktoBadge")}</span>
          </div>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "#8E90A8", padding: "0 32px", margin: "0 0 8px", lineHeight: 1.5 }}>
        {t("common.foreignerBanner")}
      </p>

      {/* Hero */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 32px" }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          style={{ marginBottom: 32 }}
        >
          <h1 style={{ fontSize: 28, fontWeight: 700, color: "#1A1A2E", lineHeight: 1.4, margin: 0, marginBottom: 12, letterSpacing: -0.5 }}>
            {t("entry.heroLine1")}
            <br />
            <span style={{ color: "#5B54D6" }}>{t("entry.heroHighlight")}</span>
            {heroTail ? (
              <>
                <br />
                <span style={{ color: "#1A1A2E" }}>{t("entry.heroLine2")}</span>
              </>
            ) : null}
          </h1>
          <p style={{ fontSize: 15, color: "#7A7A8E", margin: 0, lineHeight: 1.65, fontWeight: 400, maxWidth: 420 }}>
            {t("entry.heroDesc")}
          </p>
        </motion.div>

        {/* Value props */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 32, maxWidth: 420 }}
        >
          {[
            { icon: <Users size={14} color="#5B54D6" />, text: t("entry.value1") },
            { icon: <Route size={14} color="#3D8B7A" />, text: t("entry.value2") },
            { icon: <AlertTriangle size={14} color="#C4793C" />, text: t("entry.value3") },
            { icon: <Shield size={14} color="#4A7BBF" />, text: t("entry.value4") },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: "#F6F5FF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                {item.icon}
              </div>
              <span style={{ fontSize: 13, color: "#4A4A6A", fontWeight: 500 }}>{item.text}</span>
            </div>
          ))}
        </motion.div>

        {/* Mode selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          <div style={{ fontSize: 11, color: "#A0A0B0", fontWeight: 600, marginBottom: 2, letterSpacing: 0.3 }}>
            {t("entry.chooseEnv")}
          </div>

          {/* Mobile */}
          <button
            type="button"
            onClick={() => navigate("/mobile")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 20px",
              borderRadius: 14,
              border: "1.5px solid #5B54D6",
              background: "linear-gradient(135deg, #F8F7FF, white)",
              cursor: "pointer",
              transition: "all 0.15s ease",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: "#5B54D6",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Smartphone size={22} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", marginBottom: 3 }}>{t("entry.mobileTitle")}</div>
              <div style={{ fontSize: 12, color: "#7A7A8E", fontWeight: 400, lineHeight: 1.4 }}>
                {t("entry.mobileDesc")}
              </div>
            </div>
            <ArrowRight size={18} color="#5B54D6" />
          </button>

          {/* Desktop */}
          <button
            type="button"
            onClick={() => navigate("/desktop")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              padding: "18px 20px",
              borderRadius: 14,
              border: "1.5px solid #E8E9EE",
              background: "white",
              cursor: "pointer",
              transition: "all 0.15s ease",
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 13,
                background: "#EAF0F8",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Monitor size={22} color="#4A7BBF" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1B2E", marginBottom: 3 }}>{t("entry.desktopTitle")}</div>
              <div style={{ fontSize: 12, color: "#7A7A8E", fontWeight: 400, lineHeight: 1.4 }}>
                {t("entry.desktopDesc")}
              </div>
            </div>
            <ArrowRight size={18} color="#A0A0B0" />
          </button>
        </motion.div>
      </div>

      {/* Footer */}
      <div style={{ padding: "20px 32px", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "wrap" }}>
        {[t("entry.footerKto"), t("entry.footerBarrier"), t("entry.footerLangTour"), t("entry.footerKakao")].map((label) => (
          <div
            key={label}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              background: "white",
              border: "1px solid #E4E5EE",
              borderRadius: 6,
              padding: "4px 10px",
            }}
          >
            <Database size={9} color="#5B54D6" />
            <span style={{ fontSize: 10, color: "#5B54D6", fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
