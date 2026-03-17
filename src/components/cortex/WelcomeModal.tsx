"use client"

import { useState, useEffect, useCallback } from "react"
import { Activity, Users, Cpu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { AdaptiveModal } from "@/components/ui/adaptive-modal"
import { useTranslations } from "next-intl"

const STORAGE_KEY = "cortex-welcome-seen"

export function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const t = useTranslations("welcome")

  const features = [
    {
      icon: Activity,
      title: t("feature1Title"),
      description: t("feature1Desc"),
    },
    {
      icon: Users,
      title: t("feature2Title"),
      description: t("feature2Desc"),
    },
    {
      icon: Cpu,
      title: t("feature3Title"),
      description: t("feature3Desc"),
    },
  ]

  const handleClose = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, "1")
    setOpen(false)
  }, [])

  useEffect(() => {
    const seen = localStorage.getItem(STORAGE_KEY)
    if (!seen) {
      queueMicrotask(() => setOpen(true))
    }
  }, [])

  return (
    <AdaptiveModal
      isOpen={open}
      onClose={handleClose}
      title="CORTEX FC"
      titleId="welcome-modal-title"
      size="md"
    >
        <div className="p-8">
          {/* Gradient top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-cyan-400 rounded-t-xl" />

          {/* Logo */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent tracking-tight">
              CORTEX FC
            </h1>
            <p className="text-xs text-zinc-500 font-mono tracking-[0.2em] mt-1">
              {t("tagline")}
            </p>
          </div>

          {/* Welcome message */}
          <p className="text-sm text-zinc-400 text-center leading-relaxed mb-8">
            {t("description")}
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 mb-8">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <div
                  key={feature.title}
                  className="flex items-center gap-4 p-3 rounded-xl bg-zinc-800/40 border border-zinc-700/30 transition-colors hover:border-emerald-500/20"
                >
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0 ring-1 ring-emerald-500/20">
                    <Icon className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-zinc-200">
                      {feature.title}
                    </p>
                    <p className="text-xs text-zinc-500">{feature.description}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA */}
          <Button
            onClick={handleClose}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-900/20 transition-all duration-200 hover:shadow-emerald-900/40 h-11 text-sm font-semibold"
          >
            {t("start")}
          </Button>

          {/* Skip link */}
          <button
            onClick={handleClose}
            className="w-full mt-3 text-xs text-zinc-500 hover:text-zinc-400 transition-colors py-1"
          >
            {t("skip")}
          </button>
        </div>
    </AdaptiveModal>
  )
}
