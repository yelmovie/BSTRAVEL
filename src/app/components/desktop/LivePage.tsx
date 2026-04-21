import { useMemo, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  Accessibility,
  AlertTriangle,
  Bell,
  Check,
  ChevronRight,
  Clock,
  Cloud,
  CloudRain,
  Compass,
  ListChecks,
  Loader2,
  Map as MapIcon,
  MapPin,
  Navigation,
  Phone,
  Shield,
  Sun,
  Train,
  Users,
} from "lucide-react";
import {
  applyTimelineStates,
  getLiveTripExecution,
  type LiveChecklistItem,
  type LiveTripIssue,
} from "../../data/liveTripExecutionCatalog";
import { PLACES } from "../../data/places";
import { usePlaceWeather } from "../../hooks/usePlaceWeather";
import { useOpenMeteoBusan } from "../../hooks/useOpenMeteoBusan";
import { predictCrowdLevel } from "../../lib/crowd/predictCrowdLevel";
import { crowdInputFromPlace } from "../../lib/crowd/crowdInputMapper";
import { CrowdPredictionCard } from "../crowd/CrowdPredictionCard";
import { OPEN_METEO_ATTRIBUTION } from "../../lib/weather/openMeteoClient";
import { useI18n } from "../../i18n/I18nContext";
import type { AppLocale } from "../../i18n/constants";
import { LanguageSwitcher } from "../i18n/LanguageSwitcher";

function localeToBcp47(locale: AppLocale): string {
  switch (locale) {
    case "zh-CN":
      return "zh-CN";
    case "zh-TW":
      return "zh-TW";
    case "ja":
      return "ja-JP";
    case "ko":
      return "ko-KR";
    case "ar":
      return "ar";
    case "ru":
      return "ru-RU";
    default:
      return "en-US";
  }
}

const ISSUE_STYLE: Record<
  LiveTripIssue["category"],
  { border: string; bg: string; icon: typeof Users; color: string }
> = {
  crowd: { border: "#FDDCAD", bg: "#FFF8ED", icon: Users, color: "#D97706" },
  accessibility: {
    border: "#FECACA",
    bg: "#FEF2F2",
    icon: Accessibility,
    color: "#DC2626",
  },
  weather: { border: "#BFDBFE", bg: "#EFF6FF", icon: CloudRain, color: "#2563EB" },
};

function DataBadge({
  mode,
  label,
}: {
  mode: "live" | "sample";
  label: string;
}) {
  const live = mode === "live";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 800,
        letterSpacing: 0.6,
        textTransform: "uppercase",
        padding: "5px 10px",
        borderRadius: 8,
        border: `1px solid ${live ? "#86EFAC" : "#E4E6EF"}`,
        background: live ? "#DCFCE7" : "#F4F5FA",
        color: live ? "#166534" : "#6B6B88",
      }}
    >
      {label}
    </span>
  );
}

export function LivePage() {
  const { id = "citizenpark" } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const planBRef = useRef<HTMLDivElement>(null);

  const base = useMemo(() => getLiveTripExecution(id), [id]);
  const place = useMemo(() => PLACES.find((item) => item.id === id) ?? PLACES[0], [id]);
  const [activeIndex, setActiveIndex] = useState(base.initialTimelineActiveIndex);
  const [checklist, setChecklist] = useState<LiveChecklistItem[]>(() =>
    base.checklist.map((c) => ({ ...c })),
  );

  const wx = useOpenMeteoBusan();
  const placeWx = usePlaceWeather(place.lat, place.lng);
  const wxLive = wx.status === "ok";
  const wxData = wx.status === "ok" ? wx.data : null;
  const WxIcon = wxData
    ? wxData.weatherCode <= 1
      ? Sun
      : wxData.weatherCode <= 3
        ? Cloud
        : CloudRain
    : Cloud;

  const crowdPrediction = useMemo(() => {
    const code =
      placeWx.data?.weatherCode ??
      (wx.status === "ok" ? wx.data.weatherCode : null);
    return predictCrowdLevel(
      crowdInputFromPlace(place, {
        weatherCode: code ?? undefined,
      }),
    );
  }, [place, placeWx.data, wx]);

  const timeline = useMemo(
    () => applyTimelineStates(base.timeline, activeIndex),
    [base.timeline, activeIndex],
  );

  const phase = base.phases[activeIndex] ?? base.phases[0];
  const progressPct = Math.round(((activeIndex + 1) / base.totalSteps) * 100);
  const stepDisplay = activeIndex + 1;
  const nextDestLabel =
    timeline[activeIndex + 1]?.label ??
    (activeIndex >= base.timeline.length - 1 ? t("live.destDone") : base.nextDestinationName);

  function toggleCheck(cid: string) {
    setChecklist((prev) =>
      prev.map((c) => (c.id === cid ? { ...c, done: !c.done } : c)),
    );
  }

  function nextStep() {
    setActiveIndex((i) => Math.min(i + 1, base.timeline.length - 1));
  }

  const clockStr = useMemo(
    () =>
      new Date().toLocaleTimeString(localeToBcp47(locale), {
        hour: "2-digit",
        minute: "2-digit",
      }),
    [locale],
  );

  return (
    <div
      style={{
        minHeight: "calc(100dvh - 62px)",
        background: "#F6F7FB",
        overflowY: "auto",
      }}
    >
      {/* 서브 헤더 */}
      <div
        style={{
          background: "white",
          borderBottom: "1.5px solid #E4E6EF",
          padding: "14px 52px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
          boxShadow: "0 1px 0 rgba(0,0,0,0.03)",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(`/desktop/course/${id}`)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            border: "none",
            background: "#F6F7FB",
            borderRadius: 8,
            padding: "7px 12px",
            cursor: "pointer",
            color: "#6B6B88",
            fontSize: 12,
            fontWeight: 600,
          }}
        >
          <ArrowLeft size={12} />
          {t("live.courseDetailLink")}
        </button>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 11, color: "#8E90A8", marginBottom: 2 }}>
            {t("live.subheading")}
          </div>
          <div style={{ fontSize: 15, fontWeight: 800, color: "#1A1B2E" }}>
            {base.courseTitle}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <LanguageSwitcher variant="compact" />
          <Clock size={14} color="#5B54D6" />
          <span style={{ fontSize: 13, fontWeight: 700, color: "#5B54D6" }}>
            {clockStr}
          </span>
        </div>
      </div>

      <div
        style={{
          padding: "28px 52px 40px",
          display: "flex",
          gap: 28,
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        {/* ── 좌측 메인 ── */}
        <div style={{ flex: "1 1 520px", minWidth: 0, display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              background: "linear-gradient(135deg, #FFFFFF 0%, #EEEDFA 100%)",
              borderRadius: 18,
              border: "1.5px solid #E4E6EF",
              padding: "22px 24px",
              boxShadow: "0 8px 28px rgba(91,84,214,0.08)",
            }}
          >
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: "#5B54D6",
                    background: "white",
                    border: "1px solid #D9D6F5",
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}>
                    {base.phaseBadge}
                  </span>
                  <span style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#1A1B2E",
                    background: "#F6F7FB",
                    borderRadius: 8,
                    padding: "4px 10px",
                  }}>
                    {base.statusLabel}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6B6B88", marginBottom: 6 }}>
                  {t("live.stepCurrent")}{" "}
                  <strong style={{ color: "#1A1B2E" }}>
                    {stepDisplay}/{base.totalSteps}
                  </strong>
                  · {t("live.nextDest")}:{" "}
                  <strong style={{ color: "#5B54D6" }}>{nextDestLabel}</strong>
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: "#1A1B2E", lineHeight: 1.45 }}>
                  {phase.headline}
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
                  <DataBadge
                    mode={base.executionDataMode === "live" ? "live" : "sample"}
                    label={
                      base.executionDataMode === "live"
                        ? t("live.executionLive")
                        : t("live.executionSample")
                    }
                  />
                  <DataBadge
                    mode={wxLive ? "live" : "sample"}
                    label={wxLive ? t("live.weatherLive") : t("live.weatherError")}
                  />
                </div>
                <div style={{ fontSize: 10, color: "#9EA0B8", textAlign: "right" }}>
                  {t("live.execDataRef")} {base.lastUpdatedDisplay}
                </div>
              </div>
            </div>
            <div style={{ marginBottom: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: "#8E90A8" }}>
                  {t("live.scheduleProgress")}
                </span>
                <span style={{ fontSize: 12, fontWeight: 800, color: "#5B54D6" }}>{progressPct}%</span>
              </div>
              <div style={{ height: 10, background: "#E8E9EF", borderRadius: 6, overflow: "hidden" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.35 }}
                  style={{
                    height: "100%",
                    borderRadius: 6,
                    background: "linear-gradient(90deg, #6C66E0, #5B54D6)",
                  }}
                />
              </div>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 16, fontSize: 12, color: "#4A4A6A" }}>
              <span>
                <strong style={{ color: "#1A1B2E" }}>{t("live.eta")}</strong>{" "}
                {phase.nextArrivalDisplay}
              </span>
              <span>
                <strong style={{ color: "#1A1B2E" }}>{t("live.remainWalk")}</strong>{" "}
                {t("live.remainMinutesFmt", { m: String(phase.remainingMinutes) })}
              </span>
              <span>
                <strong style={{ color: "#1A1B2E" }}>{t("live.accessibility")}</strong>{" "}
                {phase.accessibilityMemo}
              </span>
            </div>
          </motion.div>

          {/* 지금 해야 할 일 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #E4E6EF",
              padding: "20px 22px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 11, fontWeight: 800, color: "#A0A2B8", letterSpacing: 1.2, marginBottom: 12 }}>
              {t("live.nowDoTitle")}
            </div>
            <ol style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              {phase.actions.map((line, idx) => (
                <li key={`${activeIndex}-${idx}`} style={{ fontSize: 14, color: "#1A1B2E", fontWeight: 600, lineHeight: 1.5 }}>
                  <span style={{ color: "#5B54D6", marginRight: 6 }}>{idx + 1}.</span>
                  {line}
                </li>
              ))}
            </ol>
          </motion.div>

          {/* 실시간 이슈 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #E4E6EF",
              padding: "20px 22px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1B2E" }}>
                {t("live.issuesTitleFmt", { n: String(base.issues.length) })}
              </div>
              <Bell size={16} color="#5B54D6" />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {base.issues.length === 0 ? (
                <div style={{ fontSize: 13, color: "#8E90A8", padding: "12px 0" }}>
                  {t("live.issueEmpty")}
                </div>
              ) : (
                base.issues.map((issue) => {
                  const st = ISSUE_STYLE[issue.category];
                  const II = st.icon;
                  return (
                    <div
                      key={issue.id}
                      style={{
                        borderRadius: 12,
                        border: `1.5px solid ${st.border}`,
                        background: st.bg,
                        padding: "14px 16px",
                      }}
                    >
                      <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
                        <div style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          background: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          <II size={18} color={st.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1B2E", marginBottom: 4 }}>
                            {issue.title}
                          </div>
                          <p style={{ margin: 0, fontSize: 12, color: "#4A4A6A", lineHeight: 1.5 }}>
                            {issue.detail}
                          </p>
                          <div style={{ fontSize: 10, color: "#A0A2B8", marginTop: 6 }}>
                            {t("live.issueRefPrefix")} {issue.sourceNote}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>

          {/* 체크리스트 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #E4E6EF",
              padding: "20px 22px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <ListChecks size={18} color="#5B54D6" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#1A1B2E" }}>
                {t("live.checklistTitle")}
              </span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checklist.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => toggleCheck(item.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    borderRadius: 12,
                    border: `1.5px solid ${item.done ? "#C3E8D4" : "#E4E6EF"}`,
                    background: item.done ? "#F0FAF6" : "white",
                    cursor: "pointer",
                    textAlign: "left",
                  }}
                >
                  <div style={{
                    width: 22,
                    height: 22,
                    borderRadius: 6,
                    border: `2px solid ${item.done ? "#3D8B7A" : "#D0D2DC"}`,
                    background: item.done ? "#3D8B7A" : "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {item.done ? <Check size={12} color="white" strokeWidth={3} /> : null}
                  </div>
                  <span style={{
                    fontSize: 13,
                    fontWeight: item.done ? 600 : 500,
                    color: item.done ? "#256D5C" : "#1A1B2E",
                    textDecoration: item.done ? "line-through" : "none",
                  }}>
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>

          {/* 플랜 B */}
          <motion.div
            ref={planBRef}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            style={{
              background: "linear-gradient(135deg, #FFF8ED 0%, #FFFFFF 100%)",
              borderRadius: 16,
              border: "1.5px solid #FDDCAD",
              padding: "20px 22px",
              boxShadow: "0 4px 16px rgba(217,119,6,0.06)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Shield size={18} color="#D97706" />
              <span style={{ fontSize: 14, fontWeight: 800, color: "#92400E" }}>
                {t("live.planBTitle")}
              </span>
            </div>
            <ul style={{ margin: 0, paddingLeft: 18, display: "flex", flexDirection: "column", gap: 8 }}>
              {base.planB.map((line, i) => (
                <li key={i} style={{ fontSize: 13, color: "#78350F", lineHeight: 1.45 }}>
                  {line}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 빠른 실행 */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
            gap: 12,
          }}>
            <motion.a
              href={base.mapLink}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.02 }}
              style={{
                minHeight: 48,
                borderRadius: 14,
                border: "none",
                background: "linear-gradient(135deg, #6C66E0, #5B54D6)",
                color: "white",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
                boxShadow: "0 6px 18px rgba(91,84,214,0.28)",
              }}
            >
              <MapIcon size={18} />
              {t("live.mapOpen")}
            </motion.a>
            <motion.a
              href={base.mapLink}
              target="_blank"
              rel="noreferrer"
              whileHover={{ scale: 1.02 }}
              style={{
                minHeight: 48,
                borderRadius: 14,
                border: "1.5px solid #D9D6F5",
                background: "white",
                color: "#5B54D6",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                textDecoration: "none",
              }}
            >
              <Navigation size={18} />
              {t("live.directions")}
            </motion.a>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              onClick={nextStep}
              disabled={activeIndex >= base.timeline.length - 1}
              style={{
                minHeight: 48,
                borderRadius: 14,
                border: "1.5px solid #C3E8D4",
                background: "#EDF7F2",
                color: "#256D5C",
                fontSize: 14,
                fontWeight: 700,
                cursor: activeIndex >= base.timeline.length - 1 ? "not-allowed" : "pointer",
                opacity: activeIndex >= base.timeline.length - 1 ? 0.55 : 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              <ChevronRight size={18} />
              {t("live.nextStepDone")}
            </motion.button>
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              onClick={() =>
                planBRef.current?.scrollIntoView({ behavior: "smooth", block: "center" })
              }
              style={{
                minHeight: 48,
                borderRadius: 14,
                border: "1.5px solid #FDDCAD",
                background: "#FFF8ED",
                color: "#B45309",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {t("live.showPlanB")}
            </motion.button>
          </div>

          {/* 하단 타임라인 */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            style={{
              background: "white",
              borderRadius: 16,
              border: "1.5px solid #E4E6EF",
              padding: "20px 22px",
              boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1A1B2E", marginBottom: 16 }}>
              {t("live.timelineTitle")}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {timeline.map((row, idx) => (
                <div
                  key={row.id}
                  style={{
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start",
                    paddingBottom: idx < timeline.length - 1 ? 16 : 0,
                    borderLeft: idx < timeline.length - 1 ? "2px solid #E8E9EF" : "none",
                    marginLeft: 11,
                    paddingLeft: 18,
                  }}
                >
                  <div style={{ marginLeft: -30, marginTop: 2, flexShrink: 0 }}>
                    {row.state === "done" ? (
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        background: "#3D8B7A",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}>
                        <Check size={11} color="white" strokeWidth={3} />
                      </div>
                    ) : row.state === "current" ? (
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "3px solid #5B54D6",
                        background: "white",
                        boxShadow: "0 0 0 4px rgba(91,84,214,0.15)",
                      }} />
                    ) : (
                      <div style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "2px solid #D0D2DC",
                        background: "white",
                      }} />
                    )}
                  </div>
                  <div style={{ flex: 1, paddingBottom: idx < timeline.length - 1 ? 0 : 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div>
                        <span style={{
                          fontSize: 10,
                          fontWeight: 800,
                          color: row.state === "current" ? "#5B54D6" : "#A0A2B8",
                          textTransform: "uppercase",
                          letterSpacing: 0.8,
                        }}>
                          {row.state === "done"
                            ? t("live.statDone")
                            : row.state === "current"
                              ? t("live.statCurrent")
                              : t("live.statUpcoming")}
                        </span>
                        <div style={{ fontSize: 14, fontWeight: 800, color: "#1A1B2E", marginTop: 2 }}>
                          {row.label}
                        </div>
                        {row.sublabel ? (
                          <div style={{ fontSize: 12, color: "#8E90A8", marginTop: 2 }}>{row.sublabel}</div>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "#6B6B88", whiteSpace: "nowrap" }}>
                        {row.timeDisplay}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          <p style={{ fontSize: 11, color: "#9EA0B8", lineHeight: 1.5, margin: "4px 0 0" }}>
            {t("live.footnote")}
          </p>
        </div>

        {/* ── 우측 사이드 ── */}
        <div style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #E4E6EF",
            padding: "18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#A0A2B8", letterSpacing: 1, marginBottom: 12 }}>
              {t("live.summaryTitle")}
            </div>
            <div style={{
              fontSize: 12,
              color: "#4A4A6A",
              background: "#F6F7FB",
              borderRadius: 10,
              padding: "12px 14px",
              marginBottom: 12,
              lineHeight: 1.45,
            }}>
              <Train size={14} color="#5B54D6" style={{ verticalAlign: "middle", marginRight: 6 }} />
              {base.transportSummary}
            </div>
            <div style={{ fontSize: 11, color: "#8E90A8" }}>
              {t("live.executionDataNote")}{" "}
              <strong>
                {base.executionDataMode === "sample"
                  ? t("live.executionSampleLabel")
                  : t("live.executionLiveLabel")}
              </strong>
            </div>
          </div>

          {/* 날씨 */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #E4E6EF",
            padding: "18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 800, color: "#A0A2B8", letterSpacing: 1 }}>
                {t("live.weatherTitle")}
              </span>
              <DataBadge
                mode={wxLive ? "live" : "sample"}
                label={wxLive ? "LIVE" : t("live.weatherUnset")}
              />
            </div>
            {wx.status === "loading" && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "#6B6B88", fontSize: 13 }}>
                <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: "linear" }} style={{ display: "inline-flex" }}>
                  <Loader2 size={16} />
                </motion.span>
                {t("live.loading")}
              </div>
            )}
            {wx.status === "error" && (
              <div style={{ fontSize: 12, color: "#B42318", lineHeight: 1.45 }}>
                {wx.message}
              </div>
            )}
            {wxData && (
              <>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <WxIcon size={36} color="#5B54D6" />
                  <div>
                    <div style={{ fontSize: 22, fontWeight: 900, color: "#1A1B2E" }}>
                      {Math.round(wxData.temperatureC)}°C
                    </div>
                    <div style={{ fontSize: 12, color: "#8E90A8" }}>{wxData.summaryKo}</div>
                  </div>
                </div>
                <div style={{ fontSize: 10, color: "#9EA0B8", marginTop: 10, lineHeight: 1.45 }}>
                  {OPEN_METEO_ATTRIBUTION}
                  <br />
                  {t("live.receivedPrefix")}{" "}
                  {new Date(wxData.fetchedAtIso).toLocaleString(localeToBcp47(locale))}
                </div>
              </>
            )}
          </div>

          {/* 혼잡도 예측 (규칙 기반 · 실측 유동인구 아님) */}
          <CrowdPredictionCard result={crowdPrediction} />

          {/* 근처 편의 */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #E4E6EF",
            padding: "18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#A0A2B8", letterSpacing: 1, marginBottom: 12 }}>
              {t("live.nearbyTitle")}
            </div>
            {base.nearbyFacilities.map((n, i) => (
              <div key={i} style={{ marginBottom: i < base.nearbyFacilities.length - 1 ? 12 : 0 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <MapPin size={14} color="#5B54D6" style={{ marginTop: 2, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#1A1B2E" }}>{n.name}</div>
                    <div style={{ fontSize: 11, color: "#8E90A8", marginTop: 2 }}>{n.detail}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 비상·문의 */}
          <div style={{
            background: "white",
            borderRadius: 16,
            border: "1.5px solid #E4E6EF",
            padding: "18px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.04)",
          }}>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#A0A2B8", letterSpacing: 1, marginBottom: 12 }}>
              {t("live.emergencyTitle")}
            </div>
            {base.emergencyContacts.map((e, i) => (
              <div key={i} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 10,
                padding: "10px 0",
                borderBottom: i < base.emergencyContacts.length - 1 ? "1px solid #F0F1F6" : "none",
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1A1B2E" }}>{e.name}</div>
                  <div style={{ fontSize: 10, color: "#A0A2B8" }}>{e.type}</div>
                </div>
                <a href={`tel:${e.phone.replace(/-/g, "")}`} style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: "#5B54D6",
                  textDecoration: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  <Phone size={14} />
                  {e.phone}
                </a>
              </div>
            ))}
          </div>

          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            onClick={() => navigate(`/desktop/departure/${id}`)}
            style={{
              width: "100%",
              minHeight: 48,
              borderRadius: 14,
              border: "1px solid #E4E6EF",
              background: "#FAFBFF",
              color: "#5B54D6",
              fontSize: 13,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Compass size={16} />
            {t("live.backDeparture")}
          </motion.button>
        </div>
      </div>
    </div>
  );
}
