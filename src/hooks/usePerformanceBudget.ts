"use client"

import { useEffect, useRef } from "react"

export function usePerformanceBudget(componentName: string, budgetMs = 16) {
  const startRef = useRef(performance.now())

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    const renderTime = performance.now() - startRef.current
    if (renderTime > budgetMs) {
      console.warn(
        `[Perf] ${componentName} took ${Math.round(renderTime)}ms to render (budget: ${budgetMs}ms)`
      )
    }
  })

  // Reset on each render
  startRef.current = performance.now()
}
