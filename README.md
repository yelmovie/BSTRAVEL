# BSTRAVEL
Travel Planning App Design

Figma 기반 원안: [Travel Planning App Design](https://www.figma.com/design/BJdGwJKMoyQox0nR7pmiqY/Travel-Planning-App-Design)

## 스택

- **Vite 6** + **React** + **React Router 7** (SPA)
- **TourAPI / 혼잡 / 날씨**: 개발 시 `server/tourApi.mjs` + Vite proxy — 브라우저는 `/api/tour/*`, `/api/crowd` (로컬 프록시), 날씨는 `/api/weather`(`vite`는 weather 프록시 없음·Vercel은 `api/weather.mjs`)
- 연동·트러블슈팅: [`docs/TOURAPI_DEBUGGING.md`](docs/TOURAPI_DEBUGGING.md)

## 사전 준비 (환경 변수)

비밀값은 Git에 올라가지 않습니다 (`.gitignore`). 자세한 내용은 **[`docs/env-setup.md`](docs/env-setup.md)** 참고.

1. `.env.local` 이 없으면 템플릿 복구: **`pnpm env:restore`** (기존 파일 덮어쓰기 안 함)
2. 루트 **`.env.local`** 에 최소 **`VISITKOREA_SERVICE_KEY`**(TourAPI), **`VITE_KAKAO_MAP_JS_KEY`**(카카오맵) 입력  
   - 참고 템플릿: `.env.local.example` (및 레거시 `env.local.example`)
3. 상태 점검: **`pnpm env:check`**
4. `.env` / `.env.local` 수정 후에는 **`pnpm dev` 를 재시작**해야 반영됩니다.

## 실행 (권장: pnpm)

```bash
pnpm install
pnpm dev
```

- **`pnpm dev`**: Tour API 서버(기본 포트 `3080`)와 **Vite**를 **동시에** 띄웁니다 (`package.json`의 `concurrently` 참고).
- **API만**: `pnpm run dev:api`
- **Vite만**: `pnpm run dev:vite` — `/api/tour`·`/api/crowd` 프록시 대상이 없으면 Tour·혼잡 연동이 실패할 수 있습니다. **`vite.config`는 `/api/weather`를 프록시하지 않음** — `VITE_API_BASE_URL=http://127.0.0.1:3080` 또는 `vercel dev` 없이 상대경로만 쓰면 `/api/weather`가 404일 수 있습니다(개발 제약).

## 빌드·배포

- **`pnpm run build`**: **정적 프론트**만 생성합니다.  
- **`vite build` 결과만** 배포하면 **로컬 Vite 프록시(Tour/Crowd)는 포함되지 않습니다.** 동일 도메인 `/api/tour`, `/api/crowd`가 없으면 해당 기능은 실패할 수 있습니다 — 별도 백엔드·리버스 프록시가 필요합니다. 상세는 `docs/TOURAPI_DEBUGGING.md`.  
- **날씨**: Vercel에서는 `api/weather.mjs`가 `/api/weather`를 처리합니다. 배포 전: [`docs/deploy-smoke-checklist.md`](docs/deploy-smoke-checklist.md).

## 브라우저 디버깅 (잠깐)

- 콘솔에 `content.js` / `chrome-extension` / `query` undefined 류가 보이면 **확장 프로그램** 오류일 수 있습니다. API 이슈는 **Network → `/api/tour/...`** 를 보세요. (자세한 설명: `docs/TOURAPI_DEBUGGING.md`)

## 데이터 소스 (제품 관점 한 줄)

- 메인 모바일/데스크톱 **코스·추천 플로우**의 많은 화면은 **`src/app/data/places.ts` 목업 데이터**를 사용합니다.
- **한국관광공사 API + 카카오맵** 연동 시연·통합 UI는 **`/mobile/tour-debug`** (`TourApiTestScreen` 및 `tour-workbench` 컴포넌트)에서 확인할 수 있습니다.

## 참고 폴더

- Next App Router 예시(본 빌드와 별도): `examples/next-app-router-tour/`
