import fs from "node:fs"
import path from "node:path"

type LocaleCode = "ko" | "en" | "ja" | "zh-CN" | "zh-TW" | "ar" | "ru"

const ACTIVE_LOCALES: LocaleCode[] = ["ko", "en", "ja", "zh-CN", "zh-TW"]
const ALL_LOCALES: LocaleCode[] = ["ko", "en", "ja", "zh-CN", "zh-TW", "ar", "ru"]
const IGNORE_BLANK_KEYS = new Set(["entry.heroLine2"])

const baseDir = path.resolve("src/app/i18n/locales")

function readLocaleFile(code: LocaleCode): string {
  return fs.readFileSync(path.join(baseDir, `${code}.ts`), "utf8")
}

function extractObjectLiteral(source: string, marker: string): string {
  const markerIdx = source.indexOf(marker)
  if (markerIdx < 0) throw new Error(`marker not found: ${marker}`)
  const braceStart = source.indexOf("{", markerIdx)
  if (braceStart < 0) throw new Error(`object start not found for marker: ${marker}`)

  let depth = 0
  let inSingle = false
  let inDouble = false
  let inTemplate = false
  let prev = ""

  for (let i = braceStart; i < source.length; i += 1) {
    const ch = source[i]
    if (!inDouble && !inTemplate && ch === "'" && prev !== "\\") inSingle = !inSingle
    else if (!inSingle && !inTemplate && ch === '"' && prev !== "\\") inDouble = !inDouble
    else if (!inSingle && !inDouble && ch === "`" && prev !== "\\") inTemplate = !inTemplate
    else if (!inSingle && !inDouble && !inTemplate) {
      if (ch === "{") depth += 1
      if (ch === "}") {
        depth -= 1
        if (depth === 0) return source.slice(braceStart, i + 1)
      }
    }
    prev = ch
  }

  throw new Error(`unclosed object literal for marker: ${marker}`)
}

function parseObjectLiteral(literal: string): Record<string, unknown> {
  const cleaned = literal.replace(/\bas const\b/g, "")
  return Function(`"use strict"; return (${cleaned});`)() as Record<string, unknown>
}

function mergeDeep(
  base: Record<string, unknown>,
  override: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...base }
  for (const [k, ov] of Object.entries(override)) {
    const bv = out[k]
    if (
      ov &&
      typeof ov === "object" &&
      !Array.isArray(ov) &&
      bv &&
      typeof bv === "object" &&
      !Array.isArray(bv)
    ) {
      out[k] = mergeDeep(
        bv as Record<string, unknown>,
        ov as Record<string, unknown>,
      )
    } else {
      out[k] = ov
    }
  }
  return out
}

function flattenLeafValues(input: unknown, prefix = ""): Record<string, unknown> {
  if (!input || typeof input !== "object") return {}
  const out: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input as Record<string, unknown>)) {
    const next = prefix ? `${prefix}.${k}` : k
    if (typeof v === "string") out[next] = v
    else if (Array.isArray(v)) {
      v.forEach((item, idx) => {
        const arrKey = `${next}.${idx}`
        if (typeof item === "string") out[arrKey] = item
        else if (item && typeof item === "object")
          Object.assign(out, flattenLeafValues(item, arrKey))
        else out[arrKey] = item
      })
    } else if (v && typeof v === "object") {
      Object.assign(out, flattenLeafValues(v, next))
    } else {
      out[next] = v
    }
  }
  return out
}

function loadLocaleObject(code: LocaleCode, koObj?: Record<string, unknown>, enObj?: Record<string, unknown>) {
  const src = readLocaleFile(code)
  if (code === "ar" || code === "ru") {
    if (!enObj) throw new Error(`${code} requires en base locale`)
    const overrideLiteral = extractObjectLiteral(src, "const overrides")
    const overrides = parseObjectLiteral(overrideLiteral)
    return mergeDeep(enObj, overrides)
  }
  if ((code === "ja" || code === "zh-CN" || code === "zh-TW") && src.includes("mergeDeep(")) {
    if (!koObj) throw new Error(`${code} requires ko base locale`)
    const overrideLiteral = extractObjectLiteral(src, "const overrides")
    const overrides = parseObjectLiteral(overrideLiteral)
    return mergeDeep(koObj, overrides)
  }
  const exportLiteral = extractObjectLiteral(src, "export default")
  return parseObjectLiteral(exportLiteral)
}

function main() {
  const includeAll = process.argv.includes("--all")
  const locales = includeAll ? ALL_LOCALES : ACTIVE_LOCALES

  const koObj = loadLocaleObject("ko")
  const enObj = loadLocaleObject("en")

  const localeMap: Record<LocaleCode, Record<string, unknown>> = {
    ko: flattenLeafValues(koObj),
    en: flattenLeafValues(enObj),
    ja: flattenLeafValues(loadLocaleObject("ja", koObj, enObj)),
    "zh-CN": flattenLeafValues(loadLocaleObject("zh-CN", koObj, enObj)),
    "zh-TW": flattenLeafValues(loadLocaleObject("zh-TW", koObj, enObj)),
    ar: flattenLeafValues(loadLocaleObject("ar", koObj, enObj)),
    ru: flattenLeafValues(loadLocaleObject("ru", koObj, enObj)),
  }

  const baseKeys = Object.keys(localeMap.ko).sort()
  let hasError = false

  // eslint-disable-next-line no-console
  console.log(`base locale: ko (${baseKeys.length} keys)`)

  // eslint-disable-next-line no-console
  console.log(`mode: ${includeAll ? "all-locales" : "active-locales"}`)

  for (const code of locales) {
    const map = localeMap[code]
    const keys = Object.keys(map).sort()
    const missing = baseKeys.filter((k) => !(k in map))
    const extra = keys.filter((k) => !(k in localeMap.ko))
    const blank = keys.filter(
      (k) =>
        typeof map[k] === "string" &&
        (map[k] as string).trim() === "" &&
        !IGNORE_BLANK_KEYS.has(k),
    )
    const typeMismatch = baseKeys.filter(
      (k) => k in map && typeof map[k] !== typeof localeMap.ko[k],
    )

    if (missing.length || blank.length || typeMismatch.length) hasError = true

    // eslint-disable-next-line no-console
    console.log(
      `${code}: total=${keys.length}, missing=${missing.length}, blank=${blank.length}, typeMismatch=${typeMismatch.length}, extra=${extra.length}`,
    )

    if (missing.length) {
      // eslint-disable-next-line no-console
      console.log(`  missing sample: ${missing.slice(0, 8).join(", ")}`)
    }
    if (blank.length) {
      // eslint-disable-next-line no-console
      console.log(`  blank sample: ${blank.slice(0, 8).join(", ")}`)
    }
    if (typeMismatch.length) {
      // eslint-disable-next-line no-console
      console.log(`  type mismatch sample: ${typeMismatch.slice(0, 8).join(", ")}`)
    }
  }

  if (hasError) process.exitCode = 1
}

main()
