# 환경 변수 설정 · 백업 · 복구

이 프로젝트는 **Vite**(프론트)와 **Node** `server/tourApi.mjs`(TourAPI 프록시)를 함께 사용합니다. 비밀키는 **저장소에 커밋하지 않습니다.**

## 파일 역할

| 파일 | Git | 용도 |
|------|-----|------|
| `.env.example` | ✅ 커밋됨 | 저장소 기준 **문서용** 예시. 모든 변수 설명·선택 항목 포함. |
| `.env.local.example` | ✅ 커밋됨 | **짧은 템플릿**. `pnpm env:restore` 가 이 파일을 `.env.local` 로 복사합니다. |
| `env.local.example` | ✅ 커밋됨 | 구 README 호환용 (내용은 `.env.local.example` 과 동일 목적). |
| `.env` | ❌ 무시 | 로컬 전용 (팀원마다 선택). 병합 시 먼저 로드됩니다. |
| `.env.local` | ❌ 무시 | **실제 비밀값을 두는 주된 위치**로 권장합니다. |

### 병합 규칙

`scripts/mergeProjectEnv.mjs`: 먼저 `.env`를 읽은 뒤, `.env.local`에서 **값이 비어 있지 않은 키만** 덮어씁니다.  
예시만 복사한 `.env.local` 의 빈 `키=` 줄이 `.env` 의 유효한 값을 가리지 않도록 되어 있습니다.

## 필수 변수 (로컬 개발)

| 변수 | 노출 | 설명 |
|------|------|------|
| `VISITKOREA_SERVICE_KEY` | 서버만 | 공공데이터포털 TourAPI 서비스키(평문 권장). |
| `VITE_KAKAO_MAP_JS_KEY` | **브라우저 번들에 포함** | 카카오맵 JavaScript 앱 키. 카카오 콘솔에서 도메인 등록 필요. |

## 선택 변수 · 기본값

| 변수 | 기본 · 비고 |
|------|-------------|
| `VISITKOREA_MOBILE_APP` | 코드 기본 `MovieSSam` |
| `TOURAPI_SERVER_PORT` | `3080` (`vite.config.ts` 프록시와 일치) |
| `VITE_APP_NAME` | 선택 |

### 혼잡 외부 API (서버 전용)

클라이언트는 **`GET /api/crowd`** 만 호출합니다. 업스트림 URL·인증키는 **`server/crowdApi.mjs`** 에서만 사용합니다.

| 변수 | 노출 |
|------|------|
| `CROWD_API_BASE_URL` | 서버만 |
| `CROWD_API_KEY` | 서버만 (`x-api-key` / `Bearer` 는 Node에서만 설정) |
| `CROWD_API_TIMEOUT_MS` | 서버만 (선택, 기본 10000ms) |
| `CROWD_API_ENABLED` | 서버만 (`false`/`off` 로 프록시 비활성화) |

**`VITE_CROWD_*`는 사용하지 않습니다.** (과거 버전 호환 필요 시 로컬에서만 삭제하고 위 변수로 옮기세요.)

## 디버그·안전 플래그 (선택)

- `TOURAPI_PROXY_DEBUG=1` — 프록시 로그 강화 (`server/tourApi.mjs`)
- `TOURAPI_DEBUG=1` — 클라이언트 요청 URL 로그 (`server/visitkoreaClient.mjs`)
- `TOURAPI_THROW_IF_NO_KEY=1` — 키 없으면 **서버 기동 시 종료**

## `VITE_` 접두사가 보이는 이유

Vite는 **`VITE_` 로 시작하는 변수만** 클라이언트 코드에 `import.meta.env` 로 주입합니다.  
따라서 **`VITE_KAKAO_MAP_JS_KEY`는 빌드 결과물에 문자열로 들어갑니다.** 공개되어도 되는 키(카카오 웹 JS 키 등)만 넣으세요.  
**`VISITKOREA_SERVICE_KEY`에는 `VITE_` 접두사를 붙이지 마세요.** 서버 프록시에서만 사용합니다.

## `.env.local` 이 사라지는 이유

- `.gitignore` 때문에 **커밋·복제 시 포함되지 않음** (의도된 동작)
- 브랜치 전환 / `git reset` / 새 머신 클론 시 로컬 파일만 없어짐
- 폴더 이동 시 숨김 파일 미복사

→ **비밀값은 별도 안전한 저장소**(암호 관리자, 암호화된 개인 노트 등)에 두고, 레포에서는 `pnpm env:restore` 후 다시 채우는 방식을 권장합니다.

## 복구 절차

1. 프로젝트 루트에서:

   ```bash
   pnpm env:restore
   ```

   `.env.local` 이 **없을 때만** `.env.local.example` → `.env.local` 복사합니다. 이미 있으면 **덮어쓰지 않습니다.**

2. `.env.local` 에 실제 키 입력 (`VISITKOREA_SERVICE_KEY`, `VITE_KAKAO_MAP_JS_KEY` 등).

3. **`pnpm dev` 완전히 종료 후 다시 실행** — 환경 변수는 프로세스 시작 시 읽습니다.

4. 확인:

   ```bash
   pnpm env:check
   ```

## 상태 점검

```bash
pnpm env:check
```

- `.env` / `.env.local` 존재 여부
- 필수 키 비어 있음 여부 (**값은 마스킹만** 출력)

종료 코드 `1` 은 필수 변수가 비어 있을 때 — CI나 사전 검증에 사용 가능합니다.

## 비밀값 백업 (수동 · 보안)

자동으로 레포 밖으로 비밀을 복사하는 스크립트는 제공하지 않습니다.

권장:

- 비밀번호 관리자의 안전한 노트
- **저장소 밖** 경로에 개인용 암호화 백업 (레포 디렉터리 안에 두지 않기)

절대:

- 실제 키가 들어 있는 파일을 Git에 커밋하지 않기
- 공개 채널에 키 붙여넣기

## 관련 스크립트

| 명령 | 설명 |
|------|------|
| `pnpm env:restore` | `.env.local` 템플릿 복구 (없을 때만 생성) |
| `pnpm env:check` | 병합 결과 기준 필수 변수 점검 |
