import { useState } from "react";
import { useParams } from "react-router";
import { motion } from "motion/react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import {
  Train, Ticket, UtensilsCrossed, ShoppingBag,
  Users, User, TrendingUp, Info,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";

/* ── Mock cost data per place ── */
const COST_DATA: Record<string, {
  transport: number;
  entrance: number;
  food: number;
  etc: number;
  notes: Record<string, string>;
}> = {
  botanical: {
    transport: 2800,
    entrance: 5000,
    food: 14000,
    etc: 4000,
    notes: {
      transport: "지하철 왕복 (기본 1,400원 × 2)",
      entrance: "서울 식물원 성인 기준",
      food: "여의도 근처 식사 평균",
      etc: "음료·간식 예상",
    },
  },
  museum: {
    transport: 2800,
    entrance: 0,
    food: 14000,
    etc: 5000,
    notes: {
      transport: "지하철 왕복 (기본 1,400원 × 2)",
      entrance: "국립중앙박물관 상설전 무료",
      food: "용산·이촌 식사 평균",
      etc: "오디오가이드·음료 등",
    },
  },
  palace: {
    transport: 2800,
    entrance: 3000,
    food: 13000,
    etc: 6000,
    notes: {
      transport: "지하철 왕복 (기본 1,400원 × 2)",
      entrance: "경복궁 성인 입장료",
      food: "인사동·광화문 식사 평균",
      etc: "문화체험·한복·기념품 등",
    },
  },
};

const TYPICAL_COST = 28000; // 서울 일반 여행 평균 per person

const CATEGORY_INFO = [
  { key: "transport", label: "교통비",    icon: Train,          color: "#5B54D6" },
  { key: "entrance",  label: "입장료",    icon: Ticket,         color: "#3D8B7A" },
  { key: "food",      label: "식사비",    icon: UtensilsCrossed, color: "#C4793C" },
  { key: "etc",       label: "기타",      icon: ShoppingBag,    color: "#B07AAF" },
];

function fmt(n: number) {
  return n.toLocaleString("ko-KR") + "원";
}

export function CostScreen() {
  const { id } = useParams<{ id: string }>();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const cost = COST_DATA[place.id] ?? COST_DATA.botanical;
  const [mode, setMode] = useState<"person" | "group">("person");
  const [groupSize, setGroupSize] = useState(3);

  const total = cost.transport + cost.entrance + cost.food + cost.etc;
  const displayTotal = mode === "person" ? total : total * groupSize;
  const diff = total - TYPICAL_COST;

  const pieData = CATEGORY_INFO.map((cat) => ({
    name: cat.label,
    value: cost[cat.key as keyof typeof cost] as number,
    color: cat.color,
  })).filter((d) => d.value > 0);

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="예상 비용 분석" />

      <div style={{ padding: "18px 20px 0", flex: 1, overflowY: "auto" }}>

        {/* ── Header summary ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
            borderRadius: 18, padding: "20px", marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)", marginBottom: 3, letterSpacing: -0.1 }}>
            {place.name} 예상 총 비용
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {[
              { id: "person", label: "1인 기준", icon: User },
              { id: "group",  label: `${groupSize}인 기준`, icon: Users },
            ].map(({ id: mId, label, icon: Icon }) => (
              <button
                key={mId}
                onClick={() => setMode(mId as "person" | "group")}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  padding: "5px 12px", borderRadius: 20, border: "none",
                  background: mode === mId ? "white" : "rgba(255,255,255,0.2)",
                  color: mode === mId ? "#5B54D6" : "rgba(255,255,255,0.85)",
                  fontSize: 11, fontWeight: 700, cursor: "pointer",
                  letterSpacing: -0.2,
                }}
              >
                <Icon size={11} />
                {label}
              </button>
            ))}
            {mode === "group" && (
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: "auto" }}>
                <button
                  onClick={() => setGroupSize((s) => Math.max(2, s - 1))}
                  style={{
                    width: 24, height: 24, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.2)", color: "white",
                    cursor: "pointer", fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >−</button>
                <span style={{ fontSize: 13, fontWeight: 700, color: "white", minWidth: 16, textAlign: "center" as const }}>
                  {groupSize}
                </span>
                <button
                  onClick={() => setGroupSize((s) => Math.min(10, s + 1))}
                  style={{
                    width: 24, height: 24, borderRadius: "50%", border: "none",
                    background: "rgba(255,255,255,0.2)", color: "white",
                    cursor: "pointer", fontSize: 14, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}
                >+</button>
              </div>
            )}
          </div>

          <div style={{ fontSize: 36, fontWeight: 900, color: "white", letterSpacing: -1, lineHeight: 1 }}>
            {fmt(displayTotal)}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8 }}>
            <TrendingUp size={13} color={diff <= 0 ? "#86EFAC" : "#FCA5A5"} />
            <span style={{ fontSize: 11, color: diff <= 0 ? "#86EFAC" : "#FCA5A5", fontWeight: 600 }}>
              서울 평균({fmt(TYPICAL_COST)}) 대비{" "}
              {diff <= 0
                ? `${fmt(Math.abs(diff))} 절약`
                : `${fmt(diff)} 초과`}
            </span>
          </div>
        </motion.div>

        {/* ── Donut chart ── */}
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
            비용 구성 비율
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            <ResponsiveContainer width={160} height={160}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={46}
                  outerRadius={70}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => [fmt(value), ""]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
              {CATEGORY_INFO.map((cat) => {
                const val = cost[cat.key as keyof typeof cost] as number;
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                const Icon = cat.icon;
                return (
                  <div key={cat.key} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{
                      width: 8, height: 8, borderRadius: "50%",
                      background: cat.color, flexShrink: 0,
                    }} />
                    <Icon size={12} color={cat.color} />
                    <span style={{ fontSize: 11, color: "#4A4A6A", flex: 1 }}>{cat.label}</span>
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1A2E" }}>{pct}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* ── Breakdown cards ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", marginBottom: 12, letterSpacing: -0.2 }}>
            항목별 비용 상세
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {CATEGORY_INFO.map((cat, i) => {
              const val = cost[cat.key as keyof typeof cost] as number;
              const displayVal = mode === "person" ? val : val * groupSize;
              const Icon = cat.icon;
              const isLast = i === CATEGORY_INFO.length - 1;
              return (
                <div key={cat.key} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "12px 0",
                  borderBottom: isLast ? "none" : "1px solid #F4F5FA",
                }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${cat.color}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color={cat.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>
                      {cat.label}
                    </div>
                    <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 1 }}>
                      {cost.notes[cat.key]}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" as const }}>
                    {val === 0 ? (
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: "#3D8B7A",
                        background: "#EDF7F2", borderRadius: 6, padding: "2px 8px",
                      }}>
                        무료
                      </span>
                    ) : (
                      <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E" }}>
                        {fmt(displayVal)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}

            {/* Total */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              paddingTop: 12, marginTop: 4,
              borderTop: "2px solid #E8E9EF",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>합계</span>
              <span style={{ fontSize: 18, fontWeight: 800, color: "#5B54D6", letterSpacing: -0.5 }}>
                {fmt(displayTotal)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* ── Info note ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "#F6F5FF", borderRadius: 12, border: "1px solid #E0DEFA",
            padding: "12px 14px", marginBottom: 28,
            display: "flex", gap: 8, alignItems: "flex-start",
          }}
        >
          <Info size={13} color="#5B54D6" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: "#4A4A6A", lineHeight: 1.55, letterSpacing: -0.1 }}>
            예상 비용은 성인 기준이며 경로우대(어르신), 장애인 할인 적용 시 달라질 수 있습니다.
            입장료·교통비는 실제와 다를 수 있으니 출발 전 확인을 권장합니다.
          </div>
        </motion.div>
      </div>
    </div>
  );
}
