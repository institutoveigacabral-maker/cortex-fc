import { friendlyError } from "./error-messages"

interface FetchOptions extends RequestInit {
  timeout?: number
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = "ApiError"
  }
}

function getCodeForStatus(status: number): string {
  if (status === 401) return "unauthorized"
  if (status === 403) return "forbidden"
  if (status === 429) return "rate_limited"
  return "api_error"
}

export async function apiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {}
): Promise<T> {
  const { timeout = 30000, ...fetchOptions } = options

  // Check if online
  if (typeof window !== "undefined" && !navigator.onLine) {
    throw new ApiError(0, "network_error", friendlyError("fetch failed"))
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const body = await response.json().catch(() => ({}))
      const code = body.code ?? getCodeForStatus(response.status)
      throw new ApiError(
        response.status,
        code,
        body.error ?? friendlyError(code)
      )
    }

    return response.json()
  } catch (err) {
    clearTimeout(timeoutId)

    if (err instanceof ApiError) throw err

    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError(0, "timeout", friendlyError("timeout"))
    }

    if (err instanceof TypeError && err.message.includes("fetch")) {
      throw new ApiError(0, "network_error", friendlyError("fetch failed"))
    }

    throw new ApiError(0, "unknown", friendlyError(null))
  }
}
