import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Users, Baby, Accessibility, Smile, Globe,
  Check, ChevronRight, Sparkles, Shield, Database, MapPin,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { OnboardingMascot } from "../OnboardingMascot";

/* ── companion config ─────────────────────────────────── */
const COMPANIONS = [
  {
    id: "elderly",
    label: "어르신 동반",
    sub: "계단 없는 동선 우선",
    Icon: Users,
    color: "#5B54D6",
    bg: "#EEEDFA",
    impacts: [
      "엘리베이터 완비 장소 우선 추천",
      "평지 구간 최적 동선",
      "짧은 이동 거리 최소화",
      "인근 응급·의료 시설 포함",
    ],
  },
  {
    id: "stroller",
    label: "유모차",
    sub: "넓은 통로·평지 필수",
    Icon: Baby,
    color: "#4A7BBF",
    bg: "#EFF6FF",
    impacts: [
      "넓은 통로·무단차 경로 적용",
      "자갈길·급경사 구간 완전 제외",
      "수유실 보유 장소 필터",
      "경사로 대체 경로 확보",
    ],
  },
  {
    id: "wheelchair",
    label: "휠체어 사용자",
    sub: "배리어프리 전 구간",
    Icon: Accessibility,
    color: "#3D8B7A",
    bg: "#EDF7F2",
    impacts: [
      "배리어프리 인증 장소 필터",
      "경사 구간 완전 제외",
      "장애인 주차·화장실 위치 표시",
      "휠체어 대여 정보 제공",
    ],
  },
  {
    id: "children",
    label: "어린이 동반",
    sub: "체험·교육 중심 코스",
    Icon: Smile,
    color: "#D97706",
    bg: "#FFF8ED",
    impacts: [
      "어린이 체험 프로그램 장소",
      "안전 구간 우선 추천",
      "가족 쉼터·편의 시설 포함",
      "교육·자연 생태 테마",
    ],
  },
  {
    id: "foreigner",
    label: "외국인 동행",
    sub: "다국어 안내 우선",
    Icon: Globe,
    color: "#B07AAF",
    bg: "#F8F0FF",
    impacts: [
      "4개국어 안내 서비스 필터",
      "외국어 오디오가이드 보유",
      "국제 카드 결제 가능 장소",
      "영문 시설 표기 완비",
    ],
  },
];

const DATA_STATS = [
  { label: "부산 배리어프리 관광지",  value: "340곳+",  note: "한국관광공사 OpenAPI 기준" },
  { label: "부산 무장애 접근 경로", value: "3,200km", note: "부산 전역" },
  { label: "다국어 안내 부산 관광지",   value: "128곳",   note: "영·중·일 이상" },
];

const API_SOURCES = [
  { label: "한국관광공사 무장애 여행정보 OpenAPI", primary: true },
  { label: "국문 관광정보 서비스 OpenAPI", primary: true },
  { label: "다국어 관광정보 서비스 OpenAPI", primary: true },
  { label: "관광지별 연관 관광지 정보 OpenAPI", primary: true },
  { label: "카카오맵 API (지도·길찾기)", primary: false },
  { label: "부산시 공공데이터포털", primary: false },
];

/* ── page ─────────────────────────────────────────────── */
export function OnboardingPage() {
  const { companions, setCompanions } = useApp();
  const navigate = useNavigate();

  function toggle(id: string) {
    setCompanions(
      companions.includes(id)
        ? companions.filter(c => c !== id)
        : [...companions, id]
    );
  }

  // Aggregate impact bullets (deduplicated)
  const allImpacts = COMPANIONS
    .filter(c => companions.includes(c.id))
    .flatMap(c => c.impacts.map(text => ({ text, color: c.color })));

  const uniqueImpacts = allImpacts.filter(
    (item, i, arr) => arr.findIndex(x => x.text === item.text) === i
  );

  return (
    <div style={{ display: "flex", minHeight: "calc(100dvh - 62px)" }}>
      {/* ══ LEFT — question area ═══════════════════════════ */}
      <div style={{
        flex: 1, padding: "52px 56px 48px",
        display: "flex", flexDirection: "column",
        maxWidth: 820, overflowY: "auto",
      }}>
        {/* Step label */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#5B54D6" }} />
            <span style={{
              fontSize: 11, fontWeight: 700, color: "#5B54D6",
              letterSpacing: 1.5, textTransform: "uppercase",
            }}>
              Step 1 — 동행자 선택
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 4, background: "#EEEDFA", borderRadius: 6, padding: "3px 8px", marginLeft: 8 }}>
              <MapPin size={10} color="#5B54D6" />
              <span style={{ fontSize: 10, fontWeight: 600, color: "#5B54D6" }}>시범 서비스 지역 · 부산</span>
            </div>
          </div>
          <h1 style={{
            fontSize: 34, fontWeight: 900, color: "#1A1B2E",
            margin: "0 0 10px", letterSpacing: -1,
          }}>
            누구와 함께 여행하시나요?
          </h1>
          <p style={{
            fontSize: 15, color: "#6B6B88",
            margin: 0, lineHeight: 1.65, fontWeight: 400, maxWidth: 540,
          }}>
            동행자를 선택하면 한국관광공사 공공데이터 기반으로 부산 접근성·편의성 조건을 자동 최적화합니다.
            복수 선택이 가능하며, 모든 조건을 동시에 충족하는 코스를 추천합니다.
          </p>
        </motion.div>

        {/* Companion chips */}
        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 36 }}>
          {COMPANIONS.map((c, i) => {
            const CIcon = c.Icon;
            const sel = companions.includes(c.id);
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.06 }}
                whileHover={{ y: -2, boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
                onClick={() => toggle(c.id)}
                style={{
                  width: 148, padding: "20px 16px 18px",
                  borderRadius: 16,
                  border: `2px solid ${sel ? c.color : "#E4E6EF"}`,
                  background: sel ? c.bg : "white",
                  cursor: "pointer", textAlign: "left",
                  transition: "border-color 0.15s, background 0.15s",
                  position: "relative",
                  boxShadow: sel ? `0 4px 16px ${c.color}22` : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                {sel && (
                  <div style={{
                    position: "absolute", top: 10, right: 10,
                    width: 18, height: 18, borderRadius: "50%",
                    background: c.color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <Check size={10} color="white" strokeWidth={3} />
                  </div>
                )}
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: sel ? `${c.color}18` : "#F4F5FA",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  marginBottom: 12,
                }}>
                  <CIcon size={22} color={sel ? c.color : "#9EA0B8"} />
                </div>
                <div style={{
                  fontSize: 13, fontWeight: 700,
                  color: sel ? c.color : "#1A1B2E",
                  marginBottom: 4, letterSpacing: -0.2,
                }}>
                  {c.label}
                </div>
                <div style={{
                  fontSize: 11, lineHeight: 1.4,
                  color: sel ? `${c.color}BB` : "#9EA0B8",
                }}>
                  {c.sub}
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Selection summary */}
        {companions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "#EEEDFA", borderRadius: 12,
              padding: "13px 18px", marginBottom: 28,
              display: "flex", alignItems: "center", gap: 10,
            }}
          >
            <Database size={15} color="#5B54D6" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#4A3EB8" }}>
              {companions.length}가지 조건 선택됨
              {companions.length >= 2 && " — 공공데이터 기반 복합 조건 통합 분석으로 최적 코스를 도출합니다."}
            </span>
          </motion.div>
        )}

        {/* CTA */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <motion.button
            whileHover={companions.length > 0 ? { scale: 1.02 } : {}}
            onClick={() => companions.length > 0 && navigate("/desktop/conditions")}
            style={{
              padding: "15px 32px", borderRadius: 14,
              border: "none",
              background: companions.length > 0
                ? "linear-gradient(135deg, #6C66E0, #5B54D6)"
                : "#E4E6EF",
              color: companions.length > 0 ? "white" : "#A0A2B8",
              fontSize: 15, fontWeight: 700,
              cursor: companions.length > 0 ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", gap: 8,
              boxShadow: companions.length > 0 ? "0 6px 20px rgba(91,84,214,0.3)" : "none",
              transition: "all 0.2s",
            }}
          >
            부산 여행 조건 설정하기
            <ChevronRight size={16} />
          </motion.button>
          {companions.length === 0 && (
            <span style={{ fontSize: 12, color: "#A0A2B8" }}>동행자를 1명 이상 선택해주세요</span>
          )}
        </div>
      </div>

      {/* ══ RIGHT — impact preview ═════════════════════════ */}
      <div style={{
        width: 360, flexShrink: 0,
        background: "white",
        borderLeft: "1.5px solid #E4E6EF",
        padding: "52px 28px 48px",
        overflowY: "auto",
        display: "flex", flexDirection: "column", gap: 0,
      }}>
        {/* Mascot illustration */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          style={{ marginBottom: 32, display: "flex", justifyContent: "center" }}
        >
          <OnboardingMascot />
        </motion.div>

        {/* Impact section */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 14,
          }}>
            선택에 따라 최적화되는 항목
          </div>
          {uniqueImpacts.length === 0 ? (
            <div style={{
              background: "#F6F7FB", borderRadius: 14,
              padding: "28px 20px", textAlign: "center",
            }}>
              <Shield size={32} color="#D0D2DC" style={{ marginBottom: 10 }} />
              <p style={{ fontSize: 13, color: "#B0B2C4", margin: 0, lineHeight: 1.5 }}>
                동행자를 선택하면<br />최적화 항목이 나타납니다
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {uniqueImpacts.map((item, i) => (
                <motion.div
                  key={`${item.color}:${item.text}`}
                  layout={false}
                  initial={{ opacity: 0, x: 8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 13px", borderRadius: 10,
                    background: `${item.color}0A`,
                    border: `1px solid ${item.color}20`,
                  }}
                >
                  <Check size={12} color={item.color} strokeWidth={2.5} />
                  <span style={{ fontSize: 13, color: "#3A3A5A", fontWeight: 500 }}>
                    {item.text}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "#F0F1F6", marginBottom: 24 }} />

        {/* Data stats */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12,
          }}>
            부산 공공데이터 현황
          </div>
          {DATA_STATS.map(stat => (
            <div key={stat.label} style={{
              marginBottom: 8, padding: "12px 14px",
              background: "#F6F7FB", borderRadius: 10,
            }}>
              <div style={{
                display: "flex",
                justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 11, color: "#6B6B88" }}>{stat.label}</span>
                <span style={{
                  fontSize: 16, fontWeight: 800, color: "#5B54D6",
                  letterSpacing: -0.5,
                }}>
                  {stat.value}
                </span>
              </div>
              <div style={{ fontSize: 10, color: "#A0A2B8", marginTop: 2 }}>{stat.note}</div>
            </div>
          ))}
        </div>

        {/* API sources — KTO first and prominent */}
        <div>
          <div style={{
            fontSize: 10, fontWeight: 700, color: "#A0A2B8",
            letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10,
          }}>
            추천 기준 (공공데이터 소스)
          </div>
          {API_SOURCES.map((src, i) => (
            <div key={src.label} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 0",
              borderBottom: i < API_SOURCES.length - 1 ? "1px solid #F4F5FA" : "none",
            }}>
              <Database size={10} color={src.primary ? "#5B54D6" : "#B0B2C0"} />
              <span style={{
                fontSize: 11,
                color: src.primary ? "#4A4A6A" : "#9EA0B8",
                fontWeight: src.primary ? 600 : 400,
              }}>{src.label}</span>
              {src.primary && i === 0 && (
                <div style={{ marginLeft: "auto", background: "#EEEDFA", borderRadius: 4, padding: "1px 6px" }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: "#5B54D6" }}>핵심</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}