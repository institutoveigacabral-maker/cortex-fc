"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  X,
  User,
  Users,
  Search,
  Newspaper,
  GitCompare,
  CalendarDays,
  AlertCircle,
} from "lucide-react"
import { REPORT_TEMPLATES, type ReportTemplateConfig } from "@/lib/report-templates"

// ============================================
// Types
// ============================================

interface Schedule {
  id: string
  template: string
  title: string | null
  frequency: string
  dayOfWeek: number | null
  dayOfMonth: number | null
  hour: number
  timezone: string | null
  recipientEmails: string[] | null
  isActive: boolean
  lastRunAt: string | null
  nextRunAt: string | null
  createdAt: string
}

type ModalMode = "create" | "edit"

const ICON_MAP: Record<string, typeof User> = {
  User,
  Users,
  Search,
  Newspaper,
  GitCompare,
}

const FREQUENCY_LABELS: Record<string, string> = {
  daily: "Diario",
  weekly: "Semanal",
  monthly: "Mensal",
}

const FREQUENCY_COLORS: Record<string, string> = {
  daily: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  weekly: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  monthly: "bg-purple-500/15 text-purple-400 border-purple-500/30",
}

const DAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sab"]

// ============================================
// Helper functions
// ============================================

function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return "---"
  const date = new Date(dateStr)
  return date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function getTemplateIcon(iconName: string) {
  return ICON_MAP[iconName] ?? CalendarDays
}

// ============================================
// Schedule Card
// ============================================

function ScheduleCard({
  schedule,
  onToggle,
  onDelete,
}: {
  schedule: Schedule
  onToggle: (id: string, isActive: boolean) => void
  onDelete: (id: string) => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const template = REPORT_TEMPLATES[schedule.template]
  const Icon = template ? getTemplateIcon(template.icon) : CalendarDays
  const templateName = template?.name ?? schedule.template

  return (
    <div
      className={`bg-zinc-900/80 border rounded-xl p-5 transition-all duration-200 hover:border-zinc-700 ${
        schedule.isActive ? "border-zinc-800/80" : "border-zinc-800/40 opacity-60"
      }`}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <Icon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <p className="text-sm font-semibold text-zinc-100">
              {schedule.title ?? templateName}
            </p>
            {schedule.title && (
              <p className="text-xs text-zinc-500">{templateName}</p>
            )}
          </div>
        </div>
        <span
          className={`text-xs px-2.5 py-1 rounded-full border font-medium ${
            FREQUENCY_COLORS[schedule.frequency] ?? "bg-zinc-800 text-zinc-400 border-zinc-700"
          }`}
        >
          {FREQUENCY_LABELS[schedule.frequency] ?? schedule.frequency}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4 text-xs">
        <div>
          <span className="text-zinc-500">Proxima execucao</span>
          <p className="text-zinc-300 font-medium mt-0.5">
            {formatDateTime(schedule.nextRunAt)}
          </p>
        </div>
        <div>
          <span className="text-zinc-500">Ultima execucao</span>
          <p className="text-zinc-300 font-medium mt-0.5">
            {schedule.lastRunAt ? formatDateTime(schedule.lastRunAt) : "Nunca executado"}
          </p>
        </div>
      </div>

      {schedule.recipientEmails && schedule.recipientEmails.length > 0 && (
        <div className="mb-4 text-xs">
          <span className="text-zinc-500">Destinatarios: </span>
          <span className="text-zinc-400">
            {schedule.recipientEmails.length} email(s)
          </span>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-zinc-800/50">
        {/* Active toggle */}
        <button
          onClick={() => onToggle(schedule.id, !schedule.isActive)}
          className="flex items-center gap-2 text-xs group"
        >
          <div
            className={`relative w-9 h-5 rounded-full transition-colors ${
              schedule.isActive ? "bg-emerald-600" : "bg-zinc-700"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                schedule.isActive ? "left-[18px]" : "left-0.5"
              }`}
            />
          </div>
          <span className="text-zinc-400 group-hover:text-zinc-300 transition-colors">
            {schedule.isActive ? "Ativo" : "Inativo"}
          </span>
        </button>

        {/* Delete button */}
        {confirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-red-400">Confirmar?</span>
            <button
              onClick={() => {
                onDelete(schedule.id)
                setConfirmDelete(false)
              }}
              className="px-2 py-1 text-xs bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              Sim
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2 py-1 text-xs bg-zinc-800 text-zinc-400 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Nao
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Excluir
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================
// Create/Edit Modal
// ============================================

function ScheduleModal({
  mode,
  schedule,
  onSave,
  onClose,
}: {
  mode: ModalMode
  schedule?: Schedule | null
  onSave: (data: Record<string, unknown>) => Promise<void>
  onClose: () => void
}) {
  const [template, setTemplate] = useState(schedule?.template ?? "")
  const [title, setTitle] = useState(schedule?.title ?? "")
  const [frequency, setFrequency] = useState(schedule?.frequency ?? "weekly")
  const [dayOfWeek, setDayOfWeek] = useState(schedule?.dayOfWeek ?? 1)
  const [dayOfMonth, setDayOfMonth] = useState(schedule?.dayOfMonth ?? 1)
  const [hour, setHour] = useState(schedule?.hour ?? 9)
  const [emails, setEmails] = useState(
    schedule?.recipientEmails?.join("\n") ?? ""
  )
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const templateList = Object.values(REPORT_TEMPLATES)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!template) {
      setError("Selecione um modelo de relatorio")
      return
    }

    setSaving(true)
    setError("")

    const recipientEmails = emails
      .split("\n")
      .map((e) => e.trim())
      .filter(Boolean)

    const payload: Record<string, unknown> = {
      template,
      title: title || undefined,
      frequency,
      hour,
      recipientEmails,
    }

    if (frequency === "weekly") payload.dayOfWeek = dayOfWeek
    if (frequency === "monthly") payload.dayOfMonth = dayOfMonth
    if (mode === "edit" && schedule) payload.id = schedule.id

    try {
      await onSave(payload)
    } catch {
      setError("Erro ao salvar agendamento")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-zinc-100">
            {mode === "create" ? "Novo Agendamento" : "Editar Agendamento"}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {/* Template selector */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Modelo de Relatorio *
            </label>
            <select
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
            >
              <option value="">Selecionar modelo...</option>
              {templateList.map((t: ReportTemplateConfig) => (
                <option key={t.id} value={t.id}>
                  {t.name} — {t.description}
                </option>
              ))}
            </select>
          </div>

          {/* Custom title */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Titulo personalizado (opcional)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Relatorio semanal do elenco"
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none placeholder:text-zinc-600"
            />
          </div>

          {/* Frequency */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Frequencia *
            </label>
            <div className="flex gap-2">
              {(["daily", "weekly", "monthly"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setFrequency(f)}
                  className={`flex-1 px-3 py-2 text-sm rounded-lg border transition-all font-medium ${
                    frequency === f
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
                  }`}
                >
                  {FREQUENCY_LABELS[f]}
                </button>
              ))}
            </div>
          </div>

          {/* Day of week (for weekly) */}
          {frequency === "weekly" && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Dia da semana
              </label>
              <div className="flex gap-1.5">
                {DAY_NAMES.map((name, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setDayOfWeek(idx)}
                    className={`flex-1 px-1 py-2 text-xs rounded-lg border transition-all font-medium ${
                      dayOfWeek === idx
                        ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                        : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-zinc-300 hover:border-zinc-600"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Day of month (for monthly) */}
          {frequency === "monthly" && (
            <div>
              <label className="block text-sm text-zinc-400 mb-2">
                Dia do mes (1-28)
              </label>
              <input
                type="number"
                value={dayOfMonth}
                onChange={(e) => {
                  const v = Math.max(1, Math.min(28, Number(e.target.value)))
                  setDayOfMonth(v)
                }}
                min={1}
                max={28}
                className="w-24 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
              />
            </div>
          )}

          {/* Hour picker */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Horario (0-23h)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={hour}
                onChange={(e) => {
                  const v = Math.max(0, Math.min(23, Number(e.target.value)))
                  setHour(v)
                }}
                min={0}
                max={23}
                className="w-20 bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none"
              />
              <span className="text-xs text-zinc-500">:00 (horario de Brasilia)</span>
            </div>
          </div>

          {/* Recipient emails */}
          <div>
            <label className="block text-sm text-zinc-400 mb-2">
              Emails dos destinatarios (um por linha)
            </label>
            <textarea
              value={emails}
              onChange={(e) => setEmails(e.target.value)}
              placeholder={"analista@clube.com\ndiretoria@clube.com"}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 text-zinc-200 rounded-lg px-3 py-2.5 text-sm focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 focus:outline-none placeholder:text-zinc-600 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors disabled:opacity-50"
            >
              {saving ? "Salvando..." : mode === "create" ? "Criar Agendamento" : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ============================================
// Main Page
// ============================================

export default function SchedulesPage() {
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null)

  const fetchSchedules = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/reports/schedules")
      if (res.ok) {
        const data = await res.json()
        setSchedules(data.schedules ?? [])
      }
    } catch {
      setMessage({ type: "error", text: "Erro ao carregar agendamentos" })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleCreate = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/reports/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error ?? "Erro ao criar")
    }
    setShowModal(false)
    setMessage({ type: "success", text: "Agendamento criado com sucesso" })
    await fetchSchedules()
    setTimeout(() => setMessage(null), 3000)
  }

  const handleToggle = async (id: string, isActive: boolean) => {
    const res = await fetch("/api/reports/schedules", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, isActive }),
    })
    if (res.ok) {
      setSchedules((prev) =>
        prev.map((s) => (s.id === id ? { ...s, isActive } : s))
      )
    }
  }

  const handleDelete = async (id: string) => {
    const res = await fetch(`/api/reports/schedules?id=${id}`, {
      method: "DELETE",
    })
    if (res.ok) {
      setSchedules((prev) => prev.filter((s) => s.id !== id))
      setMessage({ type: "success", text: "Agendamento removido" })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
            Agendamentos de Relatorios
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Configure a geracao automatica de relatorios
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
        >
          <Plus className="w-4 h-4" />
          Novo Agendamento
        </button>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`rounded-lg p-4 border text-sm ${
            message.type === "error"
              ? "bg-red-500/10 border-red-500/30 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-5 animate-pulse"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg" />
                <div>
                  <div className="h-4 w-36 bg-zinc-800 rounded mb-2" />
                  <div className="h-3 w-24 bg-zinc-800 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-zinc-800 rounded mb-2" />
              <div className="h-3 w-2/3 bg-zinc-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Schedule cards */}
      {!loading && schedules.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {schedules.map((schedule) => (
            <ScheduleCard
              key={schedule.id}
              schedule={schedule}
              onToggle={handleToggle}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && schedules.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-4">
            <Calendar className="w-8 h-8 text-zinc-600" />
          </div>
          <h3 className="text-lg font-semibold text-zinc-300 mb-2">
            Nenhum agendamento configurado
          </h3>
          <p className="text-sm text-zinc-500 max-w-sm mb-6">
            Configure agendamentos para gerar relatorios automaticamente em intervalos regulares.
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-500 transition-colors font-medium"
          >
            <Plus className="w-4 h-4" />
            Criar primeiro agendamento
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <ScheduleModal
          mode="create"
          onSave={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  )
}
