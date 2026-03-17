"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useTranslations } from "next-intl"
import { ChevronRight, Home } from "lucide-react"

export function Breadcrumb() {
  const pathname = usePathname()
  const t = useTranslations("nav")
  const segments = pathname.split("/").filter(Boolean)

  // Don't show breadcrumb on root dashboard
  if (segments.length <= 1) return null

  const crumbs = segments.map((segment, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/")
    const isLast = i === segments.length - 1
    // Check if segment is a UUID (dynamic route)
    const isUuid = /^[0-9a-f-]{20,}$/.test(segment)
    const label = isUuid ? t("detail") : (t.has(segment) ? t(segment) : segment.charAt(0).toUpperCase() + segment.slice(1))

    return { href, label, isLast }
  })

  return (
    <nav className="flex items-center gap-1.5 text-xs text-zinc-500 mb-4 animate-fade-in">
      <Link
        href="/dashboard"
        className="hover:text-zinc-400 transition-colors flex items-center gap-1"
      >
        <Home className="w-3 h-3" />
      </Link>
      {crumbs.map((crumb) => (
        <span key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-zinc-500" />
          {crumb.isLast ? (
            <span className="text-zinc-400 font-medium">{crumb.label}</span>
          ) : (
            <Link
              href={crumb.href}
              className="hover:text-zinc-400 transition-colors hover:underline underline-offset-2"
            >
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  )
}
