"use client"

import { useEffect, useRef, useState } from "react"

interface PresenceUser {
  userId: string
  page: string
  lastSeen: number
}

export function usePresence(currentPage: string) {
  const [viewers, setViewers] = useState<PresenceUser[]>([])
  const intervalRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    // Report presence
    const report = () => {
      fetch("/api/presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: currentPage }),
      }).catch(() => {})
    }

    report()
    intervalRef.current = setInterval(report, 30000) // every 30s

    return () => clearInterval(intervalRef.current)
  }, [currentPage])

  useEffect(() => {
    // Fetch who's viewing this page
    const fetchViewers = async () => {
      try {
        const res = await fetch(`/api/presence?page=${encodeURIComponent(currentPage)}`)
        if (res.ok) {
          const data = await res.json()
          setViewers(data.viewers || [])
        }
      } catch {}
    }

    fetchViewers()
    const interval = setInterval(fetchViewers, 15000) // every 15s
    return () => clearInterval(interval)
  }, [currentPage])

  return { viewers }
}
