"use client"

type MetricName = "CLS" | "FCP" | "FID" | "INP" | "LCP" | "TTFB"

interface WebVitalMetric {
  name: MetricName
  value: number
  rating: "good" | "needs-improvement" | "poor"
  delta: number
  id: string
}

const thresholds: Record<MetricName, [number, number]> = {
  CLS: [0.1, 0.25],
  FCP: [1800, 3000],
  FID: [100, 300],
  INP: [200, 500],
  LCP: [2500, 4000],
  TTFB: [800, 1800],
}

function getRating(name: MetricName, value: number): "good" | "needs-improvement" | "poor" {
  const [good, poor] = thresholds[name]
  if (value <= good) return "good"
  if (value <= poor) return "needs-improvement"
  return "poor"
}

export function reportWebVitals(metric: { name: string; value: number; delta: number; id: string }) {
  if (!(metric.name in thresholds)) return

  const name = metric.name as MetricName
  const rating = getRating(name, metric.value)

  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    const color = rating === "good" ? "#10b981" : rating === "needs-improvement" ? "#f59e0b" : "#ef4444"
    console.log(
      `%c[Web Vital] ${name}: ${Math.round(metric.value)}ms (${rating})`,
      `color: ${color}; font-weight: bold;`
    )
  }

  // Send to Vercel Analytics (already integrated) or custom endpoint
  // This is a hook point for future analytics
}
