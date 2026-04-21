import { useParams, useNavigate, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Clock, Footprints, Star, MapPin, ChevronRight, Info,
  Accessibility, Coffee, Car, Headphones, Globe, Baby, ArrowUpDown, Map, Navigation, CheckCircle,
  BarChart2, Wallet, Shield, Users, Route,
  Zap, TrendingUp, Activity, AlertTriangle, Database,
} from "lucide-react";
import { PLACES, FACILITY_INFO } from "../data/places";
import { TopNav } from "./TopNav";
import { TourApiPlaceDetail } from "./tour/TourApiPlaceDetail";
import { loadTourRecommendation } from "../lib/recommendations/tourRecommendationStorage";
import type { NormalizedRecommendation } from "../lib/recommendations/recommendationModel";
import { isTourApiDetailRoute } from "../lib/recommendations/tourDetailRouting";
import { useI18n } from "../i18n/I18nContext";

const FACILITY_ICONS: Record<string, React.ReactNode> = {
  elevator: <ArrowUpDown size={18} color="#5B54D6" />,
  accessible_restroom: <Accessibility size={18} color="#5B54D6" />,
  parking: <Car size={18} color="#5B54D6" />,
  cafe: <Coffee size={18} color="#5B54D6" />,
  nursing_room: <Baby size={18} color="#5B54D6" />,
  guide_map: <Map size={18} color="#5B54D6" />,
  audio_guide: <Headphones size={18} color="#5B54D6" />,
  foreign_guide: <Globe size={18} color="#5B54D6" />,
  wheelchair_rental: <Accessibility size={18} color="#5B54D6" />,
};

const SCORE_BREAKDOWN_CONFIG = [
  { key: "accessibility" as const, labelKey: "detail.score.accessibility", icon: <Shield size={13} />, color: "#5B54D6" },
  { key: "companionFit" as const, labelKey: "detail.score.companionFit", icon: <Users size={13} />, color: "#3D8B7A" },
  { key: "walkingLoad" as const, labelKey: "detail.score.walkingLoad", icon: <Footprints size={13} />, color: "#4A7BBF" },
  { key: "crowdStability" as const, labelKey: "detail.score.crowdStability", icon: <Zap size={13} />, color: "#B07AAF" },
  { key: "connectivity" as const, labelKey: "detail.score.connectivity", icon: <TrendingUp size={13} />, color: "#C4793C" },
];

const RISK_COLOR: Record<string, string> = { low: "#2D8A6B", medium: "#C4793C", high: "#D05050" };
const RISK_BG: Record<string, string> = { low: "#E8F7F2", medium: "#FFF1E3", high: "#FFE8E8" };

function ScoreBar({ value, color, delay = 0 }: { value: number; color: string; delay?: number }) {
  return (
    <div style={{ flex: 1, height: 8, borderRadius: 4, background: "#F0F1F5", overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.7, delay, ease: "easeOut" }}
        style={{
          height: "100%",
          borderRadius: 4,
          background: `linear-gradient(90deg, ${color}, ${color}BB)`,
        }}
      />
    </div>
  );
}

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent(query)}`, "_blank");
}

function openKakaoRoute(name: string, lat: number | undefined, lng: number | undefined, regionPrefix: string) {
  if (lat && lng) {
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(name)},${lat},${lng}`, "_blank");
  } else {
    window.open(`https://map.kakao.com/?q=${encodeURIComponent(`${regionPrefix} ${name}`)}`, "_blank");
  }
}

export function DetailScreen() {
  const { t } = useI18n();
  const regionPrefix = t("common.regionBusan");
  const riskLabel: Record<string, string> = {
    low: t("detail.risk.low"),
    medium: t("detail.risk.medium"),
    high: t("detail.risk.high"),
  };
  const { id = "" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const fromState = (location.state as { tourRecommendation?: NormalizedRecommendation } | null)
    ?.tourRecommendation;
  const stored = id ? loadTourRecommendation(id) : null;
  const tourItem =
    fromState && fromState.id === id ? fromState : stored && stored.id === id ? stored : null;

  if (id && isTourApiDetailRoute(id, tourItem)) {
    return (
      <TourApiPlaceDetail
        variant="mobile"
        contentId={id}
        initialItem={tourItem}
        onBack={() => navigate(-1)}
      />
    );
  }

  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const { successRate, risks } = place.feasibility;
  const highRisks = risks.filter((r) => r.riskLevel === "high");
  const overallScore = place.score;
  const successColor = successRate >= 85 ? "#2D8A6B" : successRate >= 70 ? "#5B54D6" : successRate >= 55 ? "#C4793C" : "#D05050";

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FC" }}>
      <TopNav title={place.name} />

      {/* Hero */}
      <div style={{ position: "relative", height: 200 }}>
        <img src={place.image} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.55) 100%)" }} />
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.9)", borderRadius: 6, padding: "3px 8px" }}>
              <MapPin size={10} color="#5B54D6" />
              <span style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>부산 · {place.busanArea}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h1 style={{ color: "white", fontSize: 19, fontWeight: 700, margin: 0, letterSpacing: -0.3 }}>{place.name}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.95)", borderRadius: 8, padding: "5px 10px" }}>
              <Star size={13} color="#5B54D6" fill="#5B54D6" />
              <span style={{ fontSize: 15, fontWeight: 700, color: "#5B54D6" }}>{overallScore.toFixed(1)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Key metrics strip */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", background: "white", borderBottom: "1px solid #E8E9EE" }}>
        {[
          { label: t("detail.metric.duration"), value: place.duration, icon: <Clock size={16} color="#5B54D6" /> },
          { label: t("detail.metric.estimatedWalk"), value: place.estimatedSteps, icon: <Footprints size={16} color="#5B54D6" /> },
          { label: t("detail.metric.walkingLoad"), value: place.walkingAmount, icon: <Navigation size={16} color="#5B54D6" /> },
        ].map((item) => (
          <div key={item.label} style={{ padding: "14px 10px", textAlign: "center", borderRight: "1px solid #F0F1F5" }}>
            <div style={{ marginBottom: 4 }}>{item.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E" }}>{item.value}</div>
            <div style={{ fontSize: 10, color: "#A0A0B0", marginTop: 2 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Primary CTAs */}
      <div style={{ padding: "12px 20px 10px", background: "white", borderBottom: "1px solid #E8E9EE", display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={() => navigate(`/mobile/course/${place.id}`)}
          style={{
            width: "100%", padding: "14px", borderRadius: 12, border: "none",
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
            color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 16px rgba(91,84,214,0.3)",
          }}
        >
          이 코스로 출발하기
          <ChevronRight size={17} />
        </button>

        {/* Kakao Map CTAs */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => openKakaoMap(`${regionPrefix} ${place.name}`)}
            style={{
              flex: 1, padding: "11px 12px", borderRadius: 10,
              border: "1.5px solid #F9A825", background: "#FFFBF0",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Map size={14} color="#F9A825" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#B8820A" }}>카카오맵으로 보기</span>
          </button>
          <button
            onClick={() => openKakaoRoute(place.name, place.lat, place.lng, regionPrefix)}
            style={{
              flex: 1, padding: "11px 12px", borderRadius: 10,
              border: "1.5px solid #E8E9EE", background: "white",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <Navigation size={14} color="#5B54D6" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#5B54D6" }}>카카오맵 길찾기</span>
          </button>
        </div>
      </div>

      {/* ── Data Explorer Row ── */}
      <div style={{ background: "white", borderBottom: "1px solid #E8E9EE", padding: "12px 16px 14px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#9EA0B8", letterSpacing: 0.3, marginBottom: 10, textTransform: "uppercase" as const }}>
          데이터 탐색
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 6 }}>
          {[
            { label: t("detail.explorer.map"),    icon: Route,    path: `/mobile/map/${place.id}`,           color: "#5B54D6" },
            { label: t("detail.explorer.crowd"),  icon: BarChart2, path: `/mobile/crowd/${place.id}`,        color: "#3D8B7A" },
            { label: t("detail.explorer.budget"), icon: Wallet,   path: `/mobile/cost/${place.id}`,          color: "#C4793C" },
            { label: t("detail.explorer.accessibility"),  icon: Users,    path: `/mobile/accessibility/${place.id}`, color: "#B07AAF" },
            { label: t("detail.explorer.safety"),    icon: Shield,   path: `/mobile/safety/${place.id}`,        color: "#E05C6A" },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                onClick={() => navigate(item.path)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
                  padding: "11px 4px", borderRadius: 12,
                  border: "1.5px solid #E8E9EF",
                  background: `${item.color}08`,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9,
                  background: `${item.color}18`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Icon size={15} color={item.color} />
                </div>
                <span style={{ fontSize: 10, fontWeight: 700, color: item.color, letterSpacing: -0.2 }}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: 14 }}
      >
        {/* Recommendation reason */}
        <div style={{ background: "#F6F5FF", borderRadius: 14, padding: "14px 16px", border: "1px solid #E4E2F5" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <Info size={13} color="#5B54D6" />
            <span style={{ fontSize: 12, fontWeight: 600, color: "#5B54D6" }}>이 코스를 추천하는 이유</span>
          </div>
          <p style={{ fontSize: 13, color: "#3D3D5C", lineHeight: 1.6, margin: 0, fontWeight: 500, marginBottom: 8 }}>
            {place.recommendReason}
          </p>
          <p style={{ fontSize: 12, color: "#4A4A6A", lineHeight: 1.6, margin: 0, fontWeight: 400 }}>{place.reasonText}</p>
        </div>

        {/* Evidence */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#F0FAF6", borderRadius: 10, padding: "10px 12px" }}>
          <CheckCircle size={13} color="#2D8A6B" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: "#2D6B52", fontWeight: 500, lineHeight: 1.4 }}>{place.evidence}</span>
        </div>

        {/* === SCORE SECTION === */}
        <div
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E9EE",
            overflow: "hidden",
          }}
        >
          {/* Score header */}
          <div
            style={{
              background: "linear-gradient(135deg, #5B54D6, #7C75E8)",
              padding: "16px 18px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.75)", fontWeight: 500, marginBottom: 2 }}>
                같이가능 종합 점수
              </div>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: "white", lineHeight: 1 }}>{overallScore.toFixed(1)}</span>
                <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)" }}>/10</span>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 8px" }}>
                <Database size={10} color="white" />
                <span style={{ fontSize: 10, fontWeight: 600, color: "white" }}>KTO OpenAPI</span>
              </div>
              {place.tags.slice(0, 1).map((tag) => (
                <span
                  key={tag}
                  style={{
                    fontSize: 10, fontWeight: 600, color: "white",
                    background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "4px 8px",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Score interpretation */}
          <div style={{ padding: "14px 18px 0" }}>
            <div
              style={{
                background: "#F6F5FF",
                borderRadius: 10,
                padding: "10px 12px",
                marginBottom: 14,
                borderLeft: "3px solid #5B54D6",
              }}
            >
              <div style={{ display: "flex", gap: 6, alignItems: "flex-start" }}>
                <Info size={12} color="#5B54D6" style={{ flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 12, color: "#3D3D5C", lineHeight: 1.6, margin: 0 }}>
                  {place.scoreBreakdown.interpretationText}
                </p>
              </div>
            </div>
          </div>

          {/* Breakdown bars */}
          <div style={{ padding: "0 18px 16px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#7A7A8E", marginBottom: 12, textTransform: "uppercase", letterSpacing: 0.5 }}>
              세부 점수 분석
            </div>
            {SCORE_BREAKDOWN_CONFIG.map(({ key, labelKey, icon, color }, i) => (
              <div key={key} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ color }}>{icon}</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: "#4A4A6A" }}>{t(labelKey)}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color }}>{place.scoreBreakdown[key]}</span>
                </div>
                <ScoreBar value={place.scoreBreakdown[key]} color={color} delay={0.1 + i * 0.06} />
              </div>
            ))}
          </div>
        </div>

        {/* === FEASIBILITY PREVIEW === */}
        <button
          onClick={() => navigate(`/mobile/feasibility/${place.id}`)}
          style={{
            width: "100%",
            background: "white",
            border: `1.5px solid ${highRisks.length > 0 ? "#FECACA" : "#E8E9EE"}`,
            borderRadius: 14,
            padding: "14px 16px",
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 40, height: 40, borderRadius: 10,
                background: successRate >= 85 ? "#E8F7F2" : successRate >= 70 ? "#EEEDFA" : "#FFF4F4",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <Activity size={20} color={successColor} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "#7A7A8E", fontWeight: 500, marginBottom: 2 }}>이동 가능성 시뮬레이션</div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 20, fontWeight: 800, color: successColor }}>{successRate}%</span>
                <span style={{ fontSize: 12, color: "#7A7A8E" }}>실현 가능성</span>
                {highRisks.length > 0 && (
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#D05050", background: "#FFE8E8", borderRadius: 4, padding: "2px 6px" }}>
                    위험 {highRisks.length}구간
                  </span>
                )}
              </div>
            </div>
            <ChevronRight size={18} color="#A0A0B0" />
          </div>

          {/* Progress bar */}
          <div style={{ height: 6, borderRadius: 3, background: "#F0F1F5", overflow: "hidden", marginTop: 12 }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${successRate}%` }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
              style={{ height: "100%", borderRadius: 3, background: successColor }}
            />
          </div>

          {/* Risk hint */}
          {risks.length > 0 && (
            <div style={{ display: "flex", gap: 5, marginTop: 10, flexWrap: "wrap" }}>
              {risks.slice(0, 2).map((r) => (
                <span
                  key={r.name}
                  style={{
                    fontSize: 10, fontWeight: 500,
                    color: RISK_COLOR[r.riskLevel],
                    background: RISK_BG[r.riskLevel],
                    borderRadius: 4, padding: "2px 7px",
                    display: "flex", alignItems: "center", gap: 3,
                  }}
                >
                  {r.riskLevel === "high" && <AlertTriangle size={9} />}
                  {r.name} · {riskLabel[r.riskLevel]}
                </span>
              ))}
              {risks.length > 2 && (
                <span style={{ fontSize: 10, color: "#7A7A8E", padding: "2px 0" }}>+{risks.length - 2}개 더</span>
              )}
            </div>
          )}
        </button>

        {/* Description */}
        <div style={{ background: "white", borderRadius: 14, padding: "16px", border: "1px solid #E8E9EE" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", margin: 0, marginBottom: 8 }}>코스 소개</h3>
          <p style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.65, margin: 0, fontWeight: 400 }}>{place.description}</p>
        </div>

        {/* Info */}
        <div style={{ background: "white", borderRadius: 14, padding: "16px", border: "1px solid #E8E9EE" }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", margin: 0, marginBottom: 10 }}>기본 정보</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <MapPin size={14} color="#7A7A8E" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.4 }}>{place.address}</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Clock size={14} color="#7A7A8E" style={{ marginTop: 2, flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: "#4A4A6A" }}>{place.operatingHours}</span>
            </div>
          </div>
        </div>

        {/* Facilities */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", margin: "0 0 10px" }}>접근성·편의 시설</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
            {place.facilities.map((f) => {
              const info = FACILITY_INFO[f];
              if (!info) return null;
              return (
                <div
                  key={f}
                  style={{
                    background: "white", borderRadius: 12, padding: "12px 8px",
                    border: "1px solid #E8E9EE",
                    display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
                  }}
                >
                  {FACILITY_ICONS[f] || <Accessibility size={18} color="#5B54D6" />}
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#4A4A6A", textAlign: "center", lineHeight: 1.3 }}>{info.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Place step links */}
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", margin: "0 0 8px" }}>장소별 상세 정보</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {place.courseSteps.filter(s => s.type === "place").map((step, i) => (
              <div
                key={i}
                onClick={() => navigate(`/mobile/feasibility/${place.id}`)}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 12,
                  border: "1px solid #E8E9EF", background: "white",
                  cursor: "pointer",
                  width: "100%",
                  boxSizing: "border-box" as const,
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 9, background: "#EEEDFA",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                }}>
                  <MapPin size={14} color="#5B54D6" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>{step.name}</div>
                  {step.subname && <div style={{ fontSize: 11, color: "#9EA0B8" }}>{step.subname}</div>}
                </div>
                {/* Kakao Map mini button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openKakaoMap(`${regionPrefix} ${step.name}`);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 3,
                    padding: "4px 8px", borderRadius: 6,
                    border: "1px solid #F9A825", background: "#FFFBF0",
                    cursor: "pointer",
                  }}
                >
                  <Map size={11} color="#F9A825" />
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#B8820A" }}>지도</span>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* KTO data note */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#F0F1F5", borderRadius: 10, padding: "10px 12px" }}>
          <Database size={13} color="#7A7A8E" style={{ flexShrink: 0, marginTop: 1 }} />
          <span style={{ fontSize: 11, color: "#7A7A8E", fontWeight: 400, lineHeight: 1.5 }}>
            일부 시설 정보는 한국관광공사 무장애 여행 OpenAPI 기반으로 수집되었으며, 현장 상황에 따라 달라질 수 있습니다. 방문 전 확인을 권장합니다.
          </span>
        </div>

        {/* Secondary actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 16 }}>
          <button
            onClick={() => navigate(`/mobile/execution/${place.id}`)}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 16px rgba(91,84,214,0.3)",
            }}
          >
            <Route size={16} />
            이 코스로 실행 시작
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => navigate(`/mobile/alternatives/${place.id}`)}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              border: "1.5px solid #E8E9EE", background: "white",
              color: "#4A4A6A", fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <BarChart2 size={16} />
            대안 코스 비교하기
            <ChevronRight size={16} />
          </button>

          <button
            onClick={() => openKakaoMap(`${regionPrefix} ${place.busanArea} ${t("detail.explorer.map")}`)}
            style={{
              width: "100%", padding: "14px", borderRadius: 12,
              border: "1.5px solid #F9A825", background: "#FFFBF0",
              color: "#B8820A", fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
            }}
          >
            <Navigation size={16} color="#F9A825" />
            대안 코스 지도 다시 보기
          </button>
        </div>
      </motion.div>
    </div>
  );
}