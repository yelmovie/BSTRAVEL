/**
 * 배포(Vercel): `VITE_API_BASE_URL` 비우면 동일 출처 `/api/weather` (api/weather.mjs).
 *
 * 로컬 제약 (버그 아님):
 * · `vite` 단독 + origin 비움 → 브라우저가 상대경로 `/api/weather` 만 호출 → Vite에 해당 라우트 없으면 404 가능
 * · 해결: `pnpm dev`(api+vite 동시), 또는 `VITE_API_BASE_URL=http://127.0.0.1:3080`, 또는 `vercel dev`
 */
export function getWeatherApiOrigin(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  return typeof raw === "string" ? raw.replace(/\/$/, "") : ""
}

/** @param pathAndQuery — 예: `/api/weather?lat=35&lng=129&mode=current` */
export function weatherRequestUrl(pathAndQuery: string): string {
  const origin = getWeatherApiOrigin()
  const path = pathAndQuery.startsWith("/") ? pathAndQuery : `/${pathAndQuery}`
  if (!origin) return path
  return `${origin}${path}`
}

/** 개발자용: 로컬 상대경로 /api/weather 실패 시에만 힌트 (호출부에서 `import.meta.env.DEV` 로 감싸면 PROD 번들에서 호출 제거 가능) */
export function warnIfDevLocalWeatherLikelyMisconfigured(res: Response, resolvedUrl: string): void {
  if (!import.meta.env.DEV) return
  if (res.ok) return
  if (getWeatherApiOrigin() !== "") return
  if (!resolvedUrl.includes("/api/weather")) return
  // eslint-disable-next-line no-console
  console.warn(
    `[weather] HTTP ${res.status} ${resolvedUrl.slice(0, 88)} — ` +
      "Vite 단독이면 `/api/weather` 백엔드가 없을 수 있음(정상 제약). " +
      "`VITE_API_BASE_URL`(예: http://127.0.0.1:3080), `pnpm dev`, 또는 `vercel dev`. " +
      "docs/deploy-smoke-checklist.md",
  )
}
