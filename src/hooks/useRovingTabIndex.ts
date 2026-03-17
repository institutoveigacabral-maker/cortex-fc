"use client"

import { useState, useEffect, useCallback } from "react"

interface UseRovingTabIndexOptions {
  orientation?: "horizontal" | "vertical" | "grid"
  loop?: boolean
  onSelect?: (index: number, element: HTMLElement) => void
}

export function useRovingTabIndex(
  containerRef: React.RefObject<HTMLElement | null>,
  itemSelector: string,
  options?: UseRovingTabIndexOptions
): { activeIndex: number; setActiveIndex: (i: number) => void } {
  const [activeIndex, setActiveIndex] = useState(0)
  const orientation = options?.orientation ?? "horizontal"
  const loop = options?.loop ?? true
  const onSelect = options?.onSelect

  const getItems = useCallback((): HTMLElement[] => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll(itemSelector))
  }, [containerRef, itemSelector])

  // Manage tabIndex attributes
  useEffect(() => {
    const items = getItems()
    items.forEach((item, i) => {
      item.setAttribute("tabindex", i === activeIndex ? "0" : "-1")
    })
  }, [activeIndex, getItems])

  // Focus the active item when activeIndex changes via keyboard
  const focusItem = useCallback(
    (index: number) => {
      const items = getItems()
      if (items[index]) {
        items[index].focus()
      }
    },
    [getItems]
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    function handleKeyDown(e: KeyboardEvent) {
      const items = getItems()
      if (items.length === 0) return

      // Only handle if focus is within the container
      if (!container!.contains(document.activeElement)) return
      // Only handle if the focused element is one of the items
      const currentIdx = items.indexOf(document.activeElement as HTMLElement)
      if (currentIdx === -1) return

      let nextIndex = currentIdx
      let handled = false

      const move = (delta: number) => {
        const len = items.length
        if (loop) {
          nextIndex = (currentIdx + delta + len) % len
        } else {
          nextIndex = Math.max(0, Math.min(len - 1, currentIdx + delta))
        }
        handled = true
      }

      switch (e.key) {
        case "ArrowRight":
          if (orientation === "horizontal" || orientation === "grid") move(1)
          break
        case "ArrowLeft":
          if (orientation === "horizontal" || orientation === "grid") move(-1)
          break
        case "ArrowDown":
          if (orientation === "vertical") move(1)
          if (orientation === "grid") {
            // Estimate columns from layout
            const cols = getGridColumns(items)
            move(cols)
            handled = true
          }
          break
        case "ArrowUp":
          if (orientation === "vertical") move(-1)
          if (orientation === "grid") {
            const cols = getGridColumns(items)
            move(-cols)
            handled = true
          }
          break
        case "Home":
          nextIndex = 0
          handled = true
          break
        case "End":
          nextIndex = items.length - 1
          handled = true
          break
        case "Enter":
        case " ":
          if (onSelect) {
            e.preventDefault()
            onSelect(currentIdx, items[currentIdx])
          }
          return
      }

      if (handled) {
        e.preventDefault()
        setActiveIndex(nextIndex)
        focusItem(nextIndex)
      }
    }

    container.addEventListener("keydown", handleKeyDown)
    return () => container.removeEventListener("keydown", handleKeyDown)
  }, [containerRef, getItems, orientation, loop, onSelect, focusItem])

  return { activeIndex, setActiveIndex }
}

/** Estimate number of columns in a grid by comparing offsetTop of items */
function getGridColumns(items: HTMLElement[]): number {
  if (items.length < 2) return 1
  const firstTop = items[0].getBoundingClientRect().top
  for (let i = 1; i < items.length; i++) {
    if (items[i].getBoundingClientRect().top !== firstTop) return i
  }
  return items.length
}
