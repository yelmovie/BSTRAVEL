# TourAPI + 카카오맵 연동 점검표

Vite + React SPA, TourAPI는 `server/tourApi.mjs` → `GET /api/tour/*`, 카카오맵은 브라우저에서 `VITE_KAKAO_MAP_JS_KEY`로 SDK 로드.

## 1. TourAPI 키 오류

- **증상**: `MISSING_SERVICE_KEY`, `TOURAPI_30` 등, HTTP 502/503
- **확인**: `.env.local`의 `VISITKOREA_SERVICE_KEY`, `/api/tour/health`의 `hasServiceKey`
- **주의**: 인증키를 URL 인코딩된 채로 넣으면 이중 인코딩으로 실패할 수 있음

## 2. TourAPI 엔드포인트·파라미터 오타

- **증상**: HTTP 404, `INVALID_JSON`, 빈 `items`
- **확인**: `server/tourApi.mjs`의 오퍼레이션명이 공공데이터포털 명세와 일치하는지 (`areaBasedList2`, `detailCommon2`, `searchKeyword2`)

## 3. JSON / XML 형식

- **증상**: JSON 파싱 실패, `INVALID_JSON`
- **확인**: 서버가 `_type=json` 고정 주입하는지(`visitkoreaClient.mjs`). 응답 `Content-Type` 및 본문 앞수글자

## 4. `item`이 배열이 아닐 때

- **증상**: 런타임에서 `item.forEach is not a function` 등
- **처리**: `server/visitkoreaClient.mjs`의 `extractItemsFromBody`가 단일 객체를 배열로 감쌈. 클라이언트는 정규화 함수만 호출

## 5. 카카오맵 403·로딩 실패

- **증상**: 스크립트 `onerror`, 콘솔 네트워크 탭 403
- **확인**: JavaScript 키 오타, **플랫폼(Web) 도메인**에 현재 접속 URL(예: `http://localhost:5173`) 등록 여부

## 6. 카카오 디벨로퍼스 도메인 등록

- 카카오맵 앱 설정 → **플랫폼** → Web 사이트 도메인에 로컬/배포 도메인 추가
- 미등록 시 SDK는 내려와도 지도 초기화 단계에서 제한될 수 있음

## 7. 카카오맵 사용 설정 ON

- 내 애플리케이션 → 앱 설정 → **사용 API 설정**에서 **카카오맵** 사용 ON 여부 확인

## 8. 이미지·좌표 없는 관광지

- **이미지**: `normalizeTourItem`에서 `missingOriginalImage` 플래그 + SVG placeholder
- **좌표**: `parseWgs84FromTourMapStrings`가 범위 밖이면 `hasValidCoordinates: false` → 마커 생략, 목록에 `좌표 없음` 배지

## 9. 호출량·rate limit

- 공공데이터포털·카카오맵 각각 트래픽 정책 확인. 개발 계정 한도 초과 시 간헐 실패

## 10. mock 데이터 fallback

- **RecommendationScreen**: KorWith 실패 시에도 기존 `PLACES` 데모 코스 유지 → 서비스 데모 연속성
- **tour-debug**: 실 API만 표시해 연동 검증에 집중

## 확장 TODO (공식 문서 확인 후)

- **마커 클러스터러**: SDK `libraries=clusterer` 등 공식 파라미터 확인 후 스크립트 URL 확장
- KorWith 전용 무장애 단일 조회 오퍼레이션: 매뉴얼 확정 후 `server/tourApi.mjs`에 경로 추가

## 관련 문서

- `docs/TOURAPI_DEBUGGING.md` — TourAPI 전용
- 카카오: [카카오맵 Web 가이드](https://apis.map.kakao.com/web/guide/)
