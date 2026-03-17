"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface CheckmarkAnimationProps {
  size?: number
  color?: string
  onComplete?: () => void
  className?: string
}

function CheckmarkAnimation({
  size = 24,
  color,
  onComplete,
  className,
}: CheckmarkAnimationProps) {
  const circleRef = React.useRef<SVGCircleElement>(null)
  const pathRef = React.useRef<SVGPathElement>(null)
  const prefersReducedMotion = React.useRef(false)

  // Resolve color: support Tailwind token "emerald-500" or raw CSS color
  const resolvedColor = React.useMemo(() => {
    if (!color || color === "emerald-500") return "#10b981"
    if (color.startsWith("#") || color.startsWith("rgb") || color.startsWith("hsl")) return color
    // Map common Tailwind color tokens
    const colorMap: Record<string, string> = {
      "emerald-400": "#34d399",
      "emerald-500": "#10b981",
      "emerald-600": "#059669",
      "cyan-500": "#06b6d4",
      "red-500": "#ef4444",
      "amber-500": "#f59e0b",
    }
    return colorMap[color] ?? color
  }, [color])

  React.useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  }, [])

  React.useEffect(() => {
    const circle = circleRef.current
    const path = pathRef.current
    if (!circle || !path) return

    if (prefersReducedMotion.current) {
      circle.style.strokeDashoffset = "0"
      path.style.strokeDashoffset = "0"
      onComplete?.()
      return
    }

    // Circle draw: 0-400ms
    const circumference = 2 * Math.PI * 18
    circle.style.strokeDasharray = `${circumference}`
    circle.style.strokeDashoffset = `${circumference}`

    // Checkmark path length
    const pathLength = path.getTotalLength()
    path.style.strokeDasharray = `${pathLength}`
    path.style.strokeDashoffset = `${pathLength}`

    // Animate circle
    circle.animate(
      [
        { strokeDashoffset: `${circumference}` },
        { strokeDashoffset: "0" },
      ],
      {
        duration: 400,
        easing: "cubic-bezier(0.4, 0, 0.2, 1)",
        fill: "forwards",
      }
    )

    // Animate checkmark after circle (400ms delay)
    const checkAnim = path.animate(
      [
        { strokeDashoffset: `${pathLength}` },
        { strokeDashoffset: "0" },
      ],
      {
        duration: 400,
        delay: 400,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        fill: "forwards",
      }
    )

    checkAnim.onfinish = () => {
      onComplete?.()
    }

    return () => {
      checkAnim.cancel()
    }
  }, [onComplete])

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      className={cn("shrink-0", className)}
      aria-label="Sucesso"
      role="img"
    >
      <circle
        ref={circleRef}
        cx="20"
        cy="20"
        r="18"
        stroke={resolvedColor}
        strokeWidth="2"
        fill="none"
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <path
        ref={pathRef}
        d="M12 20.5L17.5 26L28 15"
        stroke={resolvedColor}
        strokeWidth="2.5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export { CheckmarkAnimation }
export type { CheckmarkAnimationProps }
