Refine the current “같이가능 부산” mobile product so that it visually and structurally matches the key storytelling and feature direction shown in the presentation samples.

IMPORTANT:
Do NOT redesign from scratch.
Preserve the current improved screens and layout system as much as possible.
Replace or add only what is necessary so the app feels much closer to the presentation sample screens and stronger as a public-data-based decision-support product.

Core product definition:
같이가능 부산 is a Busan-specialized travel feasibility planning service.
It is built mainly on Korea Tourism Organization OpenAPI.
Its core experience is:
추천 → 비교 → 판단 → 실행

The app should not feel like a generic recommendation app.
It should feel like a travel feasibility engine that helps users decide whether a route is realistically possible for selected companion conditions.

MAIN GOALS:
1. Keep current strong UI base
2. Make the experience match the presentation samples more closely
3. Strengthen recommendation → comparison → judgment → execution flow
4. Make KTO OpenAPI-based feasibility logic visually central
5. Add stronger Plan B / risk / comparison interactions
6. Keep Busan specialization clear
7. Keep Kakao Map integration visible for execution

VISUAL DIRECTION:
- keep the current refined calm UI
- cool neutral base, controlled purple accent
- strong hierarchy, not decorative
- no childish tone
- no generic startup AI vibe
- polished product UI, launch-ready quality

---

## SCREEN-BY-SCREEN IMPROVEMENTS

### 1. Companion selection screen
Keep the current multi-select structure.
Refine it so it feels closer to the “recommendation stage” concept in the presentation.
Add helper text that explains:
- selected companion conditions are used to calculate route feasibility
- this is not just preference input, but execution-condition input

Suggested Korean copy:
- 동행 조건을 선택하면 부산 권역 내 실제 가능한 코스를 분석합니다
- 이동 부담, 접근성, 안내 가능성, 혼잡도를 함께 고려합니다

CTA:
Replace generic AI wording with:
- 부산 추천 코스 분석 시작

Secondary button:
- 조건 직접 설정하기

---

### 2. Goal / purpose selection screen
Keep the existing card layout.
But simplify any overly technical “public data source” panel inside the main flow.
Instead, add a lighter “추천 기준 보기” information pattern.

Make sure KTO OpenAPI appears as the main analysis basis.
If a source box remains, KTO OpenAPI must be listed first and feel most central.

Suggested Korean copy:
- 부산에서 어떤 여행을 원하시나요?
- 목적을 선택하면 한국관광공사 OpenAPI 기반으로 코스를 분석합니다
- 추천 기준 보기

---

### 3. Analysis / loading screen
Keep the current loading screen and improve it.
It should match the “analysis” stage from the presentation more clearly.
Use fewer but stronger steps.

Recommended steps:
1. 동행자 조건 분석 중
2. 부산 관광 접근성 데이터 매칭 중
3. 위험 구간 탐지 중
4. 대안 코스 가능성 계산 중

Add current-analysis line examples:
- 보행 부담과 편의시설을 종합 분석 중입니다
- 혼잡 안정성과 동행 적합도를 계산 중입니다

This screen should feel like a real feasibility engine, not a decorative AI loading screen.

---

### 4. Recommendation results screen
This is the most important screen.
Keep the current card-based recommendation list, but make each card closer to the presentation logic.

Each recommendation card must include, in this order:
1. Busan area label
2. route rank badge
3. 같이가능 score
4. one-line recommendation reason near the top
5. estimated time
6. walking load
7. score breakdown bars
8. execution feasibility percentage
9. caution/risk row
10. alternative route availability
11. CTA buttons

Required CTA buttons:
- 자세히 보기
- 비교 담기
- 지도에서 확인

Examples of recommendation reason:
- 유모차와 외국인 동행 시 이동과 안내가 편한 부산 도심 코스입니다
- 어르신과 함께하기에 보행 부담이 비교적 적은 해운대 권역 코스입니다
- 휠체어와 유아차 이동을 함께 고려한 부산 실내 중심 코스입니다

Replace robotic labels like “위험 0개” with more product-like labels such as:
- 주의 요소 없음
- 일부 시간대 혼잡 가능
- 대안 코스 제공 가능

Add a clearer execution-feasibility indicator:
- 실행 가능성 93%

This screen must feel like “추천 + 판단”, not just recommendation.

---

### 5. Route detail screen
Keep the current structure and strengthen it.

Required order:
1. hero image
2. route title + Busan area label
3. 같이가능 score
4. interpretation sentence
5. why this route fits
6. facility summary
7. detailed location cards
8. comparison CTA
9. Kakao Map CTA
10. alternative route CTA

Add interpretation sentence below the score:
- 이 코스는 선택한 동행 조건 기준으로 실제 이동과 이용이 비교적 안정적인 편입니다
- 접근성과 동행 적합성이 높아 실행 가능성이 높은 코스입니다

Add a stronger “why this route fits” box.
This box should look important, not secondary.

Include facility certainty note when needed:
- 일부 편의시설 정보는 현장 상황에 따라 달라질 수 있습니다

CTA buttons:
- 이 코스로 출발하기
- 카카오맵으로 보기
- 다른 코스 비교하기
- 대안 코스 보기

---

### 6. Route comparison screen
Add or refine the comparison screen so it looks close to the presentation sample.

The comparison screen should compare 2–3 routes side by side.
Include:
- image
- small route preview map
- score
- time
- walking load
- crowd level
- facilities
- accessibility notes

Required structure:
- top title: 코스 비교
- side-by-side comparison cards
- summary line explaining which route is best for the selected companion profile

Add message:
- 추천이 아니라 선택을 돕는 서비스

Example summary text:
- 코스 A는 유모차와 외국인 동행에 가장 적합합니다
- 코스 B는 시간이 더 짧지만 일부 경사 구간이 있습니다

CTA:
- 이 코스 선택하기
- 비교 종료

---

### 7. Feasibility judgment screen or module
Add a stronger judgment layer inspired by the presentation.

This can be:
- a dedicated judgment screen
or
- a judgment module inside recommendation/detail flow

Required elements:
- large score or gauge
- 실행 가능성 92% / 93%
- score breakdown
- one-line interpretation
- warning if any risky segment exists

This section must feel like:
“판단”
not just “result display”

Use Korean labels:
- 실행 가능성
- 현재 예측
- 이동 부담
- 동행 적합성
- 혼잡 안정성
- 연계성

---

### 8. Risk zone + Plan B execution screen
Strengthen the current timeline / execution flow so it matches the presentation’s “실행” stage.

Add:
- 위험 구간 표시
- 돌발 상황 알림
- Plan B route visualization
- dynamic switch option

Possible UI pattern:
- route map with one highlighted risk segment
- dotted line to alternative route
- floating execution-feasibility badge
- Plan B card

Required labels:
- 위험 구간
- 실행 가능성 93%
- 대체 코스 Plan B
- 이 코스가 어려우면 대안 코스로 전환하기

Kakao Map actions must appear here:
- 카카오맵 길찾기 열기
- 코스 전체 지도 보기
- 대안 코스 지도 다시 보기

This screen should be the strongest differentiator.

---

## PRODUCT COPY DIRECTION
Use Korean copy that feels:
- professional
- data-based
- strategic
- concise
- trustworthy

Avoid overusing:
- AI 맞춤
- 생성하기
- generic startup-style labels

Prefer:
- 공공데이터 기반 분석
- 실행 가능성
- 추천 이유
- 대안 코스
- 비교 담기
- 동행 적합성
- 한국관광공사 OpenAPI 기반 분석

---

## KTO OpenAPI EMPHASIS
The service must visually feel powered by Korea Tourism Organization OpenAPI.
Do not visually let non-KTO data feel more central.

Core KTO APIs to imply:
- 무장애 여행 정보
- 국문 관광정보 서비스
- 다국어 관광정보 서비스
- 관광지별 연관 관광지 정보

---

## BUSAN SPECIALIZATION
Keep the service clearly Busan-specialized.
Use Busan area labels where appropriate.
Do not let the app feel like a nationwide travel app.

---

## KAKAO MAP INTEGRATION
Make Kakao Map actions visible in:
- recommendation cards
- detail screen
- execution/risk screen

Use labels:
- 지도에서 확인
- 카카오맵으로 보기
- 카카오맵 길찾기 열기

---

## FINAL DESIGN INTENT
The final product should feel like:
- a Busan-specialized tourism feasibility engine
- powered by Korea Tourism Organization OpenAPI
- visually aligned with the presentation samples
- recommendation + comparison + judgment + execution
- real, strategic, competition-ready