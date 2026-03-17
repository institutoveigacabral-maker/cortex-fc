"use client"

import { useState, useCallback } from "react"

interface OptimisticMutationOptions<TData, TResult> {
  // Apply optimistic update to local state
  onMutate: (data: TData) => void
  // The actual API call
  mutationFn: (data: TData) => Promise<TResult>
  // Rollback on error
  onError?: (error: Error, data: TData) => void
  // Called with real server response
  onSuccess?: (result: TResult, data: TData) => void
}

export function useOptimisticMutation<TData, TResult = unknown>({
  onMutate,
  mutationFn,
  onError,
  onSuccess,
}: OptimisticMutationOptions<TData, TResult>) {
  const [isPending, setIsPending] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const mutate = useCallback(async (data: TData) => {
    setIsPending(true)
    setError(null)

    // Apply optimistic update immediately
    onMutate(data)

    try {
      const result = await mutationFn(data)
      onSuccess?.(result, data)
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      onError?.(error, data)
      throw error
    } finally {
      setIsPending(false)
    }
  }, [onMutate, mutationFn, onError, onSuccess])

  return { mutate, isPending, error }
}
