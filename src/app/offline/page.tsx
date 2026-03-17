"use client"

import { WifiOff } from "lucide-react"

export default function OfflinePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#09090b] px-4 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-zinc-800/80 border border-zinc-700/50">
        <WifiOff className="h-10 w-10 text-zinc-500" />
      </div>
      <h1 className="mb-2 text-2xl font-bold text-white">Sem conexao</h1>
      <p className="mb-8 max-w-sm text-zinc-400">
        Voce esta offline. Verifique sua conexao com a internet e tente novamente.
      </p>
      <button
        onClick={() => window.location.reload()}
        className="inline-flex h-11 items-center justify-center rounded-lg bg-emerald-600 px-6 text-sm font-medium text-white transition-colors hover:bg-emerald-500"
      >
        Tentar novamente
      </button>
      <p className="mt-6 text-xs text-zinc-600">
        Dados em cache continuam disponiveis no dashboard.
      </p>
    </div>
  )
}
