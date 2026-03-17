"use client"

import { useCallback, useEffect, useState } from "react"

type HapticPattern = "light" | "medium" | "heavy" | "success" | "error" | "selection"

const HAPTIC_PATTERNS: Record<HapticPattern, number | number[]> = {
  light: 10,
  medium: 20,
  heavy: 40,
  success: [10, 50, 10],
  error: [30, 50, 30, 50, 30],
  selection: 5,
}

const STORAGE_KEY = "cortex-haptics-enabled"

export function useHaptics() {
  const [isEnabled, setIsEnabled] = useState(true)

  const isSupported =
    typeof navigator !== "undefined" && "vibrate" in navigator

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored !== null) setIsEnabled(stored === "true")
    } catch {
      // SSR or storage unavailable
    }
  }, [])

  const setEnabled = useCallback((v: boolean) => {
    setIsEnabled(v)
    try {
      localStorage.setItem(STORAGE_KEY, String(v))
    } catch {
      // storage unavailable
    }
  }, [])

  const vibrate = useCallback(
    (pattern: HapticPattern) => {
      if (!isEnabled || !isSupported) return
      navigator.vibrate(HAPTIC_PATTERNS[pattern])
    },
    [isEnabled, isSupported]
  )

  return { vibrate, isSupported, isEnabled, setEnabled }
}
