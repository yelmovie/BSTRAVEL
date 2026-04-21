import { useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  Clock, Sun, Cloud, CloudRain, Wind, AlertCircle, Loader2,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";
import { useOpenMeteoBusan } from "../hooks/useOpenMeteoBusan";
import { OPEN_METEO_ATTRIBUTION } from "../lib/weather/openMeteoClient";
import { predictCrowdLevel } from "../lib/crowd/predictCrowdLevel";
import { crowdInputFromPlace } from "../lib/crowd/crowdInputMapper";
import { CrowdPredictionCard } from "./crowd/CrowdPredictionCard";

function iconForWeatherCode(code: number) {
  if (code <= 1) return Sun;
  if (code <= 3) return Cloud;
  return CloudRain;
}

/** 혼잡도는 공공 분류·규칙 추정(실측 유동인구 아님). 화면 상단 날씨 코드는 추정 규칙 입력으로만 쓰이며 혼잡 근거 출처가 아님 */
export function CrowdScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const wxState = useOpenMeteoBusan();
  const wxData = wxState.status === "ok" ? wxState.data : null;

  const crowdPrediction = useMemo(
    () =>
      predictCrowdLevel(
        crowdInputFromPlace(place, {
          weatherCode: wxData?.weatherCode ?? null,
        }),
      ),
    [place, wxData?.weatherCode],
  );
  const WxIcon = wxData ? iconForWeatherCode(wxData.weatherCode) : Cloud;
  const wxIconColor =
    wxData
      ? wxData.weatherCode <= 1
        ? "#F59E3A"
        : wxData.weatherCode <= 3
          ? "#94A3B8"
          : "#60A5FA"
      : "#94A3B8";

  const now = new Date();
  const clockStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const dayStr = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
  const wxVisitGood = wxData ? wxData.weatherCode <= 1 : false;
  const wxVisitOk = wxData ? wxData.weatherCode <= 3 : false;

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="혼잡도 예측 · 방문 참고" />

      <div style={{ padding: "18px 20px 28px", flex: 1, overflowY: "auto" }}>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white",
            borderRadius: 16,
            border: "1px solid #E8E9EF",
            boxShadow: "0 4px 16px rgba(26,26,46,0.06)",
            padding: "18px 16px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 12, color: "#8E90A8", marginBottom: 4 }}>{place.subtitle}</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: "#1A1A2E", marginBottom: 14, letterSpacing: -0.4 }}>
            {place.name}
          </div>

          <CrowdPredictionCard result={crowdPrediction} />

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 14 }}>
            <div style={{
              flex: 1, minWidth: 140,
              padding: "12px 14px", borderRadius: 12,
              background: "#F6F5FF", border: "1px solid #E0DEFA",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <Clock size={12} color="#5B54D6" />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#6B6B88" }}>현재 시각</span>
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: "#5B54D6" }}>{clockStr}</div>
              <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 2 }}>기기 로컬 시각</div>
            </div>
          </div>
        </motion.div>

        {/* 날씨 카드: 예보 출처만 표시 (혼잡도 카드와 근거 분리) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "14px 16px",
            boxShadow: "0 2px 10px rgba(26,26,46,0.04)",
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12, flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E" }}>
              오늘의 날씨 · 방문 적합도
            </div>
            {wxState.status === "loading" && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: "#4A4A6A",
                background: "#F4F5FA", borderRadius: 6, padding: "2px 7px",
              }}>
                불러오는 중
              </span>
            )}
            {wxState.status === "ok" && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: "#0D5A2A",
                background: "#E6F4EC", border: "1px solid #B6E0C8", borderRadius: 6, padding: "2px 7px",
              }}>
                격자 예보 API
              </span>
            )}
            {wxState.status === "error" && (
              <span style={{
                fontSize: 9, fontWeight: 800, color: "#9B1C1C",
                background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 6, padding: "2px 7px",
              }}>
                연결 실패
              </span>
            )}
          </div>

          {wxState.status === "loading" && (
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "#6B6B88", fontSize: 13 }}>
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                style={{ display: "inline-flex" }}
              >
                <Loader2 size={18} />
              </motion.span>
              Open-Meteo에서 부산 지역 날씨를 불러오는 중입니다
            </div>
          )}

          {wxState.status === "error" && (
            <div style={{
              background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 12,
              padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <AlertCircle size={18} color="#B42318" style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: "#B42318", marginBottom: 6 }}>
                  날씨 API를 불러오지 못했습니다
                </div>
                <div style={{ fontSize: 12, color: "#7A271A", lineHeight: 1.45 }}>
                  {wxState.message}
                </div>
              </div>
            </div>
          )}

          {wxData && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <WxIcon size={40} color={wxIconColor} />
                <div>
                  <div style={{ fontSize: 26, fontWeight: 800, color: "#1A1A2E", letterSpacing: -0.5 }}>
                    {Math.round(wxData.temperatureC)}°C
                  </div>
                  <div style={{ fontSize: 11, color: "#8E90A8" }}>
                    {wxData.summaryKo} · {dayStr}
                  </div>
                </div>
                <div style={{ flex: 1 }} />
                <div style={{
                  padding: "6px 12px", borderRadius: 20,
                  background: wxVisitGood ? "#EDF7F2" : wxVisitOk ? "#F0F4FF" : "#FFF8ED",
                  border: `1px solid ${wxVisitGood ? "#C3E8D4" : wxVisitOk ? "#D0D5EE" : "#FDDCAD"}`,
                }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700,
                    color: wxVisitGood ? "#3D8B7A" : wxVisitOk ? "#4A7BBF" : "#D97706",
                  }}>
                    방문 {wxVisitGood ? "좋음" : wxVisitOk ? "양호" : "주의"}
                  </span>
                </div>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                {[
                  {
                    icon: Sun,
                    label: "자외선(UV)",
                    value: wxData.uvIndex != null ? String(wxData.uvIndex) : "정보 없음",
                  },
                  {
                    icon: Wind,
                    label: "습도",
                    value: `${Math.round(wxData.relativeHumidityPct)}%`,
                  },
                  {
                    icon: Cloud,
                    label: "상태",
                    value: wxData.summaryKo,
                  },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} style={{
                      background: "#F8F9FC", borderRadius: 10, padding: "10px 8px", textAlign: "center" as const,
                    }}>
                      <Icon size={14} color="#8E90A8" style={{ marginBottom: 4 }} />
                      <div style={{ fontSize: 11, fontWeight: 600, color: "#1A1A2E" }}>{item.value}</div>
                      <div style={{ fontSize: 9, color: "#9EA0B8", marginTop: 1 }}>{item.label}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{
                fontSize: 10, color: "#6B6B88", marginTop: 12,
                paddingTop: 10, borderTop: "1px solid #F0F1F6", lineHeight: 1.45,
              }}>
                <strong style={{ color: "#1A1B2E" }}>출처:</strong> {OPEN_METEO_ATTRIBUTION}
                <br />
                관측 시각(API): {wxData.observationTimeDisplay || "정보 없음"} · 클라이언트 수신:{" "}
                {new Date(wxData.fetchedAtIso).toLocaleString("ko-KR")}
              </div>
            </>
          )}
        </motion.div>

        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            width: "100%",
            marginTop: 18,
            height: 48,
            borderRadius: 14,
            border: "1px solid #E4E6EF",
            background: "white",
            fontSize: 13,
            fontWeight: 700,
            color: "#4A4A6A",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(26,26,46,0.04)",
          }}
        >
          이전 화면으로
        </button>
      </div>
    </div>
  );
}
