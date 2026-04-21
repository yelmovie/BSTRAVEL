import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock, Bus, Car, PersonStanding, ChevronRight,
  Leaf, Palette, BookOpen, Sunset, Check, ArrowLeft,
  Wallet, Sun, Building2, Trees, MapPin, Users, User,
  Baby, Accessibility, Globe, ShoppingCart, AlarmClock,
  Filter, Plus, Minus, Database,
} from "lucide-react";
import { useApp, GroupComposition, SupportOptions, ACCESSIBILITY_FILTER_LIST } from "../../context/AppContext";
import type { BudgetLevel, IndoorPref } from "../../context/AppContext";
import { BUSAN_AREAS } from "../../data/places";

/* ── data ────────────────────────────────────────────── */
const DURATIONS = [
  { id: "2h",   label: "2시간",    sub: "간단 코스" },
  { id: "half", label: "반나절",   sub: "3–4시간" },
  { id: "full", label: "하루종일", sub: "6–8시간" },
];

const TRANSPORTS = [
  { id: "transit", label: "대중교통", Icon: Bus },
  { id: "car",     label: "차량 이용", Icon: Car },
  { id: "walk",    label: "도보 중심", Icon: PersonStanding },
];

const WALK_LABELS = ["매우 적게", "낮게", "보통", "활동적", "충분히"];

const BUDGETS: { id: BudgetLevel; label: string; sub: string }[] = [
  { id: "economy",  label: "알뜰하게", sub: "교통비 위주" },
  { id: "moderate", label: "보통으로", sub: "식사·입장 포함" },
  { id: "generous", label: "여유있게", sub: "체험·기념품 포함" },
];

const INDOOR_OPTS: { id: IndoorPref; label: string; Icon: React.FC<any> }[] = [
  { id: "indoor",  label: "실내 중심", Icon: Building2 },
  { id: "mixed",   label: "혼합",      Icon: Sun },
  { id: "outdoor", label: "야외 중심", Icon: Trees },
];

const PURPOSES = [
  { id: "healing",   label: "휴식·힐링",   Icon: Leaf },
  { id: "culture",   label: "문화·예술",   Icon: Palette },
  { id: "education", label: "역사·교육",   Icon: BookOpen },
  { id: "nature",    label: "자연·생태",   Icon: Sunset },
];

const DEPARTURE_PRESETS = [
  { label: "오전 8시", value: "08:00" },
  { label: "오전 9시", value: "09:00" },
  { label: "오전 10시", value: "10:00" },
  { label: "오전 11시", value: "11:00" },
  { label: "오후 12시", value: "12:00" },
  { label: "오후 1시", value: "13:00" },
  { label: "오후 2시", value: "14:00" },
];

const COMPANION_LABELS: Record<string, string> = {
  elderly: "어르신 동반", stroller: "유모차",
  wheelchair: "휠체어 사용자", children: "어린이 동반", foreigner: "외국인 동행",
};

const DURATION_LABELS: Record<string, string> = {
  "2h": "2시간", half: "반나절 (3–4h)", full: "하루종일 (6–8h)",
};

const WALK_CRITERIA: Record<string, string[]> = {
  elderly:    ["최대 이동 거리 3km 이내", "30분 이상 연속 보행 제외", "중간 휴식 장소 포함"],
  stroller:   ["넓은 보도·무단차 구간", "자갈길·계단 완전 제외", "경사 5% 이하 유지"],
  wheelchair: ["배리어프리 인증 경로", "경사로 대신 평지 경로", "화장실 30분 이내 간격"],
  children:   ["어린이 보행 속도 기준", "안전 통행 구간 우선", "중간 놀이 체험 포함"],
  foreigner:  ["영문 표기 및 안내판", "무인 결제 가능 장소", "교통 접근성 용이"],
};

/* ── Stepper Component ─────────────────────────────────── */
function Stepper({
  value,
  min = 0,
  max = 20,
  onChange,
}: {
  value: number; min?: number; max?: number; onChange: (v: number) => void;
}) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <div style={{ display: "flex", alignItems: "center", background: "#EEF0F7", borderRadius: 10, padding: 3, gap: 0, flexShrink: 0 }}>
      <button
        onClick={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        style={{
          width: 30, height: 30, borderRadius: 7, border: "none",
          background: canDec ? "white" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: canDec ? "pointer" : "not-allowed",
          boxShadow: canDec ? "0 1px 4px rgba(0,0,0,0.09)" : "none",
          flexShrink: 0,
        }}
      >
        <Minus size={12} color={canDec ? "#5B54D6" : "#C4C5D6"} />
      </button>
      <span style={{ fontSize: 14, fontWeight: 700, color: value > 0 ? "#1A1A2E" : "#B8BAD0", minWidth: 32, textAlign: "center" }}>
        {value}
      </span>
      <button
        onClick={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        style={{
          width: 30, height: 30, borderRadius: 7, border: "none",
          background: canInc ? "white" : "transparent",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: canInc ? "pointer" : "not-allowed",
          boxShadow: canInc ? "0 1px 4px rgba(0,0,0,0.09)" : "none",
          flexShrink: 0,
        }}
      >
        <Plus size={12} color={canInc ? "#5B54D6" : "#C4C5D6"} />
      </button>
    </div>
  );
}

/* ── page ─────────────────────────────────────────────── */
export function ConditionsPage() {
  const navigate = useNavigate();
  const {
    companions,
    travelTime, setTravelTime,
    walkingDifficulty, setWalkingDifficulty,
    transportType, setTransportType,
    budget, setBudget,
    indoorPref, setIndoorPref,
    purpose, setPurpose,
    region, setRegion,
    departureTime, setDepartureTime,
    accessibilityFilters, setAccessibilityFilters,
    groupComposition, setGroupComposition,
    supportOptions, setSupportOptions,
    busanArea, setBusanArea,
  } = useApp();

  // Local state for form (committed on "Next")
  const [localRegion, setLocalRegion] = useState(region);
  const [localBusanArea, setLocalBusanArea] = useState(busanArea);
  const [localComp, setLocalComp] = useState<GroupComposition>(groupComposition);
  const [localSupport, setLocalSupport] = useState<SupportOptions>(supportOptions);
  const [localDeparture, setLocalDeparture] = useState(departureTime);
  const [localFilters, setLocalFilters] = useState<string[]>(accessibilityFilters);
  const [localPurpose, setLocalPurpose] = useState<string[]>(purpose);

  const updateComp = (key: keyof GroupComposition, val: number) =>
    setLocalComp((prev) => ({ ...prev, [key]: val }));
  const updateSupport = <K extends keyof SupportOptions>(key: K, val: SupportOptions[K]) =>
    setLocalSupport((prev) => ({ ...prev, [key]: val }));
  const toggleLocalFilter = (id: string) =>
    setLocalFilters((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const toggleLocalPurpose = (p: string) =>
    setLocalPurpose((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);

  // Summary
  const totalPeople = localComp.adult + localComp.elementary + localComp.preschool + localComp.elderly;

  // Criteria from companions
  const liveCriteria = companions.slice(0, 2).flatMap(c => WALK_CRITERIA[c] ?? []).slice(0, 4);

  const handleNext = () => {
    setRegion(localRegion);
    setGroupComposition(localComp);
    setSupportOptions(localSupport);
    setDepartureTime(localDeparture);
    // Sync purpose
    setPurpose(localPurpose);
    // Sync accessibility filters
    setAccessibilityFilters(localFilters);
    // Sync busanArea
    setBusanArea(localBusanArea);
    navigate("/desktop/generating");
  };

  return (
    <div style={{ display: "flex", minHeight: "calc(100dvh - 62px)" }}>
      {/* ══ LEFT — form ════════════════════════════════════ */}
      <div style={{
        flex: 1, padding: "40px 48px",
        overflowY: "auto",
        display: "flex", flexDirection: "column",
      }}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: 32 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#5B54D6" }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: "#5B54D6", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Step 2 — 여행 조건
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 900, color: "#1A1B2E", margin: "0 0 8px", letterSpacing: -0.8 }}>
            어떤 조건으로 여행하시나요?
          </h1>
          <p style={{ fontSize: 14, color: "#6B6B88", margin: 0, lineHeight: 1.6 }}>
            선택 조건이 코스 추천에 직접 반영됩니다. 동행자 접근성과 함께 자동으로 최적화됩니다.
          </p>
        </motion.div>

        {/* ── Two-column layout for form sections ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>

          {/* ① 부산 권역 선택 — full width */}
          <div style={{ gridColumn: "1 / -1", marginBottom: 28 }}>
            <FormSection label="부산 권역 선택">
              {/* Busan fixed badge */}
              <div style={{ background: "white", borderRadius: 12, border: "2px solid #E4E6EF", padding: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #F0F1F6" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6C66E0, #5B54D6)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPin size={17} color="white" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1B2E" }}>부산광역시</div>
                    <div style={{ fontSize: 11, color: "#A0A2B8" }}>시범 서비스 지역</div>
                  </div>
                  <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EEEDFA", borderRadius: 6, padding: "4px 10px" }}>
                    <Database size={10} color="#5B54D6" />
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>KTO OpenAPI</span>
                  </div>
                </div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#9EA0B8", marginBottom: 10 }}>권역 선택 (선택사항)</div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
                  {BUSAN_AREAS.map((area) => {
                    const isSel = localBusanArea === area.id;
                    return (
                      <button
                        key={area.id}
                        onClick={() => setLocalBusanArea(isSel ? "busan-all" : area.id)}
                        style={{
                          padding: "10px 8px", borderRadius: 10,
                          border: isSel ? `2px solid ${area.color}` : "1.5px solid #E4E6EF",
                          background: isSel ? `${area.color}0D` : "#F8F9FC",
                          cursor: "pointer", textAlign: "center" as const,
                          transition: "all 0.15s ease", position: "relative" as const,
                        }}
                      >
                        {isSel && (
                          <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, borderRadius: "50%", background: area.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                            <Check size={9} color="white" strokeWidth={3} />
                          </div>
                        )}
                        <div style={{ fontSize: 16, marginBottom: 4 }}>{area.emoji}</div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? area.color : "#1A1B2E", letterSpacing: -0.2 }}>{area.name}</div>
                        <div style={{ fontSize: 9, color: "#A4A6BC", marginTop: 2, lineHeight: 1.2 }}>{area.sub.split("·")[0].trim()}</div>
                      </button>
                    );
                  })}
                </div>
                {localBusanArea && localBusanArea !== "busan-all" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 10, background: "#F6F5FF", borderRadius: 8, padding: "7px 12px" }}>
                    <Check size={12} color="#5B54D6" />
                    <span style={{ fontSize: 11, color: "#5B54D6", fontWeight: 600 }}>
                      {BUSAN_AREAS.find(a => a.id === localBusanArea)?.name} 권역 선택됨
                    </span>
                  </div>
                )}
              </div>
            </FormSection>
          </div>

          {/* ② 인원 구성 */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="인원 구성">
              <div style={{ display: "flex", flexDirection: "column", gap: 0, background: "white", borderRadius: 12, border: "2px solid #E4E6EF", overflow: "hidden" }}>
                {[
                  { icon: User, key: "adult" as const, label: "성인", sub: "만 13세 이상" },
                  { icon: BookOpen, key: "elementary" as const, label: "초등학생", sub: "8–12세" },
                  { icon: Baby, key: "preschool" as const, label: "미취학아동", sub: "7세 이하" },
                  { icon: PersonStanding, key: "elderly" as const, label: "어르신", sub: "65세 이상" },
                ].map((row, idx, arr) => (
                  <div key={row.key} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                    borderBottom: idx < arr.length - 1 ? "1px solid #F0F1F6" : "none",
                    background: localComp[row.key] > 0 ? "rgba(91,84,214,0.025)" : "transparent",
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: localComp[row.key] > 0 ? "#EEEDFA" : "#F0F1F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <row.icon size={15} color={localComp[row.key] > 0 ? "#5B54D6" : "#8E90A8"} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1B2E" }}>{row.label}</div>
                      <div style={{ fontSize: 10, color: "#A0A2B8" }}>{row.sub}</div>
                    </div>
                    <Stepper value={localComp[row.key]} onChange={(v) => updateComp(row.key, v)} />
                  </div>
                ))}
              </div>
            </FormSection>
          </div>

          {/* ③ 동행 지원 옵션 */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="동행 지원 옵션">
              <div style={{ background: "white", borderRadius: 12, border: "2px solid #E4E6EF", overflow: "hidden" }}>
                {[
                  { icon: ShoppingCart, key: "stroller" as const, label: "유모차", sub: "경사로·평지 우선" },
                  { icon: Accessibility, key: "wheelchair" as const, label: "휠체어", sub: "배리어프리 경로" },
                ].map((row, idx) => (
                  <div key={row.key} style={{
                    display: "flex", alignItems: "center", gap: 10, padding: "11px 14px",
                    borderBottom: "1px solid #F0F1F6",
                    background: (localSupport[row.key] as number) > 0 ? "rgba(91,84,214,0.025)" : "transparent",
                  }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: (localSupport[row.key] as number) > 0 ? "#EEEDFA" : "#F0F1F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <row.icon size={15} color={(localSupport[row.key] as number) > 0 ? "#5B54D6" : "#8E90A8"} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1B2E" }}>{row.label}</div>
                      <div style={{ fontSize: 10, color: "#A0A2B8" }}>{row.sub}</div>
                    </div>
                    <Stepper value={localSupport[row.key] as number} onChange={(v) => updateSupport(row.key, v)} />
                  </div>
                ))}
                {/* Foreign language toggle */}
                <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "11px 14px", background: localSupport.foreignLanguage ? "rgba(91,84,214,0.025)" : "transparent" }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: localSupport.foreignLanguage ? "#EEEDFA" : "#F0F1F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <Globe size={15} color={localSupport.foreignLanguage ? "#5B54D6" : "#8E90A8"} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "#1A1B2E" }}>외국어 지원</div>
                    <div style={{ fontSize: 10, color: "#A0A2B8" }}>다국어 안내 장소 우선</div>
                  </div>
                  <div
                    role="switch"
                    aria-checked={localSupport.foreignLanguage}
                    onClick={() => updateSupport("foreignLanguage", !localSupport.foreignLanguage)}
                    style={{
                      width: 44, height: 24, borderRadius: 12,
                      background: localSupport.foreignLanguage ? "#5B54D6" : "#D4D6E8",
                      position: "relative", cursor: "pointer", transition: "background 0.25s",
                    }}
                  >
                    <div style={{
                      position: "absolute", top: 3,
                      left: localSupport.foreignLanguage ? 23 : 3,
                      width: 18, height: 18, borderRadius: "50%",
                      background: "white", transition: "left 0.25s cubic-bezier(0.34,1.56,0.64,1)",
                      boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
                    }} />
                  </div>
                </div>
              </div>
            </FormSection>
          </div>

          {/* ④ 출발 시간 */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="출발 시간">
              <div style={{
                background: "#EEEDFA",
                borderRadius: 14,
                border: "2px solid #D4D1F7",
                padding: "18px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: "#5B54D6",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                  boxShadow: "0 4px 12px rgba(91,84,214,0.3)",
                }}>
                  <AlarmClock size={20} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: "#8B84E0", marginBottom: 4, letterSpacing: -0.1 }}>
                    출발 시각 직접 입력
                  </div>
                  <input
                    type="time"
                    value={localDeparture}
                    onChange={(e) => setLocalDeparture(e.target.value)}
                    style={{
                      border: "none",
                      background: "transparent",
                      fontSize: 28,
                      fontWeight: 800,
                      color: "#5B54D6",
                      accentColor: "#5B54D6",
                      outline: "none",
                      fontFamily: "'Noto Sans KR', sans-serif",
                      letterSpacing: -1,
                      width: "100%",
                    }}
                  />
                </div>
                <div style={{
                  fontSize: 11, color: "#A0A2B8",
                  textAlign: "right" as const,
                  lineHeight: 1.5,
                  flexShrink: 0,
                }}>
                  클릭하여<br />시간 입력
                </div>
              </div>
            </FormSection>
          </div>

          {/* ⑤ Duration */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="여행 시간">
              <div style={{ display: "flex", gap: 10 }}>
                {DURATIONS.map(d => {
                  const sel = travelTime === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => setTravelTime(d.id)}
                      style={{
                        flex: 1, padding: "13px 8px", borderRadius: 12,
                        border: `2px solid ${sel ? "#5B54D6" : "#E4E6EF"}`,
                        background: sel ? "#EEEDFA" : "white",
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
                      }}
                    >
                      <Clock size={16} color={sel ? "#5B54D6" : "#A0A2B8"} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: sel ? "#5B54D6" : "#1A1B2E" }}>{d.label}</span>
                      <span style={{ fontSize: 10, color: sel ? "#8B84E0" : "#A0A2B8" }}>{d.sub}</span>
                    </button>
                  );
                })}
              </div>
            </FormSection>
          </div>

          {/* ⑥ Transport */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="이동 수단">
              <div style={{ display: "flex", gap: 10 }}>
                {TRANSPORTS.map(t => {
                  const TIcon = t.Icon;
                  const sel = transportType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTransportType(t.id)}
                      style={{
                        flex: 1, padding: "13px 8px", borderRadius: 12,
                        border: `2px solid ${sel ? "#5B54D6" : "#E4E6EF"}`,
                        background: sel ? "#EEEDFA" : "white",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                      }}
                    >
                      <TIcon size={16} color={sel ? "#5B54D6" : "#A0A2B8"} />
                      <span style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "#5B54D6" : "#4A4A6A" }}>{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormSection>
          </div>

          {/* ⑦ Walking tolerance */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label={`보행 부담 — ${WALK_LABELS[walkingDifficulty - 1] ?? "보통"}`}>
              <div style={{ background: "white", borderRadius: 12, border: "2px solid #E4E6EF", padding: "16px" }}>
                <input
                  type="range" min={1} max={5} value={walkingDifficulty}
                  onChange={e => setWalkingDifficulty(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#5B54D6", cursor: "pointer" }}
                />
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                  {WALK_LABELS.map((l, i) => (
                    <span key={l} style={{
                      fontSize: 10, color: walkingDifficulty === i + 1 ? "#5B54D6" : "#B0B2C4",
                      fontWeight: walkingDifficulty === i + 1 ? 700 : 400,
                    }}>{l}</span>
                  ))}
                </div>
              </div>
            </FormSection>
          </div>

          {/* ⑧ Budget */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="예산 수준">
              <div style={{ display: "flex", gap: 10 }}>
                {BUDGETS.map(b => {
                  const sel = budget === b.id;
                  return (
                    <button
                      key={b.id}
                      onClick={() => setBudget(b.id)}
                      style={{
                        flex: 1, padding: "12px 8px", borderRadius: 10,
                        border: `2px solid ${sel ? "#5B54D6" : "#E4E6EF"}`,
                        background: sel ? "#EEEDFA" : "white",
                        cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                      }}
                    >
                      <Wallet size={15} color={sel ? "#5B54D6" : "#A0A2B8"} />
                      <div style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "#5B54D6" : "#1A1B2E" }}>{b.label}</div>
                      <div style={{ fontSize: 10, color: sel ? "#8B84E0" : "#A0A2B8", textAlign: "center" }}>{b.sub}</div>
                    </button>
                  );
                })}
              </div>
            </FormSection>
          </div>

          {/* ⑨ Indoor/Outdoor */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="실내 · 야외 선호">
              <div style={{ display: "flex", gap: 10 }}>
                {INDOOR_OPTS.map(o => {
                  const OIcon = o.Icon;
                  const sel = indoorPref === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setIndoorPref(o.id)}
                      style={{
                        flex: 1, padding: "12px 8px", borderRadius: 10,
                        border: `2px solid ${sel ? "#5B54D6" : "#E4E6EF"}`,
                        background: sel ? "#EEEDFA" : "white",
                        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      }}
                    >
                      <OIcon size={14} color={sel ? "#5B54D6" : "#A0A2B8"} />
                      <span style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "#5B54D6" : "#4A4A6A" }}>{o.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormSection>
          </div>

          {/* ⑩ Purpose */}
          <div style={{ marginBottom: 28 }}>
            <FormSection label="여행 목적 (복수 선택)">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {PURPOSES.map(p => {
                  const PIcon = p.Icon;
                  const sel = localPurpose.includes(p.id);
                  return (
                    <button
                      key={p.id}
                      onClick={() => toggleLocalPurpose(p.id)}
                      style={{
                        padding: "9px 16px", borderRadius: 24,
                        border: `2px solid ${sel ? "#5B54D6" : "#E4E6EF"}`,
                        background: sel ? "#EEEDFA" : "white",
                        cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
                      }}
                    >
                      <PIcon size={13} color={sel ? "#5B54D6" : "#A0A2B8"} />
                      <span style={{ fontSize: 12, fontWeight: sel ? 700 : 500, color: sel ? "#5B54D6" : "#4A4A6A" }}>{p.label}</span>
                    </button>
                  );
                })}
              </div>
            </FormSection>
          </div>

          {/* ⑪ Accessibility filters — full width */}
          <div style={{ gridColumn: "1 / -1", marginBottom: 28 }}>
            <FormSection label="접근성 필터 (필수 시설 선택)">
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {ACCESSIBILITY_FILTER_LIST.map((f) => {
                  const active = localFilters.includes(f.id);
                  return (
                    <button
                      key={f.id}
                      onClick={() => toggleLocalFilter(f.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 6,
                        padding: "8px 16px", borderRadius: 24,
                        border: `2px solid ${active ? "#5B54D6" : "#E4E6EF"}`,
                        background: active ? "#EEEDFA" : "white",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      {active && <Check size={11} color="#5B54D6" strokeWidth={2.5} />}
                      <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#5B54D6" : "#4A4A6A" }}>
                        {f.label}
                      </span>
                    </button>
                  );
                })}
              </div>
              <p style={{ fontSize: 11, color: "#A0A2B8", margin: "8px 0 0", fontStyle: "italic" }}>
                * 선택한 시설이 모두 갖춰진 장소를 우선 추천합니다
              </p>
            </FormSection>
          </div>
        </div>

        {/* CTA row */}
        <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
          <button
            onClick={() => navigate("/desktop/onboarding")}
            style={{
              padding: "14px 24px", borderRadius: 12,
              border: "1.5px solid #E4E6EF", background: "white",
              color: "#6B6B88", fontSize: 14, fontWeight: 600, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 7,
            }}
          >
            <ArrowLeft size={14} />이전
          </button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            onClick={handleNext}
            style={{
              flex: 1, padding: "15px 32px", borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
              color: "white", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 6px 20px rgba(91,84,214,0.3)",
            }}
          >
            코스 분석 시작
            <ChevronRight size={17} />
          </motion.button>
        </div>
      </div>

      {/* ══ RIGHT — live profile preview ═══════════════════ */}
      <div style={{
        width: 300, flexShrink: 0,
        background: "white", borderLeft: "1.5px solid #E4E6EF",
        padding: "40px 24px", overflowY: "auto",
      }}>
        <div style={{
          fontSize: 10, fontWeight: 700, color: "#A0A2B8",
          letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 20,
        }}>
          나의 여행 프로필
        </div>

        {/* Summary card */}
        <div style={{
          background: "#EEEDFA", borderRadius: 14, padding: "16px 18px", marginBottom: 20,
          display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ fontSize: 12, color: "#5B54D6", fontWeight: 600 }}>총 인원</div>
            <div style={{ fontSize: 20, fontWeight: 900, color: "#1A1B2E", letterSpacing: -0.5 }}>
              {totalPeople}명
            </div>
          </div>
          <div style={{ height: 1, background: "#D8D5F5" }} />
          <div style={{ fontSize: 11, color: "#5B54D6", fontWeight: 500 }}>
            출발 {localDeparture} · {localBusanArea !== "busan-all" ? BUSAN_AREAS.find(a => a.id === localBusanArea)?.name ?? "부산 전체" : "부산 전체"}
          </div>
        </div>

        {/* Profile rows */}
        {[
          { label: "동행자", value: companions.map(c => COMPANION_LABELS[c] ?? c).join(", ") || "미선택" },
          { label: "여행 시간", value: DURATION_LABELS[travelTime] ?? travelTime },
          { label: "이동 수단", value: TRANSPORTS.find(t => t.id === transportType)?.label ?? transportType },
          { label: "보행 부담", value: `${WALK_LABELS[walkingDifficulty - 1]} (${walkingDifficulty}/5)` },
          { label: "예산", value: BUDGETS.find(b => b.id === budget)?.label ?? budget },
          { label: "환경 선호", value: INDOOR_OPTS.find(o => o.id === indoorPref)?.label ?? indoorPref },
          { label: "여행 목적", value: localPurpose.map(p => PURPOSES.find(x => x.id === p)?.label ?? p).join(", ") || "미선택" },
          { label: "접근성 필터", value: localFilters.length > 0 ? `${localFilters.length}개 선택됨` : "미선택" },
        ].map(row => (
          <div key={row.label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            padding: "10px 0", borderBottom: "1px solid #F0F1F6",
          }}>
            <span style={{ fontSize: 11, color: "#8E90A8", flexShrink: 0, marginRight: 12 }}>{row.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: "#1A1B2E", textAlign: "right", wordBreak: "keep-all" }}>
              {row.value}
            </span>
          </div>
        ))}

        {/* Criteria derived */}
        {liveCriteria.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#A0A2B8",
              letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12,
            }}>
              동행자 조건 필터
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
              {liveCriteria.map((c, i) => (
                <div key={i} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  padding: "8px 10px", borderRadius: 8, background: "#F6F7FB",
                }}>
                  <Check size={11} color="#5B54D6" />
                  <span style={{ fontSize: 11, color: "#4A4A6A" }}>{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility filter badges */}
        {localFilters.length > 0 && (
          <div style={{ marginTop: 20 }}>
            <div style={{
              fontSize: 10, fontWeight: 700, color: "#A0A2B8",
              letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10,
            }}>
              선택된 접근성 필터
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
              {localFilters.map(f => {
                const info = ACCESSIBILITY_FILTER_LIST.find(x => x.id === f);
                return (
                  <div key={f} style={{
                    padding: "4px 10px", borderRadius: 12, background: "#EEEDFA",
                    fontSize: 11, fontWeight: 600, color: "#5B54D6",
                  }}>
                    {info?.label ?? f}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function FormSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: "#1A1B2E",
        marginBottom: 10, letterSpacing: -0.1,
      }}>
        {label}
      </div>
      {children}
    </div>
  );
}