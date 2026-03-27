"use client"

import { useState, useCallback, useEffect } from "react"

interface SearchPreferences {
  sortField: string
  sortDir: "asc" | "desc"
  filters: Record<string, string>
}

const DEFAULT_PREFS: SearchPreferences = {
  sortField: "",
  sortDir: "asc",
  filters: {},
}

function getStorageKey(pageKey: string) {
  return `cortex-fc:search-prefs:${pageKey}`
}

export function useSearchPreferences(pageKey: string) {
  const [prefs, setPrefs] = useState<SearchPreferences>(() => {
    if (typeof window === "undefined") return DEFAULT_PREFS
    try {
      const raw = localStorage.getItem(getStorageKey(pageKey))
      if (raw) return JSON.parse(raw) as SearchPreferences
    } catch { /* Ignore parse errors */ }
    return DEFAULT_PREFS
  })
  const [loaded, setLoaded] = useState(() => typeof window !== "undefined")

  // Save to localStorage whenever prefs change (skip initial load)
  useEffect(() => {
    if (!loaded) return
    try {
      localStorage.setItem(getStorageKey(pageKey), JSON.stringify(prefs))
    } catch {
      // Ignore storage errors
    }
  }, [prefs, pageKey, loaded])

  const setSortField = useCallback((field: string) => {
    setPrefs((prev) => ({ ...prev, sortField: field }))
  }, [])

  const setSortDir = useCallback((dir: "asc" | "desc") => {
    setPrefs((prev) => ({ ...prev, sortDir: dir }))
  }, [])

  const setFilter = useCallback((key: string, value: string) => {
    setPrefs((prev) => ({
      ...prev,
      filters: { ...prev.filters, [key]: value },
    }))
  }, [])

  const clearFilters = useCallback(() => {
    setPrefs((prev) => ({ ...prev, filters: {} }))
  }, [])

  return {
    prefs,
    loaded,
    setSortField,
    setSortDir,
    setFilter,
    clearFilters,
  }
}
