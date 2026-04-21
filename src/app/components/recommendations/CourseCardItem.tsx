/**
 * 단일 통합 카드 컴포넌트 — 실 API(live) 데이터와 시연(demo) 데이터 모두 동일 UI로 렌더링
 * 목록에서는 대표 이미지만 표시하고, 탭 시 상세로 이동합니다.
 */

import { useMemo, useState, type ReactNode } from "react"
import { Star } from "lucide-react"

/* ─── design tokens ─────────────────────────────── */
const BRAND = "#5B54D6"
const IMG_PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
      <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ECEEF6"/><stop offset="1" stop-color="#DDE1EE"/></linearGradient></defs>
      <rect width="800" height="400" fill="url(#g)"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="#8E90A8" font-family="Noto Sans KR, sans-serif" font-size="24">이미지를 불러오지 못했습니다</text>
    </svg>`,
  )

/* ─── public types ──────────────────────────────── */
export type CardDisplayData = {
  id: string
  rank: number
  source: "live" | "simulation"
  title: string
  /** 목록 커버 이미지 URL — 없으면 그라데이션 플레이스홀더 */
  coverImageUrl?: string | null
  /** 카드 하단 출처 문구(심사 대응) — 확장 필드용 유지 */
  attributionLine: string
  /** 카테고리 · 한 줄 요약 (없으면 null) */
  categoryLabel: string | null
  /** TourAPI 유형 뱃지(관광지·식사 등) — 없으면 생략 */
  kindBadgeLabel?: string | null
  /** LIVE: 이동·편의 참고 근거 1~2줄(보수적 표현) */
  accessibilityHints?: string[]
  /** LIVE: 이동편한 곳 후보 여부 · `accessibilityReason`과 연동 가능 */
  isAccessibleCandidate?: boolean
  /** LIVE: 점수 근거 문자열 (`accessibilityReason` 별칭 역할) */
  accessibilityReasons?: string[]
  /** LIVE: 직선거리 요약 (이전 장소 대비, 있을 때만) */
  routeDistanceLabel?: string | null
  /** LIVE: 도보 또는 차량 이동시간 요약 */
  routeTimeLabel?: string | null
  /** 근거 요약 라벨(숫자 점수 아님) */
  scoreLabel: string | null
  /** "약 2시간" 또는 "시간 정보 없음" */
  durationLabel: string | null
  /** 이동·접근성 요약 한 줄 */
  walkingLabel: string | null
  /** 접근성·조건 태그 배열 */
  tags: string[]
  /** 한 줄 요약(accessibilityReasons 우선 · 없으면 카드 내 fallback) */
  summaryRecommendationOneLine?: string | null
  /** 추천 이유 (레거시 필드 — 목록 미표시) */
  reason: string | null
  /** 주소 (live 데이터용, 없으면 null) */
  address: string | null
  lat: number | null
  lng: number | null
  isSelected: boolean
}

export type CourseCardItemProps = CardDisplayData & {
  /** 상세 보기 → 앱 내 상세 페이지 이동 */
  onDetail?: () => void
}

/* ─── internal sub-components ──────────────────── */

function RankBadge({ rank }: { rank: number }) {
  const isTop = rank === 1
  return (
    <div
      style={{
        width: 32, height: 32, borderRadius: 10, flexShrink: 0,
        background: isTop ? BRAND : "rgba(255,255,255,0.92)",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
      }}
    >
      {isTop
        ? <Star size={14} color="white" fill="white" />
        : <span style={{ fontSize: 13, fontWeight: 800, color: "#6B6B88" }}>{rank}</span>
      }
    </div>
  )
}

/* ─── main component ────────────────────────────── */

export function CourseCardItem({
  rank,
  title,
  kindBadgeLabel,
  coverImageUrl,
  isSelected,
  onDetail,
}: CourseCardItemProps) {
  const img = coverImageUrl?.trim() || ""
  const [imageFailed, setImageFailed] = useState(false)
  const safeImg = useMemo(() => {
    if (imageFailed) return IMG_PLACEHOLDER
    return img
  }, [imageFailed, img])
  const isTop = rank === 1
  const borderColor = isSelected ? BRAND : isTop ? `${BRAND}44` : "#E4E6EF"
  const borderWidth = isSelected ? 2 : 1

  const hero: ReactNode = safeImg ? (
    <img
      src={safeImg}
      alt=""
      style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      onError={() => setImageFailed(true)}
    />
  ) : (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #E8E9F2 0%, #F0F1F7 50%, #E4E6EF 100%)",
        color: "#8E90A8",
        fontSize: 13,
        fontWeight: 700,
        padding: "0 16px",
        textAlign: "center",
        lineHeight: 1.35,
      }}
    >
      {title}
    </div>
  )

  return (
    <div
      role={onDetail ? "button" : undefined}
      tabIndex={onDetail ? 0 : undefined}
      onClick={() => onDetail?.()}
      onKeyDown={(e) => {
        if (!onDetail) return
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          onDetail()
        }
      }}
      style={{
        background: "white",
        borderRadius: 16,
        border: `${borderWidth}px solid ${borderColor}`,
        boxShadow: isSelected
          ? "0 6px 22px rgba(91,84,214,0.14)"
          : isTop
            ? "0 4px 16px rgba(91,84,214,0.07)"
            : "0 2px 10px rgba(26,26,46,0.04)",
        overflow: "hidden",
        transition: "border-color 0.15s, box-shadow 0.15s",
        cursor: onDetail ? "pointer" : "default",
      }}
    >
      <div style={{ position: "relative", height: 200 }}>
        {hero}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.06) 0%, transparent 35%, rgba(0,0,0,0.35) 100%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 10,
            pointerEvents: "none",
          }}
        >
          <RankBadge rank={rank} />
        </div>
        {kindBadgeLabel ? (
          <div
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 10,
                fontWeight: 800,
                letterSpacing: 0.2,
                color: "white",
                background: "rgba(91,84,214,0.88)",
                padding: "4px 9px",
                borderRadius: 7,
                border: "1px solid rgba(255,255,255,0.35)",
              }}
            >
              {kindBadgeLabel}
            </span>
          </div>
        ) : null}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: 12,
            right: 12,
            pointerEvents: "none",
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: "white",
              margin: 0,
              lineHeight: 1.3,
              letterSpacing: -0.3,
              textShadow: "0 1px 8px rgba(0,0,0,0.45)",
              overflow: "hidden",
              textOverflow: "ellipsis",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {title}
          </h3>
        </div>
      </div>
    </div>
  )
}
