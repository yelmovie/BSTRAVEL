import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import {
  ACTIVE_LOCALES,
  DEFAULT_LOCALE,
  FIRST_VISIT_STORAGE_KEY,
  LOCALE_STORAGE_KEY,
  type AppLocale,
} from "./constants"
import ko from "./locales/ko"
import en from "./locales/en"
import ja from "./locales/ja"
import zhCN from "./locales/zh-CN"
import zhTW from "./locales/zh-TW"
import ar from "./locales/ar"
import ru from "./locales/ru"

type Messages = typeof ko

const REGISTRY: Record<AppLocale, Messages> = {
  ko,
  en: en as Messages,
  ja: ja as Messages,
  "zh-CN": zhCN as Messages,
  "zh-TW": zhTW as Messages,
  ar: ar as Messages,
  ru: ru as Messages,
}

function readStoredLocale(): AppLocale {
  try {
    const raw = localStorage.getItem(LOCALE_STORAGE_KEY)
    if (raw && raw in REGISTRY) {
      const activeSet = new Set(ACTIVE_LOCALES.map((l) => l.code))
      if (activeSet.has(raw as AppLocale)) return raw as AppLocale
      return DEFAULT_LOCALE
    }
  } catch {
    /* ignore */
  }
  return DEFAULT_LOCALE
}

function getLeaf(obj: unknown, path: string): unknown {
  const parts = path.split(".").filter(Boolean)
  let cur: unknown = obj
  for (const p of parts) {
    if (cur === null || cur === undefined || typeof cur !== "object") return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return cur
}

function interpolate(template: string, vars?: Record<string, string>): string {
  if (!vars) return template
  let s = template
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v)
  }
  return s
}

export type I18nContextValue = {
  locale: AppLocale
  setLocale: (l: AppLocale) => void
  t: (key: string, vars?: Record<string, string>) => string
  messages: Messages
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() =>
    typeof window !== "undefined" ? readStoredLocale() : DEFAULT_LOCALE,
  )

  const messages = useMemo(() => REGISTRY[locale], [locale])

  const t = useCallback(
    (key: string, vars?: Record<string, string>) => {
      let leaf = getLeaf(messages, key)
      if (typeof leaf !== "string") {
        if (locale !== "ko") {
          leaf = getLeaf(en, key)
        }
      }
      if (typeof leaf !== "string") {
        leaf = getLeaf(ko, key)
      }
      const raw = typeof leaf === "string" ? leaf : key
      return interpolate(raw, vars)
    },
    [locale, messages],
  )

  const setLocale = useCallback((l: AppLocale) => {
    setLocaleState(l)
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, l)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = locale === "ar" ? "rtl" : "ltr"
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t,
      messages,
    }),
    [locale, setLocale, t, messages],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext)
  if (!ctx) {
    throw new Error("useI18n는 I18nProvider 안에서만 사용할 수 있습니다.")
  }
  return ctx
}
