/**
 * 한국어 위키백과 공개 REST 요약(extract·썸네일) — 장소 소개 부재 시 참고용.
 * 출처: https://ko.wikipedia.org/wiki/위키백과:저작권 (CC BY-SA 등)
 */

export type KoWikiSummary = {
  extract: string | null
  thumbnailUrl: string | null
}

function candidateTitles(seed: string): string[] {
  const t = seed.replace(/\s+/g, " ").trim()
  if (!t.length) return []
  const seen = new Set<string>()
  const push = (s: string) => {
    const x = s.trim()
    if (x.length >= 2) seen.add(x)
  }
  push(t)
  push(t.replace(/\([^)]*\)/g, "").trim())
  push(t.replace(/\(.*?\)/g, "").trim())
  const comma = t.split(/[,，]/)[0]?.trim()
  if (comma) push(comma)
  const parts = t.split(/\s/).filter(Boolean)
  if (parts.length >= 4) push(parts.slice(0, Math.min(6, parts.length)).join(" "))
  return [...seen]
}

export async function fetchKoWikipediaSummary(seedTitle: string): Promise<KoWikiSummary> {
  for (const title of candidateTitles(seedTitle)) {
    try {
      const url = `https://ko.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
      })
      if (!res.ok) continue
      const data = (await res.json()) as {
        extract?: string
        type?: string
        thumbnail?: { source?: string }
      }
      if (data.type === "disambiguation") continue
      const ex = data.extract?.trim()
      const thumb = data.thumbnail?.source?.trim() ?? null
      if (ex && ex.length >= 28) {
        return { extract: ex, thumbnailUrl: thumb }
      }
    } catch {
      continue
    }
  }
  return { extract: null, thumbnailUrl: null }
}

/** @deprecated 호환용 — extract만 필요할 때 */
export async function fetchKoWikipediaExtract(seedTitle: string): Promise<string | null> {
  const r = await fetchKoWikipediaSummary(seedTitle)
  return r.extract
}
