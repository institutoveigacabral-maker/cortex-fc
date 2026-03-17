"use client"

import { useEffect, useRef } from "react"

const FOCUSABLE_SELECTOR = [
  "button:not([disabled]):not([tabindex='-1'])",
  "input:not([disabled]):not([tabindex='-1'])",
  "select:not([disabled]):not([tabindex='-1'])",
  "textarea:not([disabled]):not([tabindex='-1'])",
  "a[href]:not([tabindex='-1'])",
  "[tabindex]:not([tabindex='-1']):not([disabled])",
].join(", ")

export function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean,
  onClose?: () => void
): void {
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    if (!isActive) return

    // Store the previously focused element
    previousFocusRef.current = document.activeElement as HTMLElement | null

    // Auto-focus first focusable element
    const container = containerRef.current
    if (!container) return

    requestAnimationFrame(() => {
      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length > 0) {
        focusables[0].focus()
      }
    })

    function handleKeyDown(e: KeyboardEvent) {
      const container = containerRef.current
      if (!container) return

      if (e.key === "Escape" && onClose) {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }

      if (e.key !== "Tab") return

      const focusables = container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (focusables.length === 0) return

      const first = focusables[0]
      const last = focusables[focusables.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true)

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true)
      // Restore focus to previous element
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus()
      }
    }
  }, [isActive, containerRef, onClose])
}
