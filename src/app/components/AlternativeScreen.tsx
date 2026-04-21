import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import { ChevronRight, Star, Info, ArrowRight, MapPin, Map, Navigation } from "lucide-react";
import { ALTERNATIVES, PLACES } from "../data/places";
import { TopNav } from "./TopNav";
import { StepIndicator } from "./StepIndicator";

function openKakaoMap(query: string) {
  window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + query)}`, "_blank");
}

export function AlternativeScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const currentPlace = PLACES.find((p) => p.id === id) ?? PLACES[0];

  return (
    <div style={{ minHeight: "100dvh", background: "#F8F9FC", display: "flex", flexDirection: "column" }}>
      <TopNav title="대안 코스" />
      <StepIndicator current={4} />

      <div style={{ padding: "24px 24px 20px" }}>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: "#EEEDFA", borderRadius: 7, padding: "4px 10px", marginBottom: 8 }}>
            <MapPin size={11} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6" }}>부산 대안 코스</span>
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#1A1A2E", margin: 0, marginBottom: 6, letterSpacing: -0.4 }}>
            더 편한 대안 코스
          </h1>
          <p style={{ fontSize: 13, color: "#7A7A8E", margin: 0, fontWeight: 400 }}>
            현재 코스가 어렵다면, 부산에서 접근성이 더 높은 코스를 확인해 보세요
          </p>
        </motion.div>
      </div>

      {/* Current course reference */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        style={{ padding: "0 24px 16px" }}
      >
        <div
          style={{
            background: "white",
            borderRadius: 12,
            padding: "12px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            border: "1px solid #E8E9EE",
          }}
        >
          <div style={{ width: 42, height: 42, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}>
            <img src={currentPlace.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, color: "#A0A0B0", fontWeight: 500, marginBottom: 2 }}>현재 선택 코스 · 부산 {currentPlace.busanArea}</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {currentPlace.name}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
            <Star size={12} color="#5B54D6" fill="#5B54D6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#5B54D6" }}>{currentPlace.score.toFixed(1)}</span>
          </div>
        </div>
      </motion.div>

      {/* Divider */}
      <div style={{ padding: "0 24px 14px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: "#E8E9EE" }} />
          <ArrowRight size={14} color="#A0A0B0" />
          <span style={{ fontSize: 12, color: "#A0A0B0", fontWeight: 500 }}>대안 코스 비교</span>
          <div style={{ flex: 1, height: 1, background: "#E8E9EE" }} />
        </div>
      </div>

      {/* Alternative cards */}
      <div style={{ padding: "0 24px 32px", display: "flex", flexDirection: "column", gap: 12 }}>
        {ALTERNATIVES.map((alt, i) => (
          <motion.div
            key={alt.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 + i * 0.08 }}
          >
            <div
              style={{
                background: "white",
                borderRadius: 14,
                overflow: "hidden",
                border: "1px solid #E8E9EE",
              }}
            >
              <button
                onClick={() => navigate(`/mobile/recommendations`)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex" }}>
                  <div style={{ width: 100, height: 100, flexShrink: 0, position: "relative" }}>
                    <img src={alt.image} alt={alt.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    <div
                      style={{
                        position: "absolute", top: 8, left: 8,
                        width: 22, height: 22, borderRadius: 6,
                        background: "rgba(255,255,255,0.92)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#1A1A2E" }}>{i + 1}</span>
                    </div>
                  </div>

                  <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
                        <MapPin size={9} color="#5B54D6" />
                        <span style={{ fontSize: 10, color: "#5B54D6", fontWeight: 600 }}>부산 · {alt.busanArea || alt.subtitle.split("·")[0].trim()}</span>
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#1A1A2E", marginBottom: 6 }}>{alt.name}</div>
                      <div
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          background: "#F0FAF6",
                          borderRadius: 6,
                          padding: "3px 8px",
                        }}
                      >
                        <Info size={10} color="#2D8A6B" />
                        <span style={{ fontSize: 11, fontWeight: 500, color: "#2D8A6B" }}>{alt.reason}</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                      <div style={{ display: "flex", gap: 4 }}>
                        {alt.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 10, fontWeight: 500, color: "#5B54D6",
                              background: "#EEEDFA", borderRadius: 4, padding: "2px 6px",
                            }}
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                        <Star size={11} color="#5B54D6" fill="#5B54D6" />
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#5B54D6" }}>{alt.score.toFixed(1)}</span>
                        <ChevronRight size={14} color="#A0A0B0" />
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {/* Kakao Map button */}
              <div style={{ borderTop: "1px solid #F0F1F6", display: "flex" }}>
                <button
                  onClick={() => openKakaoMap(alt.name)}
                  style={{
                    flex: 1, padding: "9px 0", border: "none", borderRight: "1px solid #F0F1F6",
                    background: "#FFFBF0", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <Map size={12} color="#F9A825" />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#B8820A" }}>지도에서 확인</span>
                </button>
                <button
                  onClick={() => navigate("/mobile/recommendations")}
                  style={{
                    flex: 1, padding: "9px 0", border: "none",
                    background: "white", cursor: "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#5B54D6" }}>다른 코스 보기</span>
                  <ChevronRight size={12} color="#5B54D6" />
                </button>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            background: "#F0F1F5",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            gap: 10,
          }}
        >
          <Info size={16} color="#7A7A8E" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#4A4A6A", marginBottom: 4 }}>코스가 너무 길다면?</div>
            <div style={{ fontSize: 12, color: "#7A7A8E", lineHeight: 1.5, fontWeight: 400 }}>
              부산 권역 내에서 장소를 1–2곳으로 줄이거나, 각 장소의 관람 시간을 단축해도 좋습니다. 무리하지 않는 것이 가장 중요합니다.
            </div>
          </div>
        </motion.div>

        <button
          onClick={() => navigate("/mobile/recommendations")}
          style={{
            width: "100%",
            padding: "16px",
            borderRadius: 14,
            border: "none",
            background: "#5B54D6",
            color: "white",
            fontSize: 15,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
          }}
        >
          부산 추천 코스 전체 보기
          <ChevronRight size={17} />
        </button>
      </div>
    </div>
  );
}