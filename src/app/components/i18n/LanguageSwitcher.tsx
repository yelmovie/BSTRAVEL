import { Globe } from "lucide-react"
import { useI18n } from "../../i18n/I18nContext"
import { SUPPORTED_LOCALES, type AppLocale } from "../../i18n/constants"

type Props = {
  /** 넓은 패딩 (헤더용) */
  variant?: "header" | "compact"
}

export function LanguageSwitcher({ variant = "header" }: Props) {
  const { locale, setLocale, t } = useI18n()
  const pad = variant === "header" ? "8px 12px" : "6px 10px"

  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        position: "relative",
        cursor: "pointer",
      }}
    >
      <Globe size={variant === "header" ? 16 : 14} color="#5B54D6" aria-hidden />
      <select
        aria-label={t("common.globeAria")}
        value={locale}
        onChange={(e) => setLocale(e.target.value as AppLocale)}
        style={{
          appearance: "none",
          WebkitAppearance: "none",
          border: "1.5px solid #E4E6EF",
          borderRadius: 10,
          padding: pad,
          paddingRight: 28,
          fontSize: variant === "header" ? 13 : 12,
          fontWeight: 600,
          color: "#1A1B2E",
          background: "white",
          cursor: "pointer",
          fontFamily: "inherit",
          boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
          maxWidth: 200,
        }}
      >
        {SUPPORTED_LOCALES.map(({ code, label }) => (
          <option key={code} value={code}>
            {label}
          </option>
        ))}
      </select>
      <span
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          fontSize: 8,
          color: "#9EA0B8",
        }}
      >
        ▼
      </span>
    </label>
  )
}
