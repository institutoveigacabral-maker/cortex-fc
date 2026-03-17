"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type ShakeIntensity = "normal" | "subtle"

interface ErrorShakeProps {
  trigger: boolean
  children: React.ReactNode
  intensity?: ShakeIntensity
  className?: string
}

const intensityMap: Record<ShakeIntensity, string> = {
  normal: "3px",
  subtle: "1.5px",
}

function ErrorShake({
  trigger,
  children,
  intensity = "normal",
  className,
}: ErrorShakeProps) {
  const [shaking, setShaking] = React.useState(false)
  const prevTrigger = React.useRef(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    if (trigger && !prevTrigger.current) {
      setShaking(true)
    }
    prevTrigger.current = trigger
  }, [trigger])

  // Reset prevTrigger when trigger goes back to false
  React.useEffect(() => {
    if (!trigger) {
      prevTrigger.current = false
    }
  }, [trigger])

  const handleAnimationEnd = React.useCallback(() => {
    setShaking(false)
  }, [])

  const shakeDistance = intensityMap[intensity]

  return (
    <div
      ref={containerRef}
      className={cn(className)}
      onAnimationEnd={handleAnimationEnd}
      style={
        shaking
          ? ({
              animation: "errorShake 400ms cubic-bezier(0.36, 0.07, 0.19, 0.97) both",
              "--shake-distance": shakeDistance,
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
      {shaking && (
        <style jsx>{`
          @keyframes errorShake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(calc(-1 * var(--shake-distance))); }
            20%, 40%, 60%, 80% { transform: translateX(var(--shake-distance)); }
          }
        `}</style>
      )}
    </div>
  )
}

export { ErrorShake }
export type { ErrorShakeProps }
