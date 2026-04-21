import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { useApp } from "../context/AppContext";
import { COMPANION_LIST, BUSAN_AREAS } from "../data/places";
import {
  ChevronRight,
  Users,
  Baby,
  Accessibility,
  Globe,
  Heart,
  Check,
  Database,
  MapPin,
} from "lucide-react";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";
import onboardingCharacter from "../../assets/3.png";

const COMPANION_ICONS: Record<string, React.ReactNode> = {
  elderly: <Users size={24} color="#5B54D6" />,
  stroller: <Baby size={24} color="#5B54D6" />,
  wheelchair: <Accessibility size={24} color="#5B54D6" />,
  foreigner: <Globe size={24} color="#5B54D6" />,
  family: <Heart size={24} color="#5B54D6" />,
};

export function OnboardingScreen() {
  const navigate = useNavigate();
  const { companions, setCompanions, busanArea, setBusanArea } = useApp();
  const [selected, setSelected] = useState<string[]>(companions);
  const [selectedArea, setSelectedArea] = useState(busanArea === "busan-all" ? "" : busanArea);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setCompanions(selected);
    if (selectedArea) setBusanArea(selectedArea);
    navigate("/mobile/conditions");
  };

  const handlePublicData = () => {
    setCompanions(selected);
    if (selectedArea) setBusanArea(selectedArea);
    navigate("/mobile/smart");
  };

  return (
    <div style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", background: "#F8F9FC" }}>
      <TopNav showBack={false} />
      <StepIndicator current={0} />

      <div style={{ padding: "24px 24px 0" }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              background: "#EEEDFA",
              borderRadius: 8,
              padding: "5px 12px",
              marginBottom: 14,
            }}
          >
            <MapPin size={12} color="#5B54D6" />
            <span style={{ fontSize: 12, color: "#5B54D6", fontWeight: 600, letterSpacing: -0.2 }}>
              시범 서비스 지역 · 부산
            </span>
          </div>

          {/* Mascot + Title row */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
            <img
              src={onboardingCharacter}
              alt="동행 여행을 상징하는 캐릭터"
              width={64}
              height={80}
              style={{
                width: 64,
                height: 80,
                objectFit: "contain",
                flexShrink: 0,
                display: "block",
              }}
            />
            <h1
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#1A1A2E",
                lineHeight: 1.4,
                margin: 0,
                letterSpacing: -0.5,
              }}
            >
              누구와 함께 여행하시나요?
            </h1>
          </div>
          <p style={{ color: "#7A7A8E", fontSize: 13, margin: 0, fontWeight: 400 }}>
            동행자를 선택하면 부산 접근성 코스를 추천합니다
          </p>
        </motion.div>
      </div>

      {/* Busan Area Selection */}
      <div style={{ padding: "20px 24px 0" }}>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, color: "#4A4A6A", letterSpacing: -0.1, marginBottom: 10 }}>
            부산 권역을 선택해주세요
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {BUSAN_AREAS.map((area) => {
              const isSelected = selectedArea === area.id;
              return (
                <motion.button
                  key={area.id}
                  initial={{ opacity: 0, scale: 0.97 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => setSelectedArea(area.id)}
                  style={{
                    padding: "12px 14px",
                    borderRadius: 13,
                    border: isSelected ? `2px solid ${area.color}` : "1.5px solid #E8E9EF",
                    background: isSelected ? `${area.color}0E` : "white",
                    cursor: "pointer",
                    textAlign: "left" as const,
                    transition: "all 0.15s ease",
                    position: "relative" as const,
                  }}
                >
                  {isSelected && (
                    <div
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        width: 16,
                        height: 16,
                        borderRadius: "50%",
                        background: area.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Check size={10} color="white" strokeWidth={3} />
                    </div>
                  )}
                  <div style={{ fontSize: 16, marginBottom: 4 }}>{area.emoji}</div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: isSelected ? area.color : "#1A1A2E", letterSpacing: -0.2, marginBottom: 2 }}>
                    {area.name}
                  </div>
                  <div style={{ fontSize: 10, color: "#A4A6BC", fontWeight: 400, lineHeight: 1.3 }}>
                    {area.sub.split("·")[0]}
                  </div>
                </motion.button>
              );
            })}
          </div>
          {selectedArea && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 5,
                background: "#F6F5FF",
                borderRadius: 8,
                padding: "7px 12px",
              }}
            >
              <Check size={12} color="#5B54D6" />
              <span style={{ fontSize: 12, color: "#5B54D6", fontWeight: 600 }}>
                {BUSAN_AREAS.find(a => a.id === selectedArea)?.name} 권역 선택됨
              </span>
              <span style={{ fontSize: 12, color: "#8B84E0" }}>— 이 권역으로 시작하기</span>
            </motion.div>
          )}
        </motion.div>
      </div>

      {/* Companion selection */}
      <div style={{ padding: "20px 24px 0", flex: 1 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#4A4A6A", letterSpacing: -0.1, marginBottom: 10 }}>
          동행자 유형 선택
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {COMPANION_LIST.map((companion, i) => {
            const isSelected = selected.includes(companion.id);
            return (
              <motion.button
                key={companion.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + i * 0.04 }}
                onClick={() => toggle(companion.id)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 16px",
                  borderRadius: 13,
                  border: isSelected ? "1.5px solid #5B54D6" : "1.5px solid #E8E9EE",
                  background: isSelected ? "#F6F5FF" : "white",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  outline: "none",
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 11,
                    background: isSelected ? "#EEEDFA" : "#F3F4F8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.15s ease",
                    flexShrink: 0,
                  }}
                >
                  {COMPANION_ICONS[companion.id]}
                </div>
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: isSelected ? "#1A1A2E" : "#4A4A6A",
                    flex: 1,
                    textAlign: "left",
                  }}
                >
                  {companion.label}
                </span>
                {isSelected && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: "#5B54D6",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Check size={12} color="white" strokeWidth={2.5} />
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: "20px 24px 40px", display: "flex", flexDirection: "column", gap: 10 }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {/* Public data CTA */}
          <button
            onClick={handlePublicData}
            style={{
              width: "100%",
              padding: "16px",
              borderRadius: 14,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              color: "white",
              fontSize: 15,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s ease",
              boxShadow: "0 4px 20px rgba(91,84,214,0.35)",
              letterSpacing: -0.3,
            }}
          >
            <Database size={16} />
            부산 추천 코스 분석 시작
          </button>

          {/* Divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ flex: 1, height: 1, background: "#E8E9EE" }} />
            <span style={{ fontSize: 11, color: "#B0B2C8", fontWeight: 500 }}>또는</span>
            <div style={{ flex: 1, height: 1, background: "#E8E9EE" }} />
          </div>

          {/* Manual condition setting */}
          <button
            onClick={handleNext}
            style={{
              width: "100%",
              padding: "14px",
              borderRadius: 14,
              border: "1.5px solid #E8E9EF",
              background: "white",
              color: "#4A4A6A",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "background 0.15s ease",
              letterSpacing: -0.2,
            }}
          >
            {selected.length === 0 ? "직접 조건 설정하기" : `${selected.length}명과 조건 직접 설정`}
            <ChevronRight size={16} />
          </button>

          {/* KTO note */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, paddingTop: 4 }}>
            <Database size={11} color="#9EA0B8" />
            <span style={{ fontSize: 11, color: "#9EA0B8", fontWeight: 400 }}>
              한국관광공사 OpenAPI 기반 · 무장애 여행정보 · 부산 관광지 데이터
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}