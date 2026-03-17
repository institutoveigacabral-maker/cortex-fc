"use client"

import { Volume2, Vibrate, Play } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useSoundEffects } from "@/hooks/useSoundEffects"
import { useHaptics } from "@/hooks/useHaptics"
import { cn } from "@/lib/utils"
import { useTranslations } from "next-intl"

export function SoundSection() {
  const { play, isEnabled: soundsEnabled, setEnabled: setSoundsEnabled, volume, setVolume } =
    useSoundEffects()
  const { vibrate, isEnabled: hapticsEnabled, setEnabled: setHapticsEnabled, isSupported: hapticsSupported } =
    useHaptics()
  const t = useTranslations("settings")

  return (
    <Card className="glass rounded-xl card-hover animate-slide-up stagger-3 overflow-hidden relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          {t("soundsAndHaptics")}
        </CardTitle>
        <p className="text-xs text-zinc-500">
          {t("soundFeedbackDesc")}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Sound toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <span className="text-sm text-zinc-300">{t("soundEffects")}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!soundsEnabled}
              onClick={() => play("success")}
              className="bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-emerald-500/20 text-xs rounded-lg disabled:opacity-40 h-7 px-2"
            >
              <Play className="w-3 h-3 mr-1" />
              {t("test")}
            </Button>
            <button
              onClick={() => setSoundsEnabled(!soundsEnabled)}
              className={cn(
                "relative w-11 h-6 rounded-full transition-all duration-300",
                soundsEnabled
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                  : "bg-zinc-700/80"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                  soundsEnabled ? "translate-x-5 shadow-emerald-500/20" : "translate-x-0"
                )}
              />
              {soundsEnabled && (
                <span className="absolute inset-0 rounded-full animate-pulse-glow" />
              )}
            </button>
          </div>
        </div>

        {/* Volume slider */}
        {soundsEnabled && (
          <div className="space-y-2 pl-6">
            <div className="flex items-center justify-between">
              <span className="text-xs text-zinc-500 uppercase tracking-wider font-medium">
                {t("volume")}
              </span>
              <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded-md bg-emerald-500/10">
                {Math.round(volume * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="w-full h-1.5 rounded-full appearance-none bg-zinc-700/50 accent-emerald-500 cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-emerald-500 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-emerald-500/30 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-emerald-400"
            />
            <div className="flex justify-between text-xs text-zinc-500 font-mono">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
        )}

        {/* Haptics toggle */}
        <div className="flex items-center justify-between py-2 border-t border-zinc-800/30">
          <div className="flex items-center gap-2">
            <Vibrate className="w-4 h-4 text-zinc-400" />
            <div>
              <span className="text-sm text-zinc-300">{t("hapticFeedback")}</span>
              {!hapticsSupported && (
                <span className="text-xs text-zinc-600 ml-2">({t("noVibration")})</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={!hapticsEnabled || !hapticsSupported}
              onClick={() => vibrate("medium")}
              className="bg-zinc-800/30 border-zinc-700/40 text-zinc-300 hover:bg-zinc-800/60 hover:text-zinc-100 hover:border-emerald-500/20 text-xs rounded-lg disabled:opacity-40 h-7 px-2"
            >
              <Play className="w-3 h-3 mr-1" />
              {t("test")}
            </Button>
            <button
              onClick={() => setHapticsEnabled(!hapticsEnabled)}
              disabled={!hapticsSupported}
              className={cn(
                "relative w-11 h-6 rounded-full transition-all duration-300",
                hapticsEnabled && hapticsSupported
                  ? "bg-emerald-500 shadow-sm shadow-emerald-500/30"
                  : "bg-zinc-700/80",
                !hapticsSupported && "opacity-40 cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300",
                  hapticsEnabled && hapticsSupported ? "translate-x-5 shadow-emerald-500/20" : "translate-x-0"
                )}
              />
              {hapticsEnabled && hapticsSupported && (
                <span className="absolute inset-0 rounded-full animate-pulse-glow" />
              )}
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
