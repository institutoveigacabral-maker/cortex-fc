"use client"

import * as React from "react"
import { useEffect } from "react"
import { XIcon } from "lucide-react"
import { useFocusTrap } from "@/hooks/useFocusTrap"
import { cn } from "@/lib/utils"

interface FullscreenModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  className?: string
}

export function FullscreenModal({
  isOpen,
  onClose,
  title,
  children,
  className,
}: FullscreenModalProps) {
  const trapRef = React.useRef<HTMLDivElement>(null)
  useFocusTrap(trapRef, isOpen, onClose)

  useEffect(() => {
    if (!isOpen) return
    document.body.style.overflow = "hidden"
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      ref={trapRef}
      className={cn(
        "fixed inset-0 z-50 flex flex-col bg-background animate-sheet-up safe-area-bottom",
        className
      )}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      {/* Header */}
      <div className="fixed inset-x-0 top-0 z-10 flex h-14 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-sm safe-area-bottom">
        <h2 className="text-base font-semibold text-foreground truncate pr-4">
          {title}
        </h2>
        <button
          onClick={onClose}
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Fechar"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pt-14 pb-[env(safe-area-inset-bottom,0px)]">
        {children}
      </div>
    </div>
  )
}
