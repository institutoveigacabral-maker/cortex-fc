"use client"

import { useState, useRef, useEffect } from "react"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface LazyImageProps {
  src: string
  alt: string
  width: number
  height: number
  fallback?: string
  className?: string
  priority?: boolean
}

export function LazyImage({ src, alt, width, height, fallback, className, priority }: LazyImageProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(priority ?? false)

  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { rootMargin: "200px" }
    )

    observer.observe(imgRef.current)
    return () => observer.disconnect()
  }, [priority])

  if (error && fallback) {
    return (
      <div
        className={cn("flex items-center justify-center bg-zinc-800 text-zinc-500 text-sm font-medium", className)}
        style={{ width, height }}
      >
        {fallback}
      </div>
    )
  }

  return (
    <div ref={imgRef} className={cn("relative overflow-hidden", className)} style={{ width, height }}>
      {isVisible && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "object-cover transition-opacity duration-300",
            loaded ? "opacity-100" : "opacity-0"
          )}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          priority={priority}
        />
      )}
      {!loaded && (
        <div className="absolute inset-0 bg-zinc-800 animate-pulse" />
      )}
    </div>
  )
}
