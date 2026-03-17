"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { CheckmarkAnimation } from "./checkmark-animation"
import { ConfettiBurst } from "./confetti-burst"

type SuccessFeedbackVariant = "subtle" | "celebration"

interface SuccessFeedbackProps {
  show: boolean
  message?: string
  variant?: SuccessFeedbackVariant
  onComplete?: () => void
}

function SuccessFeedback({
  show,
  message,
  variant = "subtle",
  onComplete,
}: SuccessFeedbackProps) {
  const [visible, setVisible] = React.useState(false)
  const [messageVisible, setMessageVisible] = React.useState(false)
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  React.useEffect(() => {
    if (show) {
      setVisible(true)
      setMessageVisible(false)
    } else {
      setVisible(false)
      setMessageVisible(false)
    }
  }, [show])

  React.useEffect(() => {
    if (!visible) return

    // Auto-hide after 2s
    timerRef.current = setTimeout(() => {
      setVisible(false)
      setMessageVisible(false)
      onComplete?.()
    }, 2000)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [visible, onComplete])

  const handleCheckmarkComplete = React.useCallback(() => {
    if (message) {
      setMessageVisible(true)
    }
  }, [message])

  if (!visible) return null

  return (
    <div className="relative inline-flex flex-col items-center gap-2 animate-[scaleIn_200ms_ease-out_both]">
      <CheckmarkAnimation
        size={variant === "celebration" ? 48 : 32}
        color="emerald-500"
        onComplete={handleCheckmarkComplete}
      />
      {message && (
        <p
          className={cn(
            "text-sm font-medium text-emerald-400 transition-opacity duration-300",
            messageVisible ? "opacity-100" : "opacity-0"
          )}
        >
          {message}
        </p>
      )}
      {variant === "celebration" && (
        <ConfettiBurst trigger={visible} />
      )}
      <style jsx>{`
        @keyframes scaleIn {
          from {
            transform: scale(0.8);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}

export { SuccessFeedback }
export type { SuccessFeedbackProps }
