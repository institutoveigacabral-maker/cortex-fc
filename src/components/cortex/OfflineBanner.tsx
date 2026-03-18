"use client"

import { useState } from "react"
import { WifiOff, RefreshCw, Wifi } from "lucide-react"
import { useOnlineStatus } from "@/hooks/useOnlineStatus"
import { useTranslations } from "next-intl"

export function OfflineBanner() {
  const isOnline = useOnlineStatus()
  const t = useTranslations("pwa")
  const [checking, setChecking] = useState(false)
  const [restored, setRestored] = useState(false)

  async function handleRetry() {
    setChecking(true)
    try {
      await fetch("/api/health", { method: "HEAD", cache: "no-store" })
      setRestored(true)
      setTimeout(() => {
        setRestored(false)
        window.location.reload()
      }, 1500)
    } catch {
      // still offline
    } finally {
      setChecking(false)
    }
  }

  if (restored) {
    return (
      <div className="fixed top-0 left-0 right-0 z-[var(--z-toast)] bg-emerald-600/95 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 animate-slide-down">
        <Wifi className="w-4 h-4" />
        <span>Conexao restaurada</span>
      </div>
    )
  }

  if (isOnline) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[var(--z-toast)] bg-amber-600/95 backdrop-blur-sm text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2 animate-slide-down">
      <WifiOff className="w-4 h-4" />
      <span>{t("offline")} — {t("offlineCacheNote")}</span>
      <button
        onClick={handleRetry}
        disabled={checking}
        className="ml-2 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-white/20 hover:bg-white/30 text-white text-xs font-medium transition-colors disabled:opacity-50"
      >
        <RefreshCw className={`w-3 h-3 ${checking ? "animate-spin" : ""}`} />
        {checking ? "Verificando..." : "Tentar novamente"}
      </button>
    </div>
  )
}
