"use client"

import { useDensity } from "@/hooks/useDensity"
import type { Density } from "@/components/providers/DensityProvider"
import { Layout } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useTranslations } from "next-intl"

const densityKeys: {
  value: Density
  titleKey: string
  descKey: string
  paddingClass: string
}[] = [
  {
    value: "compact",
    titleKey: "compact",
    descKey: "compactDesc2",
    paddingClass: "py-0.5",
  },
  {
    value: "normal",
    titleKey: "normal",
    descKey: "normalDesc2",
    paddingClass: "py-1.5",
  },
  {
    value: "spacious",
    titleKey: "spacious",
    descKey: "spaciousDesc2",
    paddingClass: "py-3",
  },
]

export function DensitySection() {
  const { density, setDensity } = useDensity()
  const t = useTranslations("settings")

  return (
    <Card className="glass rounded-xl card-hover animate-slide-up stagger-2 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Layout className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          {t("density")}
        </CardTitle>
        <p className="text-xs text-zinc-500">
          {t("densityAdjust")}
        </p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {densityKeys.map((option) => {
            const isActive = density === option.value

            return (
              <button
                key={option.value}
                onClick={() => setDensity(option.value)}
                className={`relative flex flex-col items-start gap-1 p-4 rounded-xl border transition-all duration-200 text-left cursor-pointer ${
                  isActive
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-800/20 hover:border-zinc-700 hover:bg-zinc-800/40"
                }`}
              >
                <p
                  className={`text-xs font-medium ${
                    isActive ? "text-emerald-400" : "text-zinc-300"
                  }`}
                >
                  {t(option.titleKey)}
                </p>
                <p className="text-xs text-zinc-500">{t(option.descKey)}</p>

                {/* Mini preview */}
                <div className="mt-3 w-full space-y-1 rounded-lg bg-zinc-800/50 p-2 text-[11px]">
                  <div
                    className={`bg-zinc-700/30 rounded px-2 ${option.paddingClass} text-zinc-400`}
                  >
                    {t("playerA")}
                  </div>
                  <div
                    className={`bg-zinc-700/30 rounded px-2 ${option.paddingClass} text-zinc-400`}
                  >
                    {t("playerB")}
                  </div>
                  <div
                    className={`bg-zinc-700/30 rounded px-2 ${option.paddingClass} text-zinc-400`}
                  >
                    {t("playerC")}
                  </div>
                </div>

                {isActive && (
                  <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
                )}
              </button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
