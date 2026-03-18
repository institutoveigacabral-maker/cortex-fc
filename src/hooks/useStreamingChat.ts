"use client"

import { useState, useCallback, useRef } from "react"

interface StreamMetadata {
  tokensUsed: number
  model: string
  durationMs: number
  requestId?: string
}

interface StreamingState {
  isStreaming: boolean
  streamedText: string
  error: string | null
  metadata: StreamMetadata | null
}

const MAX_RETRIES = 2
const RETRY_DELAY_MS = 2000

export function useStreamingChat() {
  const [state, setState] = useState<StreamingState>({
    isStreaming: false,
    streamedText: "",
    error: null,
    metadata: null,
  })
  const abortRef = useRef<AbortController | null>(null)
  const retryCountRef = useRef(0)

  const processStream = useCallback(
    async (
      url: string,
      fetchOptions: RequestInit,
      onToken?: (text: string) => void,
      onComplete?: (fullText: string, messageId?: string) => void
    ) => {
      const res = await fetch(url, fetchOptions)

      if (!res.ok) throw new Error("Failed to send message")

      const reader = res.body?.getReader()
      const decoder = new TextDecoder()
      let accumulated = ""
      let buffer = ""

      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split("\n")
        // Keep the last potentially incomplete line in the buffer
        buffer = lines.pop() || ""

        let currentEvent = ""
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            currentEvent = line.slice(7).trim()
          } else if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6))

              if (currentEvent === "done" || data.type === "[DONE]") {
                // Parse [DONE] metadata
                const meta: StreamMetadata = {
                  tokensUsed: data.tokensUsed ?? 0,
                  model: data.model ?? "",
                  durationMs: data.durationMs ?? 0,
                  requestId: data.requestId,
                }
                setState((prev) => ({ ...prev, metadata: meta }))

                // Also handle legacy done event with messageId
                if (data.messageId) {
                  onComplete?.(accumulated, data.messageId)
                }
              } else if (currentEvent === "complete") {
                // Complete event with result — also call onComplete
                onComplete?.(accumulated, data.messageId)
              } else if (currentEvent === "error") {
                const errorMsg = typeof data.message === "string" ? data.message : "Erro desconhecido"
                setState((prev) => ({ ...prev, error: errorMsg }))
              } else if (data.text) {
                // Token event
                accumulated += data.text
                setState((prev) => ({ ...prev, streamedText: accumulated }))
                onToken?.(data.text)
              } else if (!currentEvent && data.messageId) {
                // Legacy final event with message ID
                onComplete?.(accumulated, data.messageId)
              }
            } catch {
              // Ignore malformed JSON lines
            }
            currentEvent = ""
          } else if (line === "") {
            currentEvent = ""
          }
        }
      }

      return accumulated
    },
    []
  )

  const sendMessage = useCallback(
    async (
      conversationId: string,
      content: string,
      onToken?: (text: string) => void,
      onComplete?: (fullText: string, messageId?: string) => void
    ) => {
      abortRef.current = new AbortController()
      retryCountRef.current = 0
      setState({ isStreaming: true, streamedText: "", error: null, metadata: null })

      const url = `/api/chat?stream=true`
      const fetchOptions: RequestInit = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, message: content }),
        signal: abortRef.current.signal,
      }

      const attemptStream = async (): Promise<void> => {
        try {
          await processStream(url, fetchOptions, onToken, onComplete)
        } catch (err: unknown) {
          if (err instanceof Error && err.name === "AbortError") {
            return // User aborted, don't retry
          }

          // Retry on connection drops
          if (retryCountRef.current < MAX_RETRIES) {
            retryCountRef.current++
            console.warn(
              `Stream connection lost, retrying (${retryCountRef.current}/${MAX_RETRIES})...`
            )
            setState((prev) => ({
              ...prev,
              error: `Reconectando... (tentativa ${retryCountRef.current}/${MAX_RETRIES})`,
            }))

            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS))

            // Create new abort controller for retry
            abortRef.current = new AbortController()
            fetchOptions.signal = abortRef.current.signal

            return attemptStream()
          }

          // Max retries exceeded
          const errorMsg =
            err instanceof Error ? err.message : "Erro de conexao desconhecido"
          setState((prev) => ({ ...prev, error: errorMsg }))
        }
      }

      try {
        await attemptStream()
      } finally {
        setState((prev) => ({ ...prev, isStreaming: false }))
      }
    },
    [processStream]
  )

  const stopGeneration = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({ ...prev, isStreaming: false }))
  }, [])

  return { ...state, sendMessage, stopGeneration }
}
