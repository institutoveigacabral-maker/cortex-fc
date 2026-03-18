"use client"

import { useState, useMemo } from "react"
import { useTranslations } from "next-intl"
import { cn } from "@/lib/utils"
import { Bell, CheckCheck } from "lucide-react"

interface Notification {
  id: string
  type: string
  title: string
  body: string
  read: boolean
  entityType?: string
  entityId?: string
  createdAt: string
}

interface Props {
  initialNotifications: Notification[]
}

export function NotificationCenter({ initialNotifications }: Props) {
  const t = useTranslations("notifications")
  const [notifications, setNotifications] = useState(initialNotifications)
  const [filter, setFilter] = useState<"all" | "unread" | "mention" | "usage_alert">("all")

  const filtered = useMemo(() => {
    if (filter === "all") return notifications
    if (filter === "unread") return notifications.filter((n) => !n.read)
    return notifications.filter((n) => n.type === filter)
  }, [notifications, filter])

  const unreadCount = notifications.filter((n) => !n.read).length

  async function markRead(id: string) {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    })
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    })
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  const filters = [
    { key: "all" as const, label: t("all") },
    { key: "unread" as const, label: t("unread") },
    { key: "mention" as const, label: t("mentions") },
    { key: "usage_alert" as const, label: t("alerts") },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5" />
            {t("title")}
          </h1>
          {unreadCount > 0 && (
            <p className="text-sm text-zinc-500 mt-1">
              {unreadCount} {t("unreadCount")}
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllRead}
            className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 min-h-[44px]"
          >
            <CheckCheck className="w-4 h-4" />
            {t("markAllRead")}
          </button>
        )}
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[36px]",
              filter === f.key
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-zinc-800/50 text-zinc-500 border border-zinc-700/50 hover:text-zinc-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Notification list */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-zinc-600">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">{t("noNotifications")}</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => !n.read && markRead(n.id)}
              className={cn(
                "flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                n.read
                  ? "bg-zinc-900/30 border-zinc-800/30"
                  : "bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800/70"
              )}
            >
              <div
                className={cn(
                  "mt-1 h-2 w-2 rounded-full shrink-0",
                  n.read ? "bg-transparent" : "bg-emerald-500"
                )}
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    "text-sm",
                    n.read
                      ? "text-zinc-500"
                      : "text-zinc-200 font-medium"
                  )}
                >
                  {n.title}
                </p>
                <p className="text-xs text-zinc-600 mt-0.5 line-clamp-2">
                  {n.body}
                </p>
                <p className="text-[11px] text-zinc-700 mt-1">
                  {new Date(n.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
