import { motion, AnimatePresence } from "motion/react"
import { useI18n } from "../../i18n/I18nContext"
import {
  FIRST_VISIT_STORAGE_KEY,
  SUPPORTED_LOCALES,
  type AppLocale,
} from "../../i18n/constants"

type Props = {
  open: boolean
  onClose: () => void
}

export function FirstVisitLanguageModal({ open, onClose }: Props) {
  const { setLocale, t } = useI18n()

  function pick(lang: AppLocale) {
    setLocale(lang)
    try {
      localStorage.setItem(FIRST_VISIT_STORAGE_KEY, "1")
    } catch {
      /* ignore */
    }
    onClose()
  }

  function skipKo() {
    pick("ko")
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            role="presentation"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={skipKo}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(26,27,46,0.45)",
              zIndex: 9998,
              backdropFilter: "blur(4px)",
            }}
          />
          <motion.div
            role="dialog"
            aria-modal
            aria-labelledby="fv-lang-title"
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            style={{
              position: "fixed",
              left: "50%",
              top: "50%",
              transform: "translate(-50%, -50%)",
              zIndex: 9999,
              width: "min(420px, calc(100vw - 32px))",
              background: "white",
              borderRadius: 18,
              border: "1.5px solid #E4E6EF",
              boxShadow: "0 24px 60px rgba(91,84,214,0.18)",
              padding: "24px 22px 20px",
            }}
          >
            <h2
              id="fv-lang-title"
              style={{
                fontSize: 18,
                fontWeight: 800,
                color: "#1A1B2E",
                margin: "0 0 8px",
                letterSpacing: -0.3,
              }}
            >
              {t("common.selectLanguageTitle")}
            </h2>
            <p style={{ fontSize: 13, color: "#6B6B88", margin: "0 0 18px", lineHeight: 1.5 }}>
              {t("common.foreignerBanner")}
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {SUPPORTED_LOCALES.map(({ code, label, hint }) => (
                <motion.button
                  key={code}
                  type="button"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => pick(code)}
                  style={{
                    minHeight: 48,
                    width: "100%",
                    borderRadius: 12,
                    border: "1.5px solid #E8E9EF",
                    background: code === "ko" ? "#EEEDFA" : "white",
                    padding: "12px 16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    textAlign: "left",
                  }}
                >
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#1A1B2E" }}>{label}</span>
                  {hint ? (
                    <span style={{ fontSize: 11, color: "#9EA0B8" }}>{hint}</span>
                  ) : null}
                </motion.button>
              ))}
            </div>
            <p style={{ fontSize: 11, color: "#A0A2B8", margin: "16px 0 14px", lineHeight: 1.45 }}>
              {t("common.languageApplyHint")}
            </p>
            <button
              type="button"
              onClick={skipKo}
              style={{
                width: "100%",
                minHeight: 44,
                borderRadius: 12,
                border: "none",
                background: "#F6F7FB",
                color: "#6B6B88",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("common.continueWithKo")}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
