import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router"
import {
  ArrowLeft,
  Cloud,
  Footprints,
  Navigation,
  Phone,
  Globe,
  Database,
  Star,
  Play,
  ChevronRight,
  Images,
} from "lucide-react"
import type { NormalizedRecommendation } from "../../lib/recommendations/recommendationModel"
import { recommendationToTourPlace } from "../../lib/recommendations/recommendationToTourPlace"
import { mergeDetailCommonIntoPlace } from "../../lib/tour/mergeTourDetail"
import { TourApiClientError, fetchTourDetailCommon } from "../../lib/tour/tourApiClient"
import type { NormalizedTourPlace } from "../../lib/tour/tourTypes"
import { OPEN_METEO_ATTRIBUTION, type OpenMeteoCurrentWeather, type OpenMeteoHourlySlot } from "../../lib/weather/openMeteoClient"
import { getWeatherCurrentCached, getWeatherHourlyCached } from "../../lib/weather/getWeather"
import {
  deriveScorePresentationLabel,
} from "../../lib/recommendations/liveCardDerive"
import {
  SORT_WEIGHT_DISCLAIMER_KO,
  WEATHER_SOURCE_BADGE_KO,
  CARD_SOURCE_BADGE_LIVE_KO,
  CROWD_PREDICTION_SOURCE_LINE_KO,
} from "../../lib/copy/trustMessaging"
import { TopNav } from "../TopNav"
import { predictCrowdLevel } from "../../lib/crowd/predictCrowdLevel"
import { crowdInputFromRecommendation } from "../../lib/crowd/crowdInputMapper"
import { CrowdPredictionCard } from "../crowd/CrowdPredictionCard"
import { fetchKoWikipediaSummary } from "../../lib/external/wikipediaSummaryKo"
import { useApp } from "../../context/AppContext"
import { PLACES } from "../../data/places"
import { useI18n } from "../../i18n/I18nContext"

const NO_OVERVIEW_PLACEHOLDER = "소개 글이 제공되지 않았습니다."

function stripVisitRecommendCopy(s: string): string {
  return s
    .replace(/현장\s*확인을\s*권장합니다\.?/gi, "")
    .replace(/\s*·\s*$/g, "")
    .replace(/\s+/g, " ")
    .trim()
}

function openKakaoPlace(name: string, lat: number | null, lng: number | null, regionPrefix: string) {
  if (lat != null && lng != null) {
    window.open(
      `https://map.kakao.com/link/map/${encodeURIComponent(name)},${lat},${lng}`,
      "_blank",
      "noopener,noreferrer",
    )
    return
  }
  window.open(`https://map.kakao.com/?q=${encodeURIComponent(`${regionPrefix} ${name}`)}`, "_blank", "noopener,noreferrer")
}

export type TourApiPlaceDetailProps = {
  variant: "mobile" | "desktop"
  contentId: string
  initialItem: NormalizedRecommendation | null
  onBack: () => void
}

export function TourApiPlaceDetail({
  variant,
  contentId,
  initialItem,
  onBack,
}: TourApiPlaceDetailProps) {
  const { t } = useI18n()
  const regionPrefix = t("common.regionBusan")
  const [merged, setMerged] = useState<NormalizedTourPlace | null>(() =>
    initialItem ? mergeDetailCommonIntoPlace(recommendationToTourPlace(initialItem), null) : null,
  )
  const [detailLoading, setDetailLoading] = useState(Boolean(initialItem))
  const [detailError, setDetailError] = useState<string | null>(null)
  const [visitAt, setVisitAt] = useState(() => new Date())
  const [weather, setWeather] = useState<OpenMeteoCurrentWeather | null>(null)
  const [hourlySlot, setHourlySlot] = useState<OpenMeteoHourlySlot | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [wikiExtract, setWikiExtract] = useState<string | null>(null)
  const [wikiThumbUrl, setWikiThumbUrl] = useState<string | null>(null)

  const navigate = useNavigate()
  const { selectedCourse } = useApp()
  const executionPlaceId = PLACES.some((p) => p.id === selectedCourse)
    ? selectedCourse
    : PLACES[0]?.id ?? "haeundae"

  const baseItem = initialItem

  useEffect(() => {
    if (!initialItem) return
    let cancelled = false
    setDetailLoading(true)
    setDetailError(null)
    fetchTourDetailCommon({
      contentId: initialItem.id,
      contentTypeId: initialItem.contentTypeId,
    })
      .then((payload) => {
        if (cancelled) return
        const base = recommendationToTourPlace(initialItem)
        const place = mergeDetailCommonIntoPlace(base, payload.item)
        setMerged(place)
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setDetailError(t("tourDetail.errorDetailLoad"))
        if (import.meta.env.DEV) {
          const isClientErr = e instanceof TourApiClientError
          // eslint-disable-next-line no-console
          console.warn("[TourApiPlaceDetail] detailCommon2 failed (dev only)", {
            code: isClientErr ? e.code : "UNKNOWN",
            status: isClientErr ? e.detail?.upstreamStatus : undefined,
            endpoint: isClientErr ? e.detail?.endpoint : undefined,
            resultCode: isClientErr ? e.detail?.resultCode : undefined,
            reason: isClientErr ? e.detail?.reason : (e instanceof Error ? e.message : String(e)),
          })
        }
      })
      .finally(() => {
        if (!cancelled) setDetailLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [initialItem])

  const lat = merged?.lat ?? baseItem?.lat ?? null
  const lng = merged?.lng ?? baseItem?.lng ?? null

  useEffect(() => {
    if (lat == null || lng == null) return
    let cancelled = false
    setWeatherError(null)
    getWeatherCurrentCached(lat, lng)
      .then((w) => {
        if (!cancelled) setWeather(w)
      })
      .catch((e: unknown) => {
        if (!cancelled) setWeatherError(e instanceof Error ? e.message : t("tourDetail.errorWeather"))
      })
    return () => {
      cancelled = true
    }
  }, [lat, lng])

  useEffect(() => {
    if (lat == null || lng == null) return
    let cancelled = false
    getWeatherHourlyCached(lat, lng, visitAt)
      .then((slot) => {
        if (!cancelled) setHourlySlot(slot)
      })
      .catch(() => {
        if (!cancelled) setHourlySlot(null)
      })
    return () => {
      cancelled = true
    }
  }, [lat, lng, visitAt])

  useEffect(() => {
    const rawApi = merged?.overview?.trim() || baseItem?.overview?.trim() || ""
    const apiOv = rawApi === NO_OVERVIEW_PLACEHOLDER ? "" : rawApi
    const needsWiki = !apiOv || apiOv.length < 36
    if (!needsWiki || !baseItem) {
      setWikiExtract(null)
      setWikiThumbUrl(null)
      return
    }
    const name = merged?.title ?? baseItem.title
    if (!name?.trim()) return
    let cancelled = false
    fetchKoWikipediaSummary(name.trim())
      .then((r) => {
        if (cancelled) return
        setWikiExtract(r.extract)
        setWikiThumbUrl(r.thumbnailUrl)
      })
      .catch(() => {
        if (!cancelled) {
          setWikiExtract(null)
          setWikiThumbUrl(null)
        }
      })
    return () => {
      cancelled = true
    }
  }, [merged?.overview, merged?.title, baseItem?.id, baseItem?.overview, baseItem?.title])

  if (!baseItem) {
    return (
      <div style={{ minHeight: "100dvh", background: "#F8F9FC" }}>
        {variant === "mobile" && <TopNav title={t("tourDetail.title")} />}
        <div style={{ padding: variant === "mobile" ? "24px 20px" : "48px 52px", maxWidth: 560 }}>
          <p style={{ fontSize: 14, color: "#4A4A6A", lineHeight: 1.65, marginBottom: 16 }}>
            이 주소만으로는 TourAPI 상세를 불러올 수 없습니다. 추천 목록에서 장소를 선택해 주세요.
          </p>
          <button
            type="button"
            onClick={onBack}
            style={{
              width: variant === "mobile" ? "100%" : "auto",
              minWidth: 200,
              height: 48,
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            추천 화면으로 돌아가기
          </button>
          <div style={{ fontSize: 11, color: "#A0A2B8", marginTop: 14 }}>
            요청 id: <code>{contentId}</code>
          </div>
        </div>
      </div>
    )
  }

  const title = merged?.title ?? baseItem.title
  const rawApiOv = merged?.overview?.trim() || baseItem.overview?.trim() || ""
  const apiOv = rawApiOv === NO_OVERVIEW_PLACEHOLDER ? "" : rawApiOv
  const apiLongEnough = Boolean(apiOv.length >= 36)
  const apiShortButPresent = Boolean(apiOv.length > 0 && !apiLongEnough)
  const overview =
    (apiLongEnough ? apiOv : null) ??
    wikiExtract ??
    (apiShortButPresent ? apiOv : null) ??
    `${title.replace(/\s+$/, "")}은(는) ${t("tourDetail.fallbackOverview")}`
  const showWikiAttribution = Boolean(wikiExtract && !apiLongEnough)
  const accessibilityNoteDisplay = stripVisitRecommendCopy(
    baseItem.accessibilityNote?.trim() ?? "",
  )
  const accessibleInfoDisplay = merged?.accessibleInfo?.trim()
    ? stripVisitRecommendCopy(merged.accessibleInfo.trim())
    : ""
  const imageUrl =
    merged?.image || merged?.thumbnail || baseItem.imageUrl || baseItem.thumbnailUrl
  const recommendationStyleLabel = deriveScorePresentationLabel(baseItem)

  const crowdPrediction = useMemo(() => {
    const rawWx = hourlySlot?.weatherCode ?? weather?.weatherCode
    const safeWxCode =
      rawWx != null && rawWx >= 0 ? rawWx : null
    const snap =
      hourlySlot != null && hourlySlot.weatherCode >= 0
        ? {
            weatherCode: hourlySlot.weatherCode,
            precipitationMm: hourlySlot.precipitationMm,
            precipitationProbabilityPct: hourlySlot.precipitationProbabilityPct,
            windSpeedMs: hourlySlot.windSpeedMs,
            temperatureC: hourlySlot.temperatureC,
          }
        : weather != null && weather.weatherCode >= 0
          ? {
              weatherCode: weather.weatherCode,
              temperatureC: weather.temperatureC,
            }
          : undefined
    return predictCrowdLevel(
      crowdInputFromRecommendation(baseItem, {
        visitAt,
        weatherCode: safeWxCode,
        weatherSnapshot: snap,
      }),
    )
  }, [baseItem, hourlySlot, weather, visitAt])

  function toDatetimeLocalValue(d: Date): string {
    const pad = (n: number) => String(n).padStart(2, "0")
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const innerPadDesktop = "clamp(24px, 4vw, 48px) clamp(16px, 5vw, 72px) 48px"
  const innerPadding = variant === "mobile" ? "0 20px 40px" : innerPadDesktop

  const hero = (
    <div
      style={{
        position: "relative",
        height: variant === "mobile" ? 200 : "min(340px, 34vw)",
        minHeight: variant === "mobile" ? 200 : 280,
      }}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      ) : (
        <div
          style={{
            width: "100%",
            height: "100%",
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 55%)",
          }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, transparent 35%, rgba(0,0,0,0.58) 100%)",
        }}
      />
      <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
          <span
            style={{
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: 0.4,
              padding: "4px 8px",
              borderRadius: 6,
              background: "rgba(255,255,255,0.95)",
              color: "#0D5A2A",
              border: "1px solid #C8E9D9",
            }}
          >
            {CARD_SOURCE_BADGE_LIVE_KO}
          </span>
        </div>
        <h1
          style={{
            color: "white",
            fontSize: variant === "mobile" ? 19 : 26,
            fontWeight: 800,
            margin: 0,
            letterSpacing: -0.4,
          }}
        >
          {title}
        </h1>
      </div>
    </div>
  )

  const weatherOneLiner =
    hourlySlot != null
      ? hourlySlot.weatherCode === -1
        ? `${hourlySlot.timeLabelKo} · 정보 없음`
        : `${hourlySlot.timeLabelKo} · ${Math.round(hourlySlot.temperatureC)}°C · ${hourlySlot.summaryKo}`
      : weather != null
        ? weather.weatherCode === -1
          ? `${visitAt.toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} · 정보 없음`
          : `${visitAt.toLocaleString("ko-KR", { month: "long", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false })} · ${Math.round(weather.temperatureC)}°C · ${weather.summaryKo} (현재 격자에 가까운 시각)`
        : null

  const weatherCard = (
    <div
      style={{
        background: weatherError ? "#FFF8F8" : "#F0FAF6",
        borderRadius: 14,
        border: `1px solid ${weatherError ? "#F5C4C4" : "#C3E8D4"}`,
        padding: 16,
        fontFamily: '"Noto Sans KR", system-ui, sans-serif',
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 800, color: "#1A1A2E", marginBottom: 8 }}>예상 날씨 (선택 시간 기준)</div>
      {lat != null && lng != null && (
        <label style={{ display: "block", marginBottom: 12, fontSize: 12, color: "#4A4A6A" }}>
          <span style={{ display: "block", marginBottom: 6, fontWeight: 600 }}>방문 일시 (날씨·혼잡도 기준)</span>
          <input
            type="datetime-local"
            value={toDatetimeLocalValue(visitAt)}
            onChange={(e) => {
              const v = e.target.value
              if (!v) return
              const d = new Date(v)
              if (!Number.isNaN(d.getTime())) setVisitAt(d)
            }}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 10,
              border: "1px solid #C3E8D4",
              padding: "0 12px",
              fontSize: 14,
              boxSizing: "border-box",
            }}
          />
        </label>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 6,
            background: "#E6FFFA",
            border: "1px solid #99F6E4",
            color: "#0F766E",
          }}
        >
          {WEATHER_SOURCE_BADGE_KO}
        </span>
        <span style={{ fontSize: 11, fontWeight: 700, color: "#6B6B88" }}>장소 좌표 격자</span>
      </div>
      {weatherError && <div style={{ fontSize: 13, color: "#A02020" }}>{weatherError}</div>}
      {!weatherError && weatherOneLiner && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Cloud size={20} color="#3D8B7A" />
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1A2E" }}>{weatherOneLiner}</div>
            <div style={{ fontSize: 11, color: "#6B6B88", marginTop: 4, lineHeight: 1.45 }}>
              {hourlySlot
                ? t("tourDetail.weatherOpenMeteoHourly")
                : `Open-Meteo 격자 예보 · ${OPEN_METEO_ATTRIBUTION}`}
            </div>
          </div>
        </div>
      )}
      {!weatherError && !weatherOneLiner && lat != null && lng != null && (
        <div style={{ fontSize: 13, color: "#6B6B88" }}>날씨를 불러오는 중…</div>
      )}
      {(lat == null || lng == null) && (
        <div style={{ fontSize: 13, color: "#6B6B88" }}>
          좌표가 없어 해당 위치 날씨를 표시하지 못했습니다. 부산 시 기준 예보는 추천 화면에서 확인해 주세요.
        </div>
      )}
    </div>
  )

  const mainBody = (
    <>
      {variant === "desktop" && (
        <div
          style={{
            padding: "28px 52px 0",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            type="button"
            onClick={onBack}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "none",
              background: "#F0F1F7",
              borderRadius: 8,
              padding: "8px 14px",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: "#4A4A6A",
            }}
          >
            <ArrowLeft size={14} /> 추천 결과로
          </button>
          <span style={{ fontSize: 12, color: "#9EA0B8" }}>TourAPI 공공데이터 상세</span>
        </div>
      )}

      {hero}

      {variant === "mobile" ? (
        <div style={{ padding: innerPadding, width: "100%", maxWidth: "min(720px, 100%)", margin: "0 auto" }}>
          <div style={{ marginBottom: 18 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: "#A0A2B8",
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 8,
              }}
            >
              소개
            </div>
            <p style={{ fontSize: 17, color: "#3A3A5C", lineHeight: 1.75, margin: 0 }}>{overview}</p>
            {showWikiAttribution ? (
              <p style={{ fontSize: 11, color: "#9EA0B8", margin: "10px 0 0", lineHeight: 1.5 }}>
                참고: 한국어 위키백과 공개 요약 · 이용 조건은 위키백과 라이선스를 따릅니다.
              </p>
            ) : null}
          </div>

          {wikiThumbUrl && wikiThumbUrl !== imageUrl ? (
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A0A2B8", marginBottom: 8 }}>
                참고 이미지 (위키백과)
              </div>
              <div style={{ borderRadius: 14, overflow: "hidden", border: "1px solid #E4E6EF" }}>
                <img src={wikiThumbUrl} alt="" style={{ width: "100%", display: "block", maxHeight: 220, objectFit: "cover" }} />
              </div>
            </div>
          ) : null}

          <div style={{ marginBottom: 18, padding: "12px 14px", borderRadius: 12, background: "#FAFBFF", border: "1px solid #E8E9EE" }}>
            <div style={{ fontSize: 12, fontWeight: 800, color: "#5B54D6", marginBottom: 6 }}>이용 참고</div>
            <p style={{ fontSize: 13, color: "#4A4A6A", margin: 0, lineHeight: 1.6 }}>
              운영·휴무는 시설 안내를 확인하고, 네이버·위키 등에서 장소명을 검색해 보세요.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate(`/mobile/execution/${executionPlaceId}`)}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 12,
                border: "none",
                background: "linear-gradient(135deg, #3D8B7A 0%, #2D6B5E 100%)",
                color: "white",
                fontSize: 15,
                fontWeight: 800,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Play size={17} fill="white" />
              코스 실행 화면으로
              <ChevronRight size={16} />
            </button>
            <button
              type="button"
              onClick={() => openKakaoPlace(title, lat, lng, regionPrefix)}
              style={{
                width: "100%",
                minHeight: 48,
                borderRadius: 12,
                border: "1.5px solid #E4E6EF",
                background: "white",
                color: "#4A4A6A",
                fontSize: 15,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Navigation size={17} />
              카카오맵에서 열기
            </button>
          </div>
        </div>
      ) : (
      <div style={{ padding: innerPadding, width: "100%", maxWidth: "100%", margin: "0 auto", boxSizing: "border-box" }}>
        {detailLoading && (
          <div style={{ fontSize: 13, color: "#6B6B88", marginBottom: 12 }}>상세 공공데이터를 불러오는 중…</div>
        )}
        {detailError && (
          <div
            role="status"
            style={{
              fontSize: 13,
              color: "#92400E",
              marginBottom: 12,
              padding: "10px 12px",
              borderRadius: 10,
              border: "1px solid #FDDCAD",
              background: "#FFF8ED",
            }}
          >
            {detailError}
          </div>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: variant === "desktop" ? "minmax(0, 1fr) minmax(300px, min(30vw, 460px))" : "1fr",
            gap: variant === "desktop" ? 32 : 0,
            alignItems: "start",
          }}
        >
          <div>
            <div style={{ marginBottom: 22 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: "#A0A2B8",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                소개
              </div>
              <p style={{ fontSize: "clamp(15px, 1.05vw, 18px)", color: "#3A3A5C", lineHeight: 1.75, margin: 0 }}>{overview}</p>
              {showWikiAttribution ? (
                <p style={{ fontSize: 12, color: "#9EA0B8", margin: "10px 0 0", lineHeight: 1.5 }}>
                  참고: 한국어 위키백과 공개 요약 · 이용 조건은 위키백과 라이선스를 따릅니다.
                </p>
              ) : null}
            </div>

            {wikiThumbUrl && wikiThumbUrl !== imageUrl ? (
              <div style={{ marginBottom: 22 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#A0A2B8",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Images size={14} color="#5B54D6" />
                  참고 이미지 (위키백과)
                </div>
                <div
                  style={{
                    borderRadius: 14,
                    overflow: "hidden",
                    border: "1px solid #E4E6EF",
                    boxShadow: "0 2px 10px rgba(26,26,46,0.05)",
                    maxHeight: 280,
                  }}
                >
                  <img
                    src={wikiThumbUrl}
                    alt=""
                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", maxHeight: 280 }}
                  />
                </div>
                <p style={{ fontSize: 11, color: "#9EA0B8", margin: "8px 0 0", lineHeight: 1.45 }}>
                  위키백과 문서에 실린 썸네일로, 현장과 다를 수 있습니다.
                </p>
              </div>
            ) : null}

            <div
              style={{
                marginBottom: 22,
                padding: "14px 16px",
                borderRadius: 14,
                background: "#FAFBFF",
                border: "1px solid #E8E9EE",
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 800, color: "#5B54D6", marginBottom: 8 }}>이용 참고</div>
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 13, color: "#4A4A6A", lineHeight: 1.65 }}>
                <li>운영 시간·휴무는 시설 안내를 우선 확인해 주세요.</li>
                <li>주차·유모차·휠체어 동선은 공공 정보와 안내문 기준입니다.</li>
                <li>
                  더 알아보기:{" "}
                  <a
                    href={`https://search.naver.com/search.naver?query=${encodeURIComponent(`${title} 부산`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#5B54D6", fontWeight: 700 }}
                  >
                    네이버 검색
                  </a>
                  {" · "}
                  <a
                    href={`https://ko.wikipedia.org/w/index.php?search=${encodeURIComponent(title)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: "#5B54D6", fontWeight: 700 }}
                  >
                    위키백과 검색
                  </a>
                </li>
              </ul>
            </div>

            {accessibleInfoDisplay ? (
              <div style={{ marginBottom: 18 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#A0A2B8",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    marginBottom: 8,
                  }}
                >
                  접근성
                </div>
                <p style={{ fontSize: 13, color: "#3A3A5C", lineHeight: 1.65, margin: 0 }}>
                  {accessibleInfoDisplay}
                </p>
              </div>
            ) : null}

            {(merged?.tel || merged?.homepage) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 18 }}>
                {merged?.tel && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#3A3A5C" }}>
                    <Phone size={14} color="#5B54D6" />
                    <span>{merged.tel}</span>
                  </div>
                )}
                {merged?.homepage && (
                  <a
                    href={merged.homepage.startsWith("http") ? merged.homepage : `https://${merged.homepage}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#5B54D6" }}
                  >
                    <Globe size={14} /> 홈페이지
                  </a>
                )}
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 8,
                padding: "12px 14px",
                borderRadius: 12,
                background: "#FAFBFF",
                border: "1px solid #E8E9EE",
                marginBottom: 18,
              }}
            >
              <Database size={14} color="#8E90A8" style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: 11, color: "#7A7A8E", lineHeight: 1.55 }}>
                본 상세는 한국관광공사 KorService2 detailCommon2와 목록 데이터를 병합한 결과입니다.
                우측「혼잡도 예측」은 실측 유동인구가 아니라 공공 분류·시간대 규칙 추정입니다.
              </span>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div
              style={{
                background: "white",
                borderRadius: 16,
                border: "1px solid #E4E6EF",
                padding: 18,
                boxShadow: "0 2px 10px rgba(26,26,46,0.04)",
              }}
            >
              <div style={{ fontSize: 11, fontWeight: 700, color: "#A0A2B8", marginBottom: 10 }}>
                추천 정렬 참고 (비점수)
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 8 }}>
                <Star size={16} color="#5B54D6" style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1A2E", lineHeight: 1.45 }}>
                  현재 기준 추천 유형: {recommendationStyleLabel}
                </span>
              </div>
              <div style={{ fontSize: 12, color: "#6B6B88", lineHeight: 1.5 }}>
                {SORT_WEIGHT_DISCLAIMER_KO} 목록 순서는 내부 규칙으로 정한 것이며 객관 점수가 아닙니다.
              </div>
              <div style={{ marginTop: 12, fontSize: 12, color: "#6B6B88", display: "flex", gap: 8 }}>
                <Footprints size={14} />
                <span>{accessibilityNoteDisplay || t("tourDetail.accessibilityChecked")}</span>
              </div>
            </div>

            {weatherCard}
            <CrowdPredictionCard result={crowdPrediction} />
          </div>
        </div>

        <div
          style={{
            marginTop: 12,
            padding: "14px 16px",
            borderRadius: 12,
            background: "#FAFAFA",
            border: "1px solid #E8E9EE",
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 800, color: "#6B7280", marginBottom: 8 }}>데이터 출처</div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: "#6B7280", lineHeight: 1.65 }}>
            <li>{CARD_SOURCE_BADGE_LIVE_KO}</li>
            <li>{WEATHER_SOURCE_BADGE_KO}</li>
            <li>{CROWD_PREDICTION_SOURCE_LINE_KO}</li>
          </ul>
        </div>

        <div style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 12 }}>
          <button
            type="button"
            onClick={() => navigate(`/desktop/execution/${executionPlaceId}`)}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #3D8B7A 0%, #2D6B5E 100%)",
              color: "white",
              fontSize: 15,
              fontWeight: 800,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              boxShadow: "0 4px 14px rgba(61,139,122,0.22)",
            }}
          >
            <Play size={18} fill="white" />
            코스 실행 화면으로
            <ChevronRight size={17} />
          </button>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <button
              type="button"
              onClick={() => navigate(`/desktop/departure/${executionPlaceId}`)}
              style={{
                flex: "1 1 200px",
                minHeight: 48,
                borderRadius: 12,
                border: "1.5px solid #5B54D6",
                background: "#EEEDFA",
                color: "#5B54D6",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              출발 전 체크리스트
            </button>
            <button
              type="button"
              onClick={() => openKakaoPlace(title, lat, lng, regionPrefix)}
              style={{
                flex: "1 1 200px",
                minHeight: 48,
                borderRadius: 12,
                border: "1.5px solid #E4E6EF",
                background: "white",
                color: "#4A4A6A",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <Navigation size={17} />
              카카오맵에서 열기
            </button>
          </div>
        </div>
      </div>
      )}
    </>
  )

  if (variant === "mobile") {
    return (
      <div style={{ minHeight: "100dvh", background: "#F8F9FC" }}>
        <TopNav title={title} />
        {mainBody}
      </div>
    )
  }

  return (
    <div style={{ minHeight: "calc(100dvh - 62px)", overflowY: "auto", background: "#F6F7FB" }}>{mainBody}</div>
  )
}
