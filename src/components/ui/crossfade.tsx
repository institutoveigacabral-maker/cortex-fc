"use client"

import * as React from "react"
import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

interface CrossfadeProps {
  children: React.ReactNode
  transitionKey: string | number
  duration?: number
  className?: string
}

export function Crossfade({
  children,
  transitionKey,
  duration = 200,
  className,
}: CrossfadeProps) {
  const [displayChildren, setDisplayChildren] = useState(children)
  const [phase, setPhase] = useState<"idle" | "out" | "in">("idle")
  const prevKeyRef = useRef(transitionKey)

  useEffect(() => {
    if (transitionKey === prevKeyRef.current) {
      setDisplayChildren(children)
      return
    }

    prevKeyRef.current = transitionKey
    setPhase("out")

    const outTimer = setTimeout(() => {
      setDisplayChildren(children)
      setPhase("in")

      const inTimer = setTimeout(() => {
        setPhase("idle")
      }, duration)

      return () => clearTimeout(inTimer)
    }, duration)

    return () => clearTimeout(outTimer)
  }, [transitionKey, children, duration])

  return (
    <div
      className={cn("transition-opacity", className)}
      style={{
        opacity: phase === "out" ? 0 : 1,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "ease-in-out",
      }}
    >
      {displayChildren}
    </div>
  )
}
