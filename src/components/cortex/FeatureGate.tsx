"use client"

import { ReactNode } from "react"
import Link from "next/link"
import { Lock } from "lucide-react"

interface FeatureGateProps {
  children: ReactNode
  allowed: boolean
  requiredTier?: string
  featureName?: string
}

export function FeatureGate({ children, allowed, requiredTier, featureName }: FeatureGateProps) {
  if (allowed) return <>{children}</>

  return (
    <div className="relative">
      <div className="opacity-30 pointer-events-none select-none">
        {children}
      </div>
      <div className="absolute inset-0 flex items-center justify-center bg-zinc-900/60 backdrop-blur-sm rounded-xl">
        <div className="text-center p-6">
          <Lock className="w-8 h-8 text-zinc-500 mx-auto mb-3" />
          <p className="text-sm text-zinc-400 mb-1">
            {featureName ?? "Este recurso"} requer o plano{" "}
            <span className="text-emerald-400 font-medium">{requiredTier ?? "Professional"}</span>
          </p>
          <Link
            href="/billing"
            className="inline-block mt-3 px-4 py-2 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors"
          >
            Fazer Upgrade
          </Link>
        </div>
      </div>
    </div>
  )
}
