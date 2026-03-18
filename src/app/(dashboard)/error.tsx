"use client"

import { useEffect } from "react"
import { AlertTriangle, RefreshCw } from "lucide-react"
import { friendlyError } from "@/lib/error-messages"

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Dashboard error:", error)
  }, [error])

  const msg = friendlyError(error.message)

  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="max-w-md w-full text-center">
        <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-6 h-6 text-red-400" />
        </div>
        <h2 className="text-lg font-semibold text-white mb-2">Erro ao carregar</h2>
        <p className="text-sm text-zinc-400 mb-6">{msg}</p>
        <button
          onClick={reset}
          className="flex items-center gap-2 px-4 py-2 mx-auto bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Tentar Novamente
        </button>
        {error.digest && (
          <p className="text-zinc-600 text-xs font-mono mt-4">
            Codigo: {error.digest}
          </p>
        )}
      </div>
    </div>
  )
}
