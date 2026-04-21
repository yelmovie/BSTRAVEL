import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock, Footprints, Cloud, Users, ChevronRight,
  Check, Star, ArrowUpDown, Bookmark, Share2, MapPin,
  BarChart2, Activity,
} from "lucide-react";
import { PLACES } from "../../data/places";
import { LiveRecommendationList, DataSourceBadge } from "../recommendations/LiveRecommendationSection";
import {
  RecommendationMapFocusProvider,
  useRecommendationMapFocus,
} from "../../context/RecommendationMapFocusContext";
import { useApp } from "../../context/AppContext";
import { useI18n } from "../../i18n/I18nContext";
import { useTourRecommendations } from "../../lib/recommendations/useTourRecommendations";
import { markersFromRecommendations } from "../../lib/tour/tourMapMarkers";
import { KakaoTourPlacesMap } from "../map/KakaoTourPlacesMap";

/* ─── design tokens ──────────────────────────────── */
// Fixed section heights that every card MUST share
const SEC = {
  HEADER:  148, // px — gradient hero (rank + title + score)
  METRICS:  72, // px — 3-col stats strip
  PILLS:    78, // px — 2 status pills
  WHY:     124, // px — "왜 추천?" bullets
  // FOOTER is not fixed-height but always at bottom via marginTop:auto
};

/* ─── per-course meta ─────────────────────────────── */
const COURSE_META: Record<string, {
  score: number; color: string; gradient: string;
  weather: { label: string; short: string; level: "ok" | "warn" };
  crowd:   { label: string; short: string; level: "ok" | "warn" };
  cost: string;
  indoor: number;
  baseWhys: string[];
}> = {
  haeundae: {
    score: 92, color: "#5B54D6",
    gradient: "linear-gradient(135deg, #5B54D6 0%, #7C75E8 100%)",
    weather: { label: "실내 아쿠아리움 중심 — 날씨 무관", short: "날씨 무관", level: "ok" },
    crowd:   { label: "주말 성수기 혼잡 주의", short: "주말 혼잡 주의", level: "warn" },
    cost: "약 32,000원", indoor: 65,
    baseWhys: [
      "실내 무장애 동선 완비 — 휠체어·유모차 최적",
      "동백섬 평지 산책로 — 어르신 보행 부담 최소",
      "영·중·일 다국어 안내 — 외국인 동행 지원",
    ],
  },
  gamcheon: {
    score: 87, color: "#C4793C",
    gradient: "linear-gradient(135deg, #C4793C 0%, #E09050 100%)",
    weather: { label: "야외 비율 높음 — 우천 시 주의", short: "우천 시 주의", level: "warn" },
    crowd:   { label: "주말 관광객 집중 주의", short: "주말 혼잡 주의", level: "warn" },
    cost: "약 18,000원", indoor: 35,
    baseWhys: [
      "무장애 탐방로 — 주요 포토스팟 접근 가능",
      "4개국어 안내판 — 외국인 동행 최적",
      "자갈치시장 실내 공간 — 날씨 무관",
    ],
  },
  citizenpark: {
    score: 95, color: "#3D8B7A",
    gradient: "linear-gradient(135deg, #3D8B7A 0%, #5DA870 100%)",
    weather: { label: "야외이나 넓은 쉼터 완비", short: "쉼터 완비", level: "ok" },
    crowd:   { label: "현재 한산", short: "현재 한산", level: "ok" },
    cost: "약 8,000원", indoor: 30,
    baseWhys: [
      "완전 평지 배리어프리 인증 — 휠체어·유모차 자유 이동",
      "무료 입장 — 예산 부담 없음",
      "도심 위치 교통 접근성 최우수",
    ],
  },
  dongrae: {
    score: 86, color: "#B07AAF",
    gradient: "linear-gradient(135deg, #B07AAF 0%, #C89EC8 100%)",
    weather: { label: "실내 역사관 중심 — 날씨 무관", short: "날씨 무관", level: "ok" },
    crowd:   { label: "현재 한산 — 평일 방문 추천", short: "현재 한산", level: "ok" },
    cost: "약 14,000원", indoor: 70,
    baseWhys: [
      "실내 역사관 엘리베이터 완비 — 휠체어·유모차 자유 이동",
      "다국어 오디오가이드 — 외국인 동행 최적",
      "금강공원 완만한 평지 산책 — 보행 부담 최소",
    ],
  },
};

const COMPANION_WHY: Record<string, Record<string, string>> = {
  elderly: {
    haeundae:    "어르신 최적 — 계단·경사 없는 완전 평지",
    gamcheon:    "어르신 주의 — 자갈길 구간 일부, 사전 확인 권장",
    citizenpark: "어르신 최적 — 계단·경사 없는 완전 평지",
    dongrae:     "어르신 최적 — 실내 역사관 엘리베이터 완비",
  },
  stroller: {
    haeundae:    "유모차 완전 자유 이동 확인됨",
    gamcheon:    "유모차 주의 — 자갈길 구간 우회 필요",
    citizenpark: "유모차 완전 자유 이동 확인됨",
    dongrae:     "유모차 이동 가능 — 역사관 엘리베이터·금강공원 평지",
  },
  wheelchair: {
    haeundae:    "휠체어 배리어프리 전 구간",
    gamcheon:    "무장애 탐방로 완비",
    citizenpark: "휠체어 배리어프리 전 구간",
    dongrae:     "휠체어 접근 가능 — 엘리베이터 완비·배리어프리 동선",
  },
  foreigner: {
    haeundae:    "외국어 안내 기본 수준 제공",
    gamcheon:    "4개국어 안내판 무료",
    citizenpark: "4개국어 안내판 무료",
    dongrae:     "4개국어 오디오가이드 — 외국인 동행 최적",
  },
  children: {
    haeundae:    "어린이 체험 프로그램 운영",
    gamcheon:    "역사 체험 어린이 해설 투어",
    citizenpark: "어린이 체험 프로그램 운영",
    dongrae:     "역사 체험 어린이 해설 투어 운영",
  },
};

function getWhyBullets(placeId: string, companions: string[]): string[] {
  const base = COURSE_META[placeId]?.baseWhys ?? [];
  const extra = companions.map(c => COMPANION_WHY[c]?.[placeId]).filter(Boolean)[0];
  return extra ? [...base.slice(0, 2), extra] : base.slice(0, 3);
}

/* ─── sub-components ─────────────────────────────── */

/** Rank badge shown at top-left of the header */
function RankBadge({ rank, isTop }: { rank: number; isTop: boolean }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      background: isTop ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.18)",
      borderRadius: 7, padding: "3px 8px",
    }}>
      {isTop && <Star size={10} color="white" fill="white" />}
      <span style={{ fontSize: 11, color: "white", fontWeight: 700 }}>
        {isTop ? "가장 추천" : `${rank}위 추천`}
      </span>
    </div>
  );
}

/** Large score number in the header */
function ScoreDisplay({ score }: { score: number }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
      <span style={{
        fontSize: 30, fontWeight: 900,
        color: "white", letterSpacing: -1, lineHeight: 1,
      }}>
        {score}
      </span>
      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", fontWeight: 600 }}>/100</span>
    </div>
  );
}

/** Status pill — truncates long labels */
function StatusPill({ icon, label, level }: {
  icon: React.ReactNode; label: string; level: "ok" | "warn";
}) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 5,
      padding: "5px 10px", borderRadius: 8,
      background: level === "ok" ? "#EDF7F2" : "#FFF8ED",
      border: `1px solid ${level === "ok" ? "#C3E8D4" : "#FDDCAD"}`,
      overflow: "hidden",
      minWidth: 0,
    }}>
      <span style={{ color: level === "ok" ? "#3D8B7A" : "#D97706", flexShrink: 0 }}>{icon}</span>
      <span style={{
        fontSize: 11, fontWeight: 600,
        color: level === "ok" ? "#1E6B4A" : "#92400E",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </div>
  );
}

/** Single why-bullet with 2-line clamp */
function WhyBullet({ text, color }: { text: string; color: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
      <Check size={12} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
      <span style={{
        fontSize: 12, color: "#4A4A6A", lineHeight: 1.45,
        overflow: "hidden",
        display: "-webkit-box",
        WebkitLineClamp: 2,
        WebkitBoxOrient: "vertical",
      }}>
        {text}
      </span>
    </div>
  );
}

/* ─── main card ─────────────────────────────────── */
function CourseCard({
  place, rank, isTop, companions, isSaved, onSave, onShare, onDetail,
}: {
  place: typeof PLACES[0];
  rank: number;
  isTop: boolean;
  companions: string[];
  isSaved: boolean;
  onSave: () => void;
  onShare: () => void;
  onDetail: () => void;
}) {
  const meta  = COURSE_META[place.id]!;
  const whys  = getWhyBullets(place.id, companions);

  return (
    <div style={{
      background: "white",
      borderRadius: 18,
      border: `2px solid ${isTop ? meta.color : "#E4E6EF"}`,
      overflow: "hidden",
      boxShadow: isTop
        ? `0 8px 32px ${meta.color}22`
        : "0 2px 10px rgba(0,0,0,0.05)",
      display: "flex",
      flexDirection: "column",
      flex: 1,               /* fills the motion.div wrapper height */
      /* Total card height equals sum of fixed sections + footer content */
    }}>

      {/* ── ① HEADER (gradient hero) ─────────── */}
      <div style={{
        height: SEC.HEADER,
        flexShrink: 0,
        background: meta.gradient,
        padding: "18px 20px 16px",
        position: "relative",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        overflow: "hidden",
      }}>
        {/* Decorative circle */}
        <div style={{
          position: "absolute", top: -28, right: -28,
          width: 120, height: 120, borderRadius: "50%",
          background: "rgba(255,255,255,0.08)",
          pointerEvents: "none",
        }} />

        <div style={{ position: "absolute", top: 12, right: 12, zIndex: 2 }}>
          <DataSourceBadge source="DEMO" />
        </div>

        {/* Top row: rank badge + area tag */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <RankBadge rank={rank} isTop={isTop} />
          <div style={{
            display: "flex", alignItems: "center", gap: 3,
            background: "rgba(255,255,255,0.2)", borderRadius: 6, padding: "3px 7px",
          }}>
            <MapPin size={9} color="white" />
            <span style={{ fontSize: 10, color: "white", fontWeight: 600 }}>{place.busanArea}</span>
          </div>
        </div>

        {/* Middle: subtitle + title (1-line truncate) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "8px 0 6px" }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.65)", fontWeight: 600, marginBottom: 4 }}>
            {place.subtitle}
          </div>
          <div style={{
            fontSize: 17, fontWeight: 800, color: "white",
            letterSpacing: -0.4, lineHeight: 1.2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {place.name.replace(" 코스", "")}
          </div>
        </div>

        {/* Bottom: score */}
        <ScoreDisplay score={meta.score} />
      </div>

      {/* ── ② METRICS (time / walking / facilities) ─ */}
      <div style={{
        height: SEC.METRICS,
        flexShrink: 0,
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        borderBottom: "1px solid #F0F1F6",
      }}>
        {[
          { Icon: Clock,      value: place.duration.replace("약 ", ""),  label: "소요 시간" },
          { Icon: Footprints, value: place.walkingAmount,                 label: "보행 부담" },
          { Icon: Users,      value: `${place.facilities.length}개 시설`, label: "편의시설" },
        ].map(({ Icon, value, label }, mi) => (
          <div key={mi} style={{
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            padding: "8px 6px",
            borderRight: mi < 2 ? "1px solid #F0F1F6" : "none",
            gap: 4,
          }}>
            <Icon size={14} color="#A0A2B8" />
            <div style={{
              fontSize: 12, fontWeight: 700, color: "#3A3A5C",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: "100%", textAlign: "center",
            }}>
              {value}
            </div>
            <div style={{ fontSize: 9, color: "#B0B2C8", fontWeight: 500 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── ③ PILLS (weather + crowd) ─────────── */}
      <div style={{
        height: SEC.PILLS,
        flexShrink: 0,
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: 8,
        padding: "10px 16px",
        borderBottom: "1px solid #F0F1F6",
        alignItems: "center",
        overflow: "hidden",
      }}>
        <StatusPill
          icon={<Cloud size={10} />}
          label={meta.weather.short}
          level={meta.weather.level}
        />
        <StatusPill
          icon={<Users size={10} />}
          label={meta.crowd.short}
          level={meta.crowd.level}
        />
      </div>

      {/* ── ④ WHY BULLETS ─────────────────────── */}
      <div style={{
        height: SEC.WHY,
        flexShrink: 0,
        padding: "14px 18px",
        overflow: "hidden",
        borderBottom: "1px solid #F0F1F6",
      }}>
        <div style={{
          fontSize: 9, fontWeight: 700, color: "#B0B2C8",
          letterSpacing: 1.2, textTransform: "uppercase", marginBottom: 10,
        }}>
          왜 추천하나요?
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {whys.slice(0, 3).map((w, wi) => (
            <WhyBullet key={wi} text={w} color={meta.color} />
          ))}
        </div>
      </div>

      {/* ── ⑤ FOOTER (cost + save/share + CTA) ─ */}
      <div style={{
        marginTop: "auto",
        padding: "14px 18px 18px",
        flexShrink: 0,
      }}>
        {/* Expected cost */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          marginBottom: 12,
          padding: "7px 10px",
          background: "#F8F9FC",
          borderRadius: 8,
          border: "1px solid #ECEDF5",
        }}>
          <span style={{ fontSize: 11, color: "#8E90A8", fontWeight: 500 }}>예상 비용</span>
          <span style={{ fontSize: 13, fontWeight: 800, color: "#3A3A5C" }}>{meta.cost}</span>
        </div>

        {/* Save + Share */}
        <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <button
            onClick={onSave}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 9,
              border: `1.5px solid ${isSaved ? meta.color : "#E4E6EF"}`,
              background: isSaved ? `${meta.color}12` : "white",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
              transition: "all 0.15s",
            }}
          >
            <Bookmark
              size={13}
              color={isSaved ? meta.color : "#A0A2B8"}
              fill={isSaved ? meta.color : "none"}
            />
            <span style={{ fontSize: 11, fontWeight: 600, color: isSaved ? meta.color : "#6B6B88" }}>
              {isSaved ? "저장됨" : "저장"}
            </span>
          </button>
          <button
            onClick={onShare}
            style={{
              flex: 1, padding: "8px 0", borderRadius: 9,
              border: "1.5px solid #E4E6EF", background: "white",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            <Share2 size={13} color="#A0A2B8" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B88" }}>공유</span>
          </button>
        </div>

        {/* CTA — always last, same height */}
        <button
          onClick={onDetail}
          style={{
            width: "100%", padding: "12px 0",
            borderRadius: 11,
            border: isTop ? "none" : `1.5px solid ${meta.color}`,
            background: isTop ? meta.gradient : "white",
            color: isTop ? "white" : meta.color,
            fontSize: 13, fontWeight: 700, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            boxShadow: isTop ? `0 4px 14px ${meta.color}28` : "none",
            transition: "opacity 0.15s",
          }}
        >
          이 코스 자세히 보기
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

/* ─── page ───────────────────────────────────────── */
export function ResultsPage() {
  return (
    <RecommendationMapFocusProvider>
      <ResultsPageInner />
    </RecommendationMapFocusProvider>
  );
}

function ResultsPageInner() {
  const navigate = useNavigate();
  const { companions, setSelectedCourse, savedCourses, toggleSavedCourse, busanArea } = useApp();
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

  const [sortBy, setSortBy] = useState<"score" | "duration" | "walking">("score");
  const [shareToast, setShareToast] = useState<string | null>(null);

  const sorted = [...PLACES].sort((a, b) => {
    if (sortBy === "score")    return b.score - a.score;
    if (sortBy === "walking")  return a.walkingLevel - b.walkingLevel;
    if (sortBy === "duration") return a.duration.localeCompare(b.duration);
    return 0;
  });

  const topId = sorted[0]?.id;

  function goDetail(id: string) {
    setSelectedCourse(id);
    navigate(`/desktop/course/${id}`);
  }

  function handleShare(id: string, name: string) {
    const text = `같이가능 — ${name} 코스`;
    if (navigator.share) {
      navigator.share({ title: text, text, url: window.location.href }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(`${text}\n${window.location.href}`).catch(() => {});
    }
    setShareToast(`"${name}" 링크가 복사되었습니다`);
    setTimeout(() => setShareToast(null), 2500);
  }

  const companionLabel = companions.length > 0
    ? companions.map(c =>
        ({ elderly: "어르신", stroller: "유모차", wheelchair: "휠체어", children: "어린이", foreigner: "외국인" }[c] ?? c)
      ).join("·") + " 동반 조건 최적화"
    : "공공데이터 기반 접근성 분석";

  return (
    <div style={{
      padding: "40px 48px 64px",
      minHeight: "calc(100dvh - 62px)",
      overflowY: "auto",
      background: "#F6F7FB",
    }}>
      {/* Share toast */}
      {shareToast && (
        <div style={{
          position: "fixed", bottom: 32, left: "50%", transform: "translateX(-50%)",
          background: "#1A1B2E", color: "white", padding: "12px 24px",
          borderRadius: 12, fontSize: 13, fontWeight: 600, zIndex: 999,
          boxShadow: "0 8px 24px rgba(0,0,0,0.2)", whiteSpace: "nowrap",
          pointerEvents: "none",
        }}>
          {shareToast}
        </div>
      )}

      {/* ── Page header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
          <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#5B54D6" }} />
          <span style={{
            fontSize: 11, fontWeight: 700, color: "#5B54D6",
            letterSpacing: 1.5, textTransform: "uppercase",
          }}>
            Step 3 — 코스 비교
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1A1B2E", margin: "0 0 5px", letterSpacing: -0.8 }}>
              {sorted.length}개 최적 코스 분석 완료
            </h1>
            <p style={{ fontSize: 13, color: "#8E90A8", margin: "0 0 12px" }}>
              {companionLabel}
            </p>
            {/* Quick-nav row */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                onClick={() => navigate("/desktop/compare")}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 8,
                  border: "1.5px solid #E4E6EF", background: "white",
                  fontSize: 12, fontWeight: 600, color: "#4A4A6A", cursor: "pointer",
                }}
              >
                <BarChart2 size={13} color="#5B54D6" />
                코스 나란히 비교
              </button>
              <button
                onClick={() => { setSelectedCourse(sorted[0].id); navigate(`/desktop/feasibility/${sorted[0].id}`); }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "7px 14px", borderRadius: 8,
                  border: "1.5px solid #E4E6EF", background: "white",
                  fontSize: 12, fontWeight: 600, color: "#4A4A6A", cursor: "pointer",
                }}
              >
                <Activity size={13} color="#3D8B7A" />
                실행 가능성 분석
              </button>
            </div>
          </div>

          {/* Sort controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            <ArrowUpDown size={13} color="#8E90A8" />
            <span style={{ fontSize: 12, color: "#8E90A8" }}>정렬:</span>
            {(["score", "walking", "duration"] as const).map(s => (
              <button
                key={s}
                onClick={() => setSortBy(s)}
                style={{
                  padding: "6px 12px", borderRadius: 8,
                  border: `1.5px solid ${sortBy === s ? "#5B54D6" : "#E4E6EF"}`,
                  background: sortBy === s ? "#EEEDFA" : "white",
                  fontSize: 12,
                  fontWeight: sortBy === s ? 700 : 500,
                  color: sortBy === s ? "#5B54D6" : "#6B6B88",
                  cursor: "pointer",
                }}
              >
                {{ score: "점수순", walking: "보행순", duration: "시간순" }[s]}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      <div style={{ marginBottom: 28, maxWidth: 1100, marginInline: "auto" }}>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1B2E", marginBottom: 4 }}>
            실시간 관광지 지도
          </div>
          <div style={{ fontSize: 11, color: "#8E90A8", marginBottom: 12, lineHeight: 1.45 }}>
            카드 또는 마커를 선택하면 서로 연동됩니다.
          </div>
          <KakaoTourPlacesMap
            markers={markers}
            selectedPlaceId={selectedPlaceId}
            onMarkerSelect={onMarkerSelect}
            style={{ height: 320, minHeight: 280 }}
          />
          {recState.status === "ok" && markers.length === 0 ? (
            <div style={{ marginTop: 10, fontSize: 12, color: "#6B6B88", lineHeight: 1.45 }}>
              표시할 좌표가 있는 장소가 없어 지도에 마커를 그리지 못했습니다.
            </div>
          ) : null}
        </div>
        <LiveRecommendationList state={recState} />
      </div>

      <div style={{ fontSize: 11, fontWeight: 700, color: "#A0A2B8", letterSpacing: 0.8, textTransform: "uppercase", marginBottom: 18, maxWidth: 1100, marginInline: "auto" }}>
        시연용 분석 코스 (데모 데이터) · 점수·실행 가능성은 시뮬레이션
      </div>

      {/* ── Card grid ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: 22,
        alignItems: "stretch",      /* ← all cards in a row stretch to same height */
        maxWidth: 1100,
        margin: "0 auto",
      }}>
        {sorted.map((place, i) => {
          const isTop = place.id === topId;
          const isLastAlone =
            sorted.length % 3 !== 0 &&
            i === sorted.length - 1 &&
            sorted.length % 3 === 1;

          return (
            <motion.div
              key={place.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.07 }}
              style={{
                gridColumn: isLastAlone ? "2" : undefined,
                display: "flex",          /* flex wrapper so card can fill height */
                flexDirection: "column",
              }}
            >
              <CourseCard
                place={place}
                rank={i + 1}
                isTop={isTop}
                companions={companions}
                isSaved={savedCourses.includes(place.id)}
                onSave={() => toggleSavedCourse(place.id)}
                onShare={() => handleShare(place.id, place.name)}
                onDetail={() => goDetail(place.id)}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Bottom note */}
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
        점수는 동행자 조건·날씨·혼잡도·접근성 공공데이터를 기반으로 산출되며 실시간 갱신됩니다
      </motion.p>
    </div>
  );
}