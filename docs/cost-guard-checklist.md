# 비용 방어 점검 (캐시 · dedupe · TTL)

프로덕션 과금 폭증 방지를 위해 **외부 호출 수**와 **캐시 적중**을 주기적으로 확인합니다.

배포·로컬 경계 스모크: [`deploy-smoke-checklist.md`](deploy-smoke-checklist.md).

## 아키텍처 요약

| 구역 | 외부 호출 | 클라이언트 |
|------|-----------|------------|
| 날씨(Open-Meteo) | **`server/weatherShared.mjs`** — 로컬은 `tourApi`, 배포는 **`api/weather.mjs` (Vercel)** | `getWeather.ts` → `weatherRequestUrl('/api/weather?…')` (`VITE_API_BASE_URL` 선택) |
| TourAPI | `server/tourApi.mjs` 프록시 + area 목록 6h 캐시 + 슬림 item | `tourApiClient` + `CACHE_TTL_MS.tourList` |
| 추천 | `fetchRecommendationsForBusan` 파이프라인 | `getRecommend.ts` + `CACHE_TTL_MS.recommend` |
| 혼잡 base 비율 | 없음(계산) | `getCrowd.ts` + `CACHE_TTL_MS.crowdBase` |

## TTL (`src/app/lib/cache/cacheConfig.ts`)

| 키 | 값 | 용도 |
|----|-----|------|
| `weather` | 30분 | 정상 날씨 JSON(서버 메모리, weatherShared) |
| `weatherClient` | 2분 | 클라 탭 내 동일 조건 `/api/weather` 응답 재사용 |
| `weatherFallback` | 2분 | 클라 placeholder 캐시(실패 시) |
| `recommend` | 30분 | 동일 조건 추천 결과 |
| `tourList` | 6시간 | Tour area 목록(클라 memo + 서버 area-based) |
| `crowdBase` | 6시간 | 장소·일별 공식 비율 base |
| `crowdFallback` | 2분 | 예약 상수(향후 혼잡 fallback 저장 시) |

## Dedupe

- **`requestDedupe.ts`**: 동일 키 동시 `Promise` 공유. 성공·실패 후 `finally`에서 Map 제거.
- **날씨(브라우저)**: `simpleCache`(weatherClient) + `runDeduped`.
- **날씨(서버)**: `weatherShared.mjs` — `weatherInflight` + TTL 맵 (tourApi·Vercel 함수 각각 프로세스 단위).

## 개발 환경 로그 (프로덕션 출력 없음)

`import.meta.env.DEV === true` 일 때만:

- `[cache-hit]` — `simpleCache` get (위 키 접두·경로와 일치할 때만; 첫 요청 miss 는 로그 생략해 이중 로그 방지)
- `[dedupe-hit]` — `requestDedupe`
- `[external-fetch]` — 추천 파이프라인 실제 실행 직전
- `[fallback-used]` — 날씨 `/api/weather` 실패 후 placeholder
- **Node** `WEATHER_CACHE_DEBUG=1` 또는 `NODE_ENV!=production`: `[cache-hit]` / `[dedupe-hit]` / `[external-fetch]` (도메인만)

## 수동 검증 시나리오

1. **날씨 동일 좌표·시간 3회**: 서버 콘솔에서 `external-fetch` 는 **최초 1회**, 이후 `cache-hit`.
2. **추천 동일 조건 3회**: DEV 콘솔 `cache-hit` (두 번째부터) 또는 첫 요청만 `external-fetch`.
3. **혼잡 동일 place·날짜 3회**: `crowd:` 키 `cache-hit` (base 비율).
4. **동시 요청 5개**: `pnpm test` 의 `requestDedupe.test.ts` + 브라우저에서 동일 훅 빠른 리마운트 시 `dedupe-hit`.

## 향후 KV / Redis

`src/app/lib/cache/cacheProvider.ts` + `setCacheProvider()` 로 교체. **`requestDedupe`는 그대로** 둡니다(프로세스 동시성용).

## 한계

- 메모리 캐시는 **프로세스/탭 단위** — 서버리스 인스턴스 간 공유 없음.
- 장기적으로 지역 공유 캐시(KV/Redis)가 유리.
