import { useState, useMemo, type ReactNode } from "react";
import { useParams, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import {
  ChevronRight,
  Clock,
  MapPin,
  Coffee,
  UtensilsCrossed,
  Flag,
  Train,
  Footprints,
  Star,
  Share2,
  ChevronDown,
  Plus,
  Minus,
  RotateCcw,
  Pencil,
  ArrowRight,
  Navigation,
  Map,
} from "lucide-react";
import { PLACES } from "../data/places";
import { TopNav } from "./TopNav";

/* ─────────────────────────────────────────
   Helpers
───────────────────────────────────────── */

function parseDurationMins(duration: string): number {
  if (!duration) return 0;
  const h = duration.match(/(\d+)시간/);
  const m = duration.match(/(\d+)분/);
  return (h ? parseInt(h[1]) * 60 : 0) + (m ? parseInt(m[1]) : 0);
}

function parseTransportMins(transportTime: string | undefined): number {
  if (!transportTime) return 0;
  const m = transportTime.match(/(\d+)분/);
  return m ? parseInt(m[1]) : 0;
}

function minsToHHMM(mins: number): string {
  const total = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function hhmmToMins(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function formatDuration(mins: number): string {
  if (mins <= 0) return "0분";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

function formatTotalDuration(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h === 0) return `${m}분`;
  if (m === 0) return `${h}시간`;
  return `${h}시간 ${m}분`;
}

/* ─────────────────────────────────────────
   Types & constants
───────────────────────────────────────── */

type StepType = "start" | "place" | "rest" | "meal" | "end";

const STEP_COLORS: Record<StepType, string> = {
  start: "#5B54D6",
  place: "#3D8B7A",
  rest: "#B07AAF",
  meal: "#C4793C",
  end: "#4A7BBF",
};

const STEP_LABELS: Record<StepType, string> = {
  start: "출발",
  place: "장소",
  rest: "휴게",
  meal: "식사",
  end: "도착",
};

const STEP_ICONS: Record<StepType, ReactNode> = {
  start: <Train size={15} color="white" />,
  place: <MapPin size={15} color="white" />,
  rest: <Coffee size={15} color="white" />,
  meal: <UtensilsCrossed size={15} color="white" />,
  end: <Flag size={15} color="white" />,
};

/* ─────────────────────────────────────────
   Sub-components
───────────────────────────────────────── */

function AdjustRow({
  label,
  value,
  unit,
  onDec,
  onInc,
  canDec,
  canInc,
  accent = "#5B54D6",
}: {
  label: string;
  value: string;
  unit?: string;
  onDec: () => void;
  onInc: () => void;
  canDec: boolean;
  canInc: boolean;
  accent?: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "10px 14px",
        background: "rgba(91,84,214,0.03)",
        borderRadius: 10,
        gap: 12,
      }}
    >
      <span
        style={{
          fontSize: 12,
          fontWeight: 500,
          color: "#7A7A8E",
          flex: 1,
          letterSpacing: -0.1,
        }}
      >
        {label}
      </span>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: "white",
          borderRadius: 9,
          border: "1px solid #E4E5EE",
          overflow: "hidden",
        }}
      >
        <button
          onClick={onDec}
          disabled={!canDec}
          style={{
            width: 32,
            height: 32,
            border: "none",
            borderRight: "1px solid #E4E5EE",
            background: canDec ? "white" : "#F8F9FC",
            cursor: canDec ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Minus size={11} color={canDec ? accent : "#C4C5D6"} />
        </button>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#1A1A2E",
            minWidth: 48,
            textAlign: "center",
            letterSpacing: -0.3,
            padding: "0 4px",
          }}
        >
          {value}
          {unit && (
            <span style={{ fontSize: 10, fontWeight: 500, color: "#9EA0B8", marginLeft: 1 }}>
              {unit}
            </span>
          )}
        </span>
        <button
          onClick={onInc}
          disabled={!canInc}
          style={{
            width: 32,
            height: 32,
            border: "none",
            borderLeft: "1px solid #E4E5EE",
            background: canInc ? "white" : "#F8F9FC",
            cursor: canInc ? "pointer" : "not-allowed",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Plus size={11} color={canInc ? accent : "#C4C5D6"} />
        </button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   Main Screen
───────────────────────────────────────── */

export function CourseFlowScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const place = PLACES.find((p) => p.id === id) ?? PLACES[0];
  const steps = place.courseSteps;

  /* ── State ── */
  const [departureTime, setDepartureTime] = useState("10:00");
  const [stepDurations, setStepDurations] = useState<number[]>(() =>
    steps.map((s) => parseDurationMins(s.duration))
  );
  const [transportMins, setTransportMins] = useState<number[]>(() =>
    steps.map((s) => parseTransportMins(s.transportTime))
  );
  const [expandedStep, setExpandedStep] = useState<number | null>(null);

  /* Initial values for reset */
  const initialDurations = useMemo(
    () => steps.map((s) => parseDurationMins(s.duration)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const initialTransport = useMemo(
    () => steps.map((s) => parseTransportMins(s.transportTime)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  /* ── Computed times ── */
  const stepTimes = useMemo(() => {
    const depMins = hhmmToMins(departureTime);
    const times: { start: number; end: number }[] = [];
    let cursor = depMins;
    for (let i = 0; i < steps.length; i++) {
      const start = cursor;
      const end = start + stepDurations[i];
      times.push({ start, end });
      if (i < steps.length - 1) cursor = end + transportMins[i];
    }
    return times;
  }, [departureTime, stepDurations, transportMins, steps.length]);

  const totalMins = useMemo(() => {
    if (stepTimes.length < 2) return 0;
    return stepTimes[stepTimes.length - 1].end - stepTimes[0].start;
  }, [stepTimes]);

  const hasChanges = useMemo(
    () =>
      departureTime !== "10:00" ||
      stepDurations.some((d, i) => d !== initialDurations[i]) ||
      transportMins.some((t, i) => t !== initialTransport[i]),
    [departureTime, stepDurations, transportMins, initialDurations, initialTransport]
  );

  /* ── Update helpers ── */
  const updateDuration = (i: number, delta: number) =>
    setStepDurations((prev) => {
      const next = [...prev];
      next[i] = Math.max(5, Math.min(480, next[i] + delta));
      return next;
    });

  const updateTransport = (i: number, delta: number) =>
    setTransportMins((prev) => {
      const next = [...prev];
      next[i] = Math.max(0, Math.min(120, next[i] + delta));
      return next;
    });

  const resetAll = () => {
    setDepartureTime("10:00");
    setStepDurations(initialDurations);
    setTransportMins(initialTransport);
    setExpandedStep(null);
  };

  /* ── Render ── */
  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#F4F5FA",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <TopNav title="코스 일정" />

      {/* ── Sticky summary + departure ── */}
      <div
        style={{
          position: "sticky",
          top: 56,
          zIndex: 40,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(10px)",
          borderBottom: "1px solid #E8E9EF",
          padding: "14px 20px",
        }}
      >
        {/* Title + score */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <h1
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#1A1A2E",
              margin: 0,
              letterSpacing: -0.4,
            }}
          >
            {place.name}
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <Star size={12} color="#5B54D6" fill="#5B54D6" />
            <span style={{ fontSize: 13, fontWeight: 700, color: "#5B54D6" }}>
              {place.score.toFixed(1)}
            </span>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: "flex", gap: 14, marginBottom: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Clock size={12} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4A4A6A" }}>
              총 {formatTotalDuration(totalMins)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <MapPin size={12} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4A4A6A" }}>
              {steps.filter((s) => s.type === "place").length}개 장소
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Footprints size={12} color="#5B54D6" />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#4A4A6A" }}>
              {place.estimatedSteps}
            </span>
          </div>
        </div>

        {/* Departure time row */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 10,
            borderTop: "1px solid #F0F1F7",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Clock size={13} color="#5B54D6" />
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "#4A4A6A",
                letterSpacing: -0.2,
              }}
            >
              출발 시각
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {hasChanges && (
              <button
                onClick={resetAll}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "4px 9px",
                  borderRadius: 7,
                  border: "1px solid #E4E5EE",
                  background: "white",
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#7A7A8E",
                }}
              >
                <RotateCcw size={10} />
                초기화
              </button>
            )}

            {/* Departure time picker — overlay trick */}
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  background: "#F0EFFC",
                  border: "1.5px solid #5B54D6",
                  borderRadius: 10,
                  padding: "6px 12px",
                  cursor: "pointer",
                  pointerEvents: "none",
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: "#5B54D6",
                    letterSpacing: 0.5,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {departureTime}
                </span>
                <Pencil size={11} color="#8B84E0" />
              </div>
              <input
                type="time"
                value={departureTime}
                onChange={(e) => {
                  if (e.target.value) setDepartureTime(e.target.value);
                }}
                style={{
                  position: "absolute",
                  inset: 0,
                  opacity: 0,
                  width: "100%",
                  height: "100%",
                  cursor: "pointer",
                  fontSize: 16,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Timeline ── */}
      <div style={{ padding: "20px 20px 24px", flex: 1 }}>
        {steps.map((step, i) => {
          const isLast = i === steps.length - 1;
          const type = step.type as StepType;
          const color = STEP_COLORS[type];
          const isExpanded = expandedStep === i;
          const times = stepTimes[i];
          const hasDuration = stepDurations[i] > 0;
          const hasTransport = !isLast && (step.transport != null);
          const isEndStep = type === "end";
          const isStartStep = type === "start";

          // Time display
          const timeStr = hasDuration
            ? `${minsToHHMM(times.start)} – ${minsToHHMM(times.end)}`
            : minsToHHMM(times.start);

          // Was duration/transport modified?
          const durationChanged = stepDurations[i] !== initialDurations[i];
          const transportChanged = !isLast && transportMins[i] !== initialTransport[i];

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.05 + i * 0.055 }}
              style={{ display: "flex", gap: 0 }}
            >
              {/* Icon column */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  width: 42,
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: color,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    zIndex: 1,
                    boxShadow: `0 2px 8px ${color}40`,
                  }}
                >
                  {STEP_ICONS[type]}
                </div>
                {!isLast && (
                  <div
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 16,
                      background: isExpanded
                        ? `linear-gradient(to bottom, ${color}50, #E0E1E8)`
                        : "#E0E1E8",
                      transition: "background 0.3s ease",
                    }}
                  />
                )}
              </div>

              {/* Content column */}
              <div
                style={{
                  flex: 1,
                  paddingLeft: 12,
                  paddingBottom: isLast ? 0 : 4,
                }}
              >
                {/* Step type label */}
                <div
                  style={{
                    display: "inline-flex",
                    background: `${color}18`,
                    borderRadius: 6,
                    padding: "2px 8px",
                    marginBottom: 5,
                    marginTop: 6,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 0.2 }}>
                    {STEP_LABELS[type]}
                  </span>
                </div>

                {/* Step card */}
                <button
                  onClick={() =>
                    !isEndStep ? setExpandedStep(isExpanded ? null : i) : undefined
                  }
                  style={{
                    width: "100%",
                    background: "white",
                    borderRadius: 13,
                    padding: "13px 14px",
                    border: isExpanded
                      ? `1.5px solid ${color}50`
                      : "1.5px solid #E8E9EF",
                    cursor: isEndStep ? "default" : "pointer",
                    textAlign: "left" as const,
                    transition: "all 0.18s ease",
                    boxShadow: isExpanded
                      ? `0 2px 12px ${color}15`
                      : "0 1px 3px rgba(0,0,0,0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                      gap: 8,
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: "#1A1A2E",
                          marginBottom: 2,
                          letterSpacing: -0.2,
                        }}
                      >
                        {step.name}
                      </div>
                      {step.subname && (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#8E90A8",
                            fontWeight: 400,
                            marginBottom: 6,
                          }}
                        >
                          {step.subname}
                        </div>
                      )}

                      {/* Time + duration */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 700,
                            color,
                            fontVariantNumeric: "tabular-nums",
                            letterSpacing: 0.2,
                          }}
                        >
                          {timeStr}
                        </span>
                        {hasDuration && (
                          <span
                            style={{
                              fontSize: 11,
                              color: durationChanged ? "#5B54D6" : "#9EA0B8",
                              fontWeight: durationChanged ? 600 : 400,
                              background: durationChanged ? "#EEEDFA" : "transparent",
                              borderRadius: 5,
                              padding: durationChanged ? "1px 6px" : "0",
                            }}
                          >
                            {formatDuration(stepDurations[i])}
                          </span>
                        )}
                      </div>
                    </div>

                    {!isEndStep && (
                      <div
                        style={{
                          width: 24,
                          height: 24,
                          borderRadius: 7,
                          background: isExpanded ? `${color}18` : "#F0F1F6",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          marginTop: 2,
                          transition: "all 0.18s ease",
                        }}
                      >
                        <ChevronDown
                          size={13}
                          color={isExpanded ? color : "#9EA0B8"}
                          style={{
                            transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.25s ease",
                          }}
                        />
                      </div>
                    )}
                  </div>
                </button>

                {/* ── Expanded adjustment panel ── */}
                <AnimatePresence>
                  {isExpanded && !isEndStep && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.22, ease: "easeOut" }}
                      style={{ overflow: "hidden" }}
                    >
                      <div
                        style={{
                          background: "white",
                          borderRadius: 12,
                          border: "1px solid #E8E9EF",
                          padding: "10px",
                          display: "flex",
                          flexDirection: "column",
                          gap: 6,
                        }}
                      >
                        {/* Header */}
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: "#9EA0B8",
                            padding: "2px 4px 6px",
                            letterSpacing: 0.3,
                            textTransform: "uppercase" as const,
                            borderBottom: "1px solid #F0F1F6",
                            marginBottom: 2,
                          }}
                        >
                          시간 조정
                        </div>

                        {/* Duration control */}
                        {hasDuration && (
                          <AdjustRow
                            label={
                              type === "start"
                                ? "대기 시간"
                                : type === "rest"
                                ? "휴게 시간"
                                : type === "meal"
                                ? "식사 시간"
                                : "관람·체류 시간"
                            }
                            value={formatDuration(stepDurations[i])}
                            onDec={() => updateDuration(i, -15)}
                            onInc={() => updateDuration(i, +15)}
                            canDec={stepDurations[i] > 15}
                            canInc={stepDurations[i] < 480}
                            accent={color}
                          />
                        )}

                        {/* Transport time control */}
                        {hasTransport && (
                          <AdjustRow
                            label={`다음 이동 (${step.transport ?? "이동"})`}
                            value={`${transportMins[i]}`}
                            unit="분"
                            onDec={() => updateTransport(i, -5)}
                            onInc={() => updateTransport(i, +5)}
                            canDec={transportMins[i] > 0}
                            canInc={transportMins[i] < 120}
                            accent="#4A7BBF"
                          />
                        )}

                        {/* 출발 전 대기 (start step) — no duration but has transport */}
                        {isStartStep && !hasDuration && hasTransport && (
                          <AdjustRow
                            label={`이동 시간 (${step.transport ?? "이동"})`}
                            value={`${transportMins[i]}`}
                            unit="분"
                            onDec={() => updateTransport(i, -5)}
                            onInc={() => updateTransport(i, +5)}
                            canDec={transportMins[i] > 0}
                            canInc={transportMins[i] < 120}
                            accent="#4A7BBF"
                          />
                        )}

                        {/* Show resulting next step start time */}
                        {!isLast && (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "8px 10px 2px",
                              marginTop: 2,
                            }}
                          >
                            <span style={{ fontSize: 11, color: "#B0B2C8", fontWeight: 400 }}>
                              다음 일정 시작
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                              <ArrowRight size={10} color="#8B84E0" />
                              <span
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: "#5B54D6",
                                  fontVariantNumeric: "tabular-nums",
                                }}
                              >
                                {minsToHHMM(
                                  stepTimes[i].end + transportMins[i]
                                )}
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Transport connector (collapsed) */}
                {!isLast && !isExpanded && (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "7px 0 3px 2px",
                    }}
                  >
                    <div style={{ width: 14, height: 1, background: "#D0D1DC" }} />
                    <span
                      style={{
                        fontSize: 11,
                        color: transportChanged ? "#4A7BBF" : "#A4A6BC",
                        fontWeight: transportChanged ? 600 : 400,
                        background: transportChanged ? "#EEF3FA" : "transparent",
                        borderRadius: 5,
                        padding: transportChanged ? "1px 6px" : "0",
                      }}
                    >
                      {step.transport ?? "이동"} · {transportMins[i]}분
                    </span>
                  </div>
                )}

                {/* Spacer between expanded step and next */}
                {isExpanded && !isLast && <div style={{ height: 8 }} />}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* ── Bottom CTA ── */}
      <div
        style={{
          position: "sticky",
          bottom: 0,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(10px)",
          borderTop: "1px solid #E8E9EF",
          padding: "14px 20px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {/* Time change notice */}
        {hasChanges && (
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "#F0F8FF", borderRadius: 8, padding: "7px 12px",
            border: "1px solid #C8DDF5",
          }}>
            <Clock size={12} color="#4A7BBF" />
            <span style={{ fontSize: 11, color: "#4A7BBF", fontWeight: 500 }}>
              시간 변경 시 이후 일정이 자동으로 조정됩니다
            </span>
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => navigate(`/mobile/execution/${id}`)}
            style={{
              flex: 1,
              padding: "14px",
              borderRadius: 12,
              border: "none",
              background: "linear-gradient(135deg, #6C66E0 0%, #5B54D6 100%)",
              color: "white",
              fontSize: 14,
              fontWeight: 700,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              letterSpacing: -0.3,
              boxShadow: "0 4px 16px rgba(91,84,214,0.32)",
            }}
          >
            <Flag size={15} />
            {departureTime} 출발로 시작하기
          </button>
          <button
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              border: "1.5px solid #E8E9EF",
              background: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Share2 size={17} color="#4A4A6A" />
          </button>
        </div>

        {/* Kakao Map route button */}
        <button
          onClick={() => openKakaoRoute(place.name, place.lat, place.lng)}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            border: "1.5px solid #F9A825",
            background: "#FFFBF0",
            color: "#B8820A",
            fontSize: 13,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            letterSpacing: -0.2,
          }}
        >
          <Navigation size={15} color="#F9A825" />
          카카오맵 길찾기 열기
        </button>

        <button
          onClick={() => navigate(`/mobile/alternatives/${place.id}`)}
          style={{
            width: "100%",
            padding: "11px",
            borderRadius: 10,
            border: "none",
            background: "#F0F1F7",
            color: "#4A4A6A",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            letterSpacing: -0.2,
          }}
        >
          대안 코스로 전환하기
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

function openKakaoRoute(stepName: string, lat?: number, lng?: number) {
  if (lat && lng) {
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(stepName)},${lat},${lng}`, "_blank");
  } else {
    window.open(`https://map.kakao.com/?q=${encodeURIComponent("부산 " + stepName)}`, "_blank");
  }
}