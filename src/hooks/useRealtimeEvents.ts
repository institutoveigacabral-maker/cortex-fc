"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface RealtimeEventPayload {
  channel: string
  type: string
  data: unknown
}

interface UseRealtimeOptions {
  channels?: string[]
  onEvent?: (event: RealtimeEventPayload) => void
}

/**
 * Client hook for SSE-based real-time events.
 *
 * Connects to the notifications stream with channel support,
 * automatically reconnects on failure with exponential backoff.
 */
export function useRealtimeEvents({
  channels = ["notifications"],
  onEvent,
}: UseRealtimeOptions = {}) {
  const [isConnected, setIsConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const retryCountRef = useRef(0)
  const mountedRef = useRef(true)
  const connectRef = useRef<() => void>(() => {})

  const connect = useCallback(() => {
    if (!mountedRef.current) return

    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
    }

    const channelParam = channels.join(",")
    const es = new EventSource(
      `/api/notifications/stream?channels=${channelParam}`
    )

    es.onopen = () => {
      if (!mountedRef.current) return
      setIsConnected(true)
      retryCountRef.current = 0
    }

    es.addEventListener("notification", (e) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(e.data)
        onEvent?.({ channel: "notifications", type: "notification", data })
      } catch {
        // Silently handle parse errors
      }
    })

    es.addEventListener("presence", (e) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(e.data)
        onEvent?.({ channel: "presence", type: "presence", data })
      } catch {
        // Silently handle parse errors
      }
    })

    es.addEventListener("agent-progress", (e) => {
      if (!mountedRef.current) return
      try {
        const data = JSON.parse(e.data)
        onEvent?.({ channel: "agent-progress", type: "progress", data })
      } catch {
        // Silently handle parse errors
      }
    })

    es.onerror = () => {
      if (!mountedRef.current) return
      setIsConnected(false)
      es.close()
      eventSourceRef.current = null

      // Reconnect with exponential backoff: 1s, 2s, 4s, 8s... max 30s
      const delay = Math.min(
        1000 * Math.pow(2, retryCountRef.current),
        30000
      )
      retryCountRef.current += 1
      reconnectTimeoutRef.current = setTimeout(() => {
        if (mountedRef.current) connectRef.current()
      }, delay)
    }

    eventSourceRef.current = es
  }, [channels, onEvent])

  // Keep ref in sync with latest connect
  useEffect(() => {
    connectRef.current = connect
  })

  useEffect(() => {
    mountedRef.current = true
    connect()
    return () => {
      mountedRef.current = false
      eventSourceRef.current?.close()
      eventSourceRef.current = null
      clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connect])

  return { isConnected }
}
