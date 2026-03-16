"use client"

import { useState, useEffect } from "react"

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(true)

  useEffect(() => {
    queueMicrotask(() => setIsOnline(navigator.onLine))

    const handleOnline = () => queueMicrotask(() => setIsOnline(true))
    const handleOffline = () => queueMicrotask(() => setIsOnline(false))

    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  return isOnline
}
