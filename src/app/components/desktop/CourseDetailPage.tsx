import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router";
import { motion } from "motion/react";
import {
  Clock, Footprints, MapPin, ChevronRight, ArrowLeft,
  Check, Shield, AlertTriangle, Users, Cloud, Sun,
  Accessibility, Baby, Globe, Headphones, Car, UtensilsCrossed,
} from "lucide-react";
import { PLACES, FACILITY_INFO } from "../../data/places";
import { useApp } from "../../context/AppContext";
import { TourApiPlaceDetail } from "../tour/TourApiPlaceDetail";
import { loadTourRecommendation } from "../../lib/recommendations/tourRecommendationStorage";
import type { NormalizedRecommendation } from "../../lib/recommendations/recommendationModel";
import { isTourApiDetailRoute } from "../../lib/recommendations/tourDetailRouting";
import {
  BUSAN_COORDS,
  OPEN_METEO_ATTRIBUTION,
  weatherCodeToSummaryKo,
  type OpenMeteoCurrentWeather,
} from "../../lib/weather/openMeteoClient";
import { getWeatherCurrentCached } from "../../lib/weather/getWeather";
import { predictCrowdLevel } from "../../lib/crowd/predictCrowdLevel";
import { crowdInputFromPlace } from "../../lib/crowd/crowdInputMapper";
import { CrowdPredictionCard } from "../crowd/CrowdPredictionCard";

const SCORE_META: Record<string, { score: number; color: string; gradient: string }> = {
  botanical: { score: 94, color: "#5B54D6", gradient: "linear-gradient(135deg, #4F49C8 0%, #7C75E8 100%)" },
  museum:    { score: 91, color: "#3D8B7A", gradient: "linear-gradient(135deg, #2D7A68 0%, #5DA870 100%)" },
  palace:    { score: 87, color: "#C4793C", gradient: "linear-gradient(135deg, #B36830 0%, #E09050 100%)" },
};

const SUBSCORES: Record<string, { acc: number; comfort: number; safety: number; efficiency: number; weather: number }> = {
  botanical: { acc: 96, comfort: 88, safety: 92, efficiency: 81, weather: 70 },
  museum:    { acc: 91, comfort: 90, safety: 95, efficiency: 88, weather: 97 },
  palace:    { acc: 77, comfort: 73, safety: 84, efficiency: 85, weather: 66 },
};

const HIGHLIGHTS: Record<string, { label: string; Icon: any; color: string }[]> = {
  botanical: [
    { label: "전 구간 평지 98%",     Icon: Accessibility, color: "#5B54D6" },
    { label: "엘리베이터 3기 완비",  Icon: Shield,        color: "#3D8B7A" },
    { label: "수유실·유모차 대여",   Icon: Baby,          color: "#4A7BBF" },
    { label: "온실 실내 중심 관람",  Icon: Sun,           color: "#D97706" },
  ],
  museum: [
    { label: "실내 비율 85%",        Icon: Shield,        color: "#3D8B7A" },
    { label: "4개국어 오디오가이드", Icon: Globe,         color: "#5B54D6" },
    { label: "무장애 동선 완비",     Icon: Accessibility, color: "#3D8B7A" },
    { label: "오디오가이드 무료",    Icon: Headphones,    color: "#4A7BBF" },
  ],
  palace: [
    { label: "문화·역사 체험",       Icon: Globe,         color: "#C4793C" },
    { label: "전동 휠체어 대여",     Icon: Accessibility, color: "#3D8B7A" },
    { label: "4개국어 해설 투어",    Icon: Users,         color: "#5B54D6" },
    { label: "전통 음식 체험",       Icon: UtensilsCrossed, color: "#D97706" },
  ],
};

function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
        <span style={{ fontSize: 11, color: "#8E90A8", fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: "#EEF0F7", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          style={{ height: "100%", background: color, borderRadius: 3 }}
        />
      </div>
    </div>
  );
}

export function CourseDetailPage() {
  const { id = "botanical" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { companions } = useApp();

  const fromState = (location.state as { tourRecommendation?: NormalizedRecommendation } | null)
    ?.tourRecommendation;
  const stored = id ? loadTourRecommendation(id) : null;
  const tourItem =
    fromState && fromState.id === id ? fromState : stored && stored.id === id ? stored : null;

  if (id && isTourApiDetailRoute(id, tourItem)) {
    return (
      <TourApiPlaceDetail
        variant="desktop"
        contentId={id}
        initialItem={tourItem}
        onBack={() => navigate("/desktop/results")}
      />
    );
  }

  const place   = PLACES.find(p => p.id === id) ?? PLACES[0];
  const meta    = SCORE_META[id]  ?? SCORE_META.botanical;
  const subs    = SUBSCORES[id]   ?? SUBSCORES.botanical;
  const hilites = HIGHLIGHTS[id]  ?? [];

  const wxLat = place.lat ?? BUSAN_COORDS.latitude;
  const wxLng = place.lng ?? BUSAN_COORDS.longitude;
  const wxCoordNote =
    place.lat != null && place.lng != null
      ? "관광지 좌표 기준 격자 예보"
      : "부산 대표 좌표로 조회 (코스 좌표 없음)";

  const [wxLive, setWxLive] = useState<OpenMeteoCurrentWeather | null>(null);
  const [wxLoading, setWxLoading] = useState(true);
  const [wxErr, setWxErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setWxLoading(true);
    setWxErr(null);
    getWeatherCurrentCached(wxLat, wxLng)
      .then((w) => {
        if (!cancelled) setWxLive(w);
      })
      .catch((e: unknown) => {
        if (!cancelled) setWxErr(e instanceof Error ? e.message : "날씨 데이터 없음");
      })
      .finally(() => {
        if (!cancelled) setWxLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [wxLat, wxLng]);

  const crowdPrediction = useMemo(
    () =>
      predictCrowdLevel(
        crowdInputFromPlace(place, {
          weatherCode:
            wxLive != null && wxLive.weatherCode >= 0 ? wxLive.weatherCode : null,
        }),
      ),
    [place, wxLive?.weatherCode],
  );

  const WxIconResolved =
    wxLive != null && wxLive.weatherCode >= 0 && wxLive.weatherCode <= 3 ? Sun : Cloud;

  return (
    <div style={{ minHeight: "calc(100dvh - 62px)", overflowY: "auto" }}>
      {/* ── Hero ── */}
      <div style={{
        background: meta.gradient,
        padding: "36px 52px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div>
          <button
            onClick={() => navigate("/desktop/results")}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "none", background: "rgba(255,255,255,0.18)", borderRadius: 8,
              padding: "6px 12px", cursor: "pointer", marginBottom: 16,
              color: "white", fontSize: 12, fontWeight: 600,
            }}
          >
            <ArrowLeft size={12} />코스 비교로 돌아가기
          </button>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
            Step 4 · {place.subtitle}
          </div>
          <h1 style={{
            fontSize: 30, fontWeight: 900, color: "white",
            letterSpacing: -0.8, margin: "0 0 16px",
          }}>
            {place.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
              <span style={{ fontSize: 42, fontWeight: 900, color: "white", letterSpacing: -1.5 }}>
                {meta.score}
              </span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>/ 100</span>
            </div>
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>같이가능 점수</div>
              <div style={{
                fontSize: 14, fontWeight: 700, color: "white",
              }}>
                {meta.score >= 90 ? "매우 우수" : meta.score >= 80 ? "우수" : "양호"}
              </div>
            </div>
          </div>
        </div>

        {/* Quick stats */}
        <div style={{
          background: "rgba(255,255,255,0.15)",
          borderRadius: 16, padding: "20px 28px",
          display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start",
          backdropFilter: "blur(8px)",
        }}>
          {[
            { Icon: Clock,      v: place.duration },
            { Icon: Footprints, v: `${place.walkingAmount} 보행 (${place.estimatedSteps})` },
            { Icon: MapPin,     v: place.address.split(" ").slice(0, 2).join(" ") },
          ].map(({ Icon, v }, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <Icon size={14} color="rgba(255,255,255,0.8)" />
              <span style={{ fontSize: 13, color: "white", fontWeight: 500 }}>{v}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", padding: "32px 52px 48px", gap: 28 }}>
        {/* LEFT */}
        <div style={{ flex: 1 }}>
          {/* Description */}
          <Section title="코스 소개">
            <p style={{ fontSize: 14, color: "#4A4A6A", lineHeight: 1.7, margin: 0 }}>
              {place.description}
            </p>
          </Section>

          {/* Highlights */}
          <Section title="이 코스의 강점">
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {hilites.map(({ label, Icon: HIcon, color }, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "12px 14px", borderRadius: 11,
                  background: `${color}0A`, border: `1px solid ${color}22`,
                }}>
                  <HIcon size={15} color={color} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#3A3A5A" }}>{label}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* Evidence */}
          <Section title="공공데이터 근거">
            <div style={{
              padding: "14px 16px", borderRadius: 12,
              background: "#F6F7FB", border: "1px solid #E4E6EF",
            }}>
              <div style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.6 }}>
                {place.evidence}
              </div>
              <div style={{ fontSize: 10, color: "#A0A2B8", marginTop: 6 }}>
                출처: 장애인 편의시설 공공 API · 한국관광공사 TourAPI
              </div>
            </div>
          </Section>

          {/* Facilities */}
          <Section title="접근성 시설">
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {place.facilities.map(f => {
                const info = FACILITY_INFO[f];
                return (
                  <div key={f} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    padding: "6px 12px", borderRadius: 20,
                    background: "#EEEDFA", border: "1px solid #D4D0F0",
                  }}>
                    <Check size={10} color="#5B54D6" />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6" }}>
                      {info?.label ?? f}
                    </span>
                  </div>
                );
              })}
            </div>
          </Section>
        </div>

        {/* RIGHT */}
        <div style={{ width: 320, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            fontSize: 11, color: "#78350F", background: "#FFF8ED",
            border: "1px solid #FDDCAD", borderRadius: 12,
            padding: "10px 14px", lineHeight: 1.45,
          }}>
            <strong>점수 막대</strong>는 시연용 목업입니다. <strong>날씨</strong>는 Open-Meteo 호출 결과이고,{" "}
            <strong>혼잡도 예측</strong>은 공공 분류·시간대 규칙 추정입니다. TourAPI 기반 장소 상세는 추천 카드에서 진입합니다.
          </div>
          {/* Score breakdown card */}
          <div style={{
            background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
            padding: "20px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#A0A2B8",
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 16,
            }}>
              항목별 점수 (시연용 목업)
            </div>
            <ScoreBar label="접근성"   value={subs.acc}       color="#5B54D6" />
            <ScoreBar label="편의성"   value={subs.comfort}   color="#3D8B7A" />
            <ScoreBar label="안전성"   value={subs.safety}    color="#4A7BBF" />
            <ScoreBar label="이동 효율" value={subs.efficiency} color="#B07AAF" />
            <ScoreBar label="날씨 적합도 (시연 점수)" value={subs.weather}   color="#C4793C" />
          </div>

          {/* Weather — Open-Meteo 실데이터 (기상청 단기예보와 동일 아님) */}
          <div style={{
            background: wxErr ? "#FFF8F8" : "#F0FAF6",
            borderRadius: 14,
            border: `2px solid ${wxErr ? "#F5C4C4" : "#6EE7B7"}`,
            padding: "16px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 900, color: "#065F46",
              marginBottom: 8,
              letterSpacing: 0.3,
            }}>
              실데이터 · 날씨 (Open-Meteo)
            </div>
            {wxLoading && (
              <div style={{ fontSize: 13, color: "#6B6B88" }}>날씨 정보를 불러오는 중…</div>
            )}
            {!wxLoading && wxErr && (
              <div style={{ fontSize: 13, color: "#A02020", lineHeight: 1.5 }}>
                실데이터를 불러오지 못했습니다: {wxErr}
              </div>
            )}
            {!wxLoading && !wxErr && wxLive && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <WxIconResolved size={22} color="#3D8B7A" />
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1B2E" }}>
                      {wxLive.weatherCode < 0
                        ? wxLive.summaryKo
                        : `${weatherCodeToSummaryKo(wxLive.weatherCode)} · ${Math.round(wxLive.temperatureC)}°C`}
                    </div>
                    <div style={{ fontSize: 11, color: "#6B6B88", marginTop: 4, lineHeight: 1.45 }}>
                      {wxCoordNote} · 습도 {Math.round(wxLive.relativeHumidityPct)}% · {OPEN_METEO_ATTRIBUTION}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <CrowdPredictionCard result={crowdPrediction} />

          {/* CTA */}
          <button
            onClick={() => navigate(`/desktop/timeline/${id}`)}
            style={{
              width: "100%", padding: "15px",
              borderRadius: 13, border: "none",
              background: meta.gradient,
              color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: `0 6px 20px ${meta.color}35`,
            }}
          >
            타임라인 확인하기
            <ChevronRight size={16} />
          </button>
          <button
            onClick={() => navigate(`/desktop/live/${id}`)}
            style={{
              width: "100%", padding: "12px",
              borderRadius: 11,
              border: "1.5px solid #E4E6EF",
              background: "white",
              color: "#6B6B88", fontSize: 13, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <AlertTriangle size={13} />
            조건 기반 · 대체 코스 보기
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{
        fontSize: 13, fontWeight: 700, color: "#1A1B2E",
        marginBottom: 12, letterSpacing: -0.2,
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}
