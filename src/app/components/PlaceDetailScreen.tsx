import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  MapPin, Clock, CheckCircle, XCircle, AlertCircle,
  ArrowUpDown, Accessibility, Coffee, Car, Headphones,
  Globe, Baby, Map, ChevronRight, Star, Users,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";

/* ── Detail data per course + step ── */
interface PlaceDetail {
  photo: string;
  description: string;
  accessibilityGrade: "A" | "B" | "C";
  accessibilityScore: number;
  operatingHours: string;
  estimatedStay: string;
  tips: string[];
  facilities: { key: string; available: boolean; note?: string }[];
  crowdNow: "여유" | "보통" | "혼잡";
}

const PLACE_DETAILS: Record<string, Record<number, PlaceDetail>> = {
  botanical: {
    1: { // Botanical Garden
      photo: "https://images.unsplash.com/photo-1709697565934-179751cd2e7c?w=700&q=80",
      description: "서울 식물원은 열린 숲, 주제정원, 호수원, 습지원의 4가지 공간으로 구성된 도시형 식물원입니다. 온실은 완전 평지로 유모차와 휠체어가 자유롭게 이동 가능합니다.",
      accessibilityGrade: "A",
      accessibilityScore: 96,
      operatingHours: "화~일 09:30 – 18:00 (17:00 입장 마감)",
      estimatedStay: "약 2시간",
      tips: [
        "정문 맞은편 유모차·휠체어 무료 대여 가능",
        "온실 내 엘리베이터 3기 운영 중",
        "자갈 구간 있으나 대부분 아스팔트",
      ],
      facilities: [
        { key: "elevator",            available: true,  note: "3기 운영" },
        { key: "accessible_restroom", available: true,  note: "4개소" },
        { key: "parking",             available: true },
        { key: "cafe",                available: true,  note: "2개소" },
        { key: "nursing_room",        available: true },
        { key: "guide_map",           available: true,  note: "점자·음성" },
        { key: "audio_guide",         available: false },
        { key: "foreign_guide",       available: true,  note: "영/중/일/프" },
        { key: "wheelchair_rental",   available: true,  note: "무료 대여" },
      ],
      crowdNow: "보통",
    },
    4: { // Hangang Park
      photo: "https://images.unsplash.com/photo-1747588813943-eb7c75f20325?w=700&q=80",
      description: "여의도 한강공원은 완전 평지의 넓은 공원으로, 자전거 도로와 산책로가 분리되어 있어 안전한 보행이 가능합니다. 강변을 따라 편의시설이 잘 갖추어져 있습니다.",
      accessibilityGrade: "A",
      accessibilityScore: 98,
      operatingHours: "24시간 개방",
      estimatedStay: "약 1시간 15분",
      tips: [
        "전 구간 평지, 휠체어·유모차 완전 이동 가능",
        "공원 내 화장실 다수, 장애인 화장실 완비",
        "자전거도로 주의 (산책로 별도)",
      ],
      facilities: [
        { key: "elevator",            available: false },
        { key: "accessible_restroom", available: true,  note: "공원 내 다수" },
        { key: "parking",             available: true },
        { key: "cafe",                available: true },
        { key: "nursing_room",        available: true },
        { key: "guide_map",           available: false },
        { key: "audio_guide",         available: false },
        { key: "foreign_guide",       available: false },
        { key: "wheelchair_rental",   available: false },
      ],
      crowdNow: "보통",
    },
  },
  museum: {
    1: {
      photo: "https://images.unsplash.com/photo-1684931879880-adabb487e89e?w=700&q=80",
      description: "국립중앙박물관은 전 구역에 엘리베이터와 무장애 경로가 확보되어 있으며, 오디오 가이드와 4개국어 안내를 제공합니다. 넓고 쾌적한 실내 공간으로 날씨에 관계없이 편안하게 관람할 수 있습니다.",
      accessibilityGrade: "A",
      accessibilityScore: 94,
      operatingHours: "화~일 10:00 – 18:00 (수·토 21:00까지)",
      estimatedStay: "약 2시간 30분",
      tips: [
        "오디오가이드 무료 대여 (한/영/중/일)",
        "전 층 엘리베이터 연결, 무장애 동선 완비",
        "내부 레스토랑 및 카페 이용 가능",
      ],
      facilities: [
        { key: "elevator",            available: true,  note: "5기 운영" },
        { key: "accessible_restroom", available: true,  note: "층마다" },
        { key: "parking",             available: true },
        { key: "cafe",                available: true },
        { key: "nursing_room",        available: true },
        { key: "guide_map",           available: true },
        { key: "audio_guide",         available: true,  note: "4개국어 무료" },
        { key: "foreign_guide",       available: true,  note: "4개국어" },
        { key: "wheelchair_rental",   available: true,  note: "무료 대여" },
      ],
      crowdNow: "혼잡",
    },
  },
  palace: {
    1: {
      photo: "https://images.unsplash.com/photo-1756058492058-baff1f8f40e2?w=700&q=80",
      description: "경복궁은 조선의 정궁으로, 주요 동선은 평지이지만 일부 자갈길이 있습니다. 전동 휠체어 대여가 가능하며, 외국어 해설 서비스가 잘 갖추어져 있습니다.",
      accessibilityGrade: "B",
      accessibilityScore: 78,
      operatingHours: "화~일 09:00 – 18:00 (계절별 변동)",
      estimatedStay: "약 2시간",
      tips: [
        "자갈길 구간 있음 — 전동 휠체어 추천",
        "정문에서 전동 휠체어 무료 대여 가능",
        "기상에 따라 야외 이동 주의",
      ],
      facilities: [
        { key: "elevator",            available: false, note: "일부 구간만" },
        { key: "accessible_restroom", available: true,  note: "2개소" },
        { key: "parking",             available: true },
        { key: "cafe",                available: false },
        { key: "nursing_room",        available: false },
        { key: "guide_map",           available: true },
        { key: "audio_guide",         available: true },
        { key: "foreign_guide",       available: true,  note: "4개국어" },
        { key: "wheelchair_rental",   available: true,  note: "전동 무료" },
      ],
      crowdNow: "혼잡",
    },
  },
};

const FACILITY_INFO: Record<string, { label: string; icon: React.ReactNode }> = {
  elevator:            { label: "엘리베이터",   icon: <ArrowUpDown size={14} /> },
  accessible_restroom: { label: "장애인 화장실", icon: <Accessibility size={14} /> },
  parking:             { label: "장애인 주차",   icon: <Car size={14} /> },
  cafe:                { label: "카페·식음",     icon: <Coffee size={14} /> },
  nursing_room:        { label: "수유실",         icon: <Baby size={14} /> },
  guide_map:           { label: "점자 안내",     icon: <Map size={14} /> },
  audio_guide:         { label: "오디오 가이드", icon: <Headphones size={14} /> },
  foreign_guide:       { label: "외국어 안내",   icon: <Globe size={14} /> },
  wheelchair_rental:   { label: "휠체어 대여",   icon: <Accessibility size={14} /> },
};

function GradeBadge({ grade, score }: { grade: "A" | "B" | "C"; score: number }) {
  const cfg = {
    A: { bg: "#EDF7F2", border: "#C3E8D4", color: "#3D8B7A", label: "접근성 우수" },
    B: { bg: "#FFF8ED", border: "#FDD9A8", color: "#D97706", label: "접근성 양호" },
    C: { bg: "#FEF2F2", border: "#FCA5A5", color: "#DC2626", label: "접근성 주의" },
  }[grade];
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 8,
      background: cfg.bg, border: `1.5px solid ${cfg.border}`,
      borderRadius: 12, padding: "10px 14px",
    }}>
      <div style={{ fontSize: 24, fontWeight: 900, color: cfg.color, letterSpacing: -1 }}>{grade}</div>
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: cfg.color }}>{cfg.label}</div>
        <div style={{ fontSize: 10, color: cfg.color, opacity: 0.8 }}>접근성 점수 {score}점</div>
      </div>
    </div>
  );
}

export function PlaceDetailScreen() {
  const { id, step } = useParams<{ id: string; step: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const stepIdx = parseInt(step ?? "1");
  const courseStep = place.courseSteps[stepIdx];

  // Find detail data — fall back to first available detail
  const placeDetails = PLACE_DETAILS[place.id];
  const detail = placeDetails?.[stepIdx] ?? placeDetails?.[1] ?? Object.values(placeDetails ?? {})[0];

  if (!detail || !courseStep) {
    return (
      <div style={{ minHeight: "100dvh", background: "#F4F5FA" }}>
        <TopNav title="장소 상세" />
        <div style={{ padding: 40, textAlign: "center" as const, color: "#9EA0B8" }}>
          장소 정보를 불러올 수 없습니다.
        </div>
      </div>
    );
  }

  const crowdColors = { 여유: "#3D8B7A", 보통: "#F59E3A", 혼잡: "#E55555" };
  const crowdColor = crowdColors[detail.crowdNow];

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title={courseStep.name} />

      {/* ── Photo header ── */}
      <div style={{ position: "relative", height: 200 }}>
        <img
          src={detail.photo}
          alt={courseStep.name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.6) 100%)",
        }} />
        <div style={{ position: "absolute", bottom: 14, left: 16, right: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 19, fontWeight: 700, color: "white", letterSpacing: -0.4 }}>
                {courseStep.name}
              </div>
              {courseStep.subname && (
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", marginTop: 2 }}>
                  {courseStep.subname}
                </div>
              )}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 4,
              background: crowdColor + "DD",
              borderRadius: 20, padding: "4px 10px",
            }}>
              <Users size={11} color="white" />
              <span style={{ fontSize: 11, fontWeight: 700, color: "white" }}>
                지금 {detail.crowdNow}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 0", flex: 1, overflowY: "auto" }}>

        {/* ── Accessibility grade ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 12 }}
        >
          <GradeBadge grade={detail.accessibilityGrade} score={detail.accessibilityScore} />
        </motion.div>

        {/* ── Basic info ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{
            background: "white", borderRadius: 14, border: "1px solid #E8E9EF",
            padding: "14px 16px", marginBottom: 12,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Clock size={13} color="#5B54D6" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 11, color: "#9EA0B8", marginBottom: 1 }}>운영 시간</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{detail.operatingHours}</div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              <Star size={13} color="#5B54D6" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 11, color: "#9EA0B8", marginBottom: 1 }}>예상 체류 시간</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E" }}>{detail.estimatedStay}</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Description ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          style={{
            background: "white", borderRadius: 14, border: "1px solid #E8E9EF",
            padding: "14px 16px", marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4A4A6A", marginBottom: 8 }}>장소 소개</div>
          <p style={{ fontSize: 12, color: "#4A4A6A", lineHeight: 1.65, margin: 0 }}>
            {detail.description}
          </p>
        </motion.div>

        {/* ── Tips ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{
            background: "#F6F5FF", borderRadius: 14, border: "1px solid #E0DEFA",
            padding: "14px 16px", marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6", marginBottom: 8 }}>
            접근성 이용 팁
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {detail.tips.map((tip, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 7 }}>
                <CheckCircle size={12} color="#5B54D6" style={{ flexShrink: 0, marginTop: 1 }} />
                <span style={{ fontSize: 11, color: "#4A4A6A", lineHeight: 1.5 }}>{tip}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Facilities ── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          style={{
            background: "white", borderRadius: 14, border: "1px solid #E8E9EF",
            padding: "14px 16px", marginBottom: 12,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4A4A6A", marginBottom: 10 }}>
            접근성 · 편의 시설
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {detail.facilities.map((f, i) => {
              const info = FACILITY_INFO[f.key];
              if (!info) return null;
              const isLast = i === detail.facilities.length - 1;
              return (
                <div key={f.key} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 0",
                  borderBottom: isLast ? "none" : "1px solid #F4F5FA",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8,
                    background: f.available ? "#EEEDFA" : "#F4F5FA",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                    color: f.available ? "#5B54D6" : "#B0B2C8",
                  }}>
                    {info.icon}
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 600, color: f.available ? "#1A1A2E" : "#B0B2C8", flex: 1, letterSpacing: -0.2 }}>
                    {info.label}
                  </span>
                  {f.available ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {f.note && <span style={{ fontSize: 10, color: "#8E90A8" }}>{f.note}</span>}
                      <CheckCircle size={13} color="#3D8B7A" />
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      {f.note && <span style={{ fontSize: 10, color: "#F59E3A" }}>{f.note}</span>}
                      {f.note ? <AlertCircle size={13} color="#F59E3A" /> : <XCircle size={13} color="#D0D2DC" />}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: "#B0B2C8", marginTop: 8, textAlign: "center" as const }}>
            출처: 장애인 편의시설 공공API · 한국관광공사 TourAPI
          </div>
        </motion.div>

        {/* ── Navigate actions ── */}
        <div style={{ display: "flex", gap: 8, marginBottom: 32 }}>
          <button
            onClick={() => navigate(`/mobile/crowd/${place.id}`)}
            style={{
              flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid #E8E9EF",
              background: "white", color: "#4A4A6A", fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            혼잡도 보기
            <ChevronRight size={12} />
          </button>
          <button
            onClick={() => navigate(`/mobile/safety/${place.id}`)}
            style={{
              flex: 1, padding: "12px", borderRadius: 11, border: "1.5px solid #E8E9EF",
              background: "white", color: "#4A4A6A", fontSize: 12, fontWeight: 600,
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
            }}
          >
            안전 정보
            <ChevronRight size={12} />
          </button>
        </div>
      </div>
    </div>
  );
}
