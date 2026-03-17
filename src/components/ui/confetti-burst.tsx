"use client"

import * as React from "react"

interface ConfettiBurstProps {
  trigger: boolean
  colors?: string[]
  particleCount?: number
}

const DEFAULT_COLORS = ["#10b981", "#06b6d4", "#f59e0b", "#a78bfa"]

function ConfettiBurst({
  trigger,
  colors = DEFAULT_COLORS,
  particleCount = 12,
}: ConfettiBurstProps) {
  const [particles, setParticles] = React.useState<
    Array<{
      id: number
      x: number
      y: number
      rotation: number
      size: number
      color: string
      delay: number
    }>
  >([])
  const prevTrigger = React.useRef(false)
  const prefersReducedMotion = React.useRef(false)

  React.useEffect(() => {
    prefersReducedMotion.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
  }, [])

  React.useEffect(() => {
    if (trigger && !prevTrigger.current && !prefersReducedMotion.current) {
      const newParticles = Array.from({ length: particleCount }, (_, i) => ({
        id: Date.now() + i,
        x: (Math.random() - 0.5) * 200,
        y: -(Math.random() * 120 + 40),
        rotation: Math.random() * 720 - 360,
        size: Math.random() * 4 + 4,
        color: colors[i % colors.length],
        delay: Math.random() * 100,
      }))
      setParticles(newParticles)

      // Auto cleanup after animation completes
      const timer = setTimeout(() => {
        setParticles([])
      }, 900)
      return () => clearTimeout(timer)
    }
    prevTrigger.current = trigger
  }, [trigger, particleCount, colors])

  React.useEffect(() => {
    if (!trigger) {
      prevTrigger.current = false
    }
  }, [trigger])

  if (particles.length === 0) return null

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="relative h-full w-full">
        {particles.map((p) => (
          <span
            key={p.id}
            className="absolute left-1/2 top-1/2 rounded-sm"
            style={
              {
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                "--confetti-x": `${p.x}px`,
                "--confetti-y": `${p.y}px`,
                "--confetti-r": `${p.rotation}deg`,
                animation: `confettiBurst 800ms cubic-bezier(0.16, 1, 0.3, 1) ${p.delay}ms forwards`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
      <style jsx>{`
        @keyframes confettiBurst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          30% {
            opacity: 1;
          }
          100% {
            transform: translate(
                calc(-50% + var(--confetti-x)),
                calc(-50% + var(--confetti-y) + 60px)
              )
              rotate(var(--confetti-r))
              scale(0.6);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  )
}

export { ConfettiBurst }
export type { ConfettiBurstProps }
