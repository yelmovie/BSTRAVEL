import { useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  CheckCircle, Circle, ArrowLeft, Flag,
  MapPin, Clock, Sun, Cloud, CloudRain, Phone, AlertTriangle,
  Train, Wallet, Shield, Users, ChevronRight,
  Heart, Check, Loader2, AlertCircle,
} from "lucide-react";
import { PLACES } from "../../data/places";
import { useOpenMeteoBusan } from "../../hooks/useOpenMeteoBusan";
import { OPEN_METEO_ATTRIBUTION } from "../../lib/weather/openMeteoClient";

const CHECKLIST_ITEMS: Record<string, { label: string; sub: string; critical: boolean }[]> = {
  botanical: [
    { label: "날씨 재확인",           sub: "오후 소나기 대비 우산 준비",    critical: true },
    { label: "9호선 마곡나루역 확인",  sub: "도보 5분 거리, 엘리베이터 있음", critical: false },
    { label: "식물원 운영 시간 확인",  sub: "화~일 09:30–18:00",           critical: false },
    { label: "유모차·휠체어 대여 예약", sub: "현장 대여 또는 사전 예약",    critical: false },
    { label: "비상 연락처 저장",       sub: "강서구 응급실·약국 위치",      critical: true },
  ],
  museum: [
    { label: "특별전 사전 예매 확인",   sub: "주말 혼잡 — 온라인 예매 강력 권장", critical: true },
    { label: "4호선 이촌역 확인",      sub: "도보 3분, 장애인 엘리베이터 있음",  critical: false },
    { label: "박물관 운영 시간 확인",   sub: "화~일 10:00–18:00 (수·토 21:00)", critical: false },
    { label: "오디오가이드 수령 계획",  sub: "안내데스크 현장 수령",            critical: false },
    { label: "비상 연락처 저장",        sub: "용산구 응급실·약국 위치",         critical: true },
  ],
  palace: [
    { label: "사전 예매 완료 확인",    sub: "주말 대기 35분 예상 — 필수",      critical: true },
    { label: "전동 휠체어 대여 예약",  sub: "현장 무료 대여, 수량 제한 있음",  critical: true },
    { label: "3호선 경복궁역 확인",    sub: "도보 5분, 엘리베이터 있음",       critical: false },
    { label: "자갈길 우회 경로 숙지",  sub: "휠체어·유모차 시 우회 필요",      critical: false },
    { label: "비상 연락처 저장",        sub: "종로구 응급실·약국 위치",         critical: true },
  ],
};

const EMERGENCY_NEARBY: Record<string, { type: string; name: string; dist: string; phone: string }[]> = {
  botanical: [
    { type: "응급실", name: "이화여대 목동병원", dist: "1.2km", phone: "02-2650-5114" },
    { type: "약국",   name: "마곡 24시 약국",   dist: "300m",  phone: "02-2665-XXXX" },
    { type: "경찰서", name: "강서경찰서",        dist: "2.1km", phone: "02-3660-0112" },
  ],
  museum: [
    { type: "응급실", name: "순천향대병원",      dist: "0.8km", phone: "02-709-9000" },
    { type: "약국",   name: "이촌 약국가",       dist: "150m",  phone: "02-795-XXXX" },
    { type: "경찰서", name: "용산경찰서",        dist: "1.5km", phone: "02-3702-0112" },
  ],
  palace: [
    { type: "응급실", name: "서울대학교병원",    dist: "1.4km", phone: "02-2072-2114" },
    { type: "약국",   name: "경복궁 인근 약국",  dist: "200m",  phone: "02-737-XXXX" },
    { type: "경찰서", name: "종로경찰서",        dist: "0.9km", phone: "02-2193-0112" },
  ],
};

const TRANSPORT_CARD: Record<string, { line: string; station: string; direction: string; mins: string }[]> = {
  botanical: [
    { line: "9호선",    station: "마곡나루역",  direction: "개화방향 탑승", mins: "소요 약 5분" },
  ],
  museum: [
    { line: "4호선",    station: "이촌역",     direction: "당고개방향 탑승", mins: "소요 약 3분" },
  ],
  palace: [
    { line: "3호선",    station: "경복궁역",   direction: "대화방향 탑승", mins: "소요 약 5분" },
  ],
};

const SCORE_COLOR: Record<string, string> = {
  botanical: "#5B54D6", museum: "#3D8B7A", palace: "#C4793C",
};

export function DeparturePage() {
  const { id = "botanical" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place      = PLACES.find(p => p.id === id) ?? PLACES[0];
  const checklist  = CHECKLIST_ITEMS[id]  ?? [];
  const emergency  = EMERGENCY_NEARBY[id] ?? [];
  const transport  = TRANSPORT_CARD[id]   ?? [];
  const scoreColor = SCORE_COLOR[id] ?? "#5B54D6";
  const score      = Math.round(place.score * 10);

  const [checked, setChecked] = useState<Set<number>>(new Set());
  const wxState = useOpenMeteoBusan();
  const wxOk = wxState.status === "ok" ? wxState.data : null;
  const DepWxIcon = wxOk
    ? (wxOk.weatherCode <= 1 ? Sun : wxOk.weatherCode <= 3 ? Cloud : CloudRain)
    : Sun;
  const depWxIconColor = wxOk
    ? (wxOk.weatherCode <= 1 ? "#D97706" : wxOk.weatherCode <= 3 ? "#94A3B8" : "#60A5FA")
    : "#D97706";
  const allCritical = checklist.filter(c => c.critical).every((_, i) =>
    checked.has(checklist.indexOf(checklist.filter(c => c.critical)[i]))
  );

  function toggleCheck(i: number) {
    setChecked(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  }

  const doneCount = checked.size;
  const pct = Math.round((doneCount / checklist.length) * 100);

  return (
    <div style={{ minHeight: "calc(100dvh - 62px)", overflowY: "auto" }}>
      {/* Sub-header */}
      <div style={{
        background: "white", borderBottom: "1.5px solid #E4E6EF",
        padding: "14px 52px",
        display: "flex", alignItems: "center", gap: 12,
      }}>
        <button
          onClick={() => navigate(`/desktop/timeline/${id}`)}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            border: "none", background: "#F6F7FB", borderRadius: 8,
            padding: "7px 12px", cursor: "pointer",
            color: "#6B6B88", fontSize: 12, fontWeight: 600,
          }}
        >
          <ArrowLeft size={12} />타임라인
        </button>
        <div>
          <span style={{ fontSize: 11, color: "#8E90A8" }}>Step 5 · 출발 준비 · </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>{place.name}</span>
        </div>
      </div>

      <div style={{ padding: "32px 52px 56px", display: "grid", gridTemplateColumns: "1fr 360px", gap: 28 }}>
        {/* ══ LEFT ══════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          {/* Course summary card */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: `linear-gradient(135deg, ${scoreColor} 0%, ${scoreColor}CC 100%)`,
              borderRadius: 20, padding: "28px 32px",
              display: "flex", alignItems: "center", gap: 28,
            }}
          >
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
                오늘의 여행 코스
              </div>
              <h2 style={{
                fontSize: 24, fontWeight: 900, color: "white",
                margin: "0 0 14px", letterSpacing: -0.6,
              }}>
                {place.name}
              </h2>
              <div style={{ display: "flex", gap: 20 }}>
                {[
                  { Icon: Clock,      v: place.duration },
                  { Icon: MapPin,     v: place.subtitle },
                  { Icon: Users,      v: `시설 ${place.facilities.length}종` },
                ].map(({ Icon, v }, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon size={13} color="rgba(255,255,255,0.8)" />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.9)", fontWeight: 500 }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 44, fontWeight: 900, color: "white", letterSpacing: -2, lineHeight: 1 }}>
                {score}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", marginTop: 3 }}>같이가능 점수</div>
            </div>
          </motion.div>

          {/* Departure checklist */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "white", borderRadius: 18, border: "1.5px solid #E4E6EF",
              padding: "24px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1B2E" }}>출발 전 체크리스트</div>
              <div style={{ fontSize: 12, color: "#8E90A8" }}>
                {doneCount}/{checklist.length} 완료
                <span style={{
                  marginLeft: 8, fontSize: 11, fontWeight: 700,
                  color: pct >= 60 ? "#3D8B7A" : "#D97706",
                }}>
                  ({pct}%)
                </span>
              </div>
            </div>
            {/* Progress */}
            <div style={{ height: 4, background: "#EEF0F7", borderRadius: 2, overflow: "hidden", marginBottom: 16 }}>
              <motion.div
                animate={{ width: `${pct}%` }}
                style={{ height: "100%", background: "#5B54D6", borderRadius: 2 }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checklist.map((item, i) => {
                const done = checked.has(i);
                return (
                  <div
                    key={i}
                    onClick={() => toggleCheck(i)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 14px", borderRadius: 11, cursor: "pointer",
                      background: done ? "#F6F7FB" : "white",
                      border: `1.5px solid ${done ? "#E4E6EF" : item.critical ? "#FDDCAD" : "#F0F1F6"}`,
                      transition: "all 0.15s",
                    }}
                  >
                    {done
                      ? <CheckCircle size={18} color="#3D8B7A" />
                      : <Circle size={18} color={item.critical ? "#D97706" : "#C0C2D4"} />
                    }
                    <div style={{ flex: 1 }}>
                      <div style={{
                        fontSize: 13, fontWeight: 600,
                        color: done ? "#A0A2B8" : "#1A1B2E",
                        textDecoration: done ? "line-through" : "none",
                      }}>
                        {item.label}
                        {item.critical && !done && (
                          <span style={{
                            marginLeft: 6, fontSize: 9, fontWeight: 700,
                            color: "#D97706", background: "#FEF9C3",
                            borderRadius: 4, padding: "1px 5px",
                          }}>필수</span>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "#A0A2B8", marginTop: 1 }}>{item.sub}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>

          {/* Transport summary */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
              padding: "20px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <Train size={14} color="#5B54D6" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>출발 교통편</span>
            </div>
            {transport.map((t, i) => (
              <div key={i} style={{
                padding: "12px 14px", borderRadius: 11,
                background: "#EEEDFA",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{
                  background: "#5B54D6", borderRadius: 6,
                  padding: "4px 9px", fontSize: 11, fontWeight: 700, color: "white",
                }}>
                  {t.line}
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>{t.station}</div>
                  <div style={{ fontSize: 11, color: "#8E90A8" }}>{t.direction} · {t.mins}</div>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* ══ RIGHT ══════════════════════════════════════════ */}
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {/* Weather: Open-Meteo (same source as mobile crowd/날씨) */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
              padding: "18px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{
                fontSize: 10, fontWeight: 700, color: "#A0A2B8",
                letterSpacing: 1.5, textTransform: "uppercase",
              }}>
                오늘 날씨
              </div>
              {wxState.status === "loading" && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#4A4A6A", background: "#F4F5FA", borderRadius: 6, padding: "2px 7px" }}>로딩</span>
              )}
              {wxState.status === "ok" && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#0D5A2A", background: "#E6F4EC", border: "1px solid #B6E0C8", borderRadius: 6, padding: "2px 7px" }}>실시간 API</span>
              )}
              {wxState.status === "error" && (
                <span style={{ fontSize: 9, fontWeight: 800, color: "#9B1C1C", background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "2px 7px" }}>API 실패</span>
              )}
            </div>

            {wxState.status === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6B6B88", fontSize: 13 }}>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-flex" }}>
                  <Loader2 size={18} />
                </motion.span>
                Open-Meteo 연결 중…
              </div>
            )}
            {wxState.status === "error" && (
              <div style={{ fontSize: 12, color: "#B42318", lineHeight: 1.45 }}>
                <AlertCircle size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 6 }} />
                {wxState.message}
              </div>
            )}
            {wxOk && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <DepWxIcon size={32} color={depWxIconColor} />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1A1B2E" }}>
                      {Math.round(wxOk.temperatureC)}°C
                    </div>
                    <div style={{ fontSize: 12, color: "#8E90A8" }}>
                      {wxOk.summaryKo} · 습도 {Math.round(wxOk.relativeHumidityPct)}%
                      {wxOk.uvIndex != null ? ` · UV ${wxOk.uvIndex}` : ""}
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 10, lineHeight: 1.45 }}>
                  <strong style={{ color: "#6B6B88" }}>출처:</strong> {OPEN_METEO_ATTRIBUTION}
                  <br />
                  수신: {new Date(wxOk.fetchedAtIso).toLocaleString("ko-KR")}
                </div>
              </>
            )}
          </motion.div>

          {/* Emergency nearby */}
          <motion.div
            initial={{ opacity: 0, x: 14 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              background: "white", borderRadius: 16, border: "1.5px solid #E4E6EF",
              padding: "18px",
            }}
          >
            <div style={{
              display: "flex", alignItems: "center", gap: 7, marginBottom: 12,
            }}>
              <Shield size={13} color="#E55555" />
              <span style={{
                fontSize: 10, fontWeight: 700, color: "#A0A2B8",
                letterSpacing: 1.5, textTransform: "uppercase",
              }}>
                인근 비상 시설
              </span>
            </div>
            {emergency.map((e, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center",
                padding: "9px 0",
                borderBottom: i < emergency.length - 1 ? "1px solid #F4F5FA" : "none",
                gap: 10,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: "#FEF2F2",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <AlertTriangle size={12} color="#E55555" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1A1B2E" }}>
                    {e.name}
                    <span style={{
                      marginLeft: 5, fontSize: 9, color: "#E55555",
                      background: "#FEE2E2", borderRadius: 4, padding: "1px 5px",
                    }}>
                      {e.type}
                    </span>
                  </div>
                  <div style={{ fontSize: 10, color: "#A0A2B8" }}>{e.dist} · {e.phone}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Final CTA */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            onClick={() => navigate(`/desktop/live/${id}`)}
            style={{
              width: "100%", padding: "18px",
              borderRadius: 16, border: "none",
              background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
              color: "white", fontSize: 16, fontWeight: 800, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
              boxShadow: "0 8px 28px rgba(91,84,214,0.4)",
              letterSpacing: -0.3,
            }}
          >
            <Flag size={18} />
            지금 출발하기
          </motion.button>
          <p style={{
            textAlign: "center", fontSize: 11, color: "#B0B2C4", margin: 0,
          }}>
            실시간 변경이 발생하면 자동 알림을 드립니다
          </p>
        </div>
      </div>
    </div>
  );
}