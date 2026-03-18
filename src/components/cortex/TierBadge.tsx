"use client"

const TIER_COLORS: Record<string, string> = {
  free: "bg-zinc-700 text-zinc-300",
  scout_individual: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
  club_professional: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
  holding_multiclub: "bg-purple-500/20 text-purple-400 border border-purple-500/30",
}

const TIER_NAMES: Record<string, string> = {
  free: "Free",
  scout_individual: "Scout",
  club_professional: "Professional",
  holding_multiclub: "Holding",
}

interface TierBadgeProps {
  tier: string
  size?: "sm" | "md"
}

export function TierBadge({ tier, size = "sm" }: TierBadgeProps) {
  const colorClass = TIER_COLORS[tier] ?? TIER_COLORS.free
  const name = TIER_NAMES[tier] ?? tier
  const sizeClass = size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"

  return (
    <span className={`inline-flex items-center rounded-full font-medium ${colorClass} ${sizeClass}`}>
      {name}
    </span>
  )
}
