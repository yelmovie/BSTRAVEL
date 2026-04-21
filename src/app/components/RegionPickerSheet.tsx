import { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Search, MapPin, Check } from "lucide-react";

/* ─────────────────────────────────────────
   Data
───────────────────────────────────────── */

type Area = "전체" | "서울" | "수도권" | "강원" | "충청" | "경상" | "전라" | "제주";

export interface RegionItem {
  id: string;
  name: string;
  area: Area;
  sub?: string;
}

export const REGIONS: RegionItem[] = [
  // 서울
  { id: "seoul-all",       name: "서울 전체",   area: "서울",  sub: "서울시 전 지역" },
  { id: "seoul-gangnam",   name: "강남·서초",   area: "서울",  sub: "코엑스·선릉·양재" },
  { id: "seoul-jongno",    name: "종로·중구",   area: "서울",  sub: "경복궁·인사동·명동" },
  { id: "seoul-mapo",      name: "마포·홍대",   area: "서울",  sub: "홍대·합정·상수" },
  { id: "seoul-songpa",    name: "송파·잠실",   area: "서울",  sub: "롯데월드·올림픽공원" },
  { id: "seoul-seongdong", name: "성동·성수",   area: "서울",  sub: "성수동·뚝섬·왕십리" },
  { id: "seoul-yongsan",   name: "용산·이태원", area: "서울",  sub: "이태원·한남동·용리단길" },
  { id: "seoul-eunpyeong", name: "은평·서대문", area: "서울",  sub: "북한산·신촌·연남동" },
  { id: "seoul-nowon",     name: "노원·도봉",   area: "서울",  sub: "수락산·창동·불암산" },
  { id: "seoul-gangseo",   name: "강서·여의도", area: "서울",  sub: "여의도·목동·김포공항" },

  // 수도권
  { id: "gyeonggi-all",  name: "경기 전체",  area: "수도권", sub: "경기도 전 지역" },
  { id: "incheon",       name: "인천",       area: "수도권", sub: "차이나타운·송도·강화도" },
  { id: "suwon",         name: "수원",       area: "수도권", sub: "화성·행궁동·광교" },
  { id: "gapyeong",      name: "가평",       area: "수도권", sub: "남이섬·아침고요수목원" },
  { id: "paju",          name: "파주",       area: "수도권", sub: "헤이리·임진각·출판도시" },
  { id: "namyangju",     name: "남양주",     area: "수도권", sub: "다산생태공원·운길산" },
  { id: "yongin",        name: "용인",       area: "수도권", sub: "에버랜드·한국민속촌" },
  { id: "seongnam",      name: "성남·분당",  area: "수도권", sub: "판교·탄천·중앙공원" },
  { id: "anyang",        name: "안양·과천",  area: "수도권", sub: "관악산·서울대공원" },

  // 강원
  { id: "gangwon-all",  name: "강원 전체", area: "강원", sub: "강원도 전 지역" },
  { id: "gangneung",    name: "강릉",     area: "강원", sub: "경포대·정동진·오죽헌" },
  { id: "chuncheon",    name: "춘천",     area: "강원", sub: "의암호·소양강·스카이워크" },
  { id: "sokcho",       name: "속초",     area: "강원", sub: "설악산·아바이마을·청초호" },
  { id: "pyeongchang",  name: "평창",     area: "강원", sub: "대관령·알펜시아·이효석문화마을" },
  { id: "wonju",        name: "원주",     area: "강원", sub: "뮤지엄 산·간현관광지·치악산" },
  { id: "taebaek",      name: "태백·정선",area: "강원", sub: "하이원·매봉산·화암동굴" },

  // 충청
  { id: "chungcheong-all", name: "충청 전체", area: "충청", sub: "충청도 전 지역" },
  { id: "daejeon",         name: "대전",     area: "충청", sub: "엑스포·유성온천·계족산" },
  { id: "cheongju",        name: "청주",     area: "충청", sub: "청남대·직지·수암골" },
  { id: "gongju",          name: "공주",     area: "충청", sub: "무령왕릉·공산성·마곡사" },
  { id: "buyeo",           name: "부여",     area: "충청", sub: "백제유적지구·궁남지" },
  { id: "chungju",         name: "충주",     area: "충청", sub: "수안보온천·탄금대·월악산" },
  { id: "asan",            name: "아산·천안",area: "충청", sub: "현충사·온양온천·독립기념관" },

  // 경상
  { id: "gyeongsang-all", name: "경상 전체", area: "경상", sub: "경상도 전 지역" },
  { id: "busan",          name: "부산",      area: "경상", sub: "해운대·감천문화마을·광안리" },
  { id: "daegu",          name: "대구",      area: "경상", sub: "서문시장·팔공산·동성로" },
  { id: "gyeongju",       name: "경주",      area: "경상", sub: "불국사·첨성대·동궁과월지" },
  { id: "ulsan",          name: "울산",      area: "경상", sub: "간절곶·대왕암공원·반구대" },
  { id: "tongyeong",      name: "통영",      area: "경상", sub: "한려해상·케이블카·동피랑" },
  { id: "andong",         name: "안동",      area: "경상", sub: "하회마을·도산서원·월영교" },
  { id: "geoje",          name: "거제",      area: "경상", sub: "외도·해금강·바람의언덕" },

  // 전라
  { id: "jeolla-all", name: "전라 전체", area: "전라", sub: "전라도 전 지역" },
  { id: "jeonju",     name: "전주",     area: "전라", sub: "한옥마을·전주비빔밥·경기전" },
  { id: "yeosu",      name: "여수",     area: "전라", sub: "오동도·이순신광장·향일암" },
  { id: "suncheon",   name: "순천",     area: "전라", sub: "순천만습지·낙안읍성·정원박람회" },
  { id: "gwangju",    name: "광주",     area: "전라", sub: "5.18민주화운동·무등산·양림동" },
  { id: "mokpo",      name: "목포",     area: "전라", sub: "유달산·다도해·근대역사관" },
  { id: "damyang",    name: "담양",     area: "전라", sub: "죽녹원·메타세쿼이아길·소쇄원" },

  // 제주
  { id: "jeju-all",  name: "제주 전체", area: "제주", sub: "제주도 전 지역" },
  { id: "jeju-city", name: "제주시",    area: "제주", sub: "한라산·용두암·제주민속촌" },
  { id: "seogwipo",  name: "서귀포",    area: "제주", sub: "천지연·중문·마라도·성산일출봉" },
];

export function getRegionById(id: string): RegionItem {
  return REGIONS.find((r) => r.id === id) ?? REGIONS[0];
}

const AREAS: Area[] = ["전체", "서울", "수도권", "강원", "충청", "경상", "전라", "제주"];

const AREA_COLORS: Record<Area, string> = {
  전체: "#5B54D6",
  서울: "#E05C6A",
  수도권: "#4A7BBF",
  강원: "#3D8B7A",
  충청: "#B07AAF",
  경상: "#C4793C",
  전라: "#5C9A5F",
  제주: "#2196A0",
};

/* ─────────────────────────────────────────
   Component
───────────────────────────────────────── */

export function RegionPickerSheet({
  open,
  currentRegion,
  onSelect,
  onClose,
}: {
  open: boolean;
  currentRegion: string;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [activeArea, setActiveArea] = useState<Area>("전체");
  const [pending, setPending] = useState(currentRegion);
  const searchRef = useRef<HTMLInputElement>(null);

  // Sync pending when sheet opens
  useEffect(() => {
    if (open) {
      setPending(currentRegion);
      setQuery("");
      setActiveArea("전체");
      setTimeout(() => searchRef.current?.focus(), 300);
    }
  }, [open, currentRegion]);

  const filtered = useMemo(() => {
    let list = REGIONS;
    if (activeArea !== "전체") list = list.filter((r) => r.area === activeArea);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (r) => r.name.toLowerCase().includes(q) || (r.sub ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeArea, query]);

  const handleConfirm = () => {
    onSelect(pending);
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(10,10,30,0.48)",
              zIndex: 200,
            }}
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 320 }}
            style={{
              position: "fixed",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 201,
              maxWidth: 520,
              margin: "0 auto",
              background: "white",
              borderRadius: "22px 22px 0 0",
              display: "flex",
              flexDirection: "column",
              maxHeight: "88dvh",
            }}
          >
            {/* Handle bar */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                paddingTop: 10,
                paddingBottom: 4,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 2,
                  background: "#D8D9E8",
                }}
              />
            </div>

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 20px 14px",
                flexShrink: 0,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    color: "#1A1A2E",
                    letterSpacing: -0.4,
                  }}
                >
                  여행 지역 선택
                </div>
                <div style={{ fontSize: 12, color: "#9EA0B8", marginTop: 2 }}>
                  접근성 코스를 추천할 지역을 선택해주세요
                </div>
              </div>
              <button
                onClick={onClose}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  border: "none",
                  background: "#F0F1F6",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <X size={15} color="#5A5B78" />
              </button>
            </div>

            {/* Search */}
            <div
              style={{
                padding: "0 20px 12px",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  background: "#F4F5FA",
                  borderRadius: 12,
                  padding: "10px 14px",
                  border: "1.5px solid transparent",
                  transition: "border-color 0.15s ease",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#5B54D626")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor = "transparent")
                }
              >
                <Search size={14} color="#9EA0B8" style={{ flexShrink: 0 }} />
                <input
                  ref={searchRef}
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="지역명으로 검색 (예: 강릉, 홍대...)"
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    outline: "none",
                    fontSize: 13,
                    color: "#1A1A2E",
                    fontFamily: "inherit",
                  }}
                />
                {query && (
                  <button
                    onClick={() => setQuery("")}
                    style={{
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                      padding: 0,
                      display: "flex",
                    }}
                  >
                    <X size={13} color="#B0B2C8" />
                  </button>
                )}
              </div>
            </div>

            {/* Area tabs — horizontal scroll */}
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "0 20px 14px",
                overflowX: "auto",
                flexShrink: 0,
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {AREAS.map((area) => {
                const active = activeArea === area && !query;
                const color = AREA_COLORS[area];
                return (
                  <button
                    key={area}
                    onClick={() => {
                      setActiveArea(area);
                      setQuery("");
                    }}
                    style={{
                      padding: "6px 14px",
                      borderRadius: 20,
                      border: active ? "none" : "1.5px solid #E4E5EE",
                      background: active ? color : "white",
                      color: active ? "white" : "#5A5B78",
                      fontSize: 12,
                      fontWeight: active ? 700 : 500,
                      cursor: "pointer",
                      flexShrink: 0,
                      letterSpacing: -0.2,
                      transition: "all 0.15s ease",
                    }}
                  >
                    {area}
                  </button>
                );
              })}
            </div>

            {/* Region list — scrollable */}
            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "0 16px",
                scrollbarWidth: "none",
              }}
            >
              {filtered.length === 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "40px 0",
                    gap: 8,
                  }}
                >
                  <MapPin size={28} color="#D0D1DC" />
                  <span style={{ fontSize: 13, color: "#B0B2C8", fontWeight: 500 }}>
                    검색 결과가 없습니다
                  </span>
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    paddingBottom: 16,
                  }}
                >
                  {filtered.map((region) => {
                    const isSelected = pending === region.id;
                    const areaColor = AREA_COLORS[region.area];
                    return (
                      <motion.button
                        key={region.id}
                        onClick={() => setPending(region.id)}
                        whileTap={{ scale: 0.97 }}
                        style={{
                          padding: "13px 14px",
                          borderRadius: 13,
                          border: isSelected
                            ? `2px solid ${areaColor}`
                            : "1.5px solid #E8E9EF",
                          background: isSelected ? `${areaColor}0E` : "white",
                          cursor: "pointer",
                          textAlign: "left" as const,
                          transition: "all 0.15s ease",
                          position: "relative" as const,
                        }}
                      >
                        {/* Area dot */}
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 5,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: areaColor,
                              background: `${areaColor}18`,
                              borderRadius: 5,
                              padding: "1px 6px",
                              letterSpacing: 0.2,
                            }}
                          >
                            {region.area}
                          </span>
                          {isSelected && (
                            <div
                              style={{
                                width: 16,
                                height: 16,
                                borderRadius: "50%",
                                background: areaColor,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <Check size={10} color="white" />
                            </div>
                          )}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 700,
                            color: isSelected ? areaColor : "#1A1A2E",
                            letterSpacing: -0.3,
                            marginBottom: 2,
                          }}
                        >
                          {region.name}
                        </div>
                        {region.sub && (
                          <div
                            style={{
                              fontSize: 10,
                              color: "#A4A6BC",
                              fontWeight: 400,
                              lineHeight: 1.4,
                              letterSpacing: -0.1,
                            }}
                          >
                            {region.sub}
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confirm CTA */}
            <div
              style={{
                padding: "14px 20px 40px",
                borderTop: "1px solid #F0F1F7",
                flexShrink: 0,
              }}
            >
              {pending && (
                <div
                  style={{
                    fontSize: 12,
                    color: "#8E90A8",
                    marginBottom: 10,
                    textAlign: "center" as const,
                  }}
                >
                  선택된 지역:{" "}
                  <strong style={{ color: "#1A1A2E" }}>
                    {getRegionById(pending).name}
                  </strong>
                </div>
              )}
              <button
                onClick={handleConfirm}
                disabled={!pending}
                style={{
                  width: "100%",
                  padding: "16px",
                  borderRadius: 13,
                  border: "none",
                  background: pending
                    ? "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)"
                    : "#C4C5D8",
                  color: "white",
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: pending ? "pointer" : "not-allowed",
                  letterSpacing: -0.3,
                  boxShadow: pending
                    ? "0 4px 16px rgba(91,84,214,0.3)"
                    : "none",
                  transition: "all 0.2s ease",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}
              >
                <MapPin size={15} />
                이 지역으로 설정
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
