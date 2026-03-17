"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"
import { useFocusTrap } from "@/hooks/useFocusTrap"
import {
  Bell,
  Check,
  CheckCheck,
  AlertTriangle,
  Brain,
  FileText,
  Search,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useNotifications } from "@/hooks/useNotifications"

const TYPE_CONFIG: Record<string, { icon: typeof Bell; color: string }> = {
  contract_alert: { icon: AlertTriangle, color: "text-amber-400" },
  analysis_complete: { icon: Brain, color: "text-emerald-400" },
  agent_complete: { icon: Brain, color: "text-cyan-400" },
  report_generated: { icon: FileText, color: "text-blue-400" },
  scouting_update: { icon: Search, color: "text-violet-400" },
  market_opportunity: { icon: TrendingUp, color: "text-pink-400" },
}

export function NotificationsDropdown() {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const closeDropdown = useCallback(() => setOpen(false), [])
  useFocusTrap(dropdownRef, open, closeDropdown)
  const { notifications, unreadCount, markAsRead, markAllRead, isConnected } = useNotifications()
  const t = useTranslations("common")

  // Close on click outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [])

  function formatTime(iso: string) {
    const d = new Date(iso)
    const now = new Date()
    const diff = now.getTime() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return t("now")
    if (mins < 60) return t("minutesAgo", { count: mins })
    const hours = Math.floor(mins / 60)
    if (hours < 24) return t("hoursAgo", { count: hours })
    const days = Math.floor(hours / 24)
    return t("daysAgo", { count: days })
  }

  return (
    <div ref={ref} className="relative">
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-zinc-500 hover:text-zinc-300 relative"
        onClick={() => setOpen(!open)}
        aria-label={t("notificationsCount", { count: unreadCount })}
      >
        <Bell className="w-4 h-4" />
        {/* SSE connection indicator */}
        <span
          className={cn(
            "absolute top-0 left-0 w-1.5 h-1.5 rounded-full",
            isConnected ? "bg-emerald-500" : "bg-red-500"
          )}
          aria-hidden="true"
        />
        <span className="sr-only">{isConnected ? t("connected") : t("disconnected")}</span>
        <span aria-live="polite" aria-atomic="true" className="absolute -top-0.5 -right-0.5">
          {unreadCount > 0 && (
            <span
              className="w-4 h-4 rounded-full bg-emerald-500 text-[9px] font-bold text-white flex items-center justify-center animate-pulse"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
          {unreadCount > 0 && (
            <span className="sr-only">
              {t("notificationsCount", { count: unreadCount })}
            </span>
          )}
        </span>
      </Button>

      {/* Desktop dropdown */}
      {open && (
        <div className="hidden md:block">
          <div ref={dropdownRef} className="absolute right-0 top-full mt-2 w-80 rounded-xl border border-zinc-800 bg-zinc-900 shadow-2xl z-50 animate-fade-in overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium text-zinc-300">{t("notifications")}</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  {t("markAllRead")}
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  {t("noNotifications")}
                </div>
              ) : (
                notifications.map((n) => {
                  const config = TYPE_CONFIG[n.type] ?? { icon: Bell, color: "text-zinc-400" }
                  const Icon = config.icon
                  const isUnread = !n.readAt

                  return (
                    <button
                      key={n.id}
                      onClick={() => isUnread && markAsRead(n.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex gap-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30",
                        isUnread && "bg-emerald-500/[0.03]"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.color + "/10")}>
                        <Icon className={cn("w-3.5 h-3.5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-xs truncate", isUnread ? "text-zinc-200 font-medium" : "text-zinc-400")}>
                            {n.title}
                          </p>
                          {isUnread && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                              <span className="sr-only">{t("unread")}</span>
                            </>
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{n.body}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile bottom sheet */}
      {open && (
        <div className="md:hidden fixed inset-0 z-50">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 animate-fade-in"
            onClick={() => setOpen(false)}
          />
          {/* Sheet */}
          <div className="absolute bottom-0 left-0 right-0 w-full rounded-t-2xl bg-zinc-900 border-t border-zinc-800 shadow-2xl max-h-[70vh] flex flex-col animate-slide-up">
            {/* Handle bar */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-zinc-700" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
              <span className="text-sm font-medium text-zinc-300">{t("notifications")}</span>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  <CheckCheck className="w-3 h-3" />
                  {t("markAllRead")}
                </button>
              )}
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto pb-[env(safe-area-inset-bottom,0px)]">
              {notifications.length === 0 ? (
                <div className="text-center py-8 text-xs text-zinc-500">
                  {t("noNotifications")}
                </div>
              ) : (
                notifications.map((n) => {
                  const config = TYPE_CONFIG[n.type] ?? { icon: Bell, color: "text-zinc-400" }
                  const Icon = config.icon
                  const isUnread = !n.readAt

                  return (
                    <button
                      key={n.id}
                      onClick={() => isUnread && markAsRead(n.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 flex gap-3 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/30",
                        isUnread && "bg-emerald-500/[0.03]"
                      )}
                    >
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", config.color + "/10")}>
                        <Icon className={cn("w-3.5 h-3.5", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={cn("text-xs truncate", isUnread ? "text-zinc-200 font-medium" : "text-zinc-400")}>
                            {n.title}
                          </p>
                          {isUnread && (
                            <>
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" aria-hidden="true" />
                              <span className="sr-only">{t("unread")}</span>
                            </>
                          )}
                        </div>
                        {n.body && (
                          <p className="text-xs text-zinc-500 truncate mt-0.5">{n.body}</p>
                        )}
                        <p className="text-xs text-zinc-500 mt-1">{formatTime(n.createdAt)}</p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
