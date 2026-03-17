"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  LayoutDashboard,
  Users,
  Activity,
  Search,
  FileText,
  MessageSquare,
  ArrowRightLeft,
  Monitor,
  Building2,
  Shield,
  CreditCard,
  Settings,
  Plus,
  Command,
} from "lucide-react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"

interface CommandItem {
  id: string
  label: string
  description?: string
  icon: React.ReactNode
  href?: string
  shortcut?: string
  group: string
  action?: () => void
}

const PAGE_DEFS = [
  { id: "dashboard", navKey: "dashboard" as const, descKey: "dashboardDesc" as const, icon: <LayoutDashboard className="w-4 h-4" />, href: "/dashboard" },
  { id: "players", navKey: "players" as const, descKey: "playersDesc" as const, icon: <Users className="w-4 h-4" />, href: "/players" },
  { id: "analysis", navKey: "analysis" as const, descKey: "analysisDesc" as const, icon: <Activity className="w-4 h-4" />, href: "/analysis" },
  { id: "scouting", navKey: "scouting" as const, descKey: "scoutingDesc" as const, icon: <Search className="w-4 h-4" />, href: "/scouting" },
  { id: "reports", navKey: "reports" as const, descKey: "reportsDesc" as const, icon: <FileText className="w-4 h-4" />, href: "/reports" },
  { id: "chat", navKey: "chat" as const, descKey: "chatDesc" as const, icon: <MessageSquare className="w-4 h-4" />, href: "/chat" },
  { id: "simulator", navKey: "simulator" as const, descKey: "simulatorDesc" as const, icon: <ArrowRightLeft className="w-4 h-4" />, href: "/simulator" },
  { id: "agent-console", navKey: "agentConsole" as const, descKey: "agentConsoleDesc" as const, icon: <Monitor className="w-4 h-4" />, href: "/agent-console" },
  { id: "holding", navKey: "holding" as const, descKey: "holdingDesc" as const, icon: <Building2 className="w-4 h-4" />, href: "/holding" },
  { id: "audit-log", navKey: "auditLog" as const, descKey: "auditLogDesc" as const, icon: <Shield className="w-4 h-4" />, href: "/audit-log" },
  { id: "billing", navKey: "billing" as const, descKey: "billingDesc" as const, icon: <CreditCard className="w-4 h-4" />, href: "/billing" },
  { id: "settings", navKey: "settings" as const, descKey: "settingsDesc" as const, icon: <Settings className="w-4 h-4" />, href: "/settings" },
]

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const t = useTranslations("nav")
  const tc = useTranslations("common")

  const pagesGroup = tc("pages")
  const actionsGroup = tc("actions")

  const PAGES: CommandItem[] = PAGE_DEFS.map((def) => ({
    id: def.id,
    label: t(def.navKey),
    description: t(def.descKey),
    icon: def.icon,
    href: def.href,
    group: pagesGroup,
  }))

  const ACTIONS: CommandItem[] = [
    { id: "new-analysis", label: t("newAnalysis"), description: "Cmd+N", icon: <Plus className="w-4 h-4" />, href: "/analysis/new", shortcut: "N", group: actionsGroup },
  ]

  const allItems = [...ACTIONS, ...PAGES]

  const filtered = query.length === 0
    ? allItems
    : allItems.filter(
        (item) =>
          item.label.toLowerCase().includes(query.toLowerCase()) ||
          (item.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
      )

  const groups = Array.from(new Set(filtered.map((i) => i.group)))

  const execute = useCallback((item: CommandItem) => {
    setOpen(false)
    setQuery("")
    if (item.href) router.push(item.href)
    if (item.action) item.action()
  }, [router])

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Cmd+K to open
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault()
        setOpen((prev) => !prev)
        setQuery("")
        setSelectedIndex(0)
      }

      // Cmd+N for new analysis
      if ((e.metaKey || e.ctrlKey) && e.key === "n" && !open) {
        e.preventDefault()
        router.push("/analysis/new")
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, router])

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Navigate with arrows
  useEffect(() => {
    if (!open) return

    function handleNav(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filtered.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter" && filtered[selectedIndex]) {
        e.preventDefault()
        execute(filtered[selectedIndex])
      } else if (e.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleNav)
    return () => document.removeEventListener("keydown", handleNav)
  }, [open, selectedIndex, filtered, execute])

  // Reset index on query change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  // Scroll selected into view
  useEffect(() => {
    if (!listRef.current) return
    const el = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [selectedIndex])

  if (!open) return null

  const renderItems = (itemMinH: string, showShortcuts: boolean, showHover: boolean) => {
    let idx = -1
    return groups.map((group) => {
      const groupItems = filtered.filter((i) => i.group === group)
      return (
        <div key={group}>
          <div className="px-4 py-1.5 text-xs text-zinc-500 uppercase tracking-wider font-medium">
            {group}
          </div>
          {groupItems.map((item) => {
            idx++
            const currentIdx = idx
            const isSelected = currentIdx === selectedIndex

            return (
              <button
                key={item.id}
                data-index={currentIdx}
                onClick={() => execute(item)}
                onMouseEnter={showHover ? () => setSelectedIndex(currentIdx) : undefined}
                className={cn(
                  `w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${itemMinH}`,
                  isSelected
                    ? "bg-emerald-500/10 text-emerald-300"
                    : "text-zinc-400 hover:bg-zinc-800/50"
                )}
              >
                <span className={cn(
                  "flex-shrink-0",
                  isSelected ? "text-emerald-400" : "text-zinc-500"
                )}>
                  {item.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.description && (
                    <span className="ml-2 text-xs text-zinc-500">{item.description}</span>
                  )}
                </div>
                {showShortcuts && item.shortcut && (
                  <kbd className="inline-flex px-1.5 py-0.5 rounded bg-zinc-800 text-xs text-zinc-500 font-mono border border-zinc-700/50">
                    Cmd+{item.shortcut}
                  </kbd>
                )}
              </button>
            )
          })}
        </div>
      )
    })
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={() => setOpen(false)}
      />

      {/* Palette — Desktop: centered with max-w */}
      <div className="hidden md:flex fixed inset-x-0 top-[15%] z-[201] justify-center px-4 animate-scale-in">
        <div role="dialog" aria-modal="true" aria-label={tc("quickSearch")} className="w-full max-w-lg bg-zinc-900 border border-zinc-700/50 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 h-12 border-b border-zinc-800">
            <Command className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tc("searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
            />
            <kbd className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-zinc-800 text-xs text-zinc-500 font-mono border border-zinc-700/50">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div ref={listRef} className="max-h-[360px] overflow-y-auto py-2">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                {tc("noResultsFor", { query })}
              </div>
            )}
            {renderItems("min-h-[44px]", true, true)}
          </div>

          {/* Footer */}
          <div className="flex items-center gap-4 px-4 py-2 border-t border-zinc-800 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono border border-zinc-700/50">↑↓</kbd>
              {tc("navigate")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono border border-zinc-700/50">Enter</kbd>
              {tc("select")}
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1 py-0.5 rounded bg-zinc-800 font-mono border border-zinc-700/50">Esc</kbd>
              {tc("close")}
            </span>
          </div>
        </div>
      </div>

      {/* Palette — Mobile: fullscreen */}
      <div className="md:hidden fixed inset-0 z-[201] bg-zinc-900 flex flex-col animate-slide-up">
        <div role="dialog" aria-modal="true" aria-label={tc("quickSearch")} className="flex flex-col h-full">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 min-h-[48px] border-b border-zinc-800 flex-shrink-0 pt-[env(safe-area-inset-top,0px)]">
            <Command className="w-4 h-4 text-zinc-500 flex-shrink-0" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tc("searchPlaceholder")}
              className="flex-1 bg-transparent text-sm text-zinc-200 placeholder-zinc-600 outline-none"
              autoFocus
            />
            <button
              onClick={() => setOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-300 min-h-[44px] px-2"
            >
              Fechar
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto py-2 pb-[env(safe-area-inset-bottom,0px)]">
            {filtered.length === 0 && (
              <div className="px-4 py-8 text-center text-zinc-500 text-sm">
                {tc("noResultsFor", { query })}
              </div>
            )}
            {renderItems("min-h-[48px]", false, false)}
          </div>
        </div>
      </div>
    </>
  )
}
