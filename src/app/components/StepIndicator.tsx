import { Check } from "lucide-react";

const STEPS = [
  { label: "권역 선택", short: "권역" },
  { label: "동행자 조건", short: "동행자" },
  { label: "목적 선택", short: "목적" },
  { label: "분석", short: "분석" },
  { label: "추천·비교", short: "비교" },
  { label: "실행", short: "실행" },
];

export function StepIndicator({ current }: { current: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 0,
        padding: "10px 12px",
        background: "white",
        borderBottom: "1px solid #E8E9EE",
      }}
    >
      {STEPS.map((step, i) => {
        const isDone = i < current;
        const isActive = i === current;
        const color = isActive ? "#5B54D6" : isDone ? "#3D8B7A" : "#C0C2D4";
        return (
          <div key={step.label} style={{ display: "flex", alignItems: "center" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 3,
                padding: "4px 6px",
                borderRadius: 12,
                background: isActive ? "#EEEDFA" : isDone ? "#EDF7F2" : "transparent",
              }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: isActive ? "#5B54D6" : isDone ? "#3D8B7A" : "#EEF0F6",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 8,
                  fontWeight: 700,
                  color: isActive || isDone ? "white" : "#B0B2C4",
                  flexShrink: 0,
                }}
              >
                {isDone ? <Check size={8} strokeWidth={3} /> : i + 1}
              </div>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: isActive ? 700 : 500,
                  color,
                  whiteSpace: "nowrap",
                }}
              >
                {step.short}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div
                style={{
                  width: 12,
                  height: 1,
                  background: isDone ? "#3D8B7A60" : "#E4E6EF",
                  flexShrink: 0,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
