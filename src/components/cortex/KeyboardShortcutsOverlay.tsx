"use client"

import { useEffect, useRef, useCallback } from "react"
import { useTranslations } from "next-intl"

interface KeyboardShortcutsOverlayProps {
  open: boolean
  onClose: () => void
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-zinc-800 border border-zinc-700 rounded px-1.5 py-0.5 text-xs font-mono text-zinc-300">
      {children}
    </kbd>
  )
}

export function KeyboardShortcutsOverlay({ open, onClose }: KeyboardShortcutsOverlayProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const t = useTranslations("common")

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault()
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    if (!open) return
    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open, handleKeyDown])

  useEffect(() => {
    if (open) {
      panelRef.current?.focus()
    }
  }, [open])

  if (!open) return null

  const sections = [
    {
      title: t("shortcutNavigation"),
      shortcuts: [
        { keys: ["\u2318", "K"], desc: "Command Palette" },
        { keys: ["\u2318", "/"], desc: t("keyboardShortcuts") },
      ],
    },
    {
      title: t("shortcutActions"),
      shortcuts: [
        { keys: ["\u2318", "N"], desc: "Nova analise" },
        { keys: ["\u2318", ","], desc: "Settings" },
        { keys: ["Esc"], desc: "Fechar modal/overlay" },
      ],
    },
    {
      title: t("shortcutLists"),
      shortcuts: [
        { keys: ["\u2191", "\u2193"], desc: "Navegar itens" },
        { keys: ["Enter"], desc: "Selecionar" },
        { keys: ["Space"], desc: "Toggle" },
      ],
    },
    {
      title: t("shortcutAccessibility"),
      shortcuts: [
        { keys: ["Tab"], desc: "Proximo elemento" },
        { keys: ["Shift", "Tab"], desc: "Elemento anterior" },
      ],
    },
  ]

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={t("keyboardShortcuts")}
        className="w-full max-w-lg mx-4 rounded-xl border border-zinc-800/60 bg-zinc-900/90 backdrop-blur-xl shadow-2xl animate-scale-in outline-none"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800/60">
          <h2 className="text-sm font-semibold text-zinc-100">{t("keyboardShortcuts")}</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 transition-colors text-xs"
          >
            <Kbd>Esc</Kbd>
          </button>
        </div>

        {/* Sections */}
        <div className="px-6 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {sections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-2">
                {section.shortcuts.map((shortcut, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-400">{shortcut.desc}</span>
                    <div className="flex items-center gap-1">
                      {shortcut.keys.map((key, j) => (
                        <Kbd key={j}>{key}</Kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
