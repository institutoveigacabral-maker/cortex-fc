"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export function useGlobalShortcuts(onToggleShortcuts: () => void): void {
  const router = useRouter()

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement
      const tagName = target.tagName.toLowerCase()
      if (
        tagName === "input" ||
        tagName === "textarea" ||
        target.isContentEditable
      ) {
        return
      }

      // Cmd+/ or Cmd+Shift+/ (Cmd+?) — toggle shortcuts overlay
      if (e.metaKey && e.key === "/") {
        e.preventDefault()
        onToggleShortcuts()
        return
      }

      // Cmd+N — new analysis
      if (e.metaKey && e.key === "n") {
        e.preventDefault()
        router.push("/analysis/new")
        return
      }

      // Cmd+, — settings
      if (e.metaKey && e.key === ",") {
        e.preventDefault()
        router.push("/settings")
        return
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [router, onToggleShortcuts])
}
