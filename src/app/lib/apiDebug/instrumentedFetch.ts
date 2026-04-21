import { logApiDebug } from "./apiDebug"

function urlToString(input: RequestInfo | URL): string {
  if (typeof input === "string") return input
  if (input instanceof URL) return input.href
  return input.url
}

/** DEV에서만 지연·성공/실패를 apiDebug에 기록합니다. */
export async function instrumentedFetch(
  input: RequestInfo | URL,
  init: RequestInit | undefined,
  meta: { label: string },
): Promise<Response> {
  const url = urlToString(input)
  const t0 = performance.now()
  try {
    const res = await fetch(input, init)
    const ms = Math.round(performance.now() - t0)
    logApiDebug({
      label: meta.label,
      url,
      ms,
      ok: res.ok,
      status: res.status,
    })
    return res
  } catch (e) {
    const ms = Math.round(performance.now() - t0)
    logApiDebug({
      label: meta.label,
      url,
      ms,
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    })
    throw e
  }
}
