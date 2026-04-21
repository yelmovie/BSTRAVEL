import { useState, type ElementType, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock,
  Footprints,
  Bus,
  Car,
  PersonStanding,
  Plus,
  Minus,
  Baby,
  Accessibility,
  Globe,
  User,
  Users,
  BookOpen,
  ShoppingCart,
  MapPin,
  ChevronRight,
  Wallet,
  Sun,
  Building2,
  Trees,
  Leaf,
  Palette,
  Sunset,
  Filter,
  AlarmClock,
  Check,
  Database,
} from "lucide-react";
import { useApp, GroupComposition, SupportOptions, ACCESSIBILITY_FILTER_LIST } from "../context/AppContext";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";
import { BUSAN_AREAS } from "../data/places";

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

function Stepper({
  value,
  min = 0,
  max = 20,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (v: number) => void;
}) {
  const canDec = value > min;
  const canInc = value < max;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "#EEF0F7",
        borderRadius: 12,
        padding: 4,
        gap: 0,
        flexShrink: 0,
      }}
    >
      <button
        onClick={() => canDec && onChange(value - 1)}
        disabled={!canDec}
        aria-label="감소"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "none",
          background: canDec ? "white" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canDec ? "pointer" : "not-allowed",
          boxShadow: canDec ? "0 1px 4px rgba(0,0,0,0.09)" : "none",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        <Minus size={13} color={canDec ? "#5B54D6" : "#C4C5D6"} />
      </button>
      <span
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: value > 0 ? "#1A1A2E" : "#B8BAD0",
          minWidth: 38,
          textAlign: "center",
          transition: "color 0.15s ease",
          letterSpacing: -0.3,
        }}
      >
        {value}
      </span>
      <button
        onClick={() => canInc && onChange(value + 1)}
        disabled={!canInc}
        aria-label="증가"
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          border: "none",
          background: canInc ? "white" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: canInc ? "pointer" : "not-allowed",
          boxShadow: canInc ? "0 1px 4px rgba(0,0,0,0.09)" : "none",
          transition: "all 0.15s ease",
          flexShrink: 0,
        }}
      >
        <Plus size={13} color={canInc ? "#5B54D6" : "#C4C5D6"} />
      </button>
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        width: 50,
        height: 28,
        borderRadius: 14,
        background: checked ? "#5B54D6" : "#D4D6E8",
        position: "relative",
        cursor: "pointer",
        transition: "background 0.25s ease",
        flexShrink: 0,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 4,
          left: checked ? 26 : 4,
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "white",
          transition: "left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
        }}
      />
    </div>
  );
}

/* Icon chip for rows */
function IconChip({
  icon: Icon,
  active,
}: {
  icon: ElementType;
  active?: boolean;
}) {
  return (
    <div
      style={{
        width: 36,
        height: 36,
        borderRadius: 10,
        background: active ? "#EEEDFA" : "#F0F1F6",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        transition: "background 0.15s ease",
      }}
    >
      <Icon size={17} color={active ? "#5B54D6" : "#8E90A8"} />
    </div>
  );
}

/* Section wrapper */
function Section({
  title,
  icon: Icon,
  children,
  delay = 0,
}: {
  title: string;
  icon: ElementType;
  children: ReactNode;
  delay?: number;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 7,
          marginBottom: 10,
        }}
      >
        <Icon size={14} color="#5B54D6" />
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#4A4A6A",
            letterSpacing: -0.1,
            textTransform: "uppercase" as const,
          }}
        >
          {title}
        </span>
      </div>
      <div
        style={{
          background: "white",
          borderRadius: 16,
          border: "1px solid #E8E9EF",
          overflow: "hidden",
        }}
      >
        {children}
      </div>
    </motion.section>
  );
}

/* Row inside a section panel */
function Row({
  icon: Icon,
  label,
  sub,
  right,
  isLast,
  active,
}: {
  icon: ElementType;
  label: string;
  sub: string;
  right: ReactNode;
  isLast?: boolean;
  active?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "14px 16px",
        borderBottom: isLast ? "none" : "1px solid #F0F1F6",
        background: active ? "rgba(91, 84, 214, 0.024)" : "transparent",
        transition: "background 0.15s ease",
      }}
    >
      <IconChip icon={Icon} active={active} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#1A1A2E",
            letterSpacing: -0.2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 11,
            color: "#9EA0B8",
            marginTop: 1,
            fontWeight: 400,
            letterSpacing: -0.1,
          }}
        >
          {sub}
        </div>
      </div>
      {right}
    </div>
  );
}

/* ─────────────────────────────────────────
   Constants
───────────────────────────────────────── */

const TRAVEL_TIMES = [
  { id: "2h", label: "2시간", sub: "가볍게" },
  { id: "half", label: "반나절", sub: "여유롭게" },
  { id: "full", label: "하루종일", sub: "천천히" },
];

const TRANSPORT_TYPES = [
  { id: "transit", label: "대중교통", icon: Bus },
  { id: "car", label: "차량 이용", icon: Car },
  { id: "walk", label: "도보 위주", icon: PersonStanding },
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

const BUDGETS = [
  { id: "economy", label: "알뜰하게", sub: "교통비 위주", icon: "💰" },
  { id: "moderate", label: "보통으로", sub: "식사·입장 포함", icon: "💳" },
  { id: "generous", label: "여유있게", sub: "체험·기념품 포함", icon: "✨" },
] as const;

const INDOOR_OPTS = [
  { id: "indoor", label: "실내 중심", icon: Building2 },
  { id: "mixed", label: "혼합", icon: Sun },
  { id: "outdoor", label: "야외 중심", icon: Trees },
] as const;

const PURPOSES = [
  { id: "healing", label: "휴식·힐링", Icon: Leaf },
  { id: "culture", label: "문화·예술", Icon: Palette },
  { id: "education", label: "역사·교육", Icon: BookOpen },
  { id: "nature", label: "자연·생태", Icon: Sunset },
];

const difficultyLabels = ["최대한 쉽게", "쉬움", "보통", "조금 힘듦", "어려움"];

/* ─────────────────────────────────────────
   Main Screen
───────────────────────────────────────── */

export function ConditionScreen() {
  const navigate = useNavigate();
  const {
    groupComposition,
    setGroupComposition,
    supportOptions,
    setSupportOptions,
    travelTime,
    setTravelTime,
    walkingDifficulty,
    setWalkingDifficulty,
    transportType,
    setTransportType,
    region,
    setRegion,
    busanArea,
    setBusanArea,
    departureTime,
    setDepartureTime,
    budget,
    setBudget,
    indoorPref,
    setIndoorPref,
    purpose,
    setPurpose,
    accessibilityFilters,
    setAccessibilityFilters,
  } = useApp();

  const [comp, setComp] = useState<GroupComposition>(groupComposition);
  const [support, setSupport] = useState<SupportOptions>(supportOptions);
  const [localTime, setLocalTime] = useState(travelTime);
  const [localDifficulty, setLocalDifficulty] = useState(walkingDifficulty);
  const [localTransport, setLocalTransport] = useState(transportType);
  const [localRegion, setLocalRegion] = useState(region);
  const [localBusanArea, setLocalBusanArea] = useState(busanArea);
  const [localDepartureTime, setLocalDepartureTime] = useState(departureTime);
  const [localBudget, setLocalBudget] = useState(budget);
  const [localIndoorPref, setLocalIndoorPref] = useState(indoorPref);
  const [localPurpose, setLocalPurpose] = useState<string[]>(purpose);
  const [localFilters, setLocalFilters] = useState<string[]>(accessibilityFilters);

  /* Helpers */
  const updateComp = (key: keyof GroupComposition, val: number) =>
    setComp((prev) => ({ ...prev, [key]: val }));
  const updateSupport = <K extends keyof SupportOptions>(key: K, val: SupportOptions[K]) =>
    setSupport((prev) => ({ ...prev, [key]: val }));
  const toggleLocalPurpose = (p: string) =>
    setLocalPurpose((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));
  const toggleLocalFilter = (id: string) =>
    setLocalFilters((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  /* Summary */
  const totalPeople = comp.adult + comp.elementary + comp.preschool + comp.elderly;
  const summaryParts: string[] = [];
  if (comp.adult > 0) summaryParts.push(`성인 ${comp.adult}`);
  if (comp.elementary > 0) summaryParts.push(`초등 ${comp.elementary}`);
  if (comp.preschool > 0) summaryParts.push(`미취학 ${comp.preschool}`);
  if (comp.elderly > 0) summaryParts.push(`어르신 ${comp.elderly}`);
  const summaryText = summaryParts.join(" · ") || "인원을 선택해주세요";

  const supportSummaryParts: string[] = [];
  if (support.stroller > 0) supportSummaryParts.push(`유모차 ${support.stroller}대`);
  if (support.wheelchair > 0) supportSummaryParts.push(`휠체어 ${support.wheelchair}대`);
  if (support.foreignLanguage) supportSummaryParts.push("외국어 지원");

  const handleNext = () => {
    setGroupComposition(comp);
    setSupportOptions(support);
    setTravelTime(localTime);
    setWalkingDifficulty(localDifficulty);
    setTransportType(localTransport);
    setRegion(localRegion);
    setBusanArea(localBusanArea);
    setDepartureTime(localDepartureTime);
    setBudget(localBudget);
    setIndoorPref(localIndoorPref);
    setPurpose(localPurpose);
    setAccessibilityFilters(localFilters);
    navigate("/mobile/recommendations");
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F4F5FA",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopNav title="여행 조건 설정" />
      <StepIndicator current={1} />

      {/* ── Sticky Summary Bar ── */}
      <div
        style={{
          position: "sticky",
          top: 56,
          zIndex: 40,
          padding: "10px 20px",
          background: "rgba(244, 245, 250, 0.96)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #E4E5EE",
        }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 14,
            border: "1.5px solid #E8E9F0",
            padding: "11px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          {/* Total pill */}
          <div
            style={{
              background: totalPeople > 0 ? "#5B54D6" : "#E8E9EF",
              borderRadius: 8,
              padding: "5px 11px",
              flexShrink: 0,
              transition: "background 0.25s ease",
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: totalPeople > 0 ? "white" : "#B0B2C8",
                letterSpacing: -0.3,
              }}
            >
              총 {totalPeople}명
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: totalPeople > 0 ? "#4A4A6A" : "#B0B2C8",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap" as const,
                letterSpacing: -0.2,
                transition: "color 0.25s ease",
              }}
            >
              {summaryText}
            </div>
            {supportSummaryParts.length > 0 && (
              <div
                style={{
                  fontSize: 11,
                  color: "#8B84E0",
                  marginTop: 1,
                  fontWeight: 500,
                  letterSpacing: -0.1,
                }}
              >
                {supportSummaryParts.join(" · ")}
              </div>
            )}
          </div>

          {/* Departure time badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "#F0F1F7",
              borderRadius: 7,
              padding: "4px 9px",
              flexShrink: 0,
            }}
          >
            <AlarmClock size={10} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6", letterSpacing: -0.2 }}>
              {localDepartureTime}
            </span>
          </div>

          {/* Busan badge */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              background: "#F0F1F7",
              borderRadius: 7,
              padding: "4px 9px",
              flexShrink: 0,
            }}
          >
            <MapPin size={10} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6", letterSpacing: -0.2 }}>
              부산
            </span>
          </div>
        </div>
      </div>

      {/* ── Scrollable content ── */}
      <div
        style={{
          padding: "20px 20px 0",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 24,
        }}
      >
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          style={{ paddingBottom: 4 }}
        >
          <h1
            style={{
              fontSize: 21,
              fontWeight: 700,
              color: "#1A1A2E",
              margin: 0,
              lineHeight: 1.4,
              letterSpacing: -0.5,
            }}
          >
            인원 구성과 여행 조건을
            <br />
            설정해주세요
          </h1>
          <p
            style={{
              color: "#8E90A8",
              fontSize: 13,
              margin: "5px 0 0",
              fontWeight: 400,
              letterSpacing: -0.2,
            }}
          >
            동행 조건을 선택하면 부산 권역 내 실제 가능한 코스를 분석합니다
          </p>
        </motion.div>

        {/* ── Section 0: 부산 권역 선택 ── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.03 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
            <MapPin size={14} color="#5B54D6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#4A4A6A", letterSpacing: -0.1, textTransform: "uppercase" as const }}>
              부산 권역 선택
            </span>
          </div>
          <div style={{ background: "white", borderRadius: 16, border: "1px solid #E8E9EF", overflow: "hidden", padding: "14px" }}>
            {/* Fixed Busan badge */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #F0F1F6" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 8px rgba(91,84,214,0.25)" }}>
                <MapPin size={16} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3 }}>부산광역시</div>
                <div style={{ fontSize: 11, color: "#9EA0B8", fontWeight: 400 }}>시범 서비스 지역</div>
              </div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EEEDFA", borderRadius: 6, padding: "4px 8px" }}>
                <Database size={10} color="#5B54D6" />
                <span style={{ fontSize: 10, fontWeight: 700, color: "#5B54D6" }}>KTO OpenAPI</span>
              </div>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#9EA0B8", marginBottom: 8 }}>권역 선택 (선택사항)</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
              {BUSAN_AREAS.map((area) => {
                const isSel = localBusanArea === area.id;
                return (
                  <button
                    key={area.id}
                    onClick={() => setLocalBusanArea(isSel ? "busan-all" : area.id)}
                    style={{
                      padding: "9px 11px", borderRadius: 10,
                      border: isSel ? `2px solid ${area.color}` : "1.5px solid #E8E9EF",
                      background: isSel ? `${area.color}0E` : "#F8F9FC",
                      cursor: "pointer", textAlign: "left" as const,
                      transition: "all 0.15s ease", position: "relative" as const,
                    }}
                  >
                    {isSel && (
                      <div style={{ position: "absolute", top: 6, right: 6, width: 14, height: 14, borderRadius: "50%", background: area.color, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Check size={9} color="white" strokeWidth={3} />
                      </div>
                    )}
                    <div style={{ fontSize: 13, marginBottom: 2 }}>{area.emoji}</div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: isSel ? area.color : "#1A1A2E", letterSpacing: -0.2 }}>{area.name}</div>
                    <div style={{ fontSize: 10, color: "#A4A6BC", marginTop: 1, lineHeight: 1.2 }}>{area.sub.split("·")[0].trim()}</div>
                  </button>
                );
              })}
            </div>
            {localBusanArea && localBusanArea !== "busan-all" && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 8, background: "#F6F5FF", borderRadius: 7, padding: "6px 10px" }}>
                <Check size={11} color="#5B54D6" />
                <span style={{ fontSize: 11, color: "#5B54D6", fontWeight: 600 }}>
                  {BUSAN_AREAS.find(a => a.id === localBusanArea)?.name} 권역으로 시작하기
                </span>
              </div>
            )}
          </div>
        </motion.section>

        {/* ── Section 0b: 출발 시간 ── */}
        <Section title="출발 시간" icon={AlarmClock} delay={0.04}>
          <div style={{ padding: "16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                background: "#EEEDFA",
                borderRadius: 14,
                padding: "14px 16px",
                border: "2px solid #D4D1F7",
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: "#5B54D6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <AlarmClock size={18} color="white" />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "#8B84E0", marginBottom: 4, letterSpacing: -0.1 }}>
                  출발 시각 입력
                </div>
                <input
                  type="time"
                  value={localDepartureTime}
                  onChange={(e) => setLocalDepartureTime(e.target.value)}
                  style={{
                    border: "none",
                    background: "transparent",
                    fontSize: 22,
                    fontWeight: 800,
                    color: "#5B54D6",
                    accentColor: "#5B54D6",
                    outline: "none",
                    fontFamily: "'Noto Sans KR', sans-serif",
                    letterSpacing: -0.5,
                    width: "100%",
                  }}
                />
              </div>
            </div>
            <div style={{ fontSize: 11, color: "#A0A2B8", marginTop: 8, textAlign: "center" }}>
              직접 시간을 입력하거나 터치해서 선택하세요
            </div>
          </div>
        </Section>

        {/* ── Section 1: 인원 구성 ── */}
        <Section title="인원 구성" icon={Users} delay={0.06}>
          <Row
            icon={User}
            label="성인"
            sub="만 13세 이상"
            active={comp.adult > 0}
            right={
              <Stepper
                value={comp.adult}
                onChange={(v) => updateComp("adult", v)}
              />
            }
          />
          <Row
            icon={BookOpen}
            label="초등학생"
            sub="8–12세"
            active={comp.elementary > 0}
            right={
              <Stepper
                value={comp.elementary}
                onChange={(v) => updateComp("elementary", v)}
              />
            }
          />
          <Row
            icon={Baby}
            label="미취학아동"
            sub="7세 이하"
            active={comp.preschool > 0}
            right={
              <Stepper
                value={comp.preschool}
                onChange={(v) => updateComp("preschool", v)}
              />
            }
          />
          <Row
            icon={PersonStanding}
            label="어르신"
            sub="65세 이상 · 보행 지원 고려"
            active={comp.elderly > 0}
            isLast
            right={
              <Stepper
                value={comp.elderly}
                onChange={(v) => updateComp("elderly", v)}
              />
            }
          />
        </Section>

        {/* ── Section 2: 동행 지원 옵션 ── */}
        <Section title="동행 지원 옵션" icon={Accessibility} delay={0.12}>
          <Row
            icon={ShoppingCart}
            label="유모차"
            sub="엘리베이터·경사로 코스 우선"
            active={support.stroller > 0}
            right={
              <Stepper
                value={support.stroller}
                onChange={(v) => updateSupport("stroller", v)}
              />
            }
          />
          <Row
            icon={Accessibility}
            label="휠체어"
            sub="휠체어 접근 가능 시설 필터"
            active={support.wheelchair > 0}
            right={
              <Stepper
                value={support.wheelchair}
                onChange={(v) => updateSupport("wheelchair", v)}
              />
            }
          />
          <Row
            icon={Globe}
            label="외국어 지원"
            sub="영어 등 외국어 안내 코스 포함"
            active={support.foreignLanguage}
            isLast
            right={
              <Toggle
                checked={support.foreignLanguage}
                onChange={(v) => updateSupport("foreignLanguage", v)}
              />
            }
          />
        </Section>

        {/* ── Section 3: 여행 시간 ── */}
        <Section title="여행 시간" icon={Clock} delay={0.18}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 0,
            }}
          >
            {TRAVEL_TIMES.map((t, i) => {
              const active = localTime === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setLocalTime(t.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "18px 8px",
                    border: "none",
                    borderRight:
                      i < TRAVEL_TIMES.length - 1 ? "1px solid #F0F1F6" : "none",
                    background: active ? "#F6F5FF" : "white",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                    position: "relative" as const,
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "20%",
                        right: "20%",
                        height: 2,
                        borderRadius: 2,
                        background: "#5B54D6",
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: active ? "#5B54D6" : "#1A1A2E",
                      letterSpacing: -0.3,
                    }}
                  >
                    {t.label}
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: active ? "#8B84E0" : "#9EA0B8",
                      fontWeight: 400,
                    }}
                  >
                    {t.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Section 4: 보행 난이도 ── */}
        <Section title="보행 난이도" icon={Footprints} delay={0.24}>
          <div style={{ padding: "18px 20px 16px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#9EA0B8",
                  letterSpacing: -0.1,
                }}
              >
                최대한 쉽게
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#5B54D6",
                  background: "#EEEDFA",
                  borderRadius: 7,
                  padding: "3px 10px",
                  letterSpacing: -0.2,
                }}
              >
                {difficultyLabels[localDifficulty]}
              </span>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#9EA0B8",
                  letterSpacing: -0.1,
                }}
              >
                다소 걷기 가능
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={4}
              value={localDifficulty}
              onChange={(e) => setLocalDifficulty(Number(e.target.value))}
              style={{
                width: "100%",
                accentColor: "#5B54D6",
                height: 4,
                cursor: "pointer",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 8,
                padding: "0 1px",
              }}
            >
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  style={{
                    width: 4,
                    height: 4,
                    borderRadius: "50%",
                    background: i <= localDifficulty ? "#5B54D6" : "#D4D6E8",
                    transition: "background 0.15s ease",
                  }}
                />
              ))}
            </div>
          </div>
        </Section>

        {/* ── Section 5: 이동 수단 ── */}
        <Section title="이동 수단" icon={Bus} delay={0.3}>
          {TRANSPORT_TYPES.map((t, i) => {
            const active = localTransport === t.id;
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setLocalTransport(t.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  padding: "14px 16px",
                  border: "none",
                  borderBottom:
                    i < TRANSPORT_TYPES.length - 1 ? "1px solid #F0F1F6" : "none",
                  background: active ? "rgba(91, 84, 214, 0.04)" : "white",
                  cursor: "pointer",
                  transition: "background 0.15s ease",
                  textAlign: "left" as const,
                }}
              >
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 11,
                    background: active ? "#5B54D6" : "#F0F1F6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.18s ease",
                    flexShrink: 0,
                  }}
                >
                  <Icon size={18} color={active ? "white" : "#8E90A8"} />
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: active ? "#1A1A2E" : "#5A5B78",
                    letterSpacing: -0.2,
                    flex: 1,
                  }}
                >
                  {t.label}
                </span>
                {active && (
                  <div
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: "#5B54D6",
                      flexShrink: 0,
                    }}
                  />
                )}
              </button>
            );
          })}
        </Section>

        {/* ── Section 6: 예산 수준 ── */}
        <Section title="예산 수준" icon={Wallet} delay={0.36}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 0,
            }}
          >
            {BUDGETS.map((b, i) => {
              const active = localBudget === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setLocalBudget(b.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 3,
                    padding: "16px 8px",
                    border: "none",
                    borderRight: i < BUDGETS.length - 1 ? "1px solid #F0F1F6" : "none",
                    background: active ? "#F6F5FF" : "white",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                    position: "relative" as const,
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "20%",
                        right: "20%",
                        height: 2,
                        borderRadius: 2,
                        background: "#5B54D6",
                      }}
                    />
                  )}
                  <span style={{ fontSize: 14, fontWeight: 700, color: active ? "#5B54D6" : "#1A1A2E", letterSpacing: -0.3 }}>
                    {b.label}
                  </span>
                  <span style={{ fontSize: 10, color: active ? "#8B84E0" : "#9EA0B8", fontWeight: 400, textAlign: "center" as const }}>
                    {b.sub}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Section 7: 실내·야외 선호 ── */}
        <Section title="실내·야외 선호" icon={Sun} delay={0.4}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0 }}>
            {INDOOR_OPTS.map((o, i) => {
              const active = localIndoorPref === o.id;
              const OIcon = o.icon;
              return (
                <button
                  key={o.id}
                  onClick={() => setLocalIndoorPref(o.id)}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 5,
                    padding: "16px 8px",
                    border: "none",
                    borderRight: i < INDOOR_OPTS.length - 1 ? "1px solid #F0F1F6" : "none",
                    background: active ? "#F6F5FF" : "white",
                    cursor: "pointer",
                    transition: "background 0.15s ease",
                    position: "relative" as const,
                  }}
                >
                  {active && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: "20%",
                        right: "20%",
                        height: 2,
                        borderRadius: 2,
                        background: "#5B54D6",
                      }}
                    />
                  )}
                  <OIcon size={18} color={active ? "#5B54D6" : "#9EA0B8"} />
                  <span style={{ fontSize: 12, fontWeight: active ? 700 : 500, color: active ? "#5B54D6" : "#5A5B78", letterSpacing: -0.2 }}>
                    {o.label}
                  </span>
                </button>
              );
            })}
          </div>
        </Section>

        {/* ── Section 8: 여행 목적 ── */}
        <Section title="여행 목적" icon={Palette} delay={0.44}>
          <div style={{ padding: "12px 14px", display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {PURPOSES.map((p) => {
              const active = localPurpose.includes(p.id);
              const PIcon = p.Icon;
              return (
                <button
                  key={p.id}
                  onClick={() => toggleLocalPurpose(p.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: `1.5px solid ${active ? "#5B54D6" : "#E8E9EF"}`,
                    background: active ? "#EEEDFA" : "white",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <PIcon size={13} color={active ? "#5B54D6" : "#9EA0B8"} />
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#5B54D6" : "#5A5B78" }}>
                    {p.label}
                  </span>
                </button>
              );
            })}
          </div>
          {localPurpose.length === 0 && (
            <div style={{ padding: "0 14px 12px", fontSize: 11, color: "#B0B2C8", fontWeight: 400 }}>
              * 복수 선택 가능 (선택하지 않으면 전체 포함)
            </div>
          )}
        </Section>

        {/* ── Section 9: 접근성 필터 ── */}
        <Section title="접근성 필터" icon={Filter} delay={0.48}>
          <div style={{ padding: "14px", display: "flex", gap: 8, flexWrap: "wrap" as const }}>
            {ACCESSIBILITY_FILTER_LIST.map((f) => {
              const active = localFilters.includes(f.id);
              return (
                <button
                  key={f.id}
                  onClick={() => toggleLocalFilter(f.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                    padding: "7px 13px",
                    borderRadius: 20,
                    border: `1.5px solid ${active ? "#5B54D6" : "#E8E9EF"}`,
                    background: active ? "#EEEDFA" : "white",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                  }}
                >
                  <span style={{ fontSize: 13, fontWeight: active ? 700 : 500, color: active ? "#5B54D6" : "#5A5B78" }}>
                    {f.label}
                  </span>
                </button>
              );
            })}
          </div>
          <div style={{ padding: "0 14px 12px", fontSize: 11, color: "#B0B2C8" }}>
            * 선택한 시설이 있는 장소를 우선 추천합니다
          </div>
        </Section>
      </div>

      {/* ── CTA ── */}
      <div style={{ padding: "20px 20px 44px" }}>
        <motion.button
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.52 }}
          onClick={handleNext}
          whileTap={{ scale: 0.98 }}
          style={{
            width: "100%",
            padding: "17px",
            borderRadius: 14,
            border: "none",
            background:
              totalPeople > 0
                ? "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)"
                : "#C4C5D8",
            color: "white",
            fontSize: 15,
            fontWeight: 700,
            cursor: totalPeople > 0 ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            letterSpacing: -0.3,
            boxShadow: totalPeople > 0 ? "0 4px 20px rgba(91,84,214,0.35)" : "none",
            transition: "all 0.2s ease",
          }}
        >
          {totalPeople > 0
            ? `${totalPeople}명 · 부산 추천 코스 분석 시작`
            : "인원을 1명 이상 선택해주세요"}
        </motion.button>
      </div>
    </div>
  );
}