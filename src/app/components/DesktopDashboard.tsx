import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  BarChart, Bar, XAxis, Tooltip, Cell,
} from "recharts";
import {
  Shield, Footprints, Users, Zap, Train, MapPin, Clock,
  CheckCircle, AlertTriangle, AlertCircle, Info,
  ChevronRight, ArrowRight, Award, CloudRain, Wind,
  RefreshCw, Flag, Layers, X, Star, Sparkles,
  TrendingDown, Eye, Route, Lock, BarChart2,
} from "lucide-react";
import { PLACES } from "../data/places";

/* ══════════════════════════════════════════
   MOCK DATA — inline for new desktop features
══════════════════════════════════════════ */

const SUBSCORES: Record<string, {
  accessibility: number; comfort: number;
  safety: number; efficiency: number; weather: number;
}> = {
  botanical: { accessibility: 96, comfort: 88, safety: 92, efficiency: 81, weather: 70 },
  museum:    { accessibility: 91, comfort: 90, safety: 95, efficiency: 88, weather: 97 },
  palace:    { accessibility: 77, comfort: 73, safety: 84, efficiency: 85, weather: 66 },
};

const EVIDENCE: Record<string, { label: string; source: string; type: "ok" | "warn" }[]> = {
  botanical: [
    { label: "평지 98%",        source: "장애인 편의시설 공공API",   type: "ok" },
    { label: "엘리베이터 3기",  source: "한국관광공사 TourAPI",      type: "ok" },
    { label: "유모차 대여 가능", source: "서울 식물원 공식 데이터",   type: "ok" },
    { label: "혼잡도 낮음",     source: "서울 열린데이터광장",       type: "ok" },
    { label: "수유실 완비",     source: "보건복지부 시설 DB",        type: "ok" },
  ],
  museum: [
    { label: "실내 비율 85%",   source: "문화체육관광부 DB",         type: "ok" },
    { label: "4개국어 안내",    source: "국립중앙박물관 공식",       type: "ok" },
    { label: "엘리베이터 5기",  source: "장애인 편의시설 공공API",   type: "ok" },
    { label: "오디오가이드 무료", source: "박물관 운영정보 API",      type: "ok" },
  ],
  palace: [
    { label: "자갈길 구간 주의", source: "문화재청 현장조사 DB",     type: "warn" },
    { label: "전동휠체어 대여", source: "경복궁 운영정보",          type: "ok" },
    { label: "4개국어 해설",    source: "문화재청 공식 API",        type: "ok" },
    { label: "성수기 혼잡 주의", source: "서울 유동인구 API",        type: "warn" },
  ],
};

const WHY_WORKS: Record<string, string> = {
  botanical: "전 구간 98% 평지로 이루어져 휠체어·유모차 이동이 자유롭습니다. 엘리베이터 3기가 전 구역에 확보되어 있으며, 온실 실내 관람 비중이 높아 기후 영향을 최소화합니다. 유동인구 데이터 분석 결과 오전 시간대 혼잡도가 낮아 어르신과 유아 동반 가족에게 가장 적합한 코스로 분석되었습니다.",
  museum:    "실내 관람 비율이 85%로 날씨 변화에 강하며, 5기의 엘리베이터가 전 층을 연결합니다. 4개국어 오디오가이드가 무료로 제공되어 외국인 동행 시에도 최적입니다. 공공데이터 기반 혼잡도 분석에서 오전 10–11시 방문 시 대기 없이 입장 가능한 것으로 나타났습니다.",
  palace:    "4개국어 전문 해설 서비스와 전동 휠체어 무료 대여로 문화 체험 가치가 높습니다. 다만 일부 자갈길 구간과 성수기 혼잡도로 인해 사전 예약 및 이른 시간 방문이 권장됩니다. 문화재청 데이터 기준 평일 오전이 보행 부담이 가장 낮습니다.",
};

interface RiskAlert {
  id: string;
  type: "crowd" | "weather" | "closure" | "accessibility";
  level: "info" | "warning" | "urgent";
  title: string;
  detail: string;
  source: string;
}

const RISK_ALERTS: Record<string, RiskAlert[]> = {
  botanical: [
    { id: "r1", type: "crowd",   level: "warning", title: "오후 혼잡도 증가 예측", detail: "14:00–16:00 혼잡도 78% 도달 예측. 오전 입장 권장.", source: "서울시 유동인구 API" },
    { id: "r2", type: "weather", level: "info",    title: "오후 소나기 가능성", detail: "15:00 이후 강수 확률 35%. 온실 내 이동 중심 플랜 권장.", source: "기상청 날씨 API" },
  ],
  museum: [
    { id: "r1", type: "crowd",   level: "urgent",  title: "특별전 혼잡 경보", detail: "현재 특별 기획전 진행 중. 평일 대비 혼잡도 +48% 감지.", source: "국립중앙박물관 실시간 API" },
    { id: "r2", type: "closure", level: "info",    title: "일부 전시관 정기점검", detail: "3전시실 11/15–11/20 임시 휴관. 우회 동선 확보됨.", source: "국립중앙박물관 공지" },
  ],
  palace: [
    { id: "r1", type: "crowd",   level: "warning", title: "주말 입장 대기 발생", detail: "정문 앞 평균 35분 대기. 사전 예매 권장.", source: "문화재청 실시간 API" },
    { id: "r2", type: "accessibility", level: "warning", title: "경사 구간 접근성 제한", detail: "휠체어·유모차 시 자갈길 구간(3개소) 우회 필요.", source: "장애인 편의시설 공공API" },
    { id: "r3", type: "weather", level: "info",    title: "자외선 지수 높음", detail: "오늘 자외선 지수 7 (높음). 그늘·실내 휴식 장소 확인 권장.", source: "기상청 날씨 API" },
  ],
};

interface BackupRoute {
  triggerLabel: string;
  triggerType: "weather" | "crowd" | "accessibility";
  triggerDesc: string;
  backupId: string;
  backupName: string;
  backupScore: number;
  changes: { icon: string; text: string; positive: boolean }[];
}

const BACKUP_ROUTES: Record<string, BackupRoute> = {
  botanical: {
    triggerLabel: "우천 + 혼잡도 증가",
    triggerType: "weather",
    triggerDesc: "오후 강수 예보 및 혼잡도 78% 감지로 대체 코스 자동 제안",
    backupId: "museum",
    backupName: "국립중앙박물관 코스",
    backupScore: 91,
    changes: [
      { icon: "➜", text: "야외 온실 → 실내 상설전시로 전환", positive: true },
      { icon: "➜", text: "한강공원 → 박물관 카페로 대체", positive: true },
      { icon: "↓", text: "날씨 영향 위험 완전 제거", positive: true },
      { icon: "~", text: "소요 시간 유사 (약 3–4시간)", positive: true },
    ],
  },
  museum: {
    triggerLabel: "특별전 혼잡 경보",
    triggerType: "crowd",
    triggerDesc: "주말 특별 기획전으로 혼잡도 급증 — 대기 90분 이상 예측",
    backupId: "palace",
    backupName: "경복궁 & 인사동 코스",
    backupScore: 87,
    changes: [
      { icon: "➜", text: "실내 박물관 → 야외 궁궐 코스로 전환", positive: false },
      { icon: "↑", text: "문화·역사 체험 다양성 증가", positive: true },
      { icon: "↓", text: "혼잡도 즉시 감소 기대", positive: true },
      { icon: "!", text: "외국어 오디오가이드 계속 이용 가능", positive: true },
    ],
  },
  palace: {
    triggerLabel: "접근성 장벽 감지",
    triggerType: "accessibility",
    triggerDesc: "휠체어·유모차 자갈길 이동 제한 신호 감지 — 배리어프리 코스로 재구성",
    backupId: "botanical",
    backupName: "서울 식물원 코스",
    backupScore: 94,
    changes: [
      { icon: "↑", text: "평지 비율 75% → 98%로 개선", positive: true },
      { icon: "↑", text: "엘리베이터 접근성 대폭 향상", positive: true },
      { icon: "↑", text: "유모차·휠체어 완전 자유 이동", positive: true },
      { icon: "~", text: "소요 시간 유사 (약 4–5시간)", positive: true },
    ],
  },
};

/* timeline recovery: steps with some "replaced" */
interface RecoveryStep {
  name: string;
  sub: string;
  time: string;
  type: "start" | "place" | "rest" | "meal" | "end";
  status: "keep" | "replaced" | "new";
  replaceLabel?: string;
}

const RECOVERY_TIMELINES: Record<string, RecoveryStep[]> = {
  botanical: [
    { name: "마곡나루역",     sub: "9호선 출발",       time: "10:00", type: "start", status: "keep" },
    { name: "서울 식물원",    sub: "온실·야외 정원",   time: "10:05", type: "place", status: "replaced", replaceLabel: "박물관 1층 전시실" },
    { name: "호수공원 카페",  sub: "휴식 30분",        time: "12:00", type: "rest",  status: "replaced", replaceLabel: "박물관 내 카페" },
    { name: "여의도 식사",    sub: "접근성 식당가",    time: "13:00", type: "meal",  status: "keep" },
    { name: "한강공원",       sub: "평지 산책",        time: "14:15", type: "place", status: "replaced", replaceLabel: "이촌 한강공원" },
    { name: "여의도역",       sub: "5/9호선 도착",     time: "15:35", type: "end",   status: "keep" },
  ],
  museum: [
    { name: "이촌역",          sub: "4호선 출발",      time: "10:00", type: "start", status: "keep" },
    { name: "국립중앙박물관",  sub: "상설전시",        time: "10:05", type: "place", status: "replaced", replaceLabel: "경복궁 관람" },
    { name: "박물관 카페",     sub: "내부 카페 휴식",  time: "12:30", type: "rest",  status: "keep" },
    { name: "용산 식사",       sub: "근처 식당",       time: "13:15", type: "meal",  status: "replaced", replaceLabel: "인사동 한식" },
    { name: "이촌 한강공원",   sub: "강변 산책",       time: "14:30", type: "place", status: "keep" },
    { name: "이촌역",          sub: "4호선 도착",      time: "15:35", type: "end",   status: "keep" },
  ],
  palace: [
    { name: "경복궁역",        sub: "3호선 출발",      time: "10:00", type: "start", status: "keep" },
    { name: "경복궁",          sub: "궁 전체 관람",    time: "10:05", type: "place", status: "replaced", replaceLabel: "서울 식물원" },
    { name: "인사동 점심",     sub: "전통 한식",       time: "12:15", type: "meal",  status: "keep" },
    { name: "인사동 거리",     sub: "전통 문화",       time: "13:30", type: "place", status: "replaced", replaceLabel: "호수공원 카페" },
    { name: "전통 찻집",       sub: "차 한 잔",        time: "15:10", type: "rest",  status: "new" },
    { name: "종로3가역",       sub: "1/3호선 도착",    time: "15:45", type: "end",   status: "keep" },
  ],
};

/* Feasibility simulation mock data (replaces place.feasibility) */
const FEASIBILITY_DATA: Record<string, {
  successRate: number;
  interpretation: string;
  riskCounts: { low: number; medium: number; high: number };
}> = {
  botanical: {
    successRate: 94,
    interpretation: "전 구간 평지 구성과 배리어프리 시설 완비로 실현 가능성이 매우 높습니다. 오전 시간대 혼잡도가 낮아 어르신·유아 동반 가족에게 최적의 코스입니다.",
    riskCounts: { low: 3, medium: 1, high: 0 },
  },
  museum: {
    successRate: 91,
    interpretation: "실내 위주 관람으로 기후 영향이 적고 엘리베이터가 전 층에 설치되어 있습니다. 특별전 진행 중 혼잡 가능성에 사전 확인이 필요합니다.",
    riskCounts: { low: 2, medium: 2, high: 1 },
  },
  palace: {
    successRate: 77,
    interpretation: "문화적 가치는 높으나 자갈길 구간과 성수기 혼잡도로 인해 사전 확인이 필요합니다. 전동 휠체어 대여와 이른 방문이 권장됩니다.",
    riskCounts: { low: 1, medium: 2, high: 1 },
  },
};

/* ══════════════════════════════════════════
   HELPER UTILS
══════════════════════════════════════════ */

function getScoreColor(s: number): string {
  if (s >= 90) return "#3D8B7A";
  if (s >= 75) return "#5B54D6";
  if (s >= 60) return "#C4793C";
  return "#E55555";
}

function getScoreLabel(s: number): string {
  if (s >= 90) return "매우 우수";
  if (s >= 75) return "우수";
  if (s >= 60) return "양호";
  return "주의";
}

/* ══════════════════════════════════════════
   SUB-COMPONENTS
══════════════════════════════════════════ */

/* ── Large SVG Gauge ── */
function FeasibilityGauge({ score }: { score: number }) {
  const size = 196;
  const R = 80;
  const cx = size / 2;
  const cy = size / 2;
  const circ = 2 * Math.PI * R;
  // Arc covers 240 degrees (from 150° to 390°)
  const arcFraction = (score / 100) * (240 / 360);
  const offset = circ - arcFraction * circ;
  const color = getScoreColor(score);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size}>
        {/* Background arc */}
        <circle
          cx={cx} cy={cy} r={R}
          fill="none" stroke="#EEF0F7" strokeWidth={14}
          strokeDasharray={`${circ * (240 / 360)} ${circ}`}
          strokeDashoffset={0}
          strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
        />
        {/* Progress arc */}
        <motion.circle
          cx={cx} cy={cy} r={R}
          fill="none" stroke={color} strokeWidth={14}
          strokeDasharray={`${circ * (240 / 360)} ${circ}`}
          initial={{ strokeDashoffset: circ * (240 / 360) }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.4, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
          transform={`rotate(150 ${cx} ${cy})`}
        />
      </svg>
      {/* Center text */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        paddingTop: 16,
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
        >
          <div style={{ fontSize: 38, fontWeight: 900, color, lineHeight: 1, textAlign: "center", letterSpacing: -1.5 }}>
            {score}
          </div>
          <div style={{ fontSize: 11, color: "#9EA0B8", textAlign: "center", fontWeight: 600, letterSpacing: 0.2 }}>
            / 100
          </div>
          <div style={{
            fontSize: 11, fontWeight: 700, color,
            background: `${color}14`,
            borderRadius: 6, padding: "3px 10px",
            textAlign: "center", marginTop: 4,
            letterSpacing: -0.1,
          }}>
            {getScoreLabel(score)}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ── Sub-score bar ── */
function SubScoreBar({
  label, value, color, delay = 0, icon,
}: {
  label: string; value: number; color: string; delay?: number; icon: React.ReactNode;
}) {
  const bg = value >= 85 ? "#3D8B7A" : value >= 70 ? color : value >= 55 ? "#C4793C" : "#E55555";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ color: bg, flexShrink: 0 }}>{icon}</div>
      <div style={{ width: 64, flexShrink: 0 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "#6B6B88", letterSpacing: -0.1 }}>{label}</span>
      </div>
      <div style={{ flex: 1, height: 6, background: "#EEF0F7", borderRadius: 3, overflow: "hidden" }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.9, delay, ease: "easeOut" }}
          style={{ height: "100%", background: bg, borderRadius: 3 }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 800, color: bg, minWidth: 26, textAlign: "right", letterSpacing: -0.3 }}>
        {value}
      </span>
    </div>
  );
}

/* ── Evidence tag ── */
function EvidenceTag({ label, source, type }: { label: string; source: string; type: "ok" | "warn" }) {
  const ok = type === "ok";
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 10px", borderRadius: 20,
      background: ok ? "#EDF7F2" : "#FFF8ED",
      border: `1px solid ${ok ? "#C3E8D4" : "#FDDCAD"}`,
      cursor: "default",
    }}>
      {ok
        ? <CheckCircle size={10} color="#3D8B7A" />
        : <AlertCircle size={10} color="#D97706" />
      }
      <span style={{ fontSize: 11, fontWeight: 700, color: ok ? "#1E6B4A" : "#92400E", letterSpacing: -0.1 }}>{label}</span>
      <span style={{ fontSize: 9, color: ok ? "#5DA17C" : "#B45309", borderLeft: `1px solid ${ok ? "#B4DFC5" : "#FBD59E"}`, paddingLeft: 5 }}>
        {source}
      </span>
    </div>
  );
}

/* ── Risk alert row ── */
const ALERT_CFG = {
  crowd:         { icon: Users,         bg: "#FFF8ED", border: "#FDDCAD", iconColor: "#D97706", badge: "#D97706", badgeBg: "#FEF9C3" },
  weather:       { icon: CloudRain,     bg: "#EFF6FF", border: "#BFDBFE", iconColor: "#3B82F6", badge: "#2563EB", badgeBg: "#DBEAFE" },
  closure:       { icon: Lock,          bg: "#F8F9FC", border: "#E8E9EF", iconColor: "#6B7280", badge: "#6B7280", badgeBg: "#F1F5F9" },
  accessibility: { icon: AlertTriangle, bg: "#FEF2F2", border: "#FECACA", iconColor: "#DC2626", badge: "#DC2626", badgeBg: "#FEE2E2" },
};

const LEVEL_LABELS: Record<string, string> = { info: "안내", warning: "주의", urgent: "경고" };

function AlertRow({ alert }: { alert: RiskAlert }) {
  const cfg = ALERT_CFG[alert.type];
  const AlertIcon = cfg.icon;
  return (
    <div style={{
      background: cfg.bg, borderRadius: 11,
      border: `1px solid ${cfg.border}`,
      padding: "11px 13px",
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <div style={{
        width: 30, height: 30, borderRadius: 8,
        background: `${cfg.iconColor}18`,
        display: "flex", alignItems: "center", justifyContent: "center",
        flexShrink: 0,
      }}>
        <AlertIcon size={14} color={cfg.iconColor} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>{alert.title}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: cfg.badge,
            background: cfg.badgeBg, borderRadius: 4, padding: "1px 5px",
          }}>
            {LEVEL_LABELS[alert.level]}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "#5A5B78", lineHeight: 1.5, letterSpacing: -0.1 }}>{alert.detail}</div>
        <div style={{ fontSize: 9, color: "#A0A2B8", marginTop: 3 }}>출처: {alert.source}</div>
      </div>
    </div>
  );
}

/* ── Step type config ── */
const STEP_CFG: Record<string, { color: string; bg: string }> = {
  start: { color: "#5B54D6", bg: "#EEEDFA" },
  place: { color: "#3D8B7A", bg: "#EDF7F2" },
  rest:  { color: "#B07AAF", bg: "#F5EEF8" },
  meal:  { color: "#C4793C", bg: "#FEF3EA" },
  end:   { color: "#4A7BBF", bg: "#EFF6FF" },
};

/* ══════════════════════════════════════════
   SECTION COMPONENTS
══════════════════════════════════════════ */

function LeftSidebar({
  courses, selectedId, onSelect,
}: {
  courses: typeof PLACES;
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div style={{
      width: 248, flexShrink: 0,
      background: "#1A1B2E",
      display: "flex", flexDirection: "column",
      overflowY: "auto",
    }}>
      {/* Logo area */}
      <div style={{ padding: "22px 20px 16px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 4,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8,
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>
            <Route size={15} color="white" />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white", letterSpacing: -0.4 }}>같이가능</div>
            <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 0.2 }}>ACCESSIBILITY PLANNER</div>
          </div>
        </div>
      </div>

      {/* Section label */}
      <div style={{ padding: "0 20px 8px" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase" as const }}>
          코스 선택
        </span>
      </div>

      {/* Course list */}
      <div style={{ padding: "0 12px", display: "flex", flexDirection: "column", gap: 4 }}>
        {courses.map((place) => {
          const isSelected = place.id === selectedId;
          const score = Math.round(place.score * 10);
          const scoreColor = getScoreColor(score);
          return (
            <button
              key={place.id}
              onClick={() => onSelect(place.id)}
              style={{
                padding: "11px 12px", borderRadius: 10,
                border: `1.5px solid ${isSelected ? "#5B54D6" : "transparent"}`,
                background: isSelected ? "rgba(91,84,214,0.2)" : "transparent",
                cursor: "pointer", textAlign: "left" as const,
                transition: "all 0.15s ease",
                display: "flex", alignItems: "center", gap: 10,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12, fontWeight: 700,
                  color: isSelected ? "white" : "rgba(255,255,255,0.65)",
                  letterSpacing: -0.2,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const,
                }}>
                  {place.name.replace(" 코스", "")}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>
                  {place.subtitle}
                </div>
              </div>
              <div style={{
                fontSize: 13, fontWeight: 800, color: scoreColor,
                background: `${scoreColor}20`, borderRadius: 6, padding: "2px 7px",
                flexShrink: 0,
              }}>
                {score}
              </div>
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div style={{ margin: "16px 20px", height: 1, background: "rgba(255,255,255,0.08)" }} />

      {/* Data sources */}
      <div style={{ padding: "0 20px 16px" }}>
        <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: 1.5, textTransform: "uppercase" as const }}>
          연동 공공데이터
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 10 }}>
          {[
            "서울 열린데이터광장",
            "한국관광공사 TourAPI",
            "장애인 편의시설 API",
            "기상청 날씨 API",
            "문화재청 공식 DB",
            "공공 응급의료정보",
          ].map((src) => (
            <div key={src} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 4, height: 4, borderRadius: "50%", background: "#5B54D6", flexShrink: 0 }} />
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", letterSpacing: -0.1 }}>{src}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Footer */}
      <div style={{ padding: "12px 20px 20px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,0.25)", lineHeight: 1.6 }}>
          같이가능 v2.0<br />
          공공데이터 기반 접근성 여행 플래너
        </div>
      </div>
    </div>
  );
}

/* ── Main Feasibility Panel ── */
function MainPanel({
  place, view, onViewChange,
}: {
  place: typeof PLACES[0];
  view: "dashboard" | "recovery";
  onViewChange: (v: "dashboard" | "recovery") => void;
}) {
  const score = Math.round(place.score * 10);
  const subs = SUBSCORES[place.id] ?? SUBSCORES.botanical;
  const evidence = EVIDENCE[place.id] ?? [];
  const why = WHY_WORKS[place.id] ?? "";
  const recovery = RECOVERY_TIMELINES[place.id] ?? [];
  const backup = BACKUP_ROUTES[place.id];
  const backupPlace = PLACES.find((p) => p.id === backup?.backupId);
  const feasibility = FEASIBILITY_DATA[place.id] ?? FEASIBILITY_DATA.botanical;

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflowY: "auto", background: "#F4F5FA" }}>
      {/* Sub-nav */}
      <div style={{
        background: "white", borderBottom: "1px solid #E8E9EF",
        padding: "0 24px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        flexShrink: 0,
      }}>
        <div style={{ display: "flex", gap: 0 }}>
          {([["dashboard", "분석 대시보드"], ["recovery", "타임라인 복구"]] as const).map(([v, label]) => (
            <button
              key={v}
              onClick={() => onViewChange(v)}
              style={{
                padding: "14px 18px", border: "none",
                borderBottom: `2.5px solid ${view === v ? "#5B54D6" : "transparent"}`,
                background: "transparent",
                fontSize: 13, fontWeight: view === v ? 700 : 500,
                color: view === v ? "#5B54D6" : "#8E90A8",
                cursor: "pointer", letterSpacing: -0.2,
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <MapPin size={12} color="#9EA0B8" />
          <span style={{ fontSize: 11, color: "#9EA0B8" }}>{place.subtitle}</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {view === "dashboard" ? (
          <motion.div
            key="dashboard"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* ── Row 1: Gauge + Subscores ── */}
            <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18 }}>
              {/* Score card */}
              <div style={{
                background: "white", borderRadius: 16,
                border: "1px solid #E8E9EF",
                padding: "20px 24px",
                display: "flex", flexDirection: "column", alignItems: "center",
                minWidth: 230,
              }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#9EA0B8", letterSpacing: 0.5, marginBottom: 12, textTransform: "uppercase" as const }}>
                  같이가능 점수
                </div>
                <FeasibilityGauge score={score} />
                <div style={{ marginTop: 12, textAlign: "center" as const }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3 }}>
                    {place.name.replace(" 코스", "")}
                  </div>
                  <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 2 }}>{place.duration} · {place.estimatedSteps}</div>
                </div>
              </div>

              {/* Subscores */}
              <div style={{
                background: "white", borderRadius: 16,
                border: "1px solid #E8E9EF",
                padding: "20px 24px",
                display: "flex", flexDirection: "column", justifyContent: "center", gap: 14,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#4A4A6A", letterSpacing: -0.1, marginBottom: 2 }}>
                  세부 항목 점수
                </div>
                <SubScoreBar label="접근성"  value={subs.accessibility} color="#5B54D6" icon={<Shield size={13} />}   delay={0.1} />
                <SubScoreBar label="편의성"  value={subs.comfort}       color="#3D8B7A" icon={<Users size={13} />}    delay={0.18} />
                <SubScoreBar label="안전성"  value={subs.safety}        color="#4A7BBF" icon={<Eye size={13} />}      delay={0.26} />
                <SubScoreBar label="이동효율" value={subs.efficiency}   color="#B07AAF" icon={<Train size={13} />}    delay={0.34} />
                <SubScoreBar label="날씨적합" value={subs.weather}      color="#C4793C" icon={<CloudRain size={13} />} delay={0.42} />

                {/* Mini bar chart */}
                <div style={{ height: 60, marginTop: 4 }}>
                  <BarChart
                    width={320}
                    height={60}
                    data={[
                      { name: "접근성", v: subs.accessibility },
                      { name: "편의성", v: subs.comfort },
                      { name: "안전성", v: subs.safety },
                      { name: "이동효율", v: subs.efficiency },
                      { name: "날씨", v: subs.weather },
                    ]}
                    barSize={20}
                    margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                  >
                    <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#A0A2B8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                    <Bar dataKey="v" radius={[3, 3, 0, 0]}>
                      {[subs.accessibility, subs.comfort, subs.safety, subs.efficiency, subs.weather].map((v, i) => (
                        <Cell key={`score-cell-${i}`} fill={getScoreColor(v)} />
                      ))}
                    </Bar>
                  </BarChart>
                </div>
              </div>
            </div>

            {/* ── Row 2: Why This Works ── */}
            <div style={{
              background: "white", borderRadius: 16,
              border: "1px solid #E8E9EF",
              padding: "20px 24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: "#F0EFFC",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <Info size={13} color="#5B54D6" />
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
                  이 코스가 적합한 이유
                </span>
              </div>
              <p style={{ fontSize: 13, color: "#4A4A6A", lineHeight: 1.7, margin: "0 0 16px", letterSpacing: -0.1 }}>
                {why}
              </p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {evidence.map((e, i) => (
                  <EvidenceTag key={i} label={e.label} source={e.source} type={e.type} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#C0C2D0", marginTop: 10 }}>
                출처: 공공데이터 기반 분석 · 실시간 갱신
              </div>
            </div>

            {/* ── Row 3: Feasibility Details ── */}
            <div style={{
              background: "white", borderRadius: 16,
              border: "1px solid #E8E9EF",
              padding: "20px 24px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                <BarChart2 size={14} color="#5B54D6" />
                <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
                  실현 가능성 시뮬레이션
                </span>
                <div style={{
                  marginLeft: "auto", fontSize: 12, fontWeight: 700,
                  color: getScoreColor(feasibility.successRate),
                  background: `${getScoreColor(feasibility.successRate)}12`,
                  borderRadius: 7, padding: "3px 10px",
                }}>
                  {feasibility.successRate}% 실현 가능
                </div>
              </div>
              <p style={{ fontSize: 12, color: "#5A5B78", lineHeight: 1.65, margin: "0 0 14px" }}>
                {feasibility.interpretation}
              </p>

              {/* Risk summary row */}
              <div style={{ display: "flex", gap: 8 }}>
                {["low", "medium", "high"].map((level) => {
                  const count = feasibility.riskCounts[level as "low" | "medium" | "high"];
                  const cfg = {
                    low:    { label: "낮음", color: "#3D8B7A", bg: "#EDF7F2" },
                    medium: { label: "주의", color: "#D97706", bg: "#FFF8ED" },
                    high:   { label: "위험", color: "#DC2626", bg: "#FEF2F2" },
                  }[level]!;
                  return (
                    <div key={level} style={{
                      flex: 1, padding: "10px", borderRadius: 10,
                      background: cfg.bg, textAlign: "center" as const,
                    }}>
                      <div style={{ fontSize: 20, fontWeight: 900, color: cfg.color }}>{count}</div>
                      <div style={{ fontSize: 10, color: cfg.color, fontWeight: 600 }}>{cfg.label} 구간</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        ) : (
          /* ── Timeline Recovery View ── */
          <motion.div
            key="recovery"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Recovery header */}
            <div style={{
              background: "linear-gradient(135deg, #1A1B2E 0%, #2A2B42 100%)",
              borderRadius: 16, padding: "20px 24px",
              display: "flex", alignItems: "center", gap: 16,
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: "rgba(91,84,214,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <RefreshCw size={20} color="#8B84E0" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: "white", letterSpacing: -0.3, marginBottom: 4 }}>
                  자동 코스 복구 시뮬레이션
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.5 }}>
                  {backup?.triggerLabel} 감지 → 대체 코스 자동 재구성
                </div>
              </div>
              <div style={{
                background: "rgba(91,84,214,0.25)", borderRadius: 10,
                padding: "8px 14px", textAlign: "center" as const,
              }}>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 0.5 }}>BACKUP SCORE</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#8B84E0" }}>
                  {backup ? Math.round(PLACES.find(p => p.id === backup.backupId)?.score ?? 9.1 * 10) : "--"}
                </div>
              </div>
            </div>

            {/* Trigger info */}
            {backup && (
              <div style={{
                background: "#FFF8ED", borderRadius: 12,
                border: "1px solid #FDDCAD", padding: "12px 16px",
                display: "flex", gap: 10, alignItems: "flex-start",
              }}>
                <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 2 }}>
                    복구 트리거: {backup.triggerLabel}
                  </div>
                  <div style={{ fontSize: 11, color: "#78350F", lineHeight: 1.5 }}>{backup.triggerDesc}</div>
                </div>
              </div>
            )}

            {/* Step-by-step timeline */}
            <div style={{
              background: "white", borderRadius: 16,
              border: "1px solid #E8E9EF",
              padding: "20px 24px",
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 16, letterSpacing: -0.2 }}>
                구간별 변경 사항
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {recovery.map((step, i) => {
                  const cfg = STEP_CFG[step.type];
                  const isLast = i === recovery.length - 1;
                  return (
                    <div key={i} style={{ display: "flex", gap: 12 }}>
                      {/* Timeline spine */}
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 28, flexShrink: 0 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: "50%",
                          background: step.status === "keep" ? cfg.bg : step.status === "new" ? "#EDF7F2" : "#FFF8ED",
                          border: `2px solid ${step.status === "keep" ? cfg.color : step.status === "new" ? "#3D8B7A" : "#D97706"}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0, zIndex: 1,
                        }}>
                          <div style={{
                            width: 8, height: 8, borderRadius: "50%",
                            background: step.status === "keep" ? cfg.color : step.status === "new" ? "#3D8B7A" : "#D97706",
                          }} />
                        </div>
                        {!isLast && (
                          <div style={{
                            width: 2, flex: 1, minHeight: 16,
                            background: step.status === "replaced" ? "#FDDCAD" : "#E8E9EF",
                            margin: "2px 0",
                          }} />
                        )}
                      </div>

                      {/* Step content */}
                      <div style={{ flex: 1, paddingBottom: isLast ? 0 : 14 }}>
                        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: step.status === "replaced" ? 6 : 0 }}>
                          <div style={{ flex: 1 }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                              <span style={{
                                fontSize: 13, fontWeight: 700, letterSpacing: -0.2,
                                color: step.status === "replaced" ? "#B0B2C8" : "#1A1A2E",
                                textDecoration: step.status === "replaced" ? "line-through" : "none",
                              }}>
                                {step.name}
                              </span>
                              {step.status === "keep" && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, color: "#3D8B7A",
                                  background: "#EDF7F2", borderRadius: 4, padding: "1px 5px",
                                }}>유지</span>
                              )}
                              {step.status === "replaced" && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, color: "#D97706",
                                  background: "#FEF9C3", borderRadius: 4, padding: "1px 5px",
                                }}>변경 전</span>
                              )}
                              {step.status === "new" && (
                                <span style={{
                                  fontSize: 9, fontWeight: 700, color: "#3D8B7A",
                                  background: "#EDF7F2", borderRadius: 4, padding: "1px 5px",
                                }}>신규 추가</span>
                              )}
                            </div>
                            <div style={{ fontSize: 10, color: "#A0A2B8", marginTop: 1 }}>{step.sub} · {step.time}</div>
                          </div>
                        </div>

                        {step.status === "replaced" && step.replaceLabel && (
                          <div style={{
                            background: "#EDF7F2", borderRadius: 9,
                            border: "1px solid #C3E8D4",
                            padding: "8px 12px",
                            display: "flex", alignItems: "center", gap: 8,
                          }}>
                            <ArrowRight size={12} color="#3D8B7A" style={{ flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: "#1E6B4A", letterSpacing: -0.2 }}>
                              {step.replaceLabel}
                            </span>
                            <span style={{
                              fontSize: 9, color: "#3D8B7A",
                              background: "#C3E8D4", borderRadius: 4, padding: "1px 6px",
                              marginLeft: "auto",
                            }}>변경 후</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Changes summary */}
            {backup && (
              <div style={{
                background: "white", borderRadius: 16,
                border: "1px solid #E8E9EF",
                padding: "20px 24px",
              }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 12, letterSpacing: -0.2 }}>
                  변경 내용 요약
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {backup.changes.map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 22, height: 22, borderRadius: "50%",
                        background: c.positive ? "#EDF7F2" : "#FEF2F2",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                        fontSize: 11, fontWeight: 700,
                        color: c.positive ? "#3D8B7A" : "#DC2626",
                      }}>
                        {c.icon}
                      </div>
                      <span style={{ fontSize: 12, color: "#4A4A6A", letterSpacing: -0.1 }}>{c.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Right Panel ── */
function RightPanel({
  place, onShowComparison,
}: {
  place: typeof PLACES[0];
  onShowComparison: () => void;
}) {
  const alerts = RISK_ALERTS[place.id] ?? [];
  const backup = BACKUP_ROUTES[place.id];
  const backupPlace = PLACES.find((p) => p.id === backup?.backupId);
  const backupScore = backupPlace ? Math.round(backupPlace.score * 10) : 0;
  const hasUrgent = alerts.some((a) => a.level === "urgent");

  return (
    <div style={{
      width: 292, flexShrink: 0,
      background: "#F8F9FC",
      borderLeft: "1px solid #E8E9EF",
      overflowY: "auto",
      display: "flex", flexDirection: "column", gap: 0,
    }}>
      {/* Risk section */}
      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <AlertCircle size={13} color={hasUrgent ? "#DC2626" : "#D97706"} />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4A4A6A", letterSpacing: -0.1 }}>
            실시간 위험 알림
          </span>
          {hasUrgent && (
            <span style={{
              fontSize: 9, fontWeight: 700, color: "#DC2626",
              background: "#FEE2E2", borderRadius: 4, padding: "1px 5px",
              marginLeft: "auto",
            }}>LIVE</span>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
          {alerts.map((alert) => (
            <AlertRow key={alert.id} alert={alert} />
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ margin: "16px 16px", height: 1, background: "#E8E9EF" }} />

      {/* Backup route */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <RefreshCw size={13} color="#5B54D6" />
          <span style={{ fontSize: 11, fontWeight: 700, color: "#4A4A6A", letterSpacing: -0.1 }}>
            자동 대체 코스 제안
          </span>
        </div>

        {backup && backupPlace && (
          <div style={{
            background: "white", borderRadius: 14,
            border: "1.5px solid #5B54D6",
            overflow: "hidden",
          }}>
            {/* Header */}
            <div style={{
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              padding: "12px 14px",
            }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.7)", letterSpacing: 0.5, marginBottom: 4 }}>
                AI 자동 대체 코스
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "white", letterSpacing: -0.3 }}>
                {backupPlace.name.replace(" 코스", "")}
              </div>
            </div>

            {/* Scores */}
            <div style={{
              display: "grid", gridTemplateColumns: "1fr 1fr",
              borderBottom: "1px solid #F0F1F7",
            }}>
              <div style={{ padding: "10px 12px", borderRight: "1px solid #F0F1F7" }}>
                <div style={{ fontSize: 9, color: "#9EA0B8", marginBottom: 2 }}>원본 점수</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#B0B2C8", letterSpacing: -0.5 }}>
                  {Math.round(place.score * 10)}
                </div>
              </div>
              <div style={{ padding: "10px 12px" }}>
                <div style={{ fontSize: 9, color: "#9EA0B8", marginBottom: 2 }}>대체 점수</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: "#5B54D6", letterSpacing: -0.5 }}>
                  {backupScore}
                </div>
              </div>
            </div>

            {/* Trigger */}
            <div style={{ padding: "10px 14px", borderBottom: "1px solid #F0F1F7" }}>
              <div style={{ fontSize: 9, color: "#9EA0B8", marginBottom: 3 }}>변경 트리거</div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <AlertTriangle size={10} color="#D97706" />
                <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E" }}>{backup.triggerLabel}</span>
              </div>
            </div>

            {/* Changes */}
            <div style={{ padding: "10px 14px" }}>
              <div style={{ fontSize: 9, color: "#9EA0B8", marginBottom: 6 }}>주요 변경 사항</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {backup.changes.slice(0, 3).map((c, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{
                      width: 5, height: 5, borderRadius: "50%",
                      background: c.positive ? "#3D8B7A" : "#E55555",
                      flexShrink: 0,
                    }} />
                    <span style={{ fontSize: 11, color: "#4A4A6A", letterSpacing: -0.1 }}>{c.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ margin: "0 16px 16px", height: 1, background: "#E8E9EF" }} />

      {/* Comparison CTA */}
      <div style={{ padding: "0 16px 16px" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#4A4A6A", marginBottom: 8, letterSpacing: -0.1 }}>
          전체 코스 비교
        </div>
        <button
          onClick={onShowComparison}
          style={{
            width: "100%", padding: "12px", borderRadius: 11,
            border: "none",
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
            color: "white", fontSize: 12, fontWeight: 700,
            cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            letterSpacing: -0.2,
            boxShadow: "0 4px 12px rgba(91,84,214,0.3)",
          }}
        >
          <Layers size={13} />
          3개 코스 나란히 비교하기
          <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

/* ── Comparison Modal ── */
function ComparisonModal({ onClose }: { onClose: () => void }) {
  const allPlaces = PLACES;

  const METRICS = [
    { label: "같이가능 점수", getValue: (p: typeof PLACES[0]) => `${Math.round(p.score * 10)}점`, highlight: true },
    { label: "소요 시간",     getValue: (p: typeof PLACES[0]) => p.duration },
    { label: "예상 보행",     getValue: (p: typeof PLACES[0]) => p.estimatedSteps },
    { label: "보행 부담",     getValue: (p: typeof PLACES[0]) => p.walkingAmount },
    { label: "주요 시설",     getValue: (p: typeof PLACES[0]) => `${p.facilities.length}종` },
  ];

  const SUBSCORE_LABELS = [
    { key: "accessibility", label: "접근성" },
    { key: "comfort",       label: "편의성" },
    { key: "safety",        label: "안전성" },
    { key: "efficiency",    label: "이동효율" },
    { key: "weather",       label: "날씨적합" },
  ] as const;

  const bestId = allPlaces.reduce((a, b) => (a.score > b.score ? a : b)).id;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", inset: 0, zIndex: 200,
        background: "rgba(10,10,30,0.55)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 32,
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.25 }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20,
          width: "100%", maxWidth: 960,
          maxHeight: "90dvh", overflowY: "auto",
          boxShadow: "0 24px 80px rgba(0,0,0,0.28)",
        }}
      >
        {/* Modal header */}
        <div style={{
          padding: "20px 28px 16px",
          borderBottom: "1px solid #E8E9EF",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          position: "sticky", top: 0, background: "white", zIndex: 1,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9,
              background: "#F0EFFC",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Layers size={15} color="#5B54D6" />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.4 }}>
                코스 나란히 비교
              </div>
              <div style={{ fontSize: 11, color: "#9EA0B8" }}>3개 코스 종합 분석</div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: "50%",
              border: "none", background: "#F0F1F6",
              cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <X size={14} color="#5A5B78" />
          </button>
        </div>

        {/* Column headers */}
        <div style={{ padding: "0 28px" }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "140px repeat(3, 1fr)",
            gap: 0,
            borderBottom: "2px solid #E8E9EF",
          }}>
            <div style={{ padding: "14px 0" }} />
            {allPlaces.map((p) => {
              const isBest = p.id === bestId;
              const score = Math.round(p.score * 10);
              const scoreColor = getScoreColor(score);
              return (
                <div key={p.id} style={{
                  padding: "14px 16px", textAlign: "center" as const,
                  background: isBest ? "#FAFBFF" : "transparent",
                  borderLeft: "1px solid #F0F1F7",
                  position: "relative" as const,
                }}>
                  {isBest && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0,
                      height: 3, background: "#5B54D6", borderRadius: "3px 3px 0 0",
                    }} />
                  )}
                  {isBest && (
                    <div style={{
                      display: "inline-flex", alignItems: "center", gap: 3,
                      background: "#5B54D6", borderRadius: 5, padding: "2px 7px",
                      marginBottom: 5,
                    }}>
                      <Star size={9} color="white" fill="white" />
                      <span style={{ fontSize: 9, color: "white", fontWeight: 700 }}>최적 추천</span>
                    </div>
                  )}
                  <div style={{ fontSize: 13, fontWeight: 700, color: isBest ? "#5B54D6" : "#4A4A6A", letterSpacing: -0.2 }}>
                    {p.name.replace(" 코스", "").replace(" & 인사동", "")}
                  </div>
                  <div style={{
                    fontSize: 24, fontWeight: 900, color: scoreColor, letterSpacing: -1, marginTop: 4,
                  }}>
                    {score}
                    <span style={{ fontSize: 11, color: "#9EA0B8", fontWeight: 500 }}>/100</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Basic metrics */}
          {METRICS.map((metric, mi) => (
            <div key={metric.label} style={{
              display: "grid",
              gridTemplateColumns: "140px repeat(3, 1fr)",
              borderBottom: mi < METRICS.length - 1 ? "1px solid #F4F5FA" : "2px solid #E8E9EF",
            }}>
              <div style={{
                padding: "11px 0", display: "flex", alignItems: "center",
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#6B6B88" }}>{metric.label}</span>
              </div>
              {allPlaces.map((p, pi) => {
                const isBest = p.id === bestId;
                return (
                  <div key={p.id} style={{
                    padding: "11px 16px", textAlign: "center" as const,
                    background: isBest ? "#FAFBFF" : "white",
                    borderLeft: "1px solid #F4F5FA",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <span style={{
                      fontSize: metric.highlight ? 16 : 13,
                      fontWeight: metric.highlight ? 800 : 500,
                      color: metric.highlight ? getScoreColor(Math.round(p.score * 10)) : "#4A4A6A",
                    }}>
                      {metric.getValue(p)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Subscore section */}
          <div style={{ padding: "16px 0 8px" }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9EA0B8", letterSpacing: 0.5, textTransform: "uppercase" as const }}>
              항목별 점수
            </span>
          </div>
          {SUBSCORE_LABELS.map(({ key, label }, si) => (
            <div key={key} style={{
              display: "grid",
              gridTemplateColumns: "140px repeat(3, 1fr)",
              borderBottom: si < SUBSCORE_LABELS.length - 1 ? "1px solid #F4F5FA" : "none",
            }}>
              <div style={{ padding: "9px 0", display: "flex", alignItems: "center" }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8E90A8" }}>{label}</span>
              </div>
              {allPlaces.map((p) => {
                const subs = SUBSCORES[p.id] ?? SUBSCORES.botanical;
                const val = subs[key];
                const color = getScoreColor(val);
                const isBest = p.id === bestId;
                return (
                  <div key={p.id} style={{
                    padding: "9px 16px",
                    background: isBest ? "#FAFBFF" : "white",
                    borderLeft: "1px solid #F4F5FA",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <div style={{ flex: 1, height: 5, background: "#F0F1F6", borderRadius: 3, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${val}%`, background: color, borderRadius: 3 }} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color, minWidth: 24, textAlign: "right" as const }}>{val}</span>
                  </div>
                );
              })}
            </div>
          ))}

          {/* Facility row */}
          <div style={{ padding: "16px 0 8px", borderTop: "2px solid #E8E9EF", marginTop: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#9EA0B8", letterSpacing: 0.5, textTransform: "uppercase" as const }}>
              접근성 시설 비교
            </span>
          </div>
          {["elevator", "accessible_restroom", "parking", "wheelchair_rental", "foreign_guide"].map((f, fi) => {
            const fLabels: Record<string, string> = {
              elevator: "엘리베이터", accessible_restroom: "장애인화장실",
              parking: "장애인주차", wheelchair_rental: "휠체어대여", foreign_guide: "외국어안내",
            };
            return (
              <div key={f} style={{
                display: "grid",
                gridTemplateColumns: "140px repeat(3, 1fr)",
                borderBottom: fi < 4 ? "1px solid #F4F5FA" : "none",
              }}>
                <div style={{ padding: "8px 0", display: "flex", alignItems: "center" }}>
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#8E90A8" }}>{fLabels[f]}</span>
                </div>
                {allPlaces.map((p) => {
                  const has = p.facilities.includes(f);
                  const isBest = p.id === bestId;
                  return (
                    <div key={p.id} style={{
                      padding: "8px 16px", textAlign: "center" as const,
                      background: isBest ? "#FAFBFF" : "white",
                      borderLeft: "1px solid #F4F5FA",
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      {has
                        ? <CheckCircle size={16} color="#3D8B7A" />
                        : <div style={{ width: 12, height: 2, background: "#D4D6E8", borderRadius: 1 }} />
                      }
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Modal footer */}
        <div style={{
          padding: "16px 28px 24px",
          borderTop: "1px solid #E8E9EF",
          display: "flex", justifyContent: "flex-end", gap: 10,
        }}>
          <button
            onClick={onClose}
            style={{
              padding: "11px 24px", borderRadius: 10,
              border: "1.5px solid #E8E9EF", background: "white",
              color: "#4A4A6A", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            닫기
          </button>
          <button
            style={{
              padding: "11px 24px", borderRadius: 10,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
              boxShadow: "0 4px 14px rgba(91,84,214,0.35)",
            }}
          >
            <Flag size={13} />
            최적 코스로 출발하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */

export function DesktopDashboard() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState("botanical");
  const [view, setView] = useState<"dashboard" | "recovery">("dashboard");
  const [showComparison, setShowComparison] = useState(false);

  const place = PLACES.find((p) => p.id === selectedId) ?? PLACES[0];
  const backup = BACKUP_ROUTES[selectedId];
  const backupPlace = PLACES.find((p) => p.id === backup?.backupId);
  const score = Math.round(place.score * 10);

  return (
    <div style={{
      minHeight: "100dvh", maxHeight: "100dvh",
      display: "flex", flexDirection: "column",
      background: "#F4F5FA",
      fontFamily: "'Noto Sans KR', sans-serif",
    }}>
      {/* ── Top Bar ── */}
      <div style={{
        height: 56, flexShrink: 0,
        background: "white",
        borderBottom: "1px solid #E8E9EF",
        display: "flex", alignItems: "center",
        padding: "0 24px",
        gap: 0,
      }}>
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginRight: 32 }}>
          <div style={{
            width: 26, height: 26, borderRadius: 7,
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Route size={13} color="white" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 800, color: "#1A1A2E", letterSpacing: -0.5 }}>같이가능</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: "#5B54D6",
            background: "#EEEDFA", borderRadius: 4, padding: "2px 6px",
          }}>데스크톱</span>
        </div>

        {/* Score badge for selected course */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 12, color: "#9EA0B8" }}>{place.name}</span>
          <div style={{
            display: "flex", alignItems: "center", gap: 4,
            background: `${getScoreColor(score)}14`,
            borderRadius: 7, padding: "4px 10px",
          }}>
            <Award size={12} color={getScoreColor(score)} />
            <span style={{ fontSize: 12, fontWeight: 800, color: getScoreColor(score) }}>
              {score}점
            </span>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Nav actions */}
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => setView(view === "recovery" ? "dashboard" : "recovery")}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: `1.5px solid ${view === "recovery" ? "#5B54D6" : "#E8E9EF"}`,
              background: view === "recovery" ? "#F0EFFC" : "white",
              color: view === "recovery" ? "#5B54D6" : "#6B6B88",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <RefreshCw size={12} />
            코스 복구 시뮬레이션
          </button>
          <button
            onClick={() => setShowComparison(true)}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: "1.5px solid #E8E9EF",
              background: "white",
              color: "#6B6B88",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
            }}
          >
            <Layers size={12} />
            코스 비교
          </button>
          <button
            onClick={() => navigate("/")}
            style={{
              padding: "7px 14px", borderRadius: 8,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              color: "white",
              fontSize: 12, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 5,
              boxShadow: "0 3px 10px rgba(91,84,214,0.3)",
            }}
          >
            <Flag size={12} />
            모바일로 출발하기
          </button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <LeftSidebar
          courses={PLACES}
          selectedId={selectedId}
          onSelect={(id) => { setSelectedId(id); setView("dashboard"); }}
        />
        <MainPanel place={place} view={view} onViewChange={setView} />
        <RightPanel place={place} onShowComparison={() => setShowComparison(true)} />
      </div>

      {/* ── Comparison Modal ── */}
      <AnimatePresence>
        {showComparison && (
          <ComparisonModal onClose={() => setShowComparison(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}
