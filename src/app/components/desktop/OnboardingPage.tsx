import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Users, Baby, Accessibility, Smile, Globe,
  Check, ChevronRight, Sparkles, Shield, Database, MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { OnboardingMascot } from "../OnboardingMascot";
import { useI18n } from "../../i18n/I18nContext";

/* ── companion config ─────────────────────────────────── */
const COMPANIONS = [
  {
    id: "elderly",
    Icon: Users,
    color: "#5B54D6",
    bg: "#EEEDFA",
  },
  {
    id: "stroller",
    Icon: Baby,
    color: "#4A7BBF",
    bg: "#EFF6FF",
  },
  {
    id: "wheelchair",
    Icon: Accessibility,
    color: "#3D8B7A",
    bg: "#EDF7F2",
  },
  {
    id: "children",
    Icon: Smile,
    color: "#D97706",
    bg: "#FFF8ED",
  },
  {
    id: "foreigner",
    Icon: Globe,
    color: "#B07AAF",
    bg: "#F8F0FF",
  },
];

const DATA_STATS = [
  { label: "부산 배리어프리 관광지",  value: "340곳+",  note: "한국관광공사 OpenAPI 기준" },
  { label: "부산 무장애 접근 경로", value: "3,200km", note: "부산 전역" },
  { label: "다국어 안내 부산 관광지",   value: "128곳",   note: "영·중·일 이상" },
];

const API_SOURCES = [
  { label: "한국관광공사 무장애 여행정보 OpenAPI", primary: true },
  { label: "국문 관광정보 서비스 OpenAPI", primary: true },
  { label: "다국어 관광정보 서비스 OpenAPI", primary: true },
  { label: "관광지별 연관 관광지 정보 OpenAPI", primary: true },
  { label: "카카오맵 API (지도·길찾기)", primary: false },
  { label: "부산시 공공데이터포털", primary: false },
];

/* ── page ─────────────────────────────────────────────── */
export function OnboardingPage() {
  const { companions, setCompanions } = useApp();
  const navigate = useNavigate();
  const { t } = useI18n();

  const companionCards = COMPANIONS.map((item) => ({
    ...item,
    label: t(`desktopPages.onboarding.companions.${item.id}.label`),
    sub: t(`desktopPages.onboarding.companions.${item.id}.sub`),
    impacts: [1, 2, 3, 4].map((n) =>
      t(`desktopPages.onboarding.companions.${item.id}.impacts.${n - 1}`),
    ),
  }));

  const dataStats = [
    {
      key: "barrierFree",
      value: "340+",
    },
    {
      key: "accessibleRoutes",
      value: "3,200km",
    },
    {
      key: "multilingual",
      value: "128",
    },
  ] as const;

  const apiSources = [
    { key: "barrierFree", primary: true },
    { key: "domestic", primary: true },
    { key: "multilingual", primary: true },
    { key: "related", primary: true },
    { key: "kakao", primary: false },
    { key: "busanData", primary: false },
  ] as const;

  function toggle(id: string) {
    setCompanions(
      companions.includes(id)
        ? companions.filter(c => c !== id)
        : [...companions, id]
    );
  }

  // Aggregate impact bullets (deduplicated)
  const allImpacts = companionCards
    .filter(c => companions.includes(c.id))
    .flatMap(c => c.impacts.map(text => ({ text, color: c.color })));

  const uniqueImpacts = allImpacts.filter(
    (item, i, arr) => arr.findIndex(x => x.text === item.text) === i
  );

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1.35fr) minmax(300px, 0.95fr)",
        width: "100%",
        minHeight: "calc(100dvh - 62px)",
      }}
    >
      {/* ══ LEFT — question area ═══════════════════════════ */}
      <div style={{
        minWidth: 0,
        padding: "clamp(28px, 3.5vw, 52px) clamp(24px, 4vw, 56px) 48px",
        display: "flex", flexDirection: "column",
        overflowY: "auto",
      }}>
        {/* Step label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#5B54D6" }} />
            <span style={{
              fontSize: 13, fontWeight: 700, color: "#5B54D6",
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              {t("desktopPages.onboarding.step")}
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#EEEDFA", borderRadius: 6, padding: "3px 8px", marginLeft: 8 }}>
              <MapPin size={10} color="#5B54D6" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#5B54D6" }}>{t("common.pilotRegion")}</span>
            </div>
          </div>
          <h1 style={{
            fontSize: "clamp(28px, 2.4vw, 42px)", fontWeight: 900, color: "#1A1B2E",
            margin: "0 0 14px", letterSpacing: -1,
          }}>
            {t("desktopPages.onboarding.title")}
          </h1>
          <p style={{
            fontSize: "clamp(15px, 1.15vw, 19px)", color: "#6B6B88",
            margin: 0, lineHeight: 1.65, fontWeight: 400, maxWidth: "min(720px, 100%)",
          }}>
            {t("desktopPages.onboarding.desc")}
          </p>
        </motion.div>

        {/* Companion chips */}
        <div style={{ display: "flex", gap: "clamp(10px, 1.2vw, 18px)", flexWrap: "wrap", marginBottom: 36 }}>
          {companionCards.map((c, i) => {
            const CIcon = c.Icon;
            const sel = companions.includes(c.id);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
                onClick={() => toggle(c.id)}
                style={{
                  width: "clamp(148px, 14vw, 178px)", padding: "clamp(18px, 2vw, 24px) clamp(14px, 1.5vw, 18px)",
                  borderRadius: 16,
                  border: `2px solid ${sel ? c.color : "#E4E6EF"}`,
                  background: sel ? c.bg : "white",
                  cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  position: "relative",
                  boxShadow: sel ? `0 4px 16px ${c.color}22` : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                {sel && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 18, height: 18, borderRadius: "50%",
                    background: c.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: sel ? `${c.color}18` : "#F4F5FA",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <CIcon size={22} color={sel ? c.color : "#9EA0B8"} />
                </div>
                <div style={{
                  fontSize: "clamp(14px, 1.05vw, 17px)", fontWeight: 700,
                  color: sel ? c.color : "#1A1B2E",
                  marginBottom: 4, letterSpacing: -0.2,
                }}>
                  {c.label}
                </div>
                <div style={{
                  fontSize: "clamp(12px, 0.9vw, 14px)", lineHeight: 1.4,
                  color: sel ? `${c.color}BB` : "#9EA0B8",
                }}>
                  {c.sub}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selection summary */}
        {companions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#EEEDFA", borderRadius: 12,
              padding: "13px 18px", marginBottom: 28,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <Database size={15} color="#5B54D6" />
            <span style={{ fontSize: "clamp(14px, 1vw, 17px)", fontWeight: 600, color: "#4A3EB8" }}>
              {t("desktopPages.onboarding.selectedCount", { count: String(companions.length) })}
              {companions.length >= 2 && ` - ${t("desktopPages.onboarding.selectedCountDetail")}`}
            </span>
          </motion.div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <motion.button
            whileHover={companions.length > 0 ? { scale: 1.02 } : {}}
            onClick={() => companions.length > 0 && navigate("/desktop/conditions")}
            style={{
              padding: "15px 32px", borderRadius: 14,
              border: "none",
              background: companions.length > 0
                ? "linear-gradient(135deg, #6C66E0, #5B54D6)"
                : "#E4E6EF",
              color: companions.length > 0 ? "white" : "#A0A2B8",
              fontSize: "clamp(15px, 1.1vw, 18px)", fontWeight: 700,
              cursor: companions.length > 0 ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: companions.length > 0 ? "0 6px 20px rgba(91,84,214,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            {t("desktopPages.onboarding.cta")}
            <ChevronRight size={16} />
          </motion.button>
          {companions.length === 0 && (
            <span style={{ fontSize: 12, color: "#A0A2B8" }}>{t("desktopPages.onboarding.selectAtLeastOne")}</span>
          )}
        </div>
      </div>

      {/* ══ RIGHT — impact preview ═════════════════════════ */}
      <div style={{
        minWidth: 0,
        background: "white",
        borderLeft: "1.5px solid #E4E6EF",
        padding: "clamp(28px, 3.5vw, 52px) clamp(22px, 3vw, 36px) 48px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 0,
      }}>
        {/* Mascot illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}
        >
          <OnboardingMascot />
        </motion.div>

        {/* Impact section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14,
          }}>
            {t("desktopPages.onboarding.optimizationTitle")}
          </div>
          {uniqueImpacts.length === 0 ? (
            <div style={{
              background: "#F6F7FB", borderRadius: 14,
              padding: "28px 20px", textAlign: "center",
            }}>
              <Shield size={32} color="#D0D2DC" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: "clamp(14px, 1vw, 16px)", color: "#B0B2C4", margin: 0, lineHeight: 1.5 }}>
                {t("desktopPages.onboarding.optimizationEmpty")}
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {uniqueImpacts.map((item, i) => (
                <motion.div
                  key={`${item.color}:${item.text}`}
                  layout={false}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 13px", borderRadius: 10,
                    background: `${item.color}0A`,
                    border: `1px solid ${item.color}20`,
                  }}
                >
                  <Check size={12} color={item.color} strokeWidth={2.5} />
                  <span style={{ fontSize: "clamp(13px, 0.95vw, 16px)", color: "#3A3A5A", fontWeight: 500 }}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F0F1F6", marginBottom: 24 }} />

        {/* Data stats */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12,
          }}>
            {t("desktopPages.onboarding.statsTitle")}
          </div>
          {dataStats.map(stat => (
            <div key={stat.key} style={{
              marginBottom: 8, padding: "12px 14px",
              background: "#F6F7FB", borderRadius: 10,
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: "clamp(12px, 0.95vw, 14px)", color: "#6B6B88" }}>
                  {t(`desktopPages.onboarding.stats.${stat.key}.label`)}
                </span>
                <span style={{
                  fontSize: "clamp(17px, 1.4vw, 22px)", fontWeight: 800, color: "#5B54D6",
                  letterSpacing: -0.5,
                }}>
                  {stat.value}
                </span>
              </div>
              <div style={{ fontSize: 11, color: "#A0A2B8", marginTop: 2 }}>
                {t(`desktopPages.onboarding.stats.${stat.key}.note`)}
              </div>
            </div>
          ))}
        </div>

        {/* API sources — KTO first and prominent */}
        <div>
          <div style={{
            fontSize: 12, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10,
          }}>
            {t("desktopPages.onboarding.sourcesTitle")}
          </div>
          {apiSources.map((src, i) => (
            <div key={src.key} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 0",
              borderBottom: i < apiSources.length - 1 ? "1px solid #F4F5FA" : "none",
            }}>
              <Database size={10} color={src.primary ? "#5B54D6" : "#B0B2C0"} />
              <span style={{
                fontSize: "clamp(12px, 0.9vw, 14px)",
                color: src.primary ? "#4A4A6A" : "#9EA0B8",
                fontWeight: src.primary ? 600 : 400,
              }}>{t(`desktopPages.onboarding.sources.${src.key}`)}</span>
              {src.primary && i === 0 && (
                <div style={{ marginLeft: "auto", background: "#EEEDFA", borderRadius: 4, padding: "1px 6px" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#5B54D6" }}>{t("desktopPages.onboarding.primaryBadge")}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}