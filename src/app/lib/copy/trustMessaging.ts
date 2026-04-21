/**
 * 공모전·심사 대응용 고정 카피 — 화면 간 동일 출처·추천 기준 유지
 */

/** 서비스 한 줄 (엔트리·히어로 보조) */
export const SERVICE_ONE_LINER_KO =
  "부산 여행 코스를 동행 조건에 맞춰 공공데이터 기반으로 추천합니다."

/** 엔트리용 한 줄 (조건 맞춤 자동 추천) */
export const ENTRY_TAGLINE_PRIMARY_KO =
  "부산 여행을 동행 조건에 맞게 자동 추천합니다."

/** 추천 기준 — 질문「기준이 뭐예요?」1문장 답 */
export const RECOMMENDATION_CRITERIA_ONE_LINE_KO =
  "동행 조건·이동 부담·장소 특성을 함께 고려한 참고용 추천입니다."

/** 결과 흐름 한 줄 — 심사용 이해도 보조 */
export const USER_FLOW_HINT_ONE_LINE_KO =
  "흐름: 조건 입력 → 이동 가능성 분석 → 추천 결과"

/** 목록 상단 — 선별 기준 안내 */
export const LIVE_LIST_SELECTION_SUMMARY_KO =
  "조건을 바탕으로 실제 방문 가능성을 고려해 후보를 골랐습니다."

/** 탭 아래 고정 — 이동편한 곳 필터 기준 */
export const ACCESSIBLE_TAB_THRESHOLD_NOTE_KO =
  "※ 「이동편한 곳」탭: 이동 편의 점수 60점 이상만 표시됩니다."

/** 필터·탭 근처 — 요인 요약 */
export const RECOMMENDATION_FACTORS_SUMMARY_KO =
  "추천 요약 기준: 거리 · 이동 시간 · 시설 정보"

/** 카드 한 줄 요약 fallback (accessibilityReasons 없을 때) */
export const CARD_FALLBACK_REASON_ONE_LINE_KO =
  "이동 가능성을 고려한 추천 장소"

/** 결과 상단 안내 — LIVE 목록임을 고정 인지 */
export const RESULT_PUBLIC_DATA_BANNER_KO =
  "현재 결과는 공공데이터 기반 추천입니다."

/** 카드 상단 배지 문구 */
export const CARD_SOURCE_BADGE_LIVE_KO = "공공데이터 기반 (TourAPI)"
export const CARD_SOURCE_BADGE_SIM_KO = "예시 시나리오 (실제 데이터 아님)"
export const CARD_SIM_SUBLINE_KO = "예시 시나리오 (TourAPI 기반 추천 아님)"

/** 상세 · 날씨·혼잡 출처 라벨 */
export const WEATHER_SOURCE_BADGE_KO = "실시간 날씨 (Open-Meteo)"
/** 혼잡 — 실측 연동 여부와 무관하게 공통 사용 (예측 체계) */
export const CROWD_PREDICTION_SOURCE_LINE_KO =
  "혼잡도 예측: 관광 공공데이터·시간대 기반 추정 (실시간 유동인구 실측 아님)"

/** 「이동편한 곳」탭 의미 — 확정 접근성 아님 */
export const ACCESSIBLE_TAB_MEANING_ONE_LINE_KO =
  "「이동편한 곳」은 확정적인 접근성 등급이 아니라, 공공 자료와 내부 기준으로 이동 부담이 상대적으로 적은 후보를 고른 필터입니다."

/** 지도 마커 vs 카드 유형 — 공공 분류 축 안내 */
export const MAP_MARKER_CLASSIFICATION_FOOTNOTE_KO =
  "※ 지도 아이콘은 공공데이터 분류 기준입니다. 카드 유형 표기와 다를 수 있습니다."

/** 카드 — 이동·편의 근거 블록 아래 짧은 각주 */
export const ACCESSIBLE_CARD_HINT_SECTION_SUBLINE_KO = "확정 평가 아님 · 참고용 근거 1~2개"

/** LIVE 목록 하단 — 방문 전 확인 */
export const ACCESSIBLE_LIST_FOOTER_SECOND_LINE_KO =
  "유형·순서는 참고용이며, 출입·시설·동선 난이도는 방문 전에 꼭 직접 확인해 주세요."

/** LIVE 목록 출처 줄 */
export const LIVE_LIST_SOURCE_LINE_KO =
  "한국관광공사 TourAPI·무장애 여행정보(공공데이터). 카드 근거 요약은 앱 내 규칙으로 산출합니다."

/** 카드 하단 출처 · LIVE */
export const CARD_ATTRIBUTION_LIVE_KO =
  "TourAPI·무장애 공공데이터 목록 · 근거 표시는 비공식 적합 요약입니다."

/** 카드 하단 출처 · 예시 시나리오 */
export const CARD_ATTRIBUTION_SIMULATION_KO =
  "예시 데이터(로컬 시연 시나리오, 공공 목록과 별개)"

/** 지도 블록 제목 — 「실시간」회피 */
export const MAP_BLOCK_TITLE_KO = "공공데이터 기반 추천 지도"

/** 상세 요약 패널 — 정렬 참고치 설명 */
export const SORT_WEIGHT_DISCLAIMER_KO =
  "목록 정렬·카드 근거 표시용 내부 참고치이며, 공식 관광 품질 점수가 아닙니다."

/** 혼잡 등 미연동 공통 */
export const PENDING_INTEGRATION_KO = "연동 준비 중"
