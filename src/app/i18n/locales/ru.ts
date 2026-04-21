import en from "./en"
import { mergeDeep } from "../mergeMessages"

const overrides = {
  common: {
    appName: "Пусан вместе",
    pilotRegion: "Пилот · Пусан",
    pilotBadge: "Пилот",
    ktoBadge: "На базе KTO OpenAPI",
    home: "Главная",
    language: "Язык",
    selectLanguageTitle: "Выберите язык",
    languageApplyHint: "Выбранный язык применяется ко всему приложению.",
    foreignerBanner: "Есть иностранные спутники? Смените язык в правом верхнем углу.",
    globeAria: "Выбор языка",
    continueWithKo: "Продолжить на корейском",
  },
} as const

export default mergeDeep(en as unknown as Record<string, unknown>, overrides as unknown as Record<string, unknown>) as typeof en
