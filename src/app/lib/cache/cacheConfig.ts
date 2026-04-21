/**
 * 캐시 TTL 기본값 — 숫자는 이 파일에서만 정의 (하드코딩 분산 방지)
 * 단위: ms
 */
export const CACHE_TTL_MS = {
  /** 1분 — 짧은 휴지 */
  short: 60_000,
  /** 날씨·실패 fallback 캐시 — 잘못된 값 장기 고정 방지 */
  weatherFallback: 2 * 60_000,
  /** 5분 — 일반 API 응답 */
  medium: 5 * 60_000,
  /** 동일 조건 추천 목록 — 재계산(Tour·파이프라인) 비용 큼 → 30분 재사용 */
  recommend: 30 * 60_000,
  /** 30분 — 날씨 격자 예보 슬롯 (서버 메모리) */
  weather: 30 * 60_000,
  /** 2분 — 클라이언트 탭 내 `/api/weather` 응답 재사용 (외부 Open-Meteo 아님, UX·함수 재호출 완화) */
  weatherClient: 2 * 60_000,
  /** KorService2 area 목록 — 전역 프록시와 동기(6시간) */
  tourList: 6 * 60 * 60_000,
  /** 6시간 — 장소별 혼잡도 base(일·분류만, 시간 가중 제외) */
  crowdBase: 6 * 60 * 60_000,
  /** (예약) 혼잡 fallback 플레이스홀더 장기 고정 방지 — 현재는 대부분 반환만, 저장 시 사용 */
  crowdFallback: 2 * 60_000,
  /** 30분 — 기타 메타데이터 */
  long: 30 * 60_000,
  /** 1시간 */
  oneHour: 60 * 60_000,
} as const
