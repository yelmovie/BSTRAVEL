# 배포 전 스모크 체크리스트

**공통 전제** (README · `.env.example` · `vite.config.ts` 와 동일):

- **`vite.config.ts`**: `/api/tour`, `/api/crowd` 만 로컬 `TOURAPI_SERVER_PORT`(기본 3080)으로 프록시함. **`/api/weather` 는 프록시 없음.**
- **`pnpm run build` 산출물만** 배포하면 로컬 Vite 프록시는 포함되지 않음 → **동일 도메인에 `/api/tour`, `/api/crowd` 백엔드가 없으면 Tour/Crowd 기능 실패 가능** (별도 게이트웨이·Serverless 필요).
- **날씨**: Vercel은 루트 `api/weather.mjs`가 `GET /api/weather` 처리.

---

### 1. Vite 단독 (`pnpm dev:vite`) + `VITE_API_BASE_URL` 없음

| 기대 | 증상 |
|------|------|
| `GET` 상대경로 `/api/weather?...` → Vite에 핸들러 없으면 **404** (의도된 개발 제약, 버그 아님) | Network에 404, UI 날씨 placeholder |
| 날씨까지 보려면 `VITE_API_BASE_URL=http://127.0.0.1:3080` 또는 `pnpm dev` 또는 `vercel dev` | 200 + JSON `ok: true` |

---

### 2. `vercel dev` (로컬, 프로젝트 루트)

```bash
curl -sS "http://localhost:3000/api/weather?lat=35.18&lng=129.08&mode=current"
```

- **성공**: HTTP 200, JSON에 `"ok":true,"kind":"current",...`
- **실패**: 404/500 → Vercel 라우트·`api/weather.mjs` 확인 (포트는 `vercel dev` 출력 기준)

---

### 3. 배포 URL (프로덕션)

브라우저 또는:

```bash
curl -sS "https://<your-deployment>/api/weather?lat=35.18&lng=129.08&mode=current"
```

- **성공**: HTTP 200, 위와 동일 형태 JSON
- **실패 404**: 호스트만 같은 SPA만 배포됐거나 rewrite 문제 → `vercel.json` · Functions 탭 확인

---

### 4. Tour / Crowd

- 로컬: 브라우저에서 **`/api/tour/health`** 또는 **`/api/tour/area-based?...`** — 성공 시 프록시·서버키 정상.
- 배포: **`dist`만** 있으면 해당 경로 없음 → Network **404** 또는 실패. 정상 동작하려면 운영에서 **`README.md` 빌드·배포 절 · `docs/TOURAPI_DEBUGGING.md`** 대로 별도 API 제공.

반복 호출: 캐시는 있으나 **엔드포인트가 없으면 캐시로 복구 불가**.
