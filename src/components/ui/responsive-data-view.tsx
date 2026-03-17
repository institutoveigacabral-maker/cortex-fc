"use client"

import type React from "react"

export interface Column<T> {
  key: string
  label: string
  render: (item: T) => React.ReactNode
  hideOnMobile?: boolean
  align?: "left" | "center" | "right"
  sortable?: boolean
}

export interface ResponsiveDataViewProps<T> {
  data: T[]
  columns: Column<T>[]
  renderMobileCard: (item: T, index: number) => React.ReactNode
  keyExtractor: (item: T) => string
  caption?: string
  emptyMessage?: string
  onRowClick?: (item: T) => void
  className?: string
}

export function ResponsiveDataView<T>({
  data,
  columns,
  renderMobileCard,
  keyExtractor,
  caption,
  emptyMessage = "Nenhum dado encontrado",
  onRowClick,
  className = "",
}: ResponsiveDataViewProps<T>) {
  if (data.length === 0) {
    return (
      <div className={`py-12 text-center ${className}`}>
        <p className="text-sm text-zinc-500">{emptyMessage}</p>
      </div>
    )
  }

  const alignClass = (align?: "left" | "center" | "right") => {
    if (align === "center") return "text-center"
    if (align === "right") return "text-right"
    return "text-left"
  }

  return (
    <div className={className}>
      {/* Desktop: Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr className="border-b border-zinc-800">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={`py-3 px-3 text-xs font-medium text-zinc-500 uppercase tracking-wider ${alignClass(col.align)}`}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item, index) => (
              <tr
                key={keyExtractor(item)}
                className={`border-b border-zinc-800/50 row-hover hover:bg-zinc-800/30 transition-all duration-200 animate-slide-up min-h-[48px] ${
                  onRowClick ? "cursor-pointer" : ""
                }`}
                style={{ animationDelay: `${(index + 1) * 60}ms` }}
                onClick={onRowClick ? () => onRowClick(item) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-3.5 px-3 ${alignClass(col.align)}`}
                  >
                    {col.render(item)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: Cards */}
      <div className="md:hidden space-y-3">
        {data.map((item, index) => (
          <div
            key={keyExtractor(item)}
            className={`card-hover animate-slide-up ${onRowClick ? "cursor-pointer" : ""}`}
            style={{ animationDelay: `${Math.min(index, 7) * 80}ms` }}
            onClick={onRowClick ? () => onRowClick(item) : undefined}
          >
            {renderMobileCard(item, index)}
          </div>
        ))}
      </div>
    </div>
  )
}
