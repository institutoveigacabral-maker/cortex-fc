"use client"

import { useState, useEffect } from "react"

/**
 * Hook to get the current org's subscription tier on the client.
 * Fetches from /api/org/info and caches in memory.
 */
export function useTier(): { tier: string; loading: boolean } {
  const [tier, setTier] = useState("free")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function fetchTier() {
      try {
        const res = await fetch("/api/org/info")
        if (res.ok) {
          const data = await res.json()
          if (!cancelled && data.tier) {
            setTier(data.tier)
          }
        }
      } catch {
        // Silently fall back to "free"
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchTier()
    return () => { cancelled = true }
  }, [])

  return { tier, loading }
}

/**
 * Check if current tier is at least the required tier.
 */
export function isTierAtLeast(currentTier: string, requiredTier: string): boolean {
  const order: Record<string, number> = {
    free: 0,
    scout_individual: 1,
    club_professional: 2,
    holding_multiclub: 3,
  }
  return (order[currentTier] ?? 0) >= (order[requiredTier] ?? 0)
}
