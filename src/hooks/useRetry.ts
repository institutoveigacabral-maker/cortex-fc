"use client"

import { useState, useCallback } from "react"

interface UseRetryOptions {
  maxRetries?: number
  delayMs?: number
  onError?: (error: Error, attempt: number) => void
}

export function useRetry<T>(
  fn: () => Promise<T>,
  options: UseRetryOptions = {}
) {
  const { maxRetries = 3, delayMs = 1000, onError } = options
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  const execute = useCallback(async (): Promise<T | null> => {
    setLoading(true)
    setError(null)

    for (let i = 0; i <= maxRetries; i++) {
      try {
        setAttempt(i)
        const result = await fn()
        setLoading(false)
        setAttempt(0)
        return result
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err))
        onError?.(error, i)

        if (i === maxRetries) {
          setError(error)
          setLoading(false)
          return null
        }

        // Exponential backoff
        await new Promise(r => setTimeout(r, delayMs * Math.pow(2, i)))
      }
    }

    setLoading(false)
    return null
  }, [fn, maxRetries, delayMs, onError])

  const reset = useCallback(() => {
    setError(null)
    setAttempt(0)
  }, [])

  return { execute, loading, error, attempt, reset }
}
