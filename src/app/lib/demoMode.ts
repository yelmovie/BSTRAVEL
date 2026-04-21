/**
 * 시연 확장 기능(예시 코스 섹션, 비교·외부맵 보조 CTA, 목록 정렬 칩 등) 표시 여부.
 * 공모전 본 시연은 `false`(기본)로 두고 핵심 경로만 노출할 수 있습니다.
 */
export function isDemoMode(): boolean {
  return import.meta.env.VITE_DEMO_MODE === "true"
}
