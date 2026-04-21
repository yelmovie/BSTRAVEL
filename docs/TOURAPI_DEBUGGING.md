# TourAPI(KorWithService2) 연동 디버깅 가이드

이 프로젝트는 **Vite + React SPA**이며, `serviceKey`는 **`server/tourApi.mjs`** 프로세스의 환경변수(`VISITKOREA_SERVICE_KEY`)에서만 읽습니다. 브라우저는 동일 출처의 `/api/tour/*`만 호출합니다.

## 연결 구조

1. `pnpm dev` → `node server/tourApi.mjs`(기본 3080) + `vite`
2. Vite `server.proxy`가 `/api/tour`를 `127.0.0.1:3080`으로 전달
3. Node가 `https://apis.data.go.kr/B551011/KorWithService2/{operation}` 호출 시 `serviceKey`, `MobileOS=ETC`, `MobileApp`, `_type=json` 자동 주입

### 다국어 `lang` 쿼리

- 브라우저에서 선택한 UI 언어에 맞춰 `/api/tour/*` 요청에 `lang`(예: `en`, `ja`, `zh-CN`)이 붙습니다. 매핑은 `src/app/i18n/tourLang.ts` 한 곳에서 관리합니다.
- 공공데이터포털 **무장애 여행 정보(KorWithService2)** 명세의 파라미터 이름·허용 값과 다르면 해당 파일만 수정하면 됩니다.
- 번역 필드가 비어 있거나 한국어만 오는 경우 UI에 **부분 번역·한국어 원문** 안내를 표시합니다(기계 번역과 구분).

### 자동 번역 폴백 (`/api/translate`)

- 미번역 필드 보강용 **POST `/api/translate`** (본 Node 서버와 동일 포트). 클라이언트는 **API 키를 보관하지 않습니다**.
- **우선순위**: `DEEPL_API_KEY`(또는 `DEEPL_AUTH_KEY`)로 **DeepL 무료 엔드포인트**(`api-free.deepl.com`) → 실패 시 `GOOGLE_TRANSLATE_API_KEY`가 있으면 Google Translation v2.
- 요청 JSON: `{ "texts": string[], "target": "en", "source": "ko" }` (`target`은 클라이언트와 동일한 소문자 코드)
- 응답: `{ ok: true, data: { translations: string[] } }`
- 서버 매핑: `server/translateDeepL.mjs`, `server/translateRouter.mjs`
- 캐시·감지·UI 분리: `src/app/lib/translation/*`, 통합 `src/app/lib/tour/enrichTourPlacesHybrid.ts`

## 사용 중인 오퍼레이션 (KorWithService2)

| 프록시 경로 | TourAPI 오퍼레이션 | 용도 |
|-------------|-------------------|------|
| `GET /api/tour/area-based` | `areaBasedList2` | 지역 기반 목록 |
| `GET /api/tour/detail/common` | `detailCommon2` | 상세 공통정보 |
| `GET /api/tour/search-keyword` | `searchKeyword2` | 키워드 검색(접근성 키워드 검색 등에 활용) |

명세·파라미터는 공공데이터포털 **「한국관광공사_무장애 여행 정보_GW」** 및 배포 매뉴얼 `개방데이터_활용매뉴얼(무장애여행).zip`을 기준으로 합니다.

### `detailCommon2` · `addrinfoYN` (KorService2)

- 본 프로젝트의 `server/tourApi.mjs` / `server/tourDetailParams.mjs` 는 `detailCommon2` 요청에 **`addrinfoYN` 쿼리를 붙이지 않습니다.**
- 일부 공공데이터 게이트웨이는 `addrinfoYN` 을 `addinfoYn` 등으로 보고 `INVALID_REQUEST_PARAMETER_ERROR` 를 반환하는 사례가 있어, **상세 주소 필드는 응답 본문·다른 필드**에 의존합니다.
- 상세 실패 시 HTTP 502·`ok: false` JSON에 `endpoint: "detailCommon2"` 가 포함될 수 있습니다(서비스키·preview 원문은 본문에 넣지 않음).

### 브라우저 확장 프로그램 vs 앱 API

- 콘솔에 `content.js`, `chrome-extension://...`, `Cannot read properties of undefined (reading 'query')` 가 뜨는 경우 **앱 소스가 아니라 확장**에서 나는 오류인 경우가 많습니다.
- TourAPI·프록시 이슈는 **Network**에서 ` /api/tour/detail/common` 등 **같은 출처 요청의 status / response body**로 판단하세요.

## 점검 체크리스트

### 1) 인증키 문제

- **증상**: `TOURAPI_30`, `UNAUTHORIZED`, HTTP 401/403 유사 메시지, 또는 resultCode 비 `0000`
- **점검**: `.env.local`에 `VISITKOREA_SERVICE_KEY` 존재 여부. `GET /api/tour/health`의 `hasServiceKey`
- **주의**: 키를 **이미 URL 인코딩한 문자열**로 넣으면 `URLSearchParams`가 재인코딩하여 실패할 수 있음 → **포털에서 복사한 디코딩 키** 사용 권장

### 2) CORS 문제

- **증상**: 브라우저 콘솔에 `apis.data.go.kr` 직접 호출 CORS 에러
- **점검**: 클라이언트가 반드시 **`/api/tour/...`** 만 호출하는지. `visitkoreaClient`는 서버(Node)에서만 실행됨

### 3) 잘못된 endpoint / 오퍼레이션명

- **증상**: HTTP 404, HTML 응답, `INVALID_JSON`
- **점검**: `server/tourApi.mjs`의 `callKorWithService2` 첫 인자 오퍼레이션명. 공공데이터포털 Swagger/매뉴얼과 대조

### 4) JSON / XML 형식

- **증상**: `INVALID_JSON`, 파싱 실패
- **점검**: 요청에 `_type=json` 포함 여부(서버에서 고정 주입). 포털에서 XML만 지원하는 다른 서비스와 혼동 여부

### 5) 누락 파라미터

- **증상**: `TOURAPI_xx` 응용 오류, 빈 `items`
- **점검**: `detailCommon2`는 `contentId`, `contentTypeId` 필수. `searchKeyword2`는 `keyword` 필수

### 6) `item`이 배열이 아닐 때

- **증상**: 한 건만 올 때 클라이언트에서 배열 처리 실패
- **점검**: `server/visitkoreaClient.mjs`의 `extractItemsFromBody`가 단일 객체를 배열로 감쌈. 클라이언트도 `normalizeTourItem` 전 동일 로직 유지

### 7) null 이미지 / 좌표

- **증상**: 깨진 이미지, 지도 표시 실패
- **점검**: `normalizeTourItem.ts`의 placeholder 이미지, `mapx`/`mapy` 빈 문자열 시 UI에서 지도 호출 생략

### 8) 호출 제한 / 트래픽

- **증상**: 간헐적 실패, `LIMIT`, `TOO_MANY_REQUESTS`류(서비스별 상이)
- **점검**: 공공데이터포털 일일 트래픽·승인 상태. 운영 전환 시 심의·트래픽 상향 필요 여부

## 화면에서 검증

- `/mobile/tour-debug` : 헬스, 지역/키워드 목록, `detailCommon2` overview 확인
- `/mobile/recommendations` : 공공데이터 기반 추천 목록·배너 (화면 카피 참고)

## 프로덕션 배포 시

- `vite build` 결과물만 배포하면 **API 서버가 없음**. Node `server/tourApi.mjs`를 별도 프로세스로 두고, 리버스 프록시로 **`/api/tour`** 및 **`/api/crowd`** 를 해당 포트에 넘기거나, 동일 로직을 서버리스/백엔드로 이식해야 합니다.

## 다음 단계 제안

1. **카카오맵**: `/mobile/tour-debug` 에서 WGS84 마커 연동 완료 — 좌표계·경계 검증은 `docs/INTEGRATION_DEBUG.md` 참고
2. **추천 로직**: `NormalizedTourPlace` + 동행자 태그 스코어링
3. **필터 확장**: `areaBasedList2`의 `cat` 계열·무장애 전용 상세 오퍼레이션(매뉴얼 확인 후) 추가

## 통합 점검표

- TourAPI + 카카오 공통: **`docs/INTEGRATION_DEBUG.md`**
