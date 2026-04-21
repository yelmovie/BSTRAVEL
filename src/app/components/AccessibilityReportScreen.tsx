import { useParams } from "react-router";
import { motion } from "motion/react";
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import {
  Shield, Award, CheckCircle, AlertCircle, XCircle,
  ArrowUpDown, Accessibility, Footprints, Train, Eye,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";

/* ── Mock data per place ── */
interface MetricData {
  metric: string;
  fullMark: number;
  value: number;
  icon: typeof Shield;
  description: string;
}

const REPORT_DATA: Record<string, {
  overallScore: number;
  grade: "gold" | "silver" | "bronze";
  gradeName: string;
  metrics: MetricData[];
  barrierFreeRatio: number;
  slopeWarning?: string;
}> = {
  botanical: {
    overallScore: 94,
    grade: "gold",
    gradeName: "배리어프리 골드",
    barrierFreeRatio: 98,
    metrics: [
      { metric: "평지 비율",    value: 98, fullMark: 100, icon: Footprints, description: "전 구간 98% 평지, 오르막 없음" },
      { metric: "엘리베이터",   value: 95, fullMark: 100, icon: ArrowUpDown, description: "3기 운영 · 전 구간 연결" },
      { metric: "편의시설",     value: 90, fullMark: 100, icon: Accessibility, description: "장애인 화장실 4개소 완비" },
      { metric: "경사 안전",    value: 96, fullMark: 100, icon: Shield, description: "최대 경사 2% 이하" },
      { metric: "교통 접근",    value: 82, fullMark: 100, icon: Train, description: "지하철역 5분 거리" },
      { metric: "안내 시스템",  value: 76, fullMark: 100, icon: Eye, description: "점자 안내 · 음성 유도" },
    ],
  },
  museum: {
    overallScore: 91,
    grade: "gold",
    gradeName: "배리어프리 골드",
    barrierFreeRatio: 92,
    metrics: [
      { metric: "평지 비율",    value: 85, fullMark: 100, icon: Footprints, description: "실내 85% 평지, 야외 완경사" },
      { metric: "엘리베이터",   value: 98, fullMark: 100, icon: ArrowUpDown, description: "5기 운영 · 전관 연결" },
      { metric: "편의시설",     value: 95, fullMark: 100, icon: Accessibility, description: "층마다 장애인 화장실" },
      { metric: "경사 안전",    value: 88, fullMark: 100, icon: Shield, description: "실내 이동 최적화" },
      { metric: "교통 접근",    value: 90, fullMark: 100, icon: Train, description: "이촌역 직결 도보 3분" },
      { metric: "안내 시스템",  value: 92, fullMark: 100, icon: Eye, description: "4개국어 · 오디오가이드" },
    ],
  },
  palace: {
    overallScore: 77,
    grade: "silver",
    gradeName: "배리어프리 실버",
    barrierFreeRatio: 80,
    slopeWarning: "궁내 자갈길 일부 구간 휠체어 이동 주의 필요",
    metrics: [
      { metric: "평지 비율",    value: 75, fullMark: 100, icon: Footprints, description: "주요 동선 평지, 일부 자갈길" },
      { metric: "엘리베이터",   value: 58, fullMark: 100, icon: ArrowUpDown, description: "일부 구간만 설치" },
      { metric: "편의시설",     value: 78, fullMark: 100, icon: Accessibility, description: "장애인 화장실 2개소" },
      { metric: "경사 안전",    value: 70, fullMark: 100, icon: Shield, description: "일부 경사로 있음 (5%~)" },
      { metric: "교통 접근",    value: 88, fullMark: 100, icon: Train, description: "경복궁역 직결 도보 5분" },
      { metric: "안내 시스템",  value: 85, fullMark: 100, icon: Eye, description: "4개국어 안내 우수" },
    ],
  },
};

function GradeIcon({ grade }: { grade: "gold" | "silver" | "bronze" }) {
  const configs = {
    gold:   { bg: "#FEF9C3", border: "#FDE047", color: "#854D0E" },
    silver: { bg: "#F1F5F9", border: "#CBD5E1", color: "#475569" },
    bronze: { bg: "#FEF3EA", border: "#FDBA74", color: "#92400E" },
  };
  const c = configs[grade];
  return (
    <div style={{
      width: 44, height: 44, borderRadius: 12,
      background: c.bg, border: `2px solid ${c.border}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      flexShrink: 0,
    }}>
      <Award size={20} color={c.color} />
    </div>
  );
}

function MetricBar({ value, color = "#5B54D6" }: { value: number; color?: string }) {
  return (
    <div style={{ height: 5, background: "#F0F1F6", borderRadius: 3, overflow: "hidden" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
        style={{ height: "100%", background: color, borderRadius: 3 }}
      />
    </div>
  );
}

function getMetricColor(value: number): string {
  if (value >= 85) return "#3D8B7A";
  if (value >= 65) return "#F59E3A";
  return "#E55555";
}

function StatusIcon({ value }: { value: number }) {
  if (value >= 85) return <CheckCircle size={13} color="#3D8B7A" />;
  if (value >= 65) return <AlertCircle size={13} color="#F59E3A" />;
  return <XCircle size={13} color="#E55555" />;
}

export function AccessibilityReportScreen() {
  const { id } = useParams<{ id: string }>();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const report = REPORT_DATA[place.id] ?? REPORT_DATA.botanical;

  const radarData = report.metrics.map((m) => ({
    metric: m.metric,
    value: m.value,
    fullMark: 100,
  }));

  const gradeColors = {
    gold:   "#D97706",
    silver: "#6B7280",
    bronze: "#B45309",
  };

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="접근성 분석 리포트" />

      <div style={{ padding: "18px 20px 0", flex: 1, overflowY: "auto" }}>

        {/* ── Overall Score ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white", borderRadius: 18, border: "1px solid #E8E9EF",
            padding: "20px 20px 16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <GradeIcon grade={report.grade} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: gradeColors[report.grade], letterSpacing: 0.3, marginBottom: 2 }}>
                {report.gradeName}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3 }}>
                {place.name}
              </div>
            </div>
            <div style={{ flex: 1, textAlign: "right" as const }}>
              <div style={{ fontSize: 36, fontWeight: 900, color: "#5B54D6", letterSpacing: -1, lineHeight: 1 }}>
                {report.overallScore}
              </div>
              <div style={{ fontSize: 11, color: "#9EA0B8" }}>/ 100점</div>
            </div>
          </div>

          {/* Barrier-free ratio */}
          <div style={{
            background: "#F6F5FF", borderRadius: 11, padding: "10px 14px",
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Accessibility size={14} color="#5B54D6" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#4A4A6A", letterSpacing: -0.1 }}>
                배리어프리 동선 비율
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#5B54D6" }}>
                {report.barrierFreeRatio}%
              </span>
            </div>
          </div>

          {report.slopeWarning && (
            <div style={{
              background: "#FFF8ED", borderRadius: 9, padding: "8px 12px", marginTop: 8,
              display: "flex", gap: 7, alignItems: "center",
            }}>
              <AlertCircle size={12} color="#D97706" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: "#92400E", lineHeight: 1.4 }}>{report.slopeWarning}</span>
            </div>
          )}
        </motion.div>

        {/* ── Radar Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 4, letterSpacing: -0.2 }}>
            항목별 접근성 레이더
          </div>
          <div style={{ fontSize: 11, color: "#9EA0B8", marginBottom: 8 }}>
            6개 항목 종합 시각화
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
              <PolarGrid stroke="#E8E9EF" />
              <PolarAngleAxis
                dataKey="metric"
                tick={{ fontSize: 10, fill: "#6B6B88" }}
              />
              <Radar
                name="접근성"
                dataKey="value"
                stroke="#5B54D6"
                fill="#5B54D6"
                fillOpacity={0.18}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: "#B0B2C8", textAlign: "center" as const }}>
            출처: 장애인 편의시설 공공API · 문화체육관광부 접근성 평가
          </div>
        </motion.div>

        {/* ── Individual metrics ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 14, letterSpacing: -0.2 }}>
            항목별 상세 점수
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {report.metrics.map((metric, i) => {
              const Icon = metric.icon;
              const color = getMetricColor(metric.value);
              return (
                <motion.div
                  key={metric.metric}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.06 }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: 8,
                      background: `${color}18`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0,
                    }}>
                      <Icon size={13} color={color} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>
                          {metric.metric}
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                          <StatusIcon value={metric.value} />
                          <span style={{ fontSize: 12, fontWeight: 700, color }}>{metric.value}점</span>
                        </div>
                      </div>
                      <MetricBar value={metric.value} color={color} />
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "#9EA0B8", marginLeft: 36, letterSpacing: -0.1 }}>
                    {metric.description}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Grade legend ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
          style={{
            background: "white", borderRadius: 14, border: "1px solid #E8E9EF",
            padding: "14px 16px", marginBottom: 28,
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B88", marginBottom: 10 }}>등급 기준</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {[
              { grade: "골드",  range: "90점 이상", color: "#D97706", desc: "휠체어·유모차 완전 이용 가능" },
              { grade: "실버",  range: "75 – 89점", color: "#6B7280", desc: "대부분 이용 가능, 일부 주의 필요" },
              { grade: "브론즈", range: "60 – 74점", color: "#B45309", desc: "제한적 이용 가능, 사전 확인 권장" },
            ].map((g) => (
              <div key={g.grade} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 28, height: 16, borderRadius: 5,
                  background: `${g.color}18`, border: `1px solid ${g.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <span style={{ fontSize: 8, fontWeight: 700, color: g.color }}>{g.grade}</span>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#4A4A6A" }}>{g.range}</span>
                <span style={{ fontSize: 10, color: "#9EA0B8" }}>— {g.desc}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
