import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ChevronRight, Star, Clock, Footprints, Users, Info, CheckCircle,
  BarChart2, Shield, Zap, TrendingUp, Bookmark, Share2, Map, Navigation,
  MapPin, Database, AlertTriangle,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { PLACES, COMPANION_LIST } from "../data/places";
import { TopNav } from "./TopNav";
import { useI18n } from "../i18n/I18nContext";
import { StepIndicator } from "./StepIndicator";
import { KorWithLiveSection } from "./KorWithLiveSection";
import { LiveRecommendationList, DataSourceBadge } from "./recommendations/LiveRecommendationSection";
import {
  RecommendationMapFocusProvider,
  useRecommendationMapFocus,
} from "../context/RecommendationMapFocusContext";
import { useTourRecommendations } from "../lib/recommendations/useTourRecommendations";
import { markersFromRecommendations } from "../lib/tour/tourMapMarkers";
import { KakaoTourPlacesMap } from "./map/KakaoTourPlacesMap";
import { useCallback, useEffect, useMemo, useState } from "react";

function ScoreBadge({ score }: { score: number }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        background: "#5B54D6",
        borderRadius: 8,
        padding: "4px 10px",
      }}
    >
      <Star size={11} color="white" fill="white" />
      <span style={{ color: "white", fontSize: 12, fontWeight: 700 }}>{score.toFixed(1)}</span>
    </div>
  );
}

function WalkingBar({ level }: { level: number }) {
  return (
    <div style={{ display: "flex", gap: 3, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <div
          key={i}
          style={{
            width: 16,
            height: 4,
            borderRadius: 2,
            background: i <= level ? "#5B54D6" : "#E8E9EE",
          }}
        />
      ))}
    </div>
  );
}

function MiniBreakdownRow({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ color, flexShrink: 0 }}>{icon}</span>
      <span style={{ fontSize: 10, color: "#7A7A8E", fontWeight: 500, width: 52, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 4, borderRadius: 2, background: "#F0F1F5", overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          style={{ height: "100%", borderRadius: 2, background: color }}
        />
      </div>
      <span style={{ fontSize: 10, fontWeight: 700, color, minWidth: 20, textAlign: "right" }}>{value}</span>
    </div>
  );
}

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent(query)}`, "_blank");
}

function MobileRecommendationMapBundle() {
  const { busanArea } = useApp();
  const { locale } = useI18n();
  const recState = useTourRecommendations({ busanAreaId: busanArea, locale });
  const markers = useMemo(
    () => (recState.status === "ok" ? markersFromRecommendations(recState.items) : []),
    [recState],
  );
  const { selectedPlaceId, setSelectedPlaceId } = useRecommendationMapFocus();
  const itemsSyncKey =
    recState.status === "ok"
      ? recState.items.map((i) => `${i.id}:${i.lat}:${i.lng}`).join("|")
      : "";

  useEffect(() => {
    if (recState.status !== "ok") return;
    const items = recState.items;
    setSelectedPlaceId((prev) => {
      const ok =
        prev != null && items.some((i) => i.id === prev && i.lat != null && i.lng != null);
      if (ok) return prev;
      const first = items.find((i) => i.lat != null && i.lng != null);
      return first?.id ?? null;
    });
  }, [recState.status, itemsSyncKey, setSelectedPlaceId]);

  const onMarkerSelect = useCallback(
    (id: string) => {
      setSelectedPlaceId(id);
    },
    [setSelectedPlaceId],
  );

  useEffect(() => {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.log("[RecommendationMap] selectedPlaceId →", selectedPlaceId);
    }
  }, [selectedPlaceId]);

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A2E", marginBottom: 4 }}>
          실시간 관광지 지도
        </div>
        <div style={{ fontSize: 11, color: "#8E90A8", marginBottom: 10, lineHeight: 1.45 }}>
          카드 또는 마커를 선택하면 연동됩니다.
        </div>
        <KakaoTourPlacesMap
          markers={markers}
          selectedPlaceId={selectedPlaceId}
          onMarkerSelect={onMarkerSelect}
          style={{ height: 260, minHeight: 240 }}
        />
        {recState.status === "ok" && markers.length === 0 ? (
          <div style={{ marginTop: 8, fontSize: 12, color: "#6B6B88", lineHeight: 1.45 }}>
            표시할 좌표가 있는 장소가 없어 지도에 마커를 그리지 못했습니다.
          </div>
        ) : null}
      </div>
      <LiveRecommendationList state={recState} />
    </>
  );
}

export function RecommendationScreen() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const { companions, travelTime, setSelectedCourse, savedCourses, toggleSavedCourse, busanArea, selectedForComparison, toggleComparisonSelection } = useApp();
  const [shareToast, setShareToast] = useState<string | null>(null);
  const [showKtoPanel, setShowKtoPanel] = useState(false);

  const timeLabel = travelTime === "2h" ? "2시간" : travelTime === "half" ? "반나절" : "하루종일";
  const companionLabels = companions
    .map((c) => COMPANION_LIST.find((cl) => cl.id === c)?.label)
    .filter(Boolean)
    .join(", ");

  const handleShare = async (placeId: string, placeName: string) => {
    const text = `같이가능 부산 — ${placeName} 코스 공유`;
    const url = window.location.href;
    const line = `${text}\n${url}`;
    const toast = (msg: string) => {
      setShareToast(`"${placeName}" ${msg}`);
      setTimeout(() => setShareToast(null), 2500);
    };
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      try {
        await navigator.share({ title: text, text, url });
        toast("공유 창을 열었습니다");
        return;
      } catch (err) {
        const aborted =
          (err instanceof Error && err.name === "AbortError") ||
          (typeof DOMException !== "undefined" && err instanceof DOMException && err.name === "AbortError");
        if (aborted) return;
        try {
          await navigator.clipboard?.writeText(line);
          toast("링크가 복사되었습니다");
        } catch {
          toast("공유를 완료하지 못했습니다");
        }
        return;
      }
    }
    try {
      await navigator.clipboard?.writeText(line);
      toast("링크가 복사되었습니다");
    } catch {
      toast("링크를 복사하지 못했습니다");
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FC", display: "flex", flexDirection: "column" }}>
      <TopNav title="부산 추천 코스" />
      <StepIndicator current={4} />
      <div
        style={{
          fontSize: 11,
          color: "#6B6B88",
          padding: "6px 24px 10px",
          textAlign: "center",
          lineHeight: 1.5,
          borderBottom: "1px solid #EEF0F6",
          background: "#FAFBFF",
        }}
      >
        <span style={{ fontWeight: 800, color: "#5B54D6" }}>추천</span>
        <span style={{ color: "#C4C6D4", margin: "0 10px", fontWeight: 600 }}>→</span>
        <span style={{ fontWeight: 600, color: "#8E90A8" }}>탐색</span>
        <span style={{ color: "#C4C6D4", margin: "0 10px", fontWeight: 600 }}>→</span>
        <span style={{ fontWeight: 600, color: "#8E90A8" }}>비교</span>
        <span style={{ display: "block", marginTop: 4, fontSize: 10, color: "#A0A2B8", fontWeight: 500 }}>
          샘플 코스로 조건을 맞춰 보고, 탐색에서 실제 장소를 고른 뒤 비교로 이어가면 됩니다.
        </span>
      </div>

      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: "fixed", bottom: 100, left: "50%", transform: "translateX(-50%)",
          background: "#1A1A2E", color: "white", padding: "10px 20px",
          borderRadius: 10, fontSize: 13, fontWeight: 600, zIndex: 999,
          boxShadow: "0 4px 16px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
        }}>
          {shareToast}
        </div>
      )}

      <div style={{ padding: "20px 24px 14px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1A1A2E", margin: 0, marginBottom: 4, letterSpacing: -0.4 }}>
                공공데이터 기반 부산 코스 분석
              </h1>
              <p style={{ fontSize: 12, color: "#7A7A8E", margin: 0 }}>동행 조건을 반영해 부산 특화 코스를 제안합니다</p>
              <div
                style={{
                  marginTop: 8,
                  padding: "8px 10px",
                  borderRadius: 10,
                  background: "#FAFBFF",
                  border: "1px solid #EEF0F6",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                }}
              >
                <span style={{ fontSize: 10, fontWeight: 700, color: "#8E90A8", letterSpacing: 0.15 }}>
                  동행 조건에 맞춰 · 지도에서 비교하기
                </span>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 8,
                  }}
                >
                  <span style={{ fontSize: 11, color: "#6B6B88", lineHeight: 1.45 }}>
                    위 카드는 코스 아이디어용 샘플입니다. 실제 공개 장소를 골라 지도와 상세 정보까지 이어서 보려면 아래로 이동하세요.
                  </span>
                  <Link
                    to="/mobile/tour-debug"
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#5B54D6",
                      textDecoration: "none",
                      whiteSpace: "nowrap",
                      padding: "6px 12px",
                      borderRadius: 8,
                      border: "1px solid #E4E2F5",
                      background: "white",
                    }}
                  >
                    지도·상세로 탐색하기 →
                  </Link>
                </div>
              </div>
            </div>
            {/* KTO 기준 보기 */}
            <button
              onClick={() => setShowKtoPanel(!showKtoPanel)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 10px",
                borderRadius: 8,
                border: `1.5px solid ${showKtoPanel ? "#5B54D6" : "#E4E5EE"}`,
                background: showKtoPanel ? "#EEEDFA" : "white",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Database size={12} color={showKtoPanel ? "#5B54D6" : "#7A7A8E"} />
              <span style={{ fontSize: 11, fontWeight: 600, color: showKtoPanel ? "#5B54D6" : "#7A7A8E" }}>추천 기준</span>
            </button>
          </div>

          {/* KTO Panel */}
          {showKtoPanel && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              style={{
                background: "#F6F5FF",
                borderRadius: 12,
                padding: "12px 14px",
                marginBottom: 12,
                border: "1px solid #E4E2F5",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 8 }}>
                <Database size={12} color="#5B54D6" />
                <span style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6" }}>한국관광공사 OpenAPI 기반 분석</span>
              </div>
              {[
                { label: "무장애 여행정보로 접근성 확인", color: "#5B54D6" },
                { label: "관광정보 서비스로 장소 정보 보강", color: "#3D8B7A" },
                { label: "다국어 관광정보로 외국인 동행 지원", color: "#4A7BBF" },
                { label: "연관 관광지 정보로 코스 연결", color: "#C4793C" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                  <div style={{ width: 5, height: 5, borderRadius: "50%", background: item.color, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, color: "#3D3D5C", fontWeight: 500 }}>{item.label}</span>
                </div>
              ))}
            </motion.div>
          )}

          {/* Tags */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#F0F1F7", borderRadius: 7, padding: "4px 9px" }}>
              <MapPin size={11} color="#5B54D6" />
              <span style={{ fontSize: 11, color: "#5B54D6", fontWeight: 600 }}>부산</span>
            </div>
            {companionLabels && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EEEDFA", borderRadius: 8, padding: "5px 10px" }}>
                <Users size={12} color="#5B54D6" />
                <span style={{ fontSize: 12, color: "#5B54D6", fontWeight: 600 }}>{companionLabels}</span>
              </div>
            )}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 5, background: "#EAF0F8", borderRadius: 8, padding: "5px 10px" }}>
              <Clock size={12} color="#4A7BBF" />
              <span style={{ fontSize: 12, color: "#4A7BBF", fontWeight: 600 }}>{timeLabel}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ padding: "0 24px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
        <RecommendationMapFocusProvider>
          <MobileRecommendationMapBundle />
        </RecommendationMapFocusProvider>
        <KorWithLiveSection />
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "#A0A2B8", letterSpacing: 0.4, textTransform: "uppercase" }}>
            시연용 분석 코스 (데모 데이터)
          </div>
          <div style={{ fontSize: 10, color: "#B8BAC8", marginTop: 4, lineHeight: 1.45 }}>
            아래 카드의 점수·실행 가능성·동선 분석은 앱 시뮬레이션입니다. 실제 관광 안전·접근성은 현장 확인이 필요합니다.
          </div>
        </div>
        {PLACES.map((place, i) => (
          <motion.div
            key={place.id}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.08 + i * 0.08 }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 16,
                overflow: "hidden",
                border: `1px solid ${i === 0 ? "#C8C4F0" : "#E8E9EE"}`,
              }}
            >
              {/* Image — clickable to detail */}
              <button
                onClick={() => {
                  setSelectedCourse(place.id);
                  navigate(`/mobile/detail/${place.id}`);
                }}
                style={{ display: "block", width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer" }}
              >
                <div style={{ position: "relative", height: 150 }}>
                  <img src={place.image} alt={place.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)" }} />
                  
                  {/* Rank badge */}
                  <div style={{ position: "absolute", top: 12, left: 12 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: i === 0 ? "#5B54D6" : "rgba(255,255,255,0.92)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 13, fontWeight: 700, color: i === 0 ? "white" : "#1A1A2E",
                    }}>
                      {i + 1}
                    </div>
                  </div>

                  {/* Best badge */}
                  {i === 0 && (
                    <div style={{ position: "absolute", top: 12, left: 48 }}>
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        background: "rgba(255,255,255,0.92)", borderRadius: 6, padding: "4px 8px",
                      }}>
                        <Star size={10} color="#5B54D6" fill="#5B54D6" />
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>최적 추천</span>
                      </div>
                    </div>
                  )}

                  <div
                    style={{
                      position: "absolute",
                      top: 12,
                      right: 12,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                      gap: 6,
                    }}
                  >
                    <DataSourceBadge source="DEMO" />
                    <ScoreBadge score={place.score} />
                  </div>

                  {/* Busan area label */}
                  <div style={{ position: "absolute", bottom: 10, left: 12 }}>
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      background: "rgba(255,255,255,0.92)", borderRadius: 6, padding: "3px 8px",
                    }}>
                      <MapPin size={9} color="#5B54D6" />
                      <span style={{ fontSize: 10, fontWeight: 600, color: "#5B54D6" }}>{place.busanArea}</span>
                    </div>
                  </div>
                </div>
              </button>

              {/* Content */}
              <div style={{ padding: "16px 16px 0" }}>
                {/* Execution Feasibility Header (Prominent) */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: place.feasibility.successRate >= 80 ? "#E8F7F2" : "#FFF4F4", borderRadius: 8, padding: "6px 10px", flex: 1 }}>
                    <CheckCircle size={14} color={place.feasibility.successRate >= 80 ? "#2D8A6B" : "#D05050"} style={{ flexShrink: 0 }} />
                    <span style={{ fontSize: 13, color: place.feasibility.successRate >= 80 ? "#2D6B52" : "#A02020", fontWeight: 700 }}>
                      실행 가능성 {place.feasibility.successRate}%
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setSelectedCourse(place.id);
                    navigate(`/mobile/detail/${place.id}`);
                  }}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, width: "100%", background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: "left" }}
                >
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E", margin: 0, letterSpacing: -0.3 }}>{place.name}</h3>
                  <ChevronRight size={20} color="#A0A0B0" />
                </button>

                {/* Recommendation reason (one-liner) */}
                <div style={{
                  background: "#F6F5FF",
                  borderRadius: 10,
                  padding: "10px 12px",
                  marginBottom: 12,
                  borderLeft: "3px solid #5B54D6",
                  display: "flex", flexDirection: "column", gap: 4,
                }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>추천 이유</div>
                  <span style={{ fontSize: 12, color: "#3D3D5C", fontWeight: 500, lineHeight: 1.4 }}>
                    {place.recommendReason}
                  </span>
                </div>

                {/* Data row */}
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={12} color="#7A7A8E" />
                    <span style={{ fontSize: 11, color: "#4A4A6A", fontWeight: 500 }}>{place.duration}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Footprints size={12} color="#7A7A8E" />
                    <WalkingBar level={place.walkingLevel} />
                    <span style={{ fontSize: 10, color: "#7A7A8E", fontWeight: 500 }}>{place.walkingAmount}</span>
                  </div>
                </div>

                {/* Score Breakdown mini bars */}
                <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 10 }}>
                  <MiniBreakdownRow label="접근성" value={place.scoreBreakdown.accessibility} color="#5B54D6" icon={<Shield size={10} />} />
                  <MiniBreakdownRow label="동행 적합" value={place.scoreBreakdown.companionFit} color="#3D8B7A" icon={<Users size={10} />} />
                  <MiniBreakdownRow label="혼잡 안정" value={place.scoreBreakdown.crowdStability} color="#B07AAF" icon={<Zap size={10} />} />
                </div>

                {/* Caution / risk row */}
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 12 }}>
                  {place.feasibility.risks.some(r => r.riskLevel === "high") ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#FFF4F4", borderRadius: 6, padding: "5px 8px" }}>
                      <AlertTriangle size={11} color="#D05050" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#D05050" }}>
                        일부 시간대 혼잡 가능
                      </span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#F0F1F5", borderRadius: 6, padding: "5px 8px" }}>
                      <TrendingUp size={11} color="#7A7A8E" />
                      <span style={{ fontSize: 11, fontWeight: 500, color: "#7A7A8E" }}>
                        주의 요소 없음
                      </span>
                    </div>
                  )}
                  {place.alternatives && place.alternatives.length > 0 && (
                    <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#E8F7F2", borderRadius: 6, padding: "5px 8px" }}>
                      <MapPin size={11} color="#2D8A6B" />
                      <span style={{ fontSize: 11, fontWeight: 600, color: "#2D6B52" }}>
                        대안 코스 제공 가능
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action row: Save + Compare + Map + View */}
              <div style={{ display: "flex", borderTop: "1px solid #F0F1F6" }}>
                <button
                  onClick={() => toggleSavedCourse(place.id)}
                  style={{
                    flex: 1, padding: "11px 0", border: "none", borderRight: "1px solid #F0F1F6",
                    background: savedCourses.includes(place.id) ? "#EEEDFA" : "white",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <Bookmark
                    size={14}
                    color={savedCourses.includes(place.id) ? "#5B54D6" : "#A0A0B0"}
                    fill={savedCourses.includes(place.id) ? "#5B54D6" : "none"}
                  />
                  <span style={{ fontSize: 11, fontWeight: 600, color: savedCourses.includes(place.id) ? "#5B54D6" : "#7A7A8E" }}>
                    {savedCourses.includes(place.id) ? "저장됨" : "저장"}
                  </span>
                </button>

                {/* 비교 담기 button */}
                <button
                  onClick={() => toggleComparisonSelection(place.id)}
                  style={{
                    flex: 1, padding: "11px 0", border: "none", borderRight: "1px solid #F0F1F6",
                    background: selectedForComparison.includes(place.id) ? "#EEEDFA" : "white",
                    cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}
                >
                  <BarChart2 size={13} color={selectedForComparison.includes(place.id) ? "#5B54D6" : "#A0A0B0"} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: selectedForComparison.includes(place.id) ? "#5B54D6" : "#7A7A8E" }}>
                    {selectedForComparison.includes(place.id) ? "비교중" : "비교 담기"}
                  </span>
                </button>

                {/* Kakao Map button */}
                <button
                  onClick={() => openKakaoMap(`부산 ${place.name}`)}
                  style={{
                    flex: 1, padding: "11px 0", border: "none", borderRight: "1px solid #F0F1F6",
                    background: "#FFFBF0", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                  }}
                >
                  <Map size={13} color="#F9A825" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#B8820A" }}>지도</span>
                </button>

                <button
                  onClick={() => { setSelectedCourse(place.id); navigate(`/mobile/detail/${place.id}`); }}
                  style={{
                    flex: 2, padding: "11px 0", border: "none",
                    background: i === 0 ? "#EEEDFA" : "white",
                    cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 700, color: i === 0 ? "#5B54D6" : "#4A4A6A" }}>자세히 보기</span>
                  <ChevronRight size={13} color={i === 0 ? "#5B54D6" : "#A0A0B0"} />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Compare CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <button
            onClick={() => navigate("/mobile/compare")}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #5B54D6",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "rgba(255,255,255,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <BarChart2 size={19} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 1 }}>코스 상세 비교 분석</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
                {selectedForComparison.length > 0
                  ? `${selectedForComparison.length}개 코스 비교 준비 완료 · 지금 비교하기`
                  : "부산 코스 점수·시설·실행 가능성 한눈에 비교"}
              </div>
            </div>
            <ChevronRight size={17} color="white" />
          </button>
        </motion.div>

        {/* Kakao Map full route CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={() => openKakaoMap("부산 관광 접근성 코스")}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #F9A825",
              background: "#FFFBF0",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 10,
              textAlign: "left",
            }}
          >
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: "#F9A825",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <Navigation size={19} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#B8820A", marginBottom: 1 }}>카카오맵 길찾기 열기</div>
              <div style={{ fontSize: 12, color: "#C49A2A", fontWeight: 400 }}>코스 간 이동 경로 전체 보기</div>
            </div>
            <ChevronRight size={17} color="#C49A2A" />
          </button>
        </motion.div>

        {/* Info tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          style={{ background: "#F0F1F5", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}
        >
          <Info size={14} color="#7A7A8E" />
          <span style={{ fontSize: 12, color: "#7A7A8E", fontWeight: 400, lineHeight: 1.5 }}>
            같이가능 점수는 한국관광공사 무장애 여행정보를 기반으로 접근성·동행자 적합도·보행 부담·혼잡 안정성·이동 연결성 5개 항목을 종합 분석한 결과입니다
          </span>
        </motion.div>
      </div>
    </div>
  );
}