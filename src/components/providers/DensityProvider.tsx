"use client"

import { createContext, useCallback, useEffect, useState, type ReactNode } from "react"

export type Density = "compact" | "normal" | "spacious"

export interface DensityContextValue {
  density: Density
  setDensity: (d: Density) => void
}

export const DensityContext = createContext<DensityContextValue | null>(null)

function getCookieDensity(): Density {
  if (typeof document === "undefined") return "normal"
  const match = document.cookie.match(/(?:^|;\s*)NEXT_DENSITY=(\w+)/)
  const value = match?.[1]
  if (value === "compact" || value === "normal" || value === "spacious") return value
  return "normal"
}

function setCookieDensity(d: Density) {
  document.cookie = `NEXT_DENSITY=${d};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`
}

function applyDensityClass(d: Density) {
  const html = document.documentElement
  html.classList.remove("density-compact", "density-normal", "density-spacious")
  html.classList.add(`density-${d}`)
}

interface DensityProviderProps {
  children: ReactNode
  defaultDensity?: Density
}

export function DensityProvider({ children, defaultDensity }: DensityProviderProps) {
  const [density, setDensityState] = useState<Density>(defaultDensity ?? "normal")

  // On mount, sync from cookie (client truth) and apply class
  useEffect(() => {
    const cookieValue = getCookieDensity()
    setDensityState(cookieValue)
    applyDensityClass(cookieValue)
  }, [])

  const setDensity = useCallback((d: Density) => {
    setDensityState(d)
    setCookieDensity(d)
    applyDensityClass(d)
  }, [])

  return (
    <DensityContext.Provider value={{ density, setDensity }}>
      {children}
    </DensityContext.Provider>
  )
}
