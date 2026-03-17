"use client"

import { useRef } from "react"
import { X } from "lucide-react"
import { useFocusTrap } from "@/hooks/useFocusTrap"

interface AdaptiveModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  titleId?: string
  children: React.ReactNode
  className?: string
  size?: "sm" | "md" | "lg"
}

const sizeMap = {
  sm: "max-w-[400px]",
  md: "max-w-[512px]",
  lg: "max-w-[640px]",
}

export function AdaptiveModal({
  isOpen,
  onClose,
  title,
  titleId,
  children,
  className = "",
  size = "md",
}: AdaptiveModalProps) {
  const desktopRef = useRef<HTMLDivElement>(null)
  const mobileRef = useRef<HTMLDivElement>(null)

  useFocusTrap(desktopRef, isOpen, onClose)
  useFocusTrap(mobileRef, isOpen, onClose)

  if (!isOpen) return null

  const resolvedTitleId = titleId ?? "adaptive-modal-title"

  return (
    <>
      {/* Desktop: centered dialog */}
      <div
        className="hidden md:flex fixed inset-0 z-50 items-center justify-center"
        role="dialog"
        aria-modal="true"
        aria-labelledby={resolvedTitleId}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* Dialog */}
        <div
          ref={desktopRef}
          className={`relative w-full ${sizeMap[size]} bg-zinc-900/95 border border-zinc-700 rounded-xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in ${className}`}
        >
          {/* Header */}
          <div className="sticky top-0 z-10 flex items-center justify-between p-5 border-b border-zinc-800 bg-zinc-900/95 rounded-t-xl">
            <h2 id={resolvedTitleId} className="text-sm font-semibold text-zinc-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {children}
        </div>
      </div>

      {/* Mobile: bottom sheet */}
      <div
        className="flex md:hidden fixed inset-0 z-50 items-end"
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${resolvedTitleId}-mobile`}
      >
        {/* Backdrop */}
        <div
          className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={onClose}
        />

        {/* Sheet */}
        <div
          ref={mobileRef}
          className={`relative w-full bg-zinc-900 border-t border-zinc-700 rounded-t-2xl max-h-[85vh] overflow-y-auto shadow-2xl animate-sheet-up pb-[env(safe-area-inset-bottom)] ${className}`}
        >
          {/* Handle bar */}
          <div className="sticky top-0 z-10 pt-3 pb-0 bg-zinc-900 rounded-t-2xl">
            <div className="w-10 h-1 bg-zinc-600 rounded-full mx-auto mb-3" />
          </div>

          {/* Header */}
          <div className="sticky top-[25px] z-10 flex items-center justify-between px-5 pb-4 border-b border-zinc-800 bg-zinc-900">
            <h2 id={`${resolvedTitleId}-mobile`} className="text-sm font-semibold text-zinc-100">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-zinc-300 transition-colors"
              aria-label="Fechar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {children}
        </div>
      </div>
    </>
  )
}
