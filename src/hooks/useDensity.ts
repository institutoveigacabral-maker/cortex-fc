"use client"

import { useContext } from "react"
import { DensityContext, type Density } from "@/components/providers/DensityProvider"

export function useDensity(): { density: Density; setDensity: (d: Density) => void } {
  const ctx = useContext(DensityContext)
  if (!ctx) {
    throw new Error("useDensity must be used within a <DensityProvider>")
  }
  return ctx
}
