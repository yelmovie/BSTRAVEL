import ko from "./ko"
import { mergeDeep } from "../mergeMessages"

/** 아랍어 UI 핵심 문구만 별도 제공, 나머지는 한국어 fallback (mergeDeep) */
const overrides = {
  common: {
    appName: "بوسان معًا",
    pilotRegion: "تجريبي · بوسان",
    pilotBadge: "تجريبي",
    ktoBadge: "عبر KTO OpenAPI",
    home: "الرئيسية",
    language: "اللغة",
    selectLanguageTitle: "اختر اللغة",
    languageApplyHint: "تُطبَّق اللغة المختارة على التطبيق بالكامل.",
    foreignerBanner: "مع ضيوف من الخارج؟ غيّر اللغة من أعلى اليمين.",
    globeAria: "اختيار اللغة",
    continueWithKo: "المتابعة بالكورية",
  },
} as const

export default mergeDeep(ko as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>) as typeof ko
