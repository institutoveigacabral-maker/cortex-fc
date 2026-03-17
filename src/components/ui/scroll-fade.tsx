"use client"

import { useRef, useState, useCallback, type ReactNode } from "react"

interface ScrollFadeProps {
  children: ReactNode
  className?: string
}

export function ScrollFade({ children, className = "" }: ScrollFadeProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hasScrolled, setHasScrolled] = useState(false)

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    const { scrollLeft, scrollWidth, clientWidth } = el
    const threshold = 4

    setCanScrollLeft(scrollLeft > threshold)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - threshold)
  }, [])

  const handleScroll = useCallback(() => {
    if (!hasScrolled) setHasScrolled(true)
    checkScroll()
  }, [hasScrolled, checkScroll])

  // Check on mount and when children change
  const refCallback = useCallback(
    (node: HTMLDivElement | null) => {
      (scrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      if (node) {
        // Use RAF to wait for layout
        requestAnimationFrame(() => {
          checkScroll()
        })
      }
    },
    [checkScroll]
  )

  return (
    <div className={`relative ${className}`}>
      {/* Left fade */}
      {canScrollLeft && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-zinc-950 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Right fade */}
      {canScrollRight && (
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-zinc-950 to-transparent"
          aria-hidden="true"
        />
      )}

      {/* Hint text */}
      {canScrollRight && !hasScrolled && (
        <div
          className="pointer-events-none absolute right-2 top-1/2 z-20 -translate-y-1/2 animate-fade-in"
          aria-hidden="true"
        >
          <span className="rounded-full bg-zinc-800/90 border border-zinc-700/50 px-2.5 py-1 text-[10px] font-medium text-zinc-400 backdrop-blur-sm">
            Deslize →
          </span>
        </div>
      )}

      {/* Scrollable content */}
      <div
        ref={refCallback}
        onScroll={handleScroll}
        className="overflow-x-auto scroll-touch scrollbar-hide"
      >
        {children}
      </div>
    </div>
  )
}
