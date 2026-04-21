import { useCallback } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock, Footprints, Cloud, Users,
  Star, ArrowUpDown, BarChart2, Activity, MapPin, Navigation,
} from "lucide-react";
import { PLACES } from "../../data/places";
import { LiveRecommendationList } from "../recommendations/LiveRecommendationSection";
import { type LiveSortKey } from "../../lib/recommendations/sortRecommendations";
import type { NormalizedRecommendation } from "../../lib/recommendations/recommendationModel";
import {
  RecommendationMapFocusProvider,
} from "../../context/RecommendationMapFocusContext";
import {
  TourRecommendationsProvider,
  useOptionalTourRecommendationsState,
} from "../../context/TourRecommendationsContext";
import { useApp } from "../../context/AppContext";
import { useRecommendationsExploreModel } from "../../lib/recommendations/useRecommendationsExploreModel";
import { KakaoMapView } from "../map/KakaoMapView";
import { SimulationCoursesCollapsible } from "../recommendations/SimulationCoursesCollapsible";
import { isDemoMode } from "../../lib/demoMode";
import { useI18n } from "../../i18n/I18nContext";

/* ─── page wrapper ───────────────────────────────── */
export function ResultsPage() {
  return (
    <TourRecommendationsProvider>
      <RecommendationMapFocusProvider>
        <ResultsPageInner />
      </RecommendationMapFocusProvider>
    </TourRecommendationsProvider>
  );
}

/* ─── inner page ─────────────────────────────────── */
function ResultsPageInner() {
  const { t } = useI18n();
  const ctx = useOptionalTourRecommendationsState();
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[ResultsPage] TourRecommendationsContext present:", ctx != null);
  }
  const navigate = useNavigate();
  const { companions, setSelectedCourse } = useApp();
  const demo = isDemoMode();

  const buildDetailPath = useCallback(
    (item: NormalizedRecommendation) => `/desktop/course/${item.id}`,
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
  } = useRecommendationsExploreModel({ buildDetailPath, compactListHints: false });

  const summaryBlock =
    displayRecState.status === "ok" ? (
      <div
        style={{
          marginBottom: 18,
          padding: "14px 18px",
          borderRadius: 14,
          background: "white",
          border: "1px solid #E4E6EF",
          boxShadow: "0 2px 10px rgba(26,26,46,0.04)",
          maxWidth: 1100,
          marginInline: "auto",
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1A2E", marginBottom: 6 }}>
          {t("desktopPages.results.summaryTitle")}
        </div>
        <p style={{ fontSize: 14, color: "#4A4A6A", lineHeight: 1.55, margin: 0, fontWeight: 600 }}>
          <strong style={{ color: "#5B54D6", fontSize: 16 }}>{displayRecState.items.length}</strong>
          {t("desktopPages.results.generatedCount", { count: String(displayRecState.items.length) })}
          {displayRecState.usedFallback ? (
            <span style={{ color: "#92400E", fontSize: 12, fontWeight: 500 }}>
              {" "}
              {t("desktopPages.results.fallbackNote")}
            </span>
          ) : null}
        </p>
        <p style={{ fontSize: 12, color: "#5B54D6", fontWeight: 700, margin: "10px 0 0", lineHeight: 1.45 }}>
          {t("desktopPages.results.publicDataBanner")}
        </p>
        <p style={{ fontSize: 11, color: "#9EA0B8", margin: "8px 0 0", lineHeight: 1.45 }}>
          {t("desktopPages.results.apiNotice")}
        </p>
      </div>
    ) : null;

  const companionLabel =
    companions.length > 0
      ? companions
          .map((c) => t(`common.companions.${c}`))
          .join("·") + ` ${t("desktopPages.results.companionSuffix")}`
      : t("desktopPages.results.companionFallback");

  return (
    <div
      style={{
        padding: "40px 48px 80px",
        minHeight: "calc(100dvh - 62px)",
        overflowY: "auto",
        background: "#F6F7FB",
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32, maxWidth: 1100, marginInline: "auto" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#5B54D6" }} />
          <span
            style={{
              fontSize: 11, fontWeight: 700, color: "#5B54D6",
              letterSpacing: 1.5, textTransform: "uppercase",
            }}
          >
            {t("desktopPages.results.step")}
          </span>
        </div>

        <div
          style={{
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between", flexWrap: "wrap", gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 28, fontWeight: 900, color: "#1A1B2E",
                margin: "0 0 5px", letterSpacing: -0.8,
                }}
            >
              {t("desktopPages.results.title")}
            </h1>
            <p style={{ fontSize: 13, color: "#4A4A6A", margin: "0 0 6px", fontWeight: 600, lineHeight: 1.5 }}>
              {t("desktopPages.results.subtitle")}
            </p>
            <p style={{ fontSize: 13, color: "#8E90A8", margin: "0 0 12px" }}>
              {companionLabel}
            </p>
            {demo ? (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => navigate("/desktop/compare")}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 8,
                    border: "1.5px solid #E4E6EF", background: "white",
                    fontSize: 12, fontWeight: 600, color: "#4A4A6A", cursor: "pointer",
                  }}
                >
                  <BarChart2 size={13} color="#5B54D6" />
                  {t("desktopPages.results.compareCourses")}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCourse(PLACES[0].id);
                    navigate(`/desktop/feasibility/${PLACES[0].id}`);
                  }}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "7px 14px", borderRadius: 8,
                    border: "1.5px solid #E4E6EF", background: "white",
                    fontSize: 12, fontWeight: 600, color: "#4A4A6A", cursor: "pointer",
                  }}
                >
                  <Activity size={13} color="#3D8B7A" />
                  {t("desktopPages.results.feasibility")}
                </button>
              </div>
            ) : (
              <p style={{ fontSize: 12, color: "#8E90A8", margin: 0, maxWidth: 480, lineHeight: 1.5 }}>
                {t("desktopPages.results.demoOnly")}
              </p>
            )}
          </div>

          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
            <div
              style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                background: "#F0F1F7", borderRadius: 7, padding: "4px 9px",
              }}
            >
              <MapPin size={11} color="#5B54D6" />
              <span style={{ fontSize: 11, color: "#5B54D6", fontWeight: 600 }}>{t("common.regionBusan")}</span>
            </div>
            {companions.length > 0 && (
              <div
                style={{
                  display: "inline-flex", alignItems: "center", gap: 4,
                  background: "#EEEDFA", borderRadius: 7, padding: "4px 9px",
                }}
              >
                <Users size={11} color="#5B54D6" />
                <span style={{ fontSize: 11, color: "#5B54D6", fontWeight: 600 }}>
                  {companions.map((c) => t(`common.companions.${c}`)).join("·")}
                </span>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {summaryBlock}

      <div style={{ maxWidth: 1100, marginInline: "auto", marginBottom: 8 }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1B2E", marginBottom: 4 }}>
            {t("desktopPages.results.mapTitle")}
          </div>
          <div style={{ fontSize: 11, color: "#8E90A8", marginBottom: 12, lineHeight: 1.45 }}>
            {t("desktopPages.results.mapHint")}
          </div>
          {demo ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
              <ArrowUpDown size={13} color="#8E90A8" />
              <span style={{ fontSize: 12, color: "#8E90A8" }}>{t("desktopPages.results.sortLabel")}</span>
              {(["score", "walking", "duration"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setLiveSortBy(s as LiveSortKey)}
                  style={{
                    padding: "5px 12px",
                    borderRadius: 8,
                    border: `1.5px solid ${liveSortBy === s ? "#5B54D6" : "#E4E6EF"}`,
                    background: liveSortBy === s ? "#EEEDFA" : "white",
                    fontSize: 12,
                    fontWeight: liveSortBy === s ? 700 : 500,
                    color: liveSortBy === s ? "#5B54D6" : "#6B6B88",
                    cursor: "pointer",
                  }}
                >
                  {t(`desktopPages.results.sort.${s}`)}
                </button>
              ))}
            </div>
          ) : null}
          <KakaoMapView
            places={markers}
            selectedPlaceId={selectedPlaceId}
            onMarkerSelect={onMarkerSelect}
            style={{ height: 320, minHeight: 280 }}
          />
        </div>

        <LiveRecommendationList
          state={displayRecState}
          onTourDetail={goTourDetail}
          categoryTab={categoryTab}
          onCategoryTabChange={setCategoryTab}
          kindSummaryLine={kindSummaryLine}
          composedCourseDescription={composedCourseDescription}
          visibleGroupedSections={visibleGroupedSections}
          rankById={rankById}
          routeItems={listRouteItems}
        />
      </div>

      {demo ? <SimulationCoursesCollapsible variant="desktop" /> : null}

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        style={{
          textAlign: "center", marginTop: 32,
          fontSize: 12, color: "#B0B2C4",
          maxWidth: 600, margin: "32px auto 0",
          lineHeight: 1.6,
        }}
      >
        {t("desktopPages.results.footnote")}
      </motion.p>
    </div>
  );
}

export { Clock, Footprints, Cloud, Users, Star, Navigation };
