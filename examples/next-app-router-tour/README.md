# Next.js App Router — TourAPI + 카카오맵 참고 구현

이 디렉터리는 **현재 루트 프로젝트(Vite)와 별개**입니다. `npx create-next-app@latest` 로 생성한 App Router 프로젝트의 `app/`, `lib/`, `components/`, `types/` 아래에 파일을 복사해 통합하세요.

- TourAPI: `VISITKOREA_SERVICE_KEY`는 **Route Handler에서만** 사용
- 카카오: `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`는 클라이언트 SDK 로드용
- 오퍼레이션: KorWithService2 — `areaBasedList2`, `detailCommon2` (공공데이터포털 명세). 무장애 **단일** 전용 오퍼레이션은 매뉴얼 확정 후 `app/api/tour/accessibility/route.ts` 추가 (현재 미포함)

## 복사 후 환경변수

- 예시 파일: 이 폴더의 `.env.example` 참고
- 실제 값은 프로젝트 루트 `.env.local`에만 두세요.

```
VISITKOREA_SERVICE_KEY=
NEXT_PUBLIC_KAKAO_MAP_JS_KEY=
NEXT_PUBLIC_APP_NAME=MovieSSam
```

## 실행 (Next 프로젝트 루트에서)

```bash
pnpm dev
```

브라우저에서 `/tour-demo` 접속.
