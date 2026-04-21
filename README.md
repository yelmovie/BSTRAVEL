# BSTRAVEL
Travel Planning App Design

Figma 기반 원안: [Travel Planning App Design](https://www.figma.com/design/BJdGwJKMoyQox0nR7pmiqY/Travel-Planning-App-Design)

## 스택

- **Vite 6** + **React** + **React Router 7** (SPA)
- **TourAPI(KorWithService2)**: 개발 시 Node 프록시 `server/tourApi.mjs` — 브라우저는 동일 출처 `/api/tour/*`만 호출
- 연동·트러블슈팅: [`docs/TOURAPI_DEBUGGING.md`](docs/TOURAPI_DEBUGGING.md)

## 사전 준비

1. 프로젝트 루트에 **`env.local.example`**을 참고해 **`.env.local`** 생성  
2. 최소 **`VISITKOREA_SERVICE_KEY`**(Tour), **`VITE_KAKAO_MAP_JS_KEY`**(카카오맵 시연) 등 필요한 값 입력

## 실행 (권장: pnpm)

```bash
pnpm install
pnpm dev
```

- **`pnpm dev`**: Tour API 서버(기본 포트 `3080`)와 **Vite**를 **동시에** 띄웁니다 (`package.json`의 `concurrently` 참고).
- **API만**: `pnpm run dev:api`
- **Vite만**: `pnpm run dev:vite` — 이 경우 `/api/tour` 프록시 대상이 없으면 Tour 연동이 실패할 수 있습니다.

## 빌드·배포

- **`pnpm run build`**: **정적 프론트**만 생성합니다.  
- **`vite build` 결과만** 배포하면 **Tour 프록시는 포함되지 않습니다.** 운영에서는 `server/tourApi.mjs` 등을 **별도 호스트/리버스 프록시**로 두는 방식이 필요합니다. → 상세는 `docs/TOURAPI_DEBUGGING.md`의 프로덕션 절.

## 데이터 소스 (제품 관점 한 줄)

- 메인 모바일/데스크톱 **코스·추천 플로우**의 많은 화면은 **`src/app/data/places.ts` 목업 데이터**를 사용합니다.
- **한국관광공사 API + 카카오맵** 연동 시연·통합 UI는 **`/mobile/tour-debug`** (`TourApiTestScreen` 및 `tour-workbench` 컴포넌트)에서 확인할 수 있습니다.

## 참고 폴더

- Next App Router 예시(본 빌드와 별도): `examples/next-app-router-tour/`
