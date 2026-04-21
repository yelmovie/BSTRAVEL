import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Train, MapPin, Coffee, UtensilsCrossed, Flag, ChevronRight,
  ArrowLeft, Clock, Footprints, Bus, Map, AlertTriangle,
  Toilet, Accessibility, Baby, Navigation,
} from "lucide-react";
import { PLACES } from "../../data/places";

const STEP_CFG: Record<string, { color: string; bg: string; Icon: any; label: string }> = {
  start: { color: "#5B54D6", bg: "#EEEDFA", Icon: Train,           label: "출발" },
  place: { color: "#3D8B7A", bg: "#EDF7F2", Icon: MapPin,          label: "장소" },
  rest:  { color: "#B07AAF", bg: "#F5EEF8", Icon: Coffee,          label: "휴식" },
  meal:  { color: "#C4793C", bg: "#FEF3EA", Icon: UtensilsCrossed, label: "식사" },
  end:   { color: "#4A7BBF", bg: "#EFF6FF", Icon: Flag,            label: "도착" },
};

const COST_BREAKDOWN: Record<string, { label: string; amount: string }[]> = {
  haeundae: [
    { label: "대중교통 (왕복)",   amount: "3,600원" },
    { label: "아쿠아리움 입장료 (1인)", amount: "28,000원" },
    { label: "점심 식사 (1인)",   amount: "약 12,000원" },
    { label: "음료·간식",        amount: "약 5,000원" },
  ],
  gamcheon: [
    { label: "대중교통 (왕복)",   amount: "3,600원" },
    { label: "감천문화마을 입장",  amount: "무료" },
    { label: "점심 식사 (1인)",   amount: "약 10,000원" },
    { label: "자갈치시장 간식",   amount: "약 5,000원" },
  ],
  citizenpark: [
    { label: "대중교통 (왕복)",   amount: "3,600원" },
    { label: "부산시민공원 입장",  amount: "무료" },
    { label: "점심 식사 (1인)",   amount: "약 10,000원" },
    { label: "카페",            amount: "약 6,000원" },
  ],
  dongrae: [
    { label: "대중교통 (왕복)",   amount: "3,600원" },
    { label: "동래읍성 역사관 입장", amount: "무료" },
    { label: "점심 식사 (1인)",   amount: "약 10,000원" },
    { label: "카페·간식",        amount: "약 5,000원" },
  ],
};

const CHECKPOINTS: Record<string, { label: string; Icon: any; color: string; time: string }[]> = {
  haeundae: [
    { label: "아쿠아리움 휠체어 입구",  Icon: Accessibility, color: "#5B54D6", time: "10:10" },
    { label: "수유실 (입구 1층)",      Icon: Baby,          color: "#4A7BBF", time: "10:15" },
    { label: "동백섬 무장애 산책로",    Icon: MapPin,        color: "#3D8B7A", time: "14:10" },
  ],
  gamcheon: [
    { label: "무장애 탐방로 시작점",    Icon: Accessibility, color: "#5B54D6", time: "09:45" },
    { label: "화장실 (안내소 옆)",      Icon: Toilet,        color: "#B07AAF", time: "10:30" },
    { label: "자갈치 장애인 전용 입구", Icon: Accessibility, color: "#C4793C", time: "13:45" },
  ],
  citizenpark: [
    { label: "공원 배리어프리 입구",   Icon: Accessibility, color: "#5B54D6", time: "10:05" },
    { label: "장애인화장실 (북문)",    Icon: Toilet,        color: "#B07AAF", time: "11:00" },
    { label: "유모차 대여소 (동문)",   Icon: Baby,          color: "#4A7BBF", time: "10:10" },
  ],
  dongrae: [
    { label: "역사관 엘리베이터 입구", Icon: Accessibility, color: "#5B54D6", time: "10:10" },
    { label: "장애인화장실 (역사관 1층)", Icon: Toilet,     color: "#B07AAF", time: "10:15" },
    { label: "금강공원 배리어프리 산책로", Icon: MapPin,    color: "#3D8B7A", time: "13:30" },
  ],
};

const TRANSPORT_SUMMARY: Record<string, { label: string; mins: number; color: string }[]> = {
  haeundae: [
    { label: "지하철", mins: 15, color: "#5B54D6" },
    { label: "도보",   mins: 42, color: "#3D8B7A" },
    { label: "실내 이동", mins: 120, color: "#B07AAF" },
  ],
  gamcheon: [
    { label: "지하철",   mins: 12, color: "#5B54D6" },
    { label: "도보",     mins: 35, color: "#3D8B7A" },
    { label: "실내 이동", mins: 150, color: "#B07AAF" },
  ],
  citizenpark: [
    { label: "지하철", mins: 10, color: "#5B54D6" },
    { label: "도보",   mins: 80, color: "#3D8B7A" },
    { label: "실내·야외", mins: 110, color: "#C4793C" },
  ],
  dongrae: [
    { label: "지하철", mins: 12, color: "#5B54D6" },
    { label: "도보",   mins: 35, color: "#3D8B7A" },
    { label: "실내 이동", mins: 100, color: "#B07AAF" },
  ],
};

export function TimelinePage() {
  const { id = "botanical" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find(p => p.id === id) ?? PLACES[0];
  const costs  = COST_BREAKDOWN[id] ?? [];
  const cps    = CHECKPOINTS[id]    ?? [];
  const trans  = TRANSPORT_SUMMARY[id] ?? [];
  const totalCost = costs.reduce((acc, c) => {
    const n = parseInt(c.amount.replace(/[^0-9]/g, "")) || 0;
    return acc + n;
  }, 0);
  const transTotal = trans.reduce((s, t) => s + t.mins, 0);

  return (
    <div style={{ minHeight: "calc(100dvh - 62px)", overflowY: "auto" }}>
      {/* ── Page header ── */}
      <div style={{
        background: "white", borderBottom: "1.5px solid #E4E6EF",
        padding: "20px 52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={() => navigate(`/desktop/course/${id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              border: "none", background: "#F6F7FB", borderRadius: 8,
              padding: "7px 12px", cursor: "pointer",
              color: "#6B6B88", fontSize: 12, fontWeight: 600,
            }}
          >
            <ArrowLeft size={12} />상세로
          </button>
          <div>
            <div style={{ fontSize: 11, color: "#8E90A8", marginBottom: 2 }}>Step 4 · 타임라인 확인</div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "#1A1B2E", margin: 0, letterSpacing: -0.4 }}>
              {place.name}
            </h1>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/desktop/map/${id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 16px", borderRadius: 9,
              border: "1.5px solid #E4E6EF", background: "white",
              color: "#6B6B88", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            <Map size={14} />지도 보기
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/desktop/departure/${id}`)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "9px 20px", borderRadius: 9,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
              color: "white", fontSize: 13, fontWeight: 700, cursor: "pointer",
              boxShadow: "0 4px 14px rgba(91,84,214,0.3)",
            }}
          >
            출발 준비하기 <ChevronRight size={14} />
          </motion.button>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ display: "flex", padding: "32px 52px 48px", gap: 28 }}>
        {/* LEFT — vertical timeline */}
        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20,
          }}>
            코스 타임라인
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {place.courseSteps.map((step, i) => {
              const cfg = STEP_CFG[step.type] ?? STEP_CFG.place;
              const SIcon = cfg.Icon;
              const isLast = i === place.courseSteps.length - 1;

              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i }}
                  style={{ display: "flex", gap: 16 }}
                >
                  {/* Spine */}
                  <div style={{
                    display: "flex", flexDirection: "column", alignItems: "center",
                    width: 40, flexShrink: 0,
                  }}>
                    <div style={{
                      width: 40, height: 40, borderRadius: "50%",
                      background: cfg.bg,
                      border: `2px solid ${cfg.color}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0, zIndex: 1,
                    }}>
                      <SIcon size={16} color={cfg.color} />
                    </div>
                    {!isLast && (
                      <div style={{
                        width: 2, flex: 1, minHeight: 24,
                        background: "#E8E9EF", margin: "4px 0",
                      }} />
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, paddingBottom: isLast ? 0 : 24 }}>
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{
                            fontSize: 14, fontWeight: 700, color: "#1A1B2E", letterSpacing: -0.2,
                          }}>
                            {step.name}
                          </span>
                          <span style={{
                            fontSize: 9, fontWeight: 700, color: cfg.color,
                            background: cfg.bg, borderRadius: 4, padding: "2px 6px",
                          }}>
                            {cfg.label}
                          </span>
                        </div>
                        {step.subname && (
                          <div style={{ fontSize: 12, color: "#8E90A8", marginTop: 2 }}>
                            {step.subname}
                          </div>
                        )}
                      </div>
                      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 12 }}>
                        <div style={{
                          fontSize: 13, fontWeight: 700, color: "#1A1B2E",
                          letterSpacing: -0.2,
                        }}>
                          {step.time}
                        </div>
                        {step.duration && (
                          <div style={{ fontSize: 11, color: "#A0A2B8" }}>{step.duration}</div>
                        )}
                      </div>
                    </div>

                    {/* Transport badge */}
                    {step.transport && (
                      <div style={{
                        display: "inline-flex", alignItems: "center", gap: 5,
                        background: "#F6F7FB", borderRadius: 6,
                        padding: "4px 9px", marginTop: 4,
                      }}>
                        <Bus size={10} color="#8E90A8" />
                        <span style={{ fontSize: 10, color: "#6B6B88", fontWeight: 500 }}>
                          {step.transport} {step.transportTime}
                        </span>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* RIGHT — stats */}
        <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Transport breakdown */}
          <div style={{
            background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
            padding: "20px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#A0A2B8",
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
            }}>
              이동 수단 분석
            </div>
            {trans.map(t => (
              <div key={t.label} style={{ marginBottom: 10 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: "#6B6B88" }}>{t.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: t.color }}>{t.mins}분</span>
                </div>
                <div style={{ height: 5, background: "#EEF0F7", borderRadius: 3, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", borderRadius: 3,
                    width: `${(t.mins / transTotal) * 100}%`,
                    background: t.color,
                  }} />
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 12, paddingTop: 10, borderTop: "1px solid #F0F1F6",
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 12, color: "#8E90A8" }}>총 이동</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>{transTotal}분</span>
            </div>
          </div>

          {/* Accessibility checkpoints */}
          <div style={{
            background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
            padding: "20px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#A0A2B8",
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
            }}>
              접근성 체크포인트
            </div>
            {cps.map((cp, i) => {
              const CpIcon = cp.Icon;
              return (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "8px 0",
                  borderBottom: i < cps.length - 1 ? "1px solid #F4F5FA" : "none",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7,
                    background: `${cp.color}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <CpIcon size={13} color={cp.color} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "#3A3A5A" }}>{cp.label}</div>
                  </div>
                  <span style={{
                    fontSize: 10, color: "#A0A2B8", flexShrink: 0,
                  }}>
                    {cp.time}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Cost breakdown */}
          <div style={{
            background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
            padding: "20px",
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: "#A0A2B8",
              letterSpacing: 1, textTransform: "uppercase", marginBottom: 14,
            }}>
              예상 비용 (1인)
            </div>
            {costs.map((c, i) => (
              <div key={i} style={{
                display: "flex", justifyContent: "space-between",
                padding: "7px 0",
                borderBottom: i < costs.length - 1 ? "1px solid #F4F5FA" : "none",
              }}>
                <span style={{ fontSize: 12, color: "#6B6B88" }}>{c.label}</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1B2E" }}>{c.amount}</span>
              </div>
            ))}
            <div style={{
              marginTop: 10, paddingTop: 10,
              borderTop: "2px solid #E4E6EF",
              display: "flex", justifyContent: "space-between",
            }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>합계 (1인)</span>
              <span style={{ fontSize: 14, fontWeight: 900, color: "#5B54D6" }}>
                약 {totalCost.toLocaleString()}원~
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}