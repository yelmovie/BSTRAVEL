import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate, useLocation } from "react-router"
import {
  Database, Loader2, AlertCircle,
  Landmark, Utensils, BedDouble, ShoppingBag, MoreHorizontal,
} from "lucide-react"
import { useApp } from "../../context/AppContext"
import { useOptionalRecommendationMapFocus } from "../../context/RecommendationMapFocusContext"
import { useI18n } from "../../i18n/I18nContext"
import { BUSAN_AREAS } from "../../data/places"
import type { NormalizedRecommendation, RecommendationPlaceKind } from "../../lib/recommendations/recommendationModel"
import type { TourRecommendationsState } from "../../lib/recommendations/useTourRecommendations"
import {
  type CategoryFilterTab,
  CATEGORY_FILTER_TABS,
  categoryFilterTabLabelKo,
  sectionHeadingForKind,
  placeKindBadgeLabelKo,
} from "../../lib/recommendations/recommendationPlaceKind"
import { markersFromRecommendations } from "../../lib/tour/tourMapMarkers"
import { CourseCardItem } from "./CourseCardItem"
import type { CardDisplayData } from "./CourseCardItem"
import { liveRecToDisplayFields } from "../../lib/recommendations/liveCardDerive"
import { persistTourRecommendation } from "../../lib/recommendations/tourRecommendationStorage"
import {
  ACCESSIBLE_LIST_FOOTER_SECOND_LINE_KO,
  ACCESSIBLE_TAB_MEANING_ONE_LINE_KO,
  ACCESSIBLE_TAB_THRESHOLD_NOTE_KO,
  CARD_ATTRIBUTION_LIVE_KO,
  CARD_FALLBACK_REASON_ONE_LINE_KO,
  CARD_SOURCE_BADGE_LIVE_KO,
  LIVE_LIST_SELECTION_SUMMARY_KO,
  LIVE_LIST_SOURCE_LINE_KO,
  RECOMMENDATION_FACTORS_SUMMARY_KO,
  RESULT_PUBLIC_DATA_BANNER_KO,
} from "../../lib/copy/trustMessaging"

/* ─── helpers ────────────────────────────────────── */

function routeLabelsFromMetrics(item: NormalizedRecommendation): {
  routeDistanceLabel: string | null
  routeTimeLabel: string | null
} {
  const rm = item.routeMetrics
  if (!rm) return { routeDistanceLabel: null, routeTimeLabel: null }
  let routeDistanceLabel: string | null = null
  if (rm.distanceKm != null && Number.isFinite(rm.distanceKm)) {
    const km = rm.distanceKm
    routeDistanceLabel =
      km < 10 ? `이전 장소와 ${km.toFixed(1)}km` : `이전 장소와 ${Math.round(km)}km`
  }
  let routeTimeLabel: string | null = null
  if (rm.estimatedWalkMinutes != null) {
    routeTimeLabel = `도보 약 ${rm.estimatedWalkMinutes}분`
  } else if (rm.estimatedDriveMinutes != null) {
    routeTimeLabel = `차량 약 ${rm.estimatedDriveMinutes}분`
  }
  return { routeDistanceLabel, routeTimeLabel }
}

/** NormalizedRecommendation → CardDisplayData 변환 */
function liveRecToCard(
  item: NormalizedRecommendation,
  rank: number,
  isSelected: boolean,
): CardDisplayData {
  const d = liveRecToDisplayFields(item)
  const hints = item.accessibilityReasons?.length
    ? item.accessibilityReasons
    : item.accessibilityReason ?? []
  const routes = routeLabelsFromMetrics(item)
  const mobilityScore = Math.round(
    Math.min(100, Math.max(0, Number(item.accessibleScore) || 0)),
  )
  const summaryLine = hints[0]?.trim() || CARD_FALLBACK_REASON_ONE_LINE_KO
  return {
    id: item.id,
    rank,
    source: "live",
    coverImageUrl: item.thumbnailUrl || item.imageUrl,
    attributionLine: CARD_ATTRIBUTION_LIVE_KO,
    title: item.title,
    categoryLabel: item.category,
    kindBadgeLabel: placeKindBadgeLabelKo(item.placeKind),
    scoreLabel: `이동 편의 점수 ${mobilityScore}`,
    summaryRecommendationOneLine: summaryLine,
    durationLabel: d.durationLabel,
    walkingLabel: d.walkingLabel,
    tags: d.tags,
    reason: d.reason,
    address: item.address?.trim() || null,
    lat: item.lat,
    lng: item.lng,
    isSelected,
    accessibilityHints: hints.length ? hints.slice(0, 2) : undefined,
    isAccessibleCandidate: item.isAccessibleCandidate,
    accessibilityReasons: hints.length ? hints.slice(0, 3) : undefined,
    routeDistanceLabel: routes.routeDistanceLabel,
    routeTimeLabel: routes.routeTimeLabel,
  }
}

function SectionKindIcon({ kind, color = "#5B54D6" }: { kind: RecommendationPlaceKind; color?: string }) {
  const p = { size: 15, color, strokeWidth: 2.25, style: { flexShrink: 0 } as const }
  if (kind === "attraction") return <Landmark {...p} />
  if (kind === "food") return <Utensils {...p} />
  if (kind === "lodging") return <BedDouble {...p} />
  if (kind === "convenience") return <ShoppingBag {...p} />
  return <MoreHorizontal {...p} />
}

/* ─── DataSourceBadge ─────────────────────────────── */
export function DataSourceBadge({ source }: { source: "LIVE" | "SIM" }) {
  const isLive = source === "LIVE"
  return (
    <span
      title={isLive ? "TourAPI 등 공공데이터 연동 결과" : "시연용 예시 데이터"}
      style={{
        display: "inline-block",
        fontSize: 10,
        fontWeight: 800,
        padding: "4px 9px",
        borderRadius: 7,
        border: isLive ? "1px solid #A7F3D0" : "1px solid #E5E7EB",
        background: isLive ? "#ECFDF5" : "#F3F4F6",
        color: isLive ? "#065F46" : "#4B5563",
      }}
    >
      {isLive ? CARD_SOURCE_BADGE_LIVE_KO : "예시 데이터"}
    </span>
  )
}

/* ─── LiveRecommendationList ─────────────────────── */

/** TourAPI 추천 목록 + (선택) 지도 포커스 컨텍스트 연동 */
export function LiveRecommendationList({
  state,
  onTourDetail,
  /** 모바일 메인 화면: 지도 바로 아래 보조 안내 문구 축소 */
  compactHints = false,
  categoryTab = "all",
  onCategoryTabChange,
  kindSummaryLine = "",
  composedCourseDescription = "",
  visibleGroupedSections,
  rankById,
  routeItems,
}: {
  state: TourRecommendationsState
  /** 명시 시 덮어씀 · 미전달 시 현재 라우트(모바일/데스크톱)에 맞춰 자동 상세 이동 */
  onTourDetail?: (item: NormalizedRecommendation) => void
  compactHints?: boolean
  categoryTab?: CategoryFilterTab
  onCategoryTabChange?: (tab: CategoryFilterTab) => void
  /** 상단 요약 한 줄 */
  kindSummaryLine?: string
  /** 구성 안내 한 줄 */
  composedCourseDescription?: string
  /** 필터 반영 후 유형별 그룹 — 미전달 시 state.items 평탄 렌더 */
  visibleGroupedSections?: { kind: RecommendationPlaceKind; items: NormalizedRecommendation[] }[]
  rankById?: Map<string, number>
  /** 지도 코스선 순서용 — 미전달 시 state.items */
  routeItems?: NormalizedRecommendation[]
}) {
  const navigate = useNavigate()
  const location = useLocation()
  const defaultTourDetailNav = useCallback(
    (item: NormalizedRecommendation) => {
      const isDesktop = location.pathname.startsWith("/desktop")
      navigate(
        isDesktop ? `/desktop/course/${item.id}` : `/mobile/detail/${item.id}`,
        { state: { tourRecommendation: item } },
      )
    },
    [navigate, location.pathname],
  )
  const handleTourDetail = onTourDetail ?? defaultTourDetailNav

  const focus = useOptionalRecommendationMapFocus()
  const { busanArea } = useApp()
  const { locale, t } = useI18n()
  const [coordHint, setCoordHint] = useState<string | null>(null)

  const areaLabel =
    BUSAN_AREAS.find((a) => a.id === busanArea)?.name ??
    (busanArea === "busan-all" ? "부산 전체" : "선택 권역")

  const selectedId = focus?.selectedPlaceId ?? null
  const setSelected = focus?.setSelectedPlaceId

  /* 선택된 카드로 스크롤 */
  useEffect(() => {
    if (!selectedId || !focus) return
    const el = typeof document !== "undefined"
      ? document.getElementById(`live-rec-${selectedId}`)
      : null
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedId, focus])

  const orderedRouteMarkers = useMemo(() => {
    if (state.status !== "ok") return []
    const seq = routeItems ?? state.items
    return markersFromRecommendations(seq)
  }, [state, routeItems])

  const routeEnds = useMemo(() => {
    if (!focus || orderedRouteMarkers.length < 2) {
      return { startId: null as string | null, endId: null as string | null }
    }
    const m = orderedRouteMarkers
    return { startId: m[0].id, endId: m[m.length - 1].id }
  }, [focus, orderedRouteMarkers])

  const rankForItem = (item: NormalizedRecommendation, idxFallback: number) =>
    rankById?.get(item.id) ??
    (state.status === "ok" ? state.items.findIndex((x) => x.id === item.id) + 1 : idxFallback + 1)

  function renderLiveRecCard(item: NormalizedRecommendation, rank: number) {
    const isSelected = selectedId === item.id
    const cardData = liveRecToCard(item, rank, isSelected)
    const isRouteStart =
      routeEnds.startId !== null &&
      routeEnds.startId !== routeEnds.endId &&
      item.id === routeEnds.startId
    const isRouteEnd = item.id === routeEnds.endId

    return (
      <div key={item.id} id={`live-rec-${item.id}`} style={{ position: "relative" }}>
        {(isRouteStart || isRouteEnd) && (
          <div
            style={{
              position: "absolute", top: 10, right: 44,
              fontSize: 10, fontWeight: 800, letterSpacing: 0.5,
              color: "#5B54D6", background: "#EEEDFA",
              padding: "4px 10px", borderRadius: 8,
              border: "1px solid #E8E6FA",
              zIndex: 1,
              pointerEvents: "none",
            }}
          >
            {isRouteStart ? "출발" : "도착"}
          </div>
        )}
        <CourseCardItem
          {...cardData}
          onDetail={() => {
            persistTourRecommendation(item)
            handleTourDetail(item)
          }}
        />
      </div>
    )
  }

  return (
    <div style={{ marginBottom: 14 }}>
      {state.status === "ok" && !compactHints && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 10,
            background: "#EEEDFA",
            border: "1px solid #D8D4F5",
            fontSize: 12,
            fontWeight: 700,
            color: "#4C1D95",
            lineHeight: 1.45,
          }}
        >
          {RESULT_PUBLIC_DATA_BANNER_KO}
        </div>
      )}

      {/* 섹션 헤더 */}
      <div
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          marginBottom: 10, flexWrap: "wrap", gap: 8,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Database size={15} color="#5B54D6" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>
              공공데이터 기반 추천 목록
            </span>
            <DataSourceBadge source="LIVE" />
          </div>
          {!compactHints && (
            <div style={{ fontSize: 10, color: "#9EA0B8", paddingLeft: 23, lineHeight: 1.45 }}>
              {LIVE_LIST_SOURCE_LINE_KO} · {areaLabel}
            </div>
          )}
        </div>
      </div>

      {state.status === "ok" && kindSummaryLine !== "" && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 10,
            background: "#FAFBFF",
            border: "1px solid #E8E9EE",
            fontSize: 12,
            fontWeight: 700,
            color: "#4A4A6A",
            lineHeight: 1.45,
          }}
        >
          {kindSummaryLine}
        </div>
      )}

      {state.status === "ok" && composedCourseDescription !== "" && (
        <div
          style={{
            marginBottom: 10,
            padding: "8px 12px",
            borderRadius: 10,
            background: "white",
            border: "1px solid #E8E9EE",
            fontSize: 11,
            color: "#6B6B88",
            lineHeight: 1.45,
          }}
        >
          {composedCourseDescription}
        </div>
      )}

      {state.status === "ok" && (
        <p
          style={{
            fontSize: 11,
            color: "#6B6B88",
            margin: "0 0 10px",
            lineHeight: 1.45,
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {LIVE_LIST_SELECTION_SUMMARY_KO}
        </p>
      )}

      {state.status === "ok" && onCategoryTabChange && (
        <div
          role="tablist"
          aria-label="추천 유형 필터"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginBottom: 12,
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
          }}
        >
          {CATEGORY_FILTER_TABS.map((tab) => {
            const active = categoryTab === tab
            return (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onCategoryTabChange(tab)}
                style={{
                  padding: "8px 12px",
                  minHeight: 48,
                  borderRadius: 10,
                  border: `1.5px solid ${active ? "#5B54D6" : "#E4E6EF"}`,
                  background: active ? "#EEEDFA" : "white",
                  fontFamily: "'Noto Sans KR', sans-serif",
                  fontSize: 12,
                  fontWeight: active ? 800 : 600,
                  color: active ? "#5B54D6" : "#6B6B88",
                  cursor: "pointer",
                }}
              >
                {categoryFilterTabLabelKo(tab)}
              </button>
            )
          })}
        </div>
      )}

      {state.status === "ok" && onCategoryTabChange && (
        <>
          <p
            style={{
              fontSize: 10,
              color: "#9EA0B8",
              margin: "0 0 4px",
              lineHeight: 1.45,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {ACCESSIBLE_TAB_THRESHOLD_NOTE_KO}
          </p>
          <p
            style={{
              fontSize: 10,
              color: "#9EA0B8",
              margin: "0 0 12px",
              lineHeight: 1.45,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            {RECOMMENDATION_FACTORS_SUMMARY_KO}
          </p>
        </>
      )}

      {state.status === "ok" && onCategoryTabChange && categoryTab === "accessible" && (
        <p
          style={{
            fontSize: 11,
            color: "#6B6B88",
            margin: "0 0 12px",
            lineHeight: 1.5,
            padding: "8px 12px",
            borderRadius: 10,
            background: "#FAFBFF",
            border: "1px solid #E8E9EE",
            fontFamily: "'Noto Sans KR', sans-serif",
          }}
        >
          {ACCESSIBLE_TAB_MEANING_ONE_LINE_KO}
        </p>
      )}

      {locale !== "ko" && (
        <div style={{ fontSize: 10, color: "#9EA0B8", marginBottom: 10, lineHeight: 1.45, paddingLeft: 2 }}>
          {t("tourContent.partialRawNotice")}
        </div>
      )}

      {/* 좌표 없음 힌트 */}
      {coordHint && (
        <div
          role="status"
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#FFF8ED",
            border: "1px solid #FDDCAD",
            fontSize: 12, color: "#92400E", lineHeight: 1.45,
          }}
        >
          {coordHint}
        </div>
      )}

      {/* 로딩 */}
      {state.status === "loading" && (
        <div
          style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: 16, borderRadius: 14,
            background: "white", border: "1px solid #E8E9EE",
            color: "#7A7A8E", fontSize: 13,
          }}
        >
          <Loader2 size={18} />
          추천 장소를 불러오는 중…
        </div>
      )}

      {/* 오류 */}
      {state.status === "error" && (
        <div
          style={{
            display: "flex", alignItems: "flex-start", gap: 10,
            padding: 14, borderRadius: 14,
            background: "#FFF8F8", border: "1px solid #F5C4C4",
            color: "#A02020", fontSize: 13,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>추천 데이터를 불러오지 못했습니다</div>
            <div style={{ fontSize: 12, opacity: 0.95, lineHeight: 1.45 }}>{state.message}</div>
            <div style={{ fontSize: 11, marginTop: 8, color: "#7A7A8E" }}>
              로컬 프록시(<code style={{ fontSize: 10 }}>pnpm dev</code>의 API 서버)와{" "}
              <code style={{ fontSize: 10 }}>VISITKOREA_SERVICE_KEY</code>를 확인해 주세요.
            </div>
          </div>
        </div>
      )}

      {/* 빈 결과 */}
      {state.status === "empty" && (
        <div
          style={{
            padding: 14, borderRadius: 14,
            background: "#F6F7FB", border: "1px solid #E4E6EF",
            fontSize: 13, color: "#6B6B88",
          }}
        >
          조건에 맞는 장소를 찾지 못했습니다. 권역을 넓히거나 다른 조건으로 다시 시도해 보세요.
        </div>
      )}

      {/* 성공: 카드 목록 */}
      {state.status === "ok" && (
        <>
          {state.usedFallback && (
            <div
              style={{
                fontSize: 10, color: "#92400E",
                background: "#FFF8ED", border: "1px solid #FDDCAD",
                borderRadius: 10, padding: "8px 10px", marginBottom: 10,
              }}
            >
              세부 검색 결과가 없어 부산 전체 목록으로 대체했습니다.
            </div>
          )}
          {focus && !compactHints && (
            <div
              style={{
                fontSize: 11, color: "#6B6B88", marginBottom: 10,
                padding: "8px 10px", borderRadius: 10,
                background: "#FAFBFF", border: "1px solid #E8E9EE", lineHeight: 1.45,
              }}
            >
              카드를 선택하면 지도가 해당 장소로 이동합니다. 좌표가 있는 장소는 코스 선으로 연결됩니다.
            </div>
          )}

          {visibleGroupedSections !== undefined && visibleGroupedSections.length === 0 && (
            <div
              style={{
                padding: 14, borderRadius: 14,
                background: "#F6F7FB", border: "1px solid #E4E6EF",
                fontSize: 13, color: "#6B6B88", lineHeight: 1.5,
              }}
            >
              {categoryTab === "accessible"
                ? "이동편한 곳으로 분류된 장소가 없습니다. 「전체」 탭에서 목록을 확인하거나 다른 조건으로 다시 시도해 보세요."
                : "이 탭에 해당하는 장소가 없습니다. 「전체」 또는 다른 유형을 선택해 보세요."}
            </div>
          )}

          {visibleGroupedSections === undefined && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {state.items.map((item, idx) => renderLiveRecCard(item, rankForItem(item, idx)))}
            </div>
          )}

          {visibleGroupedSections !== undefined && visibleGroupedSections.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              {visibleGroupedSections.map((section) => (
                <div key={section.kind} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <SectionKindIcon kind={section.kind} />
                    <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A2E", letterSpacing: -0.2 }}>
                      {sectionHeadingForKind(section.kind)}
                    </span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {section.items.map((item, idx) =>
                      renderLiveRecCard(item, rankForItem(item, idx)),
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 14,
              padding: "10px 12px",
              borderRadius: 12,
              background: "#FAFBFF",
              border: "1px solid #E8E9EE",
              fontSize: 11,
              color: "#8E90A8",
              lineHeight: 1.55,
              fontFamily: "'Noto Sans KR', sans-serif",
            }}
          >
            이동 부담·동선 효율을 함께 고려해 유형별로 정리했습니다. {ACCESSIBLE_TAB_MEANING_ONE_LINE_KO}{" "}
            {ACCESSIBLE_LIST_FOOTER_SECOND_LINE_KO}
          </div>
        </>
      )}
    </div>
  )
}
