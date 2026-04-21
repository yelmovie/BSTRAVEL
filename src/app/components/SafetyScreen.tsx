import { useParams } from "react-router";
import { motion } from "motion/react";
import {
  Hospital, Phone, ShieldCheck, MapPin, AlertCircle,
  HeartPulse, Siren, Eye, Zap,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";

/* ── Mock safety data ── */
const SAFETY_DATA: Record<string, {
  safetyScore: number;
  hospitals: { name: string; distance: string; tel: string; open24h: boolean }[];
  safeZones: { name: string; distance: string; type: string }[];
  aed: { name: string; location: string; distance: string }[];
  cctvDensity: "높음" | "보통" | "낮음";
  policeNearby: string;
}> = {
  botanical: {
    safetyScore: 88,
    hospitals: [
      { name: "이화여대목동병원", distance: "1.4km", tel: "02-2650-5114", open24h: true },
      { name: "강서힘병원",      distance: "2.1km", tel: "02-3662-0000", open24h: false },
      { name: "마곡서울병원",    distance: "2.8km", tel: "02-6954-0000", open24h: true },
    ],
    safeZones: [
      { name: "서울 식물원 안내데스크",  distance: "내부",    type: "안내" },
      { name: "마곡나루역 고객센터",    distance: "650m",    type: "교통" },
      { name: "마곡지구 119 안전센터", distance: "900m",    type: "소방" },
    ],
    aed: [
      { name: "식물원 1층 입구",     location: "온실 입구 우측", distance: "내부" },
      { name: "마곡나루역 2번출구",  location: "개찰구 앞",    distance: "650m" },
    ],
    cctvDensity: "높음",
    policeNearby: "강서경찰서 마곡지구대 (1.2km)",
  },
  museum: {
    safetyScore: 92,
    hospitals: [
      { name: "국립중앙의료원",  distance: "3.2km", tel: "02-2260-7114", open24h: true },
      { name: "용산구 보건소",   distance: "1.5km", tel: "02-2199-8000", open24h: false },
      { name: "서울성심병원",    distance: "2.8km", tel: "02-2204-8114", open24h: true },
    ],
    safeZones: [
      { name: "국립중앙박물관 안내",  distance: "내부",  type: "안내" },
      { name: "이촌역 역무실",        distance: "350m",  type: "교통" },
      { name: "용산 119 안전센터",    distance: "1.1km", type: "소방" },
    ],
    aed: [
      { name: "박물관 1층 로비",       location: "안내데스크 옆",  distance: "내부" },
      { name: "이촌역 대합실",         location: "스크린도어 앞", distance: "350m" },
    ],
    cctvDensity: "높음",
    policeNearby: "용산경찰서 이촌지구대 (800m)",
  },
  palace: {
    safetyScore: 85,
    hospitals: [
      { name: "서울대병원",         distance: "2.5km", tel: "02-2072-2114", open24h: true },
      { name: "종로구 보건소",       distance: "1.8km", tel: "02-2148-3500", open24h: false },
      { name: "강북삼성병원",        distance: "3.0km", tel: "02-2001-2001", open24h: true },
    ],
    safeZones: [
      { name: "경복궁 관리소",        distance: "내부",  type: "안내" },
      { name: "경복궁역 역무실",       distance: "500m",  type: "교통" },
      { name: "청운119안전센터",       distance: "1.4km", type: "소방" },
    ],
    aed: [
      { name: "경복궁 매표소 근처",   location: "흥례문 앞",       distance: "내부" },
      { name: "경복궁역 3번출구",     location: "출구 바로 앞",    distance: "500m" },
    ],
    cctvDensity: "높음",
    policeNearby: "종로경찰서 청운효자지구대 (900m)",
  },
};

const EMERGENCY_CONTACTS = [
  { label: "응급(소방/구급)", number: "119", color: "#E55555", icon: Siren },
  { label: "경찰",            number: "112", color: "#4A7BBF", icon: ShieldCheck },
  { label: "비응급 의료상담", number: "129", color: "#3D8B7A", icon: HeartPulse },
  { label: "관광불편신고",    number: "1330", color: "#B07AAF", icon: Phone },
];

function ScoreBadge({ score }: { score: number }) {
  const color = score >= 90 ? "#3D8B7A" : score >= 80 ? "#F59E3A" : "#E55555";
  const label = score >= 90 ? "안전 우수" : score >= 80 ? "안전 양호" : "주의 필요";
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center",
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: "50%",
        background: `${color}14`,
        border: `3px solid ${color}`,
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}>
        <span style={{ fontSize: 22, fontWeight: 900, color, lineHeight: 1 }}>{score}</span>
        <span style={{ fontSize: 9, color, fontWeight: 600 }}>/ 100</span>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, color, marginTop: 6 }}>{label}</div>
    </div>
  );
}

export function SafetyScreen() {
  const { id } = useParams<{ id: string }>();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const data = SAFETY_DATA[place.id] ?? SAFETY_DATA.botanical;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="안전 · 비상 정보" />

      <div style={{ padding: "18px 20px 0", flex: 1, overflowY: "auto" }}>

        {/* ── Safety score header ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white", borderRadius: 18, border: "1px solid #E8E9EF",
            padding: "18px 16px", marginBottom: 14,
            display: "flex", alignItems: "center", gap: 16,
          }}
        >
          <ScoreBadge score={data.safetyScore} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.3, marginBottom: 8 }}>
              종합 안전 점수
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Eye size={12} color="#5B54D6" />
                <span style={{ fontSize: 11, color: "#4A4A6A" }}>CCTV 밀도: <strong>{data.cctvDensity}</strong></span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <ShieldCheck size={12} color="#5B54D6" />
                <span style={{ fontSize: 11, color: "#4A4A6A" }}>{data.policeNearby}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <Zap size={12} color="#5B54D6" />
                <span style={{ fontSize: 11, color: "#4A4A6A" }}>AED {data.aed.length}개소 위치 확인됨</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Emergency contacts ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.07 }}
          style={{ marginBottom: 14 }}
        >
          <div style={{ fontSize: 13, fontWeight: 700, color: "#4A4A6A", marginBottom: 8, letterSpacing: -0.1 }}>
            긴급 연락처
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {EMERGENCY_CONTACTS.map((c) => {
              const Icon = c.icon;
              return (
                <a
                  key={c.label}
                  href={`tel:${c.number}`}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    background: "white", borderRadius: 13,
                    border: `1.5px solid ${c.color}30`,
                    padding: "12px 12px",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${c.color}14`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <Icon size={16} color={c.color} />
                  </div>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: c.color, letterSpacing: -0.5, lineHeight: 1 }}>
                      {c.number}
                    </div>
                    <div style={{ fontSize: 9, color: "#9EA0B8", marginTop: 2 }}>{c.label}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </motion.div>

        {/* ── Nearby hospitals ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.13 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <Hospital size={14} color="#E55555" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
              인근 병원 · 의료시설
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {data.hospitals.map((hospital, i) => (
              <div key={hospital.name} style={{
                padding: "11px 0",
                borderBottom: i < data.hospitals.length - 1 ? "1px solid #F4F5FA" : "none",
                display: "flex", alignItems: "center", gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: "#FEF2F2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <Hospital size={16} color="#E55555" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>
                      {hospital.name}
                    </span>
                    {hospital.open24h && (
                      <span style={{
                        fontSize: 9, fontWeight: 700, color: "#3D8B7A",
                        background: "#EDF7F2", borderRadius: 5, padding: "1px 5px",
                      }}>
                        24H
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <MapPin size={10} color="#9EA0B8" />
                      <span style={{ fontSize: 10, color: "#9EA0B8" }}>{hospital.distance}</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                      <Phone size={10} color="#9EA0B8" />
                      <span style={{ fontSize: 10, color: "#9EA0B8" }}>{hospital.tel}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, color: "#B0B2C8", marginTop: 8, textAlign: "center" as const }}>
            출처: 공공 응급의료정보시스템(E-GEN) API
          </div>
        </motion.div>

        {/* ── Safe zones ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.19 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <ShieldCheck size={14} color="#4A7BBF" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
              안전 거점 · 쉬어가는 곳
            </span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {data.safeZones.map((zone) => {
              const typeColors: Record<string, string> = {
                안내: "#5B54D6", 교통: "#4A7BBF", 소방: "#E55555",
              };
              const color = typeColors[zone.type] ?? "#5B54D6";
              return (
                <div key={zone.name} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 12px",
                  background: "#F8F9FC", borderRadius: 10,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%",
                    background: color, flexShrink: 0,
                  }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>
                      {zone.name}
                    </span>
                  </div>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color,
                    background: `${color}14`, borderRadius: 5, padding: "2px 7px",
                  }}>
                    {zone.type}
                  </span>
                  <span style={{ fontSize: 10, color: "#9EA0B8", minWidth: 30, textAlign: "right" as const }}>
                    {zone.distance}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ── AED locations ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 28,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 12 }}>
            <HeartPulse size={14} color="#E55555" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
              AED(자동심장충격기) 위치
            </span>
          </div>
          {data.aed.map((item, i) => (
            <div key={item.name} style={{
              padding: "10px 0",
              borderBottom: i < data.aed.length - 1 ? "1px solid #F4F5FA" : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 2 }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#1A1A2E", letterSpacing: -0.2 }}>
                  {item.name}
                </span>
                <span style={{ fontSize: 10, color: "#9EA0B8" }}>{item.distance}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <MapPin size={10} color="#9EA0B8" />
                <span style={{ fontSize: 10, color: "#9EA0B8" }}>{item.location}</span>
              </div>
            </div>
          ))}
          <div style={{ fontSize: 10, color: "#B0B2C8", marginTop: 10, textAlign: "center" as const }}>
            출처: 공공 AED위치정보 OpenAPI · 소방청
          </div>
        </motion.div>

        {/* ── Warning note ── */}
        <div style={{
          background: "#FFF8ED", borderRadius: 12, border: "1px solid #FDDCAD",
          padding: "12px 14px", marginBottom: 28,
          display: "flex", gap: 8, alignItems: "flex-start",
        }}>
          <AlertCircle size={13} color="#D97706" style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 11, color: "#78350F", lineHeight: 1.55 }}>
            표시된 정보는 공공데이터 기반 참고 정보입니다. 실제 비상 상황 시 반드시 <strong>119</strong>에 연락하세요.
            의료기관 운영 시간은 변동될 수 있습니다.
          </div>
        </div>
      </div>
    </div>
  );
}
