"use client"

import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

interface Vital {
  name: string
  value: number
  rating: "good" | "needs-improvement" | "poor"
}

export function PerformanceIndicator() {
  const [vitals, setVitals] = useState<Vital[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return

    // Use PerformanceObserver to collect vitals
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        // Collect paint timing
        if (entry.entryType === "paint" && entry.name === "first-contentful-paint") {
          setVitals(prev => [...prev.filter(v => v.name !== "FCP"), {
            name: "FCP",
            value: Math.round(entry.startTime),
            rating: entry.startTime <= 1800 ? "good" : entry.startTime <= 3000 ? "needs-improvement" : "poor"
          }])
        }
      }
    })

    try {
      observer.observe({ entryTypes: ["paint", "largest-contentful-paint", "layout-shift"] })
    } catch {}

    // Navigation timing for TTFB (deferred to avoid sync setState in effect)
    requestAnimationFrame(() => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming
      if (nav) {
        const ttfb = Math.round(nav.responseStart - nav.requestStart)
        setVitals(prev => [...prev.filter(v => v.name !== "TTFB"), {
          name: "TTFB",
          value: ttfb,
          rating: ttfb <= 800 ? "good" : ttfb <= 1800 ? "needs-improvement" : "poor"
        }])
      }
    })

    return () => observer.disconnect()
  }, [])

  if (process.env.NODE_ENV !== "development" || vitals.length === 0) return null

  const ratingColor = {
    good: "text-emerald-400",
    "needs-improvement": "text-amber-400",
    poor: "text-red-400",
  }

  return (
    <div className="fixed bottom-4 left-4 z-50">
      {isOpen ? (
        <div className="rounded-lg bg-zinc-900/95 border border-zinc-700/50 p-3 backdrop-blur-sm shadow-xl min-w-[180px]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-zinc-400">Web Vitals</span>
            <button onClick={() => setIsOpen(false)} className="text-zinc-500 hover:text-zinc-300 text-xs">
              &#x2715;
            </button>
          </div>
          <div className="space-y-1">
            {vitals.map(v => (
              <div key={v.name} className="flex items-center justify-between text-xs">
                <span className="text-zinc-400 font-mono">{v.name}</span>
                <span className={cn("font-mono font-medium", ratingColor[v.rating])}>
                  {v.value}{v.name === "CLS" ? "" : "ms"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900/90 border border-zinc-700/50 text-zinc-500 hover:text-zinc-300 text-xs font-mono backdrop-blur-sm"
          title="Web Vitals"
        >
          WV
        </button>
      )}
    </div>
  )
}
