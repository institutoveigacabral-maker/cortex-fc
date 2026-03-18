import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-800/50", className)}
      {...props}
    />
  )
}

function StatsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-3"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-7 w-14" />
          <Skeleton className="h-2 w-full" />
        </div>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-5 space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-48 w-full" />
    </div>
  )
}

function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl overflow-hidden">
      <div className="flex gap-4 px-4 py-3 border-b border-zinc-800 bg-zinc-900/50">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1 max-w-[120px]" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 px-4 py-3 border-b border-zinc-800/30"
        >
          {Array.from({ length: cols }).map((_, j) => (
            <Skeleton key={j} className="h-3 flex-1 max-w-[100px]" />
          ))}
        </div>
      ))}
    </div>
  )
}

function CardSkeleton() {
  return (
    <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 space-y-3">
      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  )
}

export { Skeleton, StatsSkeleton, ChartSkeleton, TableSkeleton, CardSkeleton }
