import { useCallback, useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import {
  useOptionalTourRecommendationsState,
  useTourRecommendationsState,
} from "../../context/TourRecommendationsContext"
import { useRecommendationMapFocus } from "../../context/RecommendationMapFocusContext"
import { sortRecommendations, type LiveSortKey } from "./sortRecommendations"
import { markersFromRecommendations } from "../tour/tourMapMarkers"
import type { NormalizedRecommendation } from "./recommendationModel"
import { useApp } from "../../context/AppContext"
import {
  type CategoryFilterTab,
  composeDescriptionLine,
  countByPlaceKind,
  formatKindSummaryLine,
  groupItemsByPlaceKindOrdered,
  matchesCategoryFilter,
} from "./recommendationPlaceKind"
import { enrichRecommendationsWithAccessibilityScores } from "./enrichRecommendationAccessibility"
import { compareAccessibleTabOrder } from "./accessibleTabSort"
import { applyCompanionPreferences } from "./applyCompanionPreferences"

/**
 * 지도·정렬·선택 id 싱크 — Results / Mobile 추천에서 공통으로 사용
 * (selectedPlaceId는 RecommendationMapFocusContext 한곳에서만 갱신)
 */
export function useRecommendationsExploreModel(options: {
  /** 데스크톱: /desktop/course/...  · 모바일: /mobile/detail/... */
  buildDetailPath: (item: NormalizedRecommendation) => string
  /** true면 LiveRecommendationList에 compactHints */
  compactListHints?: boolean
}) {
  const { buildDetailPath, compactListHints = false } = options
  const optionalRecState = useOptionalTourRecommendationsState()
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.log("[useRecommendationsExploreModel] context present:", optionalRecState != null)
  }
  const recState = useTourRecommendationsState()
  const { companions, supportOptions, accessibilityFilters } = useApp()
  const [liveSortBy, setLiveSortBy] = useState<LiveSortKey>("score")
  const [categoryTab, setCategoryTab] = useState<CategoryFilterTab>("all")
  const navigate = useNavigate()
  const { selectedPlaceId, setSelectedPlaceId } = useRecommendationMapFocus()

  const displayRecState = useMemo(() => {
    if (recState.status !== "ok") return recState
    const sorted = sortRecommendations(recState.items, liveSortBy)
    const enriched = enrichRecommendationsWithAccessibilityScores(sorted)
    const companionApplied = applyCompanionPreferences(enriched, {
      companions,
      support: supportOptions,
      accessibilityFilters,
    })
    const items = companionApplied.items
    const candidateCount = companionApplied.candidateDebug.length
    const survivingCount = candidateCount - companionApplied.excludedCount
    const exclusionRatio = candidateCount > 0 ? Number((companionApplied.excludedCount / candidateCount).toFixed(3)) : 0
    const savedByOverrideSignalCount = companionApplied.candidateDebug.filter(
      (c) => c.allowed && c.reasons.includes("category-risk-overridden-by-accessibility"),
    ).length
    const lowCandidateMode = survivingCount <= 2 || exclusionRatio >= 0.85
    const overrideInactive = savedByOverrideSignalCount === 0 && companionApplied.excludedCount > 0
    if (import.meta.env.DEV) {
      const EXCLUDE_REASON_CODES = new Set([
        "wheelchair-explicit-no",
        "stroller-explicit-no",
        "wheelchair-category-risk",
        "stroller-category-risk",
        "elderly-heavy-walk-risk",
        "elderly-high-crowd-risk",
        "category-risk-no-override",
        "combo-stroller-wheelchair-semi-hard-exclude",
        "low-accessibility-score",
        "missing-accessibility-info",
      ])
      const buildReasonDistribution = (reasons: string[]) => {
        const dist: Record<string, number> = {}
        for (const r of reasons) {
          if (!EXCLUDE_REASON_CODES.has(r)) continue
          dist[r] = (dist[r] ?? 0) + 1
        }
        return dist
      }
      const selectedLog = { companions, supportOptions, accessibilityFilters }
      const appliedFiltersLog = {
        applied: companionApplied.appliedFilters,
        companionFallbackUsed: companionApplied.companionFallbackUsed,
        excludedCount: companionApplied.excludedCount,
      }
      const candidateLog = companionApplied.candidateDebug.slice(0, 10).map((c) => ({
        title: c.title,
        contentTypeId: c.contentTypeId,
        cat3: c.cat3,
        strongExclude: c.strongExclude,
        semiHardExclude: c.semiHardExclude,
        reasonCodes: c.reasons,
        companionFit: c.companionFit,
        accessibilityScore: c.accessibilityScore,
        effectiveAccessibilityScore: c.effectiveAccessibilityScore,
        accessibilityFit: c.accessibilityFit,
        mobilityFit: c.mobilityFit,
        safetyFit: c.safetyFit,
        multilingualFit: c.multilingualFit,
        familyFit: c.familyFit,
        finalScore: c.finalScore,
        allowed: c.allowed,
        penalty: c.penalty,
      }))
      const removedPlacesLog = companionApplied.candidateDebug
        .filter((c) => !c.allowed)
        .map((c) => ({
          title: c.title,
          contentTypeId: c.contentTypeId,
          cat3: c.cat3,
          strongExclude: c.strongExclude,
          semiHardExclude: c.semiHardExclude,
          penalty: c.penalty,
          reasons: c.reasons,
        }))
      const excludedByHardReasonCount = companionApplied.candidateDebug.filter(
        (c) => !c.allowed && c.strongExclude,
      ).length
      const excludedBySemiHardCount = companionApplied.candidateDebug.filter(
        (c) => !c.allowed && c.semiHardExclude,
      ).length
      const excludedByCategoryRiskCount = companionApplied.candidateDebug.filter(
        (c) =>
          !c.allowed &&
          c.reasons.some((r) =>
            ["wheelchair-category-risk", "stroller-category-risk", "elderly-heavy-walk-risk", "category-risk-no-override"].includes(r),
          ),
      ).length
      const excludedReasonDistribution = buildReasonDistribution(
        companionApplied.candidateDebug.filter((c) => !c.allowed).flatMap((c) => c.reasons),
      )
      const top10Log = items.slice(0, 10).map((it) => {
        const c = companionApplied.candidateDebug.find((x) => x.id === it.id)
        return {
          title: it.title,
          companionFit: c?.companionFit ?? null,
          accessibilityScore: it.accessibleScore ?? 0,
          effectiveAccessibilityScore: c?.effectiveAccessibilityScore ?? 0,
          finalScore: c?.finalScore ?? null,
          allowed: c?.allowed ?? true,
        }
      })
      // eslint-disable-next-line no-console
      console.log(`[companions] selected: ${JSON.stringify(selectedLog)}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] applied companion filters: ${JSON.stringify(appliedFiltersLog)}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] candidate: ${JSON.stringify(candidateLog)}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] removedPlaces: ${JSON.stringify(removedPlacesLog)}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] excluded count: ${companionApplied.excludedCount}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] excluded by hard reason count: ${excludedByHardReasonCount}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] excluded by semi-hard count: ${excludedBySemiHardCount}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] excluded by category risk count: ${excludedByCategoryRiskCount}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] excluded reason distribution: ${JSON.stringify(excludedReasonDistribution)}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] saved by override signal count: ${savedByOverrideSignalCount}`)
      // eslint-disable-next-line no-console
      console.log(`[recommend] fallbackUsed: ${companionApplied.companionFallbackUsed}`)
      // eslint-disable-next-line no-console
      console.log(
        `[recommend] candidate/surviving summary: ${JSON.stringify({
          candidateCount,
          survivingCount,
          exclusionRatio,
        })}`,
      )
      // eslint-disable-next-line no-console
      console.log(`[recommend] final top 10 with companion match info: ${JSON.stringify(top10Log)}`)
      if (exclusionRatio >= 0.8) {
        // eslint-disable-next-line no-console
        console.warn(
          `[recommend][safety] high exclusion ratio detected: ${JSON.stringify({
            companions,
            excludedCount: companionApplied.excludedCount,
            candidateCount,
            exclusionRatio,
          })}`,
        )
      }
      if (survivingCount <= 2) {
        // eslint-disable-next-line no-console
        console.warn(
          `[recommend][safety] strict filtering left very few candidates: ${JSON.stringify({
            companions,
            survivingCount,
            companionFallbackUsed: companionApplied.companionFallbackUsed,
          })}`,
        )
      }
      if (savedByOverrideSignalCount === 0 && companionApplied.excludedCount > 0) {
        // eslint-disable-next-line no-console
        console.warn(
          `[recommend][safety] override signals missing in current dataset: ${JSON.stringify({
            companions,
            savedByOverrideSignalCount,
            excludedCount: companionApplied.excludedCount,
          })}`,
        )
      }
      if (lowCandidateMode) {
        // eslint-disable-next-line no-console
        console.warn(
          `[recommend][safety] low candidate result mode: ${JSON.stringify({
            companions,
            candidateCount,
            survivingCount,
            exclusionRatio,
          })}`,
        )
      }
      if (overrideInactive) {
        // eslint-disable-next-line no-console
        console.warn(
          `[recommend][safety] override path inactive: ${JSON.stringify({
            companions,
            excludedCount: companionApplied.excludedCount,
            savedByOverrideSignalCount,
          })}`,
        )
      }

      const matrixCases = [
        { key: "A-none", companions: [] as string[] },
        { key: "B-wheelchair", companions: ["wheelchair"] },
        { key: "C-stroller", companions: ["stroller"] },
        { key: "D-elderly", companions: ["elderly"] },
        { key: "E-stroller-wheelchair", companions: ["stroller", "wheelchair"] },
        { key: "F-family", companions: ["children"] },
        { key: "G-foreigner", companions: ["foreigner"] },
      ]
      const beforeTop10Titles = enriched.slice(0, 10).map((x) => x.title)
      for (const mc of matrixCases) {
        const matrixResult = applyCompanionPreferences(enriched, {
          companions: mc.companions,
          support: supportOptions,
          accessibilityFilters,
        })
        const top10 = matrixResult.items.slice(0, 10)
        const top10Debug = matrixResult.candidateDebug.filter((c) =>
          top10.some((it) => it.id === c.id),
        )
        const avgCompanionFit =
          top10Debug.length > 0
            ? Math.round(
                top10Debug.reduce((sum, cur) => sum + cur.companionFit, 0) /
                  top10Debug.length,
              )
            : 0
        const avgAccessibility =
          top10Debug.length > 0
            ? Math.round(
                top10Debug.reduce((sum, cur) => sum + cur.effectiveAccessibilityScore, 0) /
                  top10Debug.length,
              )
            : 0
        const hardExcludeCount = matrixResult.candidateDebug.filter((c) => !c.allowed && c.strongExclude).length
        const semiHardExcludeCount = matrixResult.candidateDebug.filter(
          (c) => !c.allowed && c.semiHardExclude,
        ).length
        const matrixSavedByOverrideSignalCount = matrixResult.candidateDebug.filter(
          (c) => c.allowed && c.reasons.includes("category-risk-overridden-by-accessibility"),
        ).length
        const matrixExcludedReasonDistribution = buildReasonDistribution(
          matrixResult.candidateDebug.filter((c) => !c.allowed).flatMap((c) => c.reasons),
        )
        const matrixCandidateCount = matrixResult.candidateDebug.length
        const matrixSurvivingCount = matrixCandidateCount - matrixResult.excludedCount
        const matrixExclusionRatio =
          matrixCandidateCount > 0
            ? Number((matrixResult.excludedCount / matrixCandidateCount).toFixed(3))
            : 0
        const top10OverlapCount = top10.filter((x) => beforeTop10Titles.includes(x.title)).length
        const finalScores = top10Debug.map((x) => x.finalScore).sort((a, b) => a - b)
        const finalScoreSpread =
          finalScores.length > 0
            ? {
                min: finalScores[0],
                max: finalScores[finalScores.length - 1],
              }
            : { min: 0, max: 0 }
        // eslint-disable-next-line no-console
        console.log(
          `[recommend][matrix] ${mc.key}: ${JSON.stringify({
            companions: mc.companions,
            candidateCount: matrixCandidateCount,
            survivingCount: matrixSurvivingCount,
            excludedCount: matrixResult.excludedCount,
            exclusionRatio: matrixExclusionRatio,
            hardExcludeCount,
            semiHardExcludeCount,
            savedByOverrideSignalCount: matrixSavedByOverrideSignalCount,
            excludedReasonDistribution: matrixExcludedReasonDistribution,
            avgCompanionFit,
            avgEffectiveAccessibilityScore: avgAccessibility,
            beforeTop10Titles,
            top10Titles: top10.map((x) => x.title),
            top10OverlapCount,
            finalScoreSpread,
          })}`,
        )
        if (matrixExclusionRatio >= 0.8) {
          // eslint-disable-next-line no-console
          console.warn(
            `[recommend][safety] high exclusion ratio detected in matrix ${mc.key}: ${JSON.stringify({
              companions: mc.companions,
              candidateCount: matrixCandidateCount,
              survivingCount: matrixSurvivingCount,
              excludedCount: matrixResult.excludedCount,
              exclusionRatio: matrixExclusionRatio,
            })}`,
          )
        }
      }
    }
    return {
      ...recState,
      items,
      safety: {
        lowCandidateMode,
        overrideInactive,
        exclusionRatio,
        survivingCount,
        candidateCount,
      },
    }
  }, [recState, liveSortBy, companions, supportOptions, accessibilityFilters])

  const visibleItems = useMemo(() => {
    if (displayRecState.status !== "ok") return []
    if (categoryTab === "all") return displayRecState.items
    let list = displayRecState.items.filter((i) => matchesCategoryFilter(i, categoryTab))
    if (categoryTab === "accessible") {
      list = [...list].sort(compareAccessibleTabOrder)
    }
    return list
  }, [displayRecState, categoryTab])

  const markers = useMemo(
    () => (visibleItems.length > 0 ? markersFromRecommendations(visibleItems) : []),
    [visibleItems],
  )

  const visibleGroupedSections = useMemo(
    () => groupItemsByPlaceKindOrdered(visibleItems),
    [visibleItems],
  )

  const kindCounts = useMemo(() => {
    if (displayRecState.status !== "ok") return null
    return countByPlaceKind(displayRecState.items)
  }, [displayRecState])

  const kindSummaryLine = useMemo(
    () => (kindCounts ? formatKindSummaryLine(kindCounts) : ""),
    [kindCounts],
  )

  const composedCourseDescription = useMemo(
    () => (kindCounts ? composeDescriptionLine(kindCounts) : ""),
    [kindCounts],
  )

  const rankById = useMemo(() => {
    if (displayRecState.status !== "ok") return new Map<string, number>()
    const m = new Map<string, number>()
    displayRecState.items.forEach((it, idx) => m.set(it.id, idx + 1))
    return m
  }, [displayRecState])

  const resultIdKey =
    displayRecState.status === "ok"
      ? displayRecState.items.map((i) => i.id).join("|")
      : ""

  useEffect(() => {
    setCategoryTab("all")
  }, [resultIdKey])

  const visibleSyncKey = visibleItems.map((i) => `${i.id}:${i.lat}:${i.lng}`).join("|")

  useEffect(() => {
    if (displayRecState.status !== "ok") return
    const items = visibleItems
    setSelectedPlaceId((prev) => {
      const ok = prev != null && items.some((i) => i.id === prev && i.lat != null && i.lng != null)
      if (ok) return prev
      const first = items.find((i) => i.lat != null && i.lng != null)
      return first?.id ?? null
    })
  }, [displayRecState.status, visibleSyncKey, setSelectedPlaceId, visibleItems])

  const onMarkerSelect = useCallback(
    (id: string) => setSelectedPlaceId(id),
    [setSelectedPlaceId],
  )

  const mapStatusMessage =
    displayRecState.status === "error"
      ? "관광 데이터 인증 오류로 지도 마커를 표시하지 못했습니다."
      : displayRecState.status === "empty"
        ? "조건에 맞는 관광 데이터가 없어 지도에 표시할 장소가 없습니다."
        : displayRecState.status === "ok" && markers.length === 0
          ? visibleItems.length === 0 && categoryTab !== "all"
            ? categoryTab === "accessible"
              ? "이동편한 곳으로 분류된 항목이 없거나, 해당 항목에 좌표가 없어 지도에 표시할 수 없습니다."
              : "선택한 유형에 해당하는 좌표가 있는 장소가 없습니다."
            : "응답은 성공했지만 좌표가 있는 장소가 없어 지도 마커를 그리지 못했습니다."
          : null

  const goTourDetail = useCallback(
    (item: NormalizedRecommendation) => {
      navigate(buildDetailPath(item), { state: { tourRecommendation: item } })
    },
    [navigate, buildDetailPath],
  )

  return {
    liveSortBy,
    setLiveSortBy,
    displayRecState,
    categoryTab,
    setCategoryTab,
    visibleItems,
    /** 지도 코스선·경로 끝 — 필터와 동일한 목록 */
    routeItems: visibleItems,
    visibleGroupedSections,
    kindSummaryLine,
    kindCounts,
    composedCourseDescription,
    rankById,
    markers,
    selectedPlaceId,
    onMarkerSelect,
    mapStatusMessage,
    goTourDetail,
    compactListHints,
  }
}
