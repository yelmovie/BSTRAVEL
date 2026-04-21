import { useI18n } from "../../i18n/I18nContext"
import { localeToTourApiLang } from "../../i18n/tourLang"

type Props = {
  variant?: "compact" | "comfortable"
}

/** TourAPI `lang` 안내 한 줄만 표시합니다(외부 번역·추가 설명 없음). */
export function TourApiDataLanguageStrip({ variant = "compact" }: Props) {
  const { locale, t } = useI18n()
  const lang = localeToTourApiLang(locale)

  const pad = variant === "comfortable" ? "10px 12px" : "8px 10px"
  const fontSize = variant === "comfortable" ? 11 : 10

  return (
    <div
      role="note"
      style={{
        borderRadius: 10,
        border: "1px solid #E4E6EF",
        background: "#FAFBFF",
        padding: pad,
        boxShadow: "0 1px 4px rgba(26,26,46,0.04)",
        display: "flex",
        flexDirection: "column",
        gap: variant === "comfortable" ? 8 : 6,
      }}
    >
      <div style={{ fontSize, color: "#6B6B88", lineHeight: 1.45 }}>
        {lang ? t("tourContent.apiQueryLine", { code: lang }) : t("tourContent.apiQueryDefault")}
      </div>
      {locale !== "ko" ? (
        <div style={{ fontSize: fontSize - 1, color: "#9EA0B8", lineHeight: 1.45 }}>
          {t("tourContent.partialRawNotice")}
        </div>
      ) : null}
    </div>
  )
}
