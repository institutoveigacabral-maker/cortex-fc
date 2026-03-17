"use client"

import { useCallback, useEffect, useRef, useState } from "react"

type SoundName = "click" | "success" | "error" | "notification" | "toggle"

const STORAGE_KEY = "cortex-sounds-enabled"
const VOLUME_KEY = "cortex-sounds-volume"

export function useSoundEffects() {
  const [isEnabled, setIsEnabledState] = useState(false)
  const [volume, setVolumeState] = useState(0.3)
  const ctxRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    try {
      const storedEnabled = localStorage.getItem(STORAGE_KEY)
      if (storedEnabled !== null) setIsEnabledState(storedEnabled === "true")
      const storedVolume = localStorage.getItem(VOLUME_KEY)
      if (storedVolume !== null) setVolumeState(Number(storedVolume))
    } catch {
      // SSR or storage unavailable
    }
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setIsEnabledState(v)
    try {
      localStorage.setItem(STORAGE_KEY, String(v))
    } catch {}
  }, [])

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v))
    setVolumeState(clamped)
    try {
      localStorage.setItem(VOLUME_KEY, String(clamped))
    } catch {}
  }, [])

  const getContext = useCallback((): AudioContext | null => {
    if (ctxRef.current) return ctxRef.current
    try {
      ctxRef.current = new AudioContext()
      return ctxRef.current
    } catch {
      return null
    }
  }, [])

  const play = useCallback(
    (sound: SoundName) => {
      if (!isEnabled) return
      const ctx = getContext()
      if (!ctx) return

      const now = ctx.currentTime

      switch (sound) {
        case "click": {
          // Short 800Hz blip, 50ms
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(800, now)
          gain.gain.setValueAtTime(volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.05)
          break
        }

        case "success": {
          // Ascending C5-E5-G5 arpeggio, 300ms
          const freqs = [523.25, 659.25, 783.99] // C5, E5, G5
          freqs.forEach((freq, i) => {
            const osc = ctx.createOscillator()
            const gain = ctx.createGain()
            osc.type = "sine"
            osc.frequency.setValueAtTime(freq, now)
            const start = now + i * 0.1
            gain.gain.setValueAtTime(0, start)
            gain.gain.linearRampToValueAtTime(volume, start + 0.01)
            gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1)
            osc.connect(gain)
            gain.connect(ctx.destination)
            osc.start(start)
            osc.stop(start + 0.1)
          })
          break
        }

        case "error": {
          // Descending 400Hz -> 200Hz, 200ms
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(400, now)
          osc.frequency.linearRampToValueAtTime(200, now + 0.2)
          gain.gain.setValueAtTime(volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.2)
          break
        }

        case "notification": {
          // Gentle 660Hz ping, 150ms
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(660, now)
          gain.gain.setValueAtTime(volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.15)
          break
        }

        case "toggle": {
          // 1200Hz click, 30ms
          const osc = ctx.createOscillator()
          const gain = ctx.createGain()
          osc.type = "sine"
          osc.frequency.setValueAtTime(1200, now)
          gain.gain.setValueAtTime(volume, now)
          gain.gain.exponentialRampToValueAtTime(0.001, now + 0.03)
          osc.connect(gain)
          gain.connect(ctx.destination)
          osc.start(now)
          osc.stop(now + 0.03)
          break
        }
      }
    },
    [isEnabled, volume, getContext]
  )

  return { play, isEnabled, setEnabled, volume, setVolume }
}
