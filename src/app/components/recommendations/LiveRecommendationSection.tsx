import { useEffect, useMemo, useState } from "react"
import { MapPin, Navigation, Database, Loader2, AlertCircle, ImageOff, Clock } from "lucide-react"
import { useApp } from "../../context/AppContext"
import { useOptionalRecommendationMapFocus } from "../../context/RecommendationMapFocusContext"
import { useI18n } from "../../i18n/I18nContext"
import { BUSAN_AREAS } from "../../data/places"
import { useTourRecommendations } from "../../lib/recommendations/useTourRecommendations"
import type { NormalizedRecommendation } from "../../lib/recommendations/recommendationModel"
import type { TourRecommendationsState } from "../../lib/recommendations/useTourRecommendations"
import { markersFromRecommendations } from "../../lib/tour/tourMapMarkers"

function openKakaoMapQuery(q: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent(q)}`, "_blank", "noopener,noreferrer")
}

export function DataSourceBadge({ source }: { source: "LIVE" | "DEMO" }) {
  const isLive = source === "LIVE"
  return (
    <span
      style={{
        display: "inline-block",
        fontSize: 9,
        fontWeight: 800,
        letterSpacing: 0.5,
        textTransform: "uppercase",
        padding: "3px 7px",
        borderRadius: 5,
        border: isLive ? "1px solid #C8E9D9" : "1px solid #D9D6F5",
        background: isLive ? "#F0FAF6" : "#EEEDFA",
        color: isLive ? "#0D5A2A" : "#5B54D6",
      }}
    >
      {isLive ? "LIVE API" : "DEMO DATA"}
    </span>
  )
}

function LiveRecCard({
  item,
  isSelected,
  onSelect,
  routeRole,
}: {
  item: NormalizedRecommendation
  isSelected: boolean
  onSelect?: () => void
  /** 지도 코스 순서 중 첫·마지막 좌표 (유효 포인트 2개 이상일 때만) */
  routeRole?: "start" | "end"
}) {
  const [imgFailed, setImgFailed] = useState(false)
  const showImg = Boolean(item.imageUrl) && !imgFailed
  const interactive = Boolean(onSelect)

  return (
    <div
      id={`live-rec-${item.id}`}
      role={interactive ? "button" : undefined}
      tabIndex={interactive ? 0 : undefined}
      onClick={() => onSelect?.()}
      onKeyDown={(e) => {
        if (!interactive) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onSelect?.()
        }
      }}
      style={{
        background: "white",
        borderRadius: 16,
        overflow: "hidden",
        border: isSelected ? "2px solid #5B54D6" : "1px solid #E8E9EE",
        boxShadow: isSelected
          ? "0 6px 22px rgba(91,84,214,0.15)"
          : "0 2px 10px rgba(26,26,46,0.04)",
        cursor: interactive ? "pointer" : "default",
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      <div style={{ position: "relative", height: 120, background: "#E8E9EF" }}>
        {showImg ? (
          <img
            src={item.imageUrl!}
            alt=""
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div
            style={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 4,
              color: "#9EA0B8",
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            <ImageOff size={22} strokeWidth={1.5} />
            이미지 없음
          </div>
        )}
        <div style={{ position: "absolute", top: 10, left: 10 }}>
          <DataSourceBadge source="LIVE" />
        </div>
        {routeRole ? (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.5,
              color: "#5B54D6",
              background: "#EEEDFA",
              padding: "4px 10px",
              borderRadius: 8,
              border: "1px solid #E8E6FA",
              boxShadow: "0 2px 8px rgba(91,84,214,0.15)",
            }}
          >
            {routeRole === "start" ? "출발" : "도착"}
          </div>
        ) : null}
        {isSelected ? (
          <div
            style={{
              position: "absolute",
              bottom: 10,
              left: 10,
              fontSize: 10,
              fontWeight: 800,
              color: "white",
              background: "linear-gradient(135deg,#5B54D6,#7D76E8)",
              padding: "4px 10px",
              borderRadius: 8,
              boxShadow: "0 4px 12px rgba(91,84,214,0.35)",
            }}
          >
            지도 연결됨
          </div>
        ) : null}
      </div>
      <div style={{ padding: "12px 14px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: 6 }}>
          <h3
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "#1A1A2E",
              margin: 0,
              letterSpacing: -0.3,
              lineHeight: 1.35,
              flex: 1,
              minWidth: 0,
            }}
          >
            {item.title}
          </h3>
        </div>
        {item.category ? (
          <div style={{ fontSize: 10, fontWeight: 700, color: "#6B6B88", marginBottom: 6 }}>{item.category}</div>
        ) : null}
        {item.tags.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
            {item.tags.slice(0, 3).map((tg) => (
              <span
                key={tg}
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: "#5B54D6",
                  background: "#F6F5FF",
                  padding: "3px 7px",
                  borderRadius: 6,
                  border: "1px solid #E8E6FA",
                  maxWidth: "100%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {tg}
              </span>
            ))}
          </div>
        ) : null}
        <p style={{ fontSize: 11, color: "#6B6B88", lineHeight: 1.45, margin: "0 0 8px", minHeight: item.overview ? undefined : 18 }}>
          {item.overview?.trim()
            ? item.overview.length > 140
              ? `${item.overview.slice(0, 138)}…`
              : item.overview
            : "상세 설명 없음 · 목록 요약만 제공되었습니다"}
        </p>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 10 }}>
          <MapPin size={11} color="#5B54D6" style={{ flexShrink: 0, marginTop: 2 }} />
          <span style={{ fontSize: 11, color: "#4A4A6A", fontWeight: 500, lineHeight: 1.4 }}>
            {item.address?.trim() ? item.address : "주소 정보 준비 중"}
          </span>
        </div>
        <div
          style={{
            fontSize: 10,
            color: "#9EA0B8",
            lineHeight: 1.4,
            padding: "8px 10px",
            borderRadius: 10,
            background: "#FAFBFF",
            border: "1px solid #F0F1F6",
            marginBottom: 10,
          }}
        >
          <span style={{ fontWeight: 700, color: "#8E90A8" }}>접근성 안내 · </span>
          {item.accessibilityNote ?? "접근성 정보 확인 필요"}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 12, fontSize: 9, color: "#A0A2B8" }}>
          <Clock size={11} />
          갱신 {new Date(item.fetchedAt).toLocaleString("ko-KR")}
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            openKakaoMapQuery(`${item.title} 부산`)
          }}
          style={{
            width: "100%",
            height: 48,
            borderRadius: 12,
            border: "none",
            background: "linear-gradient(135deg,#5B54D6,#7D76E8)",
            color: "white",
            fontSize: 13,
            fontWeight: 800,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            boxShadow: "0 8px 20px rgba(91,84,214,0.22)",
          }}
        >
          <Navigation size={16} />
          지도에서 보기
        </button>
      </div>
    </div>
  )
}

/** TourAPI 추천 목록 + (선택) 지도 포커스 컨텍스트와 연동 */
export function LiveRecommendationList({ state }: { state: TourRecommendationsState }) {
  const focus = useOptionalRecommendationMapFocus()
  const { busanArea } = useApp()
  const { locale, t } = useI18n()
  const [coordHint, setCoordHint] = useState<string | null>(null)

  const areaLabel =
    BUSAN_AREAS.find((a) => a.id === busanArea)?.name ??
    (busanArea === "busan-all" ? "부산 전체" : "선택 권역")

  const selectedId = focus?.selectedPlaceId ?? null
  const setSelected = focus?.setSelectedPlaceId

  useEffect(() => {
    if (!selectedId || !focus) return
    const el = typeof document !== "undefined" ? document.getElementById(`live-rec-${selectedId}`) : null
    el?.scrollIntoView({ behavior: "smooth", block: "nearest" })
  }, [selectedId, focus])

  const orderedRouteMarkers = useMemo(() => {
    if (state.status !== "ok") return []
    return markersFromRecommendations(state.items)
  }, [state])

  const routeEnds = useMemo(() => {
    if (!focus || orderedRouteMarkers.length < 2) return { startId: null as string | null, endId: null as string | null }
    const m = orderedRouteMarkers
    return {
      startId: m[0].id,
      endId: m[m.length - 1].id,
    }
  }, [focus, orderedRouteMarkers])

  const handleSelectCard = (item: NormalizedRecommendation) => {
    if (!setSelected) return
    if (item.lat === null || item.lng === null) {
      setCoordHint("이 장소는 좌표 정보가 없어 지도 중심을 이동할 수 없습니다.")
      window.setTimeout(() => setCoordHint(null), 3200)
      return
    }
    setSelected(item.id)
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <Database size={15} color="#5B54D6" />
            <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A2E" }}>조건 기반 관광 목록</span>
            <DataSourceBadge source="LIVE" />
          </div>
          <div style={{ fontSize: 10, color: "#9EA0B8", paddingLeft: 23, lineHeight: 1.45 }}>
            한국관광공사 KorWith/TourAPI 프록시 · {areaLabel} · 공공데이터 기반 기본 정보
          </div>
        </div>
      </div>

      {locale !== "ko" ? (
        <div style={{ fontSize: 10, color: "#9EA0B8", marginBottom: 10, lineHeight: 1.45, paddingLeft: 2 }}>
          {t("tourContent.partialRawNotice")}
        </div>
      ) : null}

      {coordHint ? (
        <div
          role="status"
          style={{
            marginBottom: 12,
            padding: "10px 12px",
            borderRadius: 12,
            background: "#FFF8ED",
            border: "1px solid #FDDCAD",
            fontSize: 12,
            color: "#92400E",
            lineHeight: 1.45,
          }}
        >
          {coordHint}
        </div>
      ) : null}

      {state.status === "loading" && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: 16,
            borderRadius: 14,
            background: "white",
            border: "1px solid #E8E9EE",
            color: "#7A7A8E",
            fontSize: 13,
          }}
        >
          <Loader2 size={18} />
          추천 장소를 불러오는 중…
        </div>
      )}

      {state.status === "error" && (
        <div
          style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 10,
            padding: 14,
            borderRadius: 14,
            background: "#FFF8F8",
            border: "1px solid #F5C4C4",
            color: "#A02020",
            fontSize: 13,
          }}
        >
          <AlertCircle size={18} style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 800, marginBottom: 4 }}>추천 데이터를 불러오지 못했습니다</div>
            <div style={{ fontSize: 12, opacity: 0.95, lineHeight: 1.45 }}>{state.message}</div>
            <div style={{ fontSize: 11, marginTop: 8, color: "#7A7A8E" }}>
              로컬 프록시(<code style={{ fontSize: 10 }}>pnpm dev</code>의 API 서버)와 <code style={{ fontSize: 10 }}>VISITKOREA_SERVICE_KEY</code>를 확인해 주세요.
            </div>
          </div>
        </div>
      )}

      {state.status === "empty" && (
        <div style={{ padding: 14, borderRadius: 14, background: "#F6F7FB", border: "1px solid #E4E6EF", fontSize: 13, color: "#6B6B88" }}>
          조건에 맞는 장소를 찾지 못했습니다. 권역을 넓히거나 다른 조건으로 다시 시도해 보세요.
        </div>
      )}

      {state.status === "ok" && (
        <>
          {state.usedFallback ? (
            <div
              style={{
                fontSize: 10,
                color: "#92400E",
                background: "#FFF8ED",
                border: "1px solid #FDDCAD",
                borderRadius: 10,
                padding: "8px 10px",
                marginBottom: 10,
              }}
            >
              세부 검색 결과가 없어 부산 전체 목록으로 대체했습니다.
            </div>
          ) : null}
          {focus ? (
            <div
              style={{
                fontSize: 11,
                color: "#6B6B88",
                marginBottom: 10,
                padding: "8px 10px",
                borderRadius: 10,
                background: "#FAFBFF",
                border: "1px solid #E8E9EE",
                lineHeight: 1.45,
              }}
            >
              카드를 선택하면 지도가 해당 장소로 이동합니다. 좌표가 있는 장소는 목록 순서대로 연결되어 코스 선으로 표시됩니다 (실제 도로 경로 아님).
            </div>
          ) : null}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {state.items.map((item) => (
              <LiveRecCard
                key={item.id}
                item={item}
                isSelected={selectedId === item.id}
                routeRole={
                  routeEnds.startId !== null &&
                  routeEnds.startId !== routeEnds.endId &&
                  item.id === routeEnds.startId
                    ? "start"
                    : item.id === routeEnds.endId
                      ? "end"
                      : undefined
                }
                onSelect={setSelected ? () => handleSelectCard(item) : undefined}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

/** 내부에서 `useTourRecommendations` 호출 — 지도 없는 화면용 */
export function LiveRecommendationSection() {
  const { busanArea } = useApp()
  const { locale } = useI18n()
  const state = useTourRecommendations({ busanAreaId: busanArea, locale })
  return <LiveRecommendationList state={state} />
}
