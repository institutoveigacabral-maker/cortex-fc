"use client"

import { useCallback, useEffect, useRef, useState } from "react"

interface UseSheetDragOptions {
  onDismiss: () => void
  threshold?: number
  velocityThreshold?: number
}

interface UseSheetDragReturn {
  dragHandleProps: {
    onTouchStart: (e: React.TouchEvent) => void
    onTouchMove: (e: React.TouchEvent) => void
    onTouchEnd: (e: React.TouchEvent) => void
    onMouseDown: (e: React.MouseEvent) => void
  }
  sheetStyle: React.CSSProperties
  isDragging: boolean
}

export function useSheetDrag({
  onDismiss,
  threshold = 0.3,
  velocityThreshold = 500,
}: UseSheetDragOptions): UseSheetDragReturn {
  const [dragOffset, setDragOffset] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  const startY = useRef(0)
  const lastY = useRef(0)
  const lastTime = useRef(0)
  const velocity = useRef(0)
  const sheetHeight = useRef(0)

  const getSheetHeight = useCallback((target: EventTarget) => {
    const el = (target as HTMLElement).closest('[data-slot="sheet-content"]')
    if (el) {
      sheetHeight.current = el.getBoundingClientRect().height
    }
  }, [])

  const handleStart = useCallback((clientY: number, target: EventTarget) => {
    getSheetHeight(target)
    startY.current = clientY
    lastY.current = clientY
    lastTime.current = Date.now()
    velocity.current = 0
    setIsDragging(true)
    setIsAnimating(false)
  }, [getSheetHeight])

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return

    const now = Date.now()
    const deltaTime = now - lastTime.current
    const deltaY = clientY - lastY.current

    if (deltaTime > 0) {
      velocity.current = (deltaY / deltaTime) * 1000
    }

    lastY.current = clientY
    lastTime.current = now

    const offset = Math.max(0, clientY - startY.current)
    setDragOffset(offset)
  }, [isDragging])

  const handleEnd = useCallback(() => {
    if (!isDragging) return
    setIsDragging(false)

    const height = sheetHeight.current || 400
    const ratio = dragOffset / height
    const shouldDismiss = ratio > threshold || velocity.current > velocityThreshold

    if (shouldDismiss) {
      setIsAnimating(true)
      setDragOffset(height)
      const timer = setTimeout(() => {
        onDismiss()
        setDragOffset(0)
        setIsAnimating(false)
      }, 250)
      return () => clearTimeout(timer)
    }

    setIsAnimating(true)
    setDragOffset(0)
    const timer = setTimeout(() => {
      setIsAnimating(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [isDragging, dragOffset, threshold, velocityThreshold, onDismiss])

  // Mouse drag support — use refs to avoid circular dependency
  const handleMouseMoveRef = useRef<(e: MouseEvent) => void>(() => {})
  const handleMouseUpRef = useRef<() => void>(() => {})

  useEffect(() => {
    handleMouseMoveRef.current = (e: MouseEvent) => {
      handleMove(e.clientY)
    }
    handleMouseUpRef.current = () => {
      handleEnd()
      document.removeEventListener("mousemove", handleMouseMoveRef.current)
      document.removeEventListener("mouseup", handleMouseUpRef.current)
    }
  }, [handleMove, handleEnd])

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    handleStart(e.clientY, e.target)
    document.addEventListener("mousemove", handleMouseMoveRef.current)
    document.addEventListener("mouseup", handleMouseUpRef.current)
  }, [handleStart]) // eslint-disable-line react-hooks/exhaustive-deps

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    handleStart(e.touches[0].clientY, e.target)
  }, [handleStart])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    handleMove(e.touches[0].clientY)
  }, [handleMove])

  const onTouchEnd = useCallback(() => {
    handleEnd()
  }, [handleEnd])

  const sheetStyle: React.CSSProperties = {
    transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
    transition: isAnimating
      ? "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)"
      : isDragging
        ? "none"
        : undefined,
    willChange: isDragging ? "transform" : undefined,
  }

  return {
    dragHandleProps: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
    },
    sheetStyle,
    isDragging,
  }
}
