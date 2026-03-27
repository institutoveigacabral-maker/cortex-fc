"use client"

import { useEffect, useRef } from "react"

export function usePerformanceBudget(componentName: string, budgetMs = 16) {
  const startRef = useRef(0)

  // Mark render start inside an effect (runs synchronously before paint)
  useEffect(() => {
    startRef.current = performance.now()
  })

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    if (startRef.current === 0) return

    const renderTime = performance.now() - startRef.current
    if (renderTime > budgetMs) {
      console.warn(
        `[Perf] ${componentName} took ${Math.round(renderTime)}ms to render (budget: ${budgetMs}ms)`
      )
    }
  })
}
