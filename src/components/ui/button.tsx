import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"
import { Loader2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { CheckmarkAnimation } from "./checkmark-animation"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 active:scale-[0.98] active:transition-transform touch-action-manipulation",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:border-input dark:bg-input/30 dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        xs: "h-8 min-h-[44px] gap-1 rounded-md px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 rounded-md px-3 py-2 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-10",
        "icon-xs": "size-9 min-w-[44px] min-h-[44px] rounded-md [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-10",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  successState = false,
  children,
  disabled,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    successState?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"
  const [showSuccess, setShowSuccess] = React.useState(false)
  const prevSuccess = React.useRef(false)

  React.useEffect(() => {
    if (successState && !prevSuccess.current) {
      setShowSuccess(true)
      const timer = setTimeout(() => {
        setShowSuccess(false)
      }, 1500)
      prevSuccess.current = true
      return () => clearTimeout(timer)
    }
    if (!successState) {
      prevSuccess.current = false
    }
  }, [successState])

  const isSuccess = showSuccess || successState

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      disabled={disabled || loading}
      aria-disabled={disabled || loading || undefined}
      aria-busy={loading || undefined}
      className={cn(
        buttonVariants({ variant, size, className }),
        isSuccess && "!bg-emerald-500/10 !border-emerald-500/40 shadow-[0_0_8px_rgba(16,185,129,0.3)] transition-all duration-300"
      )}
      {...props}
    >
      {isSuccess ? (
        <CheckmarkAnimation size={16} onComplete={undefined} />
      ) : loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {typeof children === "string" ? "Processando..." : children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
