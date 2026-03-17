import type { Locale } from "@/i18n/config"

// Date formatting
export function formatDate(date: Date | string, locale: Locale = "pt-BR"): string {
  const d = typeof date === "string" ? new Date(date) : date
  if (isNaN(d.getTime())) return "—"

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
  // pt-BR: 16/03/2026
  // en: 03/16/2026
}

export interface RelativeTimeStrings {
  now: string
  minutesAgo: string
  hoursAgo: string
  daysAgo: string
  monthsAgo: string
}

const defaultRelativeStrings: RelativeTimeStrings = {
  now: "agora",
  minutesAgo: "{count}min atras",
  hoursAgo: "{count}h atras",
  daysAgo: "{count}d atras",
  monthsAgo: "{count}m atras",
}

export function formatDateRelative(
  date: Date | string,
  strings: RelativeTimeStrings = defaultRelativeStrings,
  locale: Locale = "pt-BR"
): string {
  const d = typeof date === "string" ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHour = Math.floor(diffMs / 3600000)
  const diffDay = Math.floor(diffMs / 86400000)
  const diffMonth = Math.floor(diffDay / 30)

  if (diffMin < 1) return strings.now
  if (diffMin < 60) return strings.minutesAgo.replace("{count}", String(diffMin))
  if (diffHour < 24) return strings.hoursAgo.replace("{count}", String(diffHour))
  if (diffDay < 30) return strings.daysAgo.replace("{count}", String(diffDay))
  if (diffMonth < 12) return strings.monthsAgo.replace("{count}", String(diffMonth))
  return formatDate(d, locale)
}

// Number formatting
export function formatNumber(value: number, locale: Locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale).format(value)
  // pt-BR: 1.234,56
  // en: 1,234.56
}

// Currency formatting
export function formatCurrency(value: number, locale: Locale = "pt-BR", currency: string = "EUR"): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value)
  // pt-BR: € 10,5
  // en: €10.5
}

// Percentage formatting
export function formatPercent(value: number, locale: Locale = "pt-BR"): string {
  return new Intl.NumberFormat(locale, {
    style: "percent",
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value / 100)
}
