import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, ResponsiveContainer, ReferenceLine,
} from "recharts";
import {
  Clock, TrendingDown, Sun, Cloud, CloudRain, Wind,
  AlertTriangle, CheckCircle, Users, Loader2, AlertCircle,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";
import { CROWD_DATA_SAMPLE, BEST_TIME_SAMPLE } from "../../mock/crowdScreenSamples";
import { useOpenMeteoBusan } from "../hooks/useOpenMeteoBusan";
import { OPEN_METEO_ATTRIBUTION } from "../lib/weather/openMeteoClient";

const CROWD_DATA = CROWD_DATA_SAMPLE;
const BEST_TIME = BEST_TIME_SAMPLE;

function getBarColor(level: number): string {
  if (level < 40) return "#4AB87A";
  if (level < 70) return "#F59E3A";
  return "#E55555";
}

function getCrowdLabel(level: number): string {
  if (level < 40) return "여유";
  if (level < 70) return "보통";
  return "혼잡";
}

function iconForWeatherCode(code: number) {
  if (code <= 1) return Sun;
  if (code <= 3) return Cloud;
  return CloudRain;
}

export function CrowdScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const data = CROWD_DATA[place.id] ?? CROWD_DATA.botanical;
  const best = BEST_TIME[place.id];
  const wxState = useOpenMeteoBusan();

  const currentHour = String(new Date().getHours()).padStart(2, "0");
  const currentData = data.find((d) => d.hour === currentHour);
  const currentLevel = currentData?.level ?? 78;
  const refLineX = data.find((d) => d.hour === currentHour)?.label;
  const now = new Date();
  const clockStr = now.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" });
  const dayStr = now.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });

  const wxData = wxState.status === "ok" ? wxState.data : null;
  const wxVisitGood = wxData ? wxData.weatherCode <= 1 : false;
  const wxVisitOk = wxData ? wxData.weatherCode <= 3 : false;
  const WeatherIcon =
    wxData ? iconForWeatherCode(wxData.weatherCode) : Cloud;
  const wxIconColor =
    wxData
      ? wxData.weatherCode <= 1
        ? "#F59E3A"
        : wxData.weatherCode <= 3
          ? "#94A3B8"
          : "#60A5FA"
      : "#94A3B8";

  return (
    <div style={{ minHeight: "100dvh", background: "#F4F5FA", display: "flex", flexDirection: "column" }}>
      <TopNav title="혼잡도 · 최적 방문 시간" />

      <div style={{ padding: "18px 20px 0", flex: 1, overflowY: "auto" }}>

        {/* ── Place name + current status ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ fontSize: 13, color: "#8E90A8", marginBottom: 3, letterSpacing: -0.1 }}>
            {place.subtitle}
          </div>
          <div style={{ fontSize: 18, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.4, marginBottom: 12 }}>
            {place.name}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            {/* Current crowd */}
            <div style={{
              flex: 1, padding: "12px 14px", borderRadius: 12,
              background: currentLevel < 40 ? "#EDF7F2" : currentLevel < 70 ? "#FFF7ED" : "#FEF2F2",
              border: `1px solid ${currentLevel < 40 ? "#C3E8D4" : currentLevel < 70 ? "#FDD9A8" : "#FCC8C8"}`,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <Users size={12} color={currentLevel < 40 ? "#3D8B7A" : currentLevel < 70 ? "#D97706" : "#DC2626"} />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#6B6B88", letterSpacing: -0.1 }}>지금 혼잡도</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: currentLevel < 40 ? "#3D8B7A" : currentLevel < 70 ? "#D97706" : "#DC2626", letterSpacing: -0.5 }}>
                {getCrowdLabel(currentLevel)}
              </div>
              <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 2 }}>{currentLevel}% 점유</div>
            </div>
            {/* Current time */}
            <div style={{
              flex: 1, padding: "12px 14px", borderRadius: 12,
              background: "#F6F5FF", border: "1px solid #E0DEFA",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                <Clock size={12} color="#5B54D6" />
                <span style={{ fontSize: 10, fontWeight: 600, color: "#6B6B88", letterSpacing: -0.1 }}>현재 시각</span>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#5B54D6", letterSpacing: -0.5 }}>
                {clockStr}
              </div>
              <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 2 }}>기기 로컬 시각</div>
            </div>
          </div>
        </motion.div>

        {/* ── Chart ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "16px 10px 10px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 8px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
                시간대별 혼잡도
              </span>
              <span style={{
                fontSize: 9, fontWeight: 800, color: "#9A5A00",
                background: "#FFF4E0", border: "1px solid #FDE0B2", borderRadius: 6, padding: "2px 7px",
              }}>
                샘플(시연)
              </span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {[
                { color: "#4AB87A", label: "여유" },
                { color: "#F59E3A", label: "보통" },
                { color: "#E55555", label: "혼잡" },
              ].map((item) => (
                <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: item.color }} />
                  <span style={{ fontSize: 10, color: "#9EA0B8" }}>{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data} barSize={22} margin={{ top: 0, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F1F6" vertical={false} />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#A0A2B8" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: "#A0A2B8" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div style={{
                      background: "white", border: "1px solid #E8E9EF", borderRadius: 10,
                      padding: "8px 12px", boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                    }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1A2E" }}>{d.label}</div>
                      <div style={{ fontSize: 11, color: getBarColor(d.level) }}>
                        {getCrowdLabel(d.level)} ({d.level}%)
                      </div>
                    </div>
                  );
                }}
              />
              {refLineX != null && (
                <ReferenceLine
                  x={refLineX}
                  stroke="#5B54D6"
                  strokeDasharray="4 3"
                  strokeWidth={2}
                  label={{ value: "지금", position: "top", fontSize: 9, fill: "#5B54D6" }}
                />
              )}
              <Bar dataKey="level" radius={[5, 5, 0, 0]}>
                {data.map((entry) => (
                  <Cell key={entry.hour} fill={entry.hour === currentHour ? "#5B54D6" : getBarColor(entry.level)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 10, color: "#B0B2C8", textAlign: "center" as const, marginTop: 4 }}>
            데이터 성격: 시연용 고정 곡선 · 실제 서울 열린데이터광장 유동인구 API 미연동
          </div>
        </motion.div>

        {/* ── Best time card ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.14 }}
          style={{
            background: "linear-gradient(135deg, #EDEFFC 0%, #F6F5FF 100%)",
            borderRadius: 16, border: "1.5px solid #E0DEFA",
            padding: "16px", marginBottom: 14,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8, background: "#5B54D6",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <TrendingDown size={14} color="white" />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#1A1A2E", letterSpacing: -0.2 }}>
              AI 추천 최적 방문 시간
            </span>
            <span style={{
              marginLeft: 6, fontSize: 9, fontWeight: 800, color: "#6B6B88",
              background: "#F4F5FA", borderRadius: 6, padding: "2px 7px",
            }}>
              샘플
            </span>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: "#5B54D6", letterSpacing: -0.5, marginBottom: 6 }}>
            {best.time}
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 6 }}>
            <CheckCircle size={12} color="#3D8B7A" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: "#4A4A6A", lineHeight: 1.5, letterSpacing: -0.1 }}>
              {best.reason}
            </span>
          </div>
        </motion.div>

        {/* ── Weather: Open-Meteo (실외부 API, 부산 고정 좌표) ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          style={{
            background: "white", borderRadius: 16, border: "1px solid #E8E9EF",
            padding: "14px 16px", marginBottom: 14,
          }}
        >
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            marginBottom: 12, flexWrap: "wrap", gap: 8,
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B88", letterSpacing: -0.1 }}>
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
                실시간 API
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
              <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-flex" }}>
                <Loader2 size={18} />
              </motion.span>
              Open-Meteo에서 부산 지역 날씨를 불러오는 중입니다…
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
                <div style={{ fontSize: 11, color: "#9A3412", marginTop: 8 }}>
                  예시 숫자로 대체하지 않습니다. 네트워크·CORS·방화벽을 확인한 뒤 새로고침 해 주세요.
                </div>
              </div>
            </div>
          )}

          {wxData && (
            <>
              <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                <WeatherIcon size={40} color={wxIconColor} />
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
                    value: wxData.uvIndex != null ? String(wxData.uvIndex) : "—",
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
                관측 시각(API): {wxData.observationTimeDisplay || "—"} · 클라이언트 수신:{" "}
                {new Date(wxData.fetchedAtIso).toLocaleString("ko-KR")}
              </div>
            </>
          )}
        </motion.div>

        {/* ── Visit advisory ── */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.26 }}
          style={{
            background: "#FFF8ED",
            borderRadius: 14, border: "1px solid #FDDCAD",
            padding: "12px 14px", marginBottom: 28,
            display: "flex", gap: 10, alignItems: "flex-start",
          }}
        >
          <AlertTriangle size={14} color="#D97706" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: "#92400E", marginBottom: 3 }}>
              현재 시간대 주의
            </div>
            <div style={{ fontSize: 11, color: "#78350F", lineHeight: 1.55, letterSpacing: -0.1 }}>
              현재({Number(currentHour)}시) 혼잡도 지표는 <strong>시연용 샘플 곡선</strong>입니다. 동행자 중 휠체어/유모차 이용 시 혼잡 시간대에는 이동이 불편할 수 있습니다.
              <strong> {best.time}</strong>(샘플 추천)에 방문하는 것을 추천합니다.
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
