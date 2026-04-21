import { useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ChevronRight, Clock, Users, MapPin,
  Database, ArrowUpDown, BarChart2, Navigation,
} from "lucide-react";
import { useApp } from "../context/AppContext";
import { COMPANION_LIST, PLACES } from "../data/places";
import { TopNav } from "./TopNav";
import { useI18n } from "../i18n/I18nContext";
import { StepIndicator } from "./StepIndicator";
import { LiveRecommendationList } from "./recommendations/LiveRecommendationSection";
import {
  RecommendationMapFocusProvider,
} from "../context/RecommendationMapFocusContext";
import { useRecommendationsExploreModel } from "../lib/recommendations/useRecommendationsExploreModel";
import { LeafletTourPlacesMap } from "./map/LeafletTourPlacesMap";
import { type LiveSortKey } from "../lib/recommendations/sortRecommendations";
import { SimulationCoursesCollapsible } from "./recommendations/SimulationCoursesCollapsible";
import { openExternalMapSearch } from "../lib/maps/externalMapLinks";
import type { NormalizedRecommendation } from "../lib/recommendations/recommendationModel";
import {
  MAP_BLOCK_TITLE_KO,
  SERVICE_ONE_LINER_KO,
  RESULT_PUBLIC_DATA_BANNER_KO,
} from "../lib/copy/trustMessaging";
import { isDemoMode } from "../lib/demoMode";

/* ─── 지도 + TourAPI 목록 (로직은 useRecommendationsExploreModel) ── */
function MobileRecommendationMapBundle() {
  const buildDetailPath = useCallback(
    (item: NormalizedRecommendation) => `/mobile/detail/${item.id}`,
    [],
  );
  const {
    liveSortBy,
    setLiveSortBy,
    displayRecState,
    categoryTab,
    setCategoryTab,
    visibleGroupedSections,
    kindSummaryLine,
    composedCourseDescription,
    rankById,
    routeItems: listRouteItems,
    markers,
    selectedPlaceId,
    onMarkerSelect,
    mapStatusMessage,
    goTourDetail,
    compactListHints,
  } = useRecommendationsExploreModel({
    buildDetailPath,
    compactListHints: true,
  });

  const demo = isDemoMode();

  return (
    <>
      {displayRecState.status === "ok" && (
        <div
          style={{
            marginBottom: 12,
            padding: "11px 14px",
            borderRadius: 12,
            background: "white",
            border: "1px solid #E4E6EF",
            boxShadow: "0 2px 8px rgba(26,26,46,0.04)",
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A2E", marginBottom: 4 }}>
            추천 결과 요약
          </div>
          <p style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
            <strong style={{ color: "#5B54D6", fontSize: 15 }}>{displayRecState.items.length}</strong>
            가지 추천 코스가 생성되었습니다.
            {displayRecState.usedFallback ? (
              <span style={{ color: "#92400E", fontSize: 11, fontWeight: 500 }}>
                {" "}
                (세부 검색 결과가 없어 부산 전체 목록으로 보조했습니다.)
              </span>
            ) : null}
          </p>
          <p style={{ fontSize: 11, color: "#5B54D6", fontWeight: 700, margin: "8px 0 0", lineHeight: 1.45 }}>
            {RESULT_PUBLIC_DATA_BANNER_KO}
          </p>
          <p style={{ fontSize: 10, color: "#9EA0B8", margin: "6px 0 0", lineHeight: 1.45 }}>
            CCTV·센서 실시간 스트림이 아니라, 현재 조건으로 요청한 공공 API 응답입니다.
          </p>
        </div>
      )}

      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A2E", marginBottom: 4 }}>
          {MAP_BLOCK_TITLE_KO}
        </div>
        <div style={{ fontSize: 11, color: "#8E90A8", marginBottom: 10, lineHeight: 1.45 }}>
          {demo
            ? "카드·마커를 누르면 같은 장소로 맞춰집니다(Leaflet 지도)."
            : "지도는 공공데이터로 가져온 위치를 보여 주는 참고용입니다. 핵심 흐름은 아래 추천 카드·상세 보기입니다."}
        </div>

        {demo ? (
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
            <ArrowUpDown size={12} color="#8E90A8" />
            <span style={{ fontSize: 11, color: "#8E90A8" }}>정렬:</span>
            {(["score", "walking", "duration"] as const).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setLiveSortBy(s as LiveSortKey)}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  border: `1.5px solid ${liveSortBy === s ? "#5B54D6" : "#E4E6EF"}`,
                  background: liveSortBy === s ? "#EEEDFA" : "white",
                  fontSize: 11,
                  fontWeight: liveSortBy === s ? 700 : 500,
                  color: liveSortBy === s ? "#5B54D6" : "#6B6B88",
                  cursor: "pointer",
                }}
              >
                {{ score: "추천순", walking: "접근성순", duration: "이름순" }[s]}
              </button>
            ))}
          </div>
        ) : null}
        <LeafletTourPlacesMap
          markers={markers}
          selectedPlaceId={selectedPlaceId}
          onMarkerSelect={onMarkerSelect}
          statusMessage={mapStatusMessage}
          style={{ height: 260, minHeight: 240 }}
        />
      </div>
      <LiveRecommendationList
        state={displayRecState}
        onTourDetail={goTourDetail}
        compactHints={compactListHints}
        categoryTab={categoryTab}
        onCategoryTabChange={setCategoryTab}
        kindSummaryLine={kindSummaryLine}
        composedCourseDescription={composedCourseDescription}
        visibleGroupedSections={visibleGroupedSections}
        rankById={rankById}
        routeItems={listRouteItems}
      />
    </>
  );
}

/* ─── 메인 화면 ──────────────────────────────────── */
export function RecommendationScreen() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const { companions, travelTime, selectedForComparison, busanArea, selectedCourse } = useApp();
  const demo = isDemoMode();

  const executionPlaceId = PLACES.some((p) => p.id === selectedCourse)
    ? selectedCourse
    : PLACES[0]?.id ?? "haeundae";

  const timeLabel =
    travelTime === "2h" ? "2시간" : travelTime === "half" ? "반나절" : "하루종일";

  const companionLabels = companions
    .map((c) => COMPANION_LIST.find((cl) => cl.id === c)?.label)
    .filter(Boolean)
    .join(", ");

  const _ = locale;

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FC", display: "flex", flexDirection: "column" }}>
      <TopNav title="부산 추천 코스" />
      <StepIndicator current={4} />

      <div style={{ padding: "20px 20px 14px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <h1
            style={{
              fontSize: 20, fontWeight: 700, color: "#1A1A2E",
              margin: "0 0 4px", letterSpacing: -0.4,
            }}
          >
            부산 코스 추천
          </h1>
          <p style={{ fontSize: 13, color: "#4A4A6A", margin: "0 0 8px", fontWeight: 600, lineHeight: 1.45 }}>
            {SERVICE_ONE_LINER_KO}
          </p>
          <p style={{ fontSize: 12, color: "#7A7A8E", margin: "0 0 12px" }}>
            동행 조건과 무장애 정보를 반영합니다.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 4 }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#F0F1F7", borderRadius: 7, padding: "4px 9px",
              }}
            >
              <MapPin size={11} color="#5B54D6" />
              <span style={{ fontSize: 11, color: "#5B54D6", fontWeight: 600 }}>
                {busanArea === "busan-all" ? "부산 전체" : "부산"}
              </span>
            </div>
            {companionLabels && (
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 5,
                  background: "#EEEDFA", borderRadius: 8, padding: "5px 10px",
                }}
              >
                <Users size={12} color="#5B54D6" />
                <span style={{ fontSize: 12, color: "#5B54D6", fontWeight: 600 }}>
                  {companionLabels}
                </span>
              </div>
            )}
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                background: "#EAF0F8", borderRadius: 8, padding: "5px 10px",
              }}
            >
              <Clock size={12} color="#4A7BBF" />
              <span style={{ fontSize: 12, color: "#4A7BBF", fontWeight: 600 }}>{timeLabel}</span>
            </div>
          </div>
        </motion.div>
      </div>

      <div style={{ padding: "0 20px 40px", display: "flex", flexDirection: "column", gap: 14 }}>
        <RecommendationMapFocusProvider>
          <MobileRecommendationMapBundle />
        </RecommendationMapFocusProvider>

        {demo ? <SimulationCoursesCollapsible variant="mobile" /> : null}

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38 }}
        >
          <button
            type="button"
            onClick={() => navigate(`/mobile/execution/${executionPlaceId}`)}
            style={{
              width: "100%",
              minHeight: 48,
              padding: "14px 16px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #3D8B7A 0%, #2D6B5E 100%)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              textAlign: "center",
              boxShadow: "0 4px 14px rgba(61,139,122,0.22)",
            }}
          >
            <Navigation size={19} color="white" />
            <span style={{ fontSize: 15, fontWeight: 800, color: "white" }}>
              코스 실행 화면으로
            </span>
            <ChevronRight size={17} color="rgba(255,255,255,0.9)" />
          </button>
        </motion.div>

        {demo ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <button
            type="button"
            onClick={() => navigate("/mobile/compare")}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #5B54D6",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
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
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", marginBottom: 1 }}>
                코스 상세 비교 분석
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 400 }}>
                {selectedForComparison.length > 0
                  ? `${selectedForComparison.length}개 코스 비교 준비 완료 · 지금 비교하기`
                  : "부산 코스 점수·시설·실행 가능성 한눈에 비교"}
              </div>
            </div>
            <ChevronRight size={17} color="white" />
          </button>
        </motion.div>
        ) : null}

        {demo ? (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.46 }}
        >
          <button
            type="button"
            onClick={() => openExternalMapSearch("부산 관광 접근성 코스")}
            style={{
              width: "100%",
              padding: "14px 16px",
              borderRadius: 14,
              border: "1.5px solid #F9A825",
              background: "#FFFBF0",
              cursor: "pointer",
              display: "flex", alignItems: "center", gap: 10,
              textAlign: "left",
            }}
          >
            <div
              style={{
                width: 38, height: 38, borderRadius: 10,
                background: "#F9A825",
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}
            >
              <Navigation size={19} color="white" />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#B8820A", marginBottom: 1 }}>
                카카오맵 길찾기 열기
              </div>
              <div style={{ fontSize: 12, color: "#C49A2A", fontWeight: 400 }}>
                코스 간 이동 경로 전체 보기
              </div>
            </div>
            <ChevronRight size={17} color="#C49A2A" />
          </button>
        </motion.div>
        ) : null}

        <div
          style={{
            padding: "10px 14px", borderRadius: 12,
            background: "#FAFBFF", border: "1px solid #E8E9EE",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          <Database size={13} color="#8E90A8" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: "#7A7A8E", lineHeight: 1.5 }}>
            장소 목록·소개는 한국관광공사 TourAPI 등 공공데이터이며, 카드의 근거 요약은 앱 내 규칙으로 계산합니다.
          </span>
        </div>
      </div>
    </div>
  );
}
