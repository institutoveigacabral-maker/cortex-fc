"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import {
  FileText,
  Filter,
  CalendarDays,
  TrendingUp,
  Percent,
  Eye,
  Download,
  Share2,
  Bot,
  Sparkles,
  CheckCircle,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DecisionBadge } from "@/components/cortex/DecisionBadge"
import { UpgradePrompt } from "@/components/cortex/UpgradePrompt"
import { FeatureGate } from "@/components/cortex/FeatureGate"
import { EmptyState } from "@/components/ui/empty-state"
import { EmptyStateCTA } from "@/components/cortex/EmptyStateCTA"
import { ExportMenu } from "@/components/cortex/ExportMenu"
import { REPORT_TEMPLATES } from "@/lib/report-templates"
import { getDecisionColor } from "@/lib/db-transforms"
import type { AnalysisUI } from "@/lib/db-transforms"
import type { CortexDecision } from "@/types/cortex"

const decisionFilters: { label: string; value: CortexDecision | "ALL" }[] = [
  { label: "Todos", value: "ALL" },
  { label: "Blindar", value: "BLINDAR" },
  { label: "Monitorar", value: "MONITORAR" },
  { label: "Recusar", value: "RECUSAR" },
  { label: "Contratar", value: "CONTRATAR" },
  { label: "Emprestimo", value: "EMPRESTIMO" },
  { label: "Alerta Cinza", value: "ALERTA_CINZA" },
]

interface GeneratedReport {
  id: string
  title: string
  type: string
  pdfUrl: string | null
  createdAt: Date
}

interface Props {
  analyses: AnalysisUI[]
  generatedReports?: GeneratedReport[]
  tier?: string
}

export function ReportsClient({ analyses, generatedReports = [], tier = "free" }: Props) {
  const [decisionFilter, setDecisionFilter] = useState<CortexDecision | "ALL">("ALL")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [generating, setGenerating] = useState<string | null>(null)

  const filteredReports = useMemo(() => {
    return analyses.filter((a) => {
      if (decisionFilter !== "ALL" && a.decision !== decisionFilter) return false
      if (dateFrom && a.date < dateFrom) return false
      if (dateTo && a.date > dateTo) return false
      return true
    })
  }, [analyses, decisionFilter, dateFrom, dateTo])

  const totalReports = analyses.length

  const reportsThisMonth = useMemo(() => {
    const now = new Date()
    const month = now.getMonth()
    const year = now.getFullYear()
    return analyses.filter((a) => {
      const d = new Date(a.createdAt)
      return d.getMonth() === month && d.getFullYear() === year
    }).length
  }, [analyses])

  const averageConfidence = useMemo(() => {
    if (analyses.length === 0) return 0
    return Math.round(
      analyses.reduce((sum, a) => sum + a.confidence, 0) / analyses.length
    )
  }, [analyses])

  const statsCards = [
    {
      title: "Total Relatorios",
      value: totalReports,
      icon: FileText,
      subtitle: "Pareceres gerados",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/20",
      glowColor: "shadow-emerald-500/5",
    },
    {
      title: "Este Mes",
      value: reportsThisMonth,
      icon: CalendarDays,
      subtitle: "Relatorios recentes",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
      borderColor: "border-blue-500/20",
      glowColor: "shadow-blue-500/5",
    },
    {
      title: "Confianca Media",
      value: `${averageConfidence}%`,
      icon: Percent,
      subtitle: "Score de confianca ORACLE",
      color: "text-cyan-400",
      bgColor: "bg-cyan-500/10",
      borderColor: "border-cyan-500/20",
      glowColor: "shadow-cyan-500/5",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="animate-slide-down">
        <h1 className="text-2xl font-bold text-zinc-100 tracking-tight">
          Relatorios
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Central de relatorios e pareceres ORACLE
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {statsCards.map((stat, idx) => {
          const Icon = stat.icon
          return (
            <Card
              key={stat.title}
              className={`bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up overflow-hidden relative ${
                idx === 0 ? "stagger-1" : idx === 1 ? "stagger-2" : "stagger-3"
              }`}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-zinc-500 font-medium uppercase tracking-wider">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold text-zinc-100 mt-1 font-mono">
                      {stat.value}
                    </p>
                    <p className="text-xs text-zinc-500 mt-1">{stat.subtitle}</p>
                  </div>
                  <div className={`w-11 h-11 rounded-xl ${stat.bgColor} border ${stat.borderColor} flex items-center justify-center shadow-lg ${stat.glowColor}`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Generate Report Buttons + Export */}
      <div className="flex flex-wrap items-center gap-3 animate-slide-up stagger-2">
        <FeatureGate
          allowed={tier !== "free"}
          requiredTier="Scout"
          featureName="Geracao de PDF"
        >
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="outline"
              className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-2"
              disabled={generating !== null}
              onClick={async () => {
                setGenerating("squad")
                try {
                  const res = await fetch("/api/reports/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ template: "squad_analysis" }),
                  })
                  if (res.ok) {
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = "analise-elenco.pdf"
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                } catch {}
                setGenerating(null)
              }}
            >
              <Download className="w-4 h-4" />
              {generating === "squad" ? "Gerando..." : "PDF — Analise de Elenco"}
            </Button>
            <Button
              variant="outline"
              className="bg-zinc-800/40 border-zinc-700/40 text-zinc-300 hover:bg-emerald-500/10 hover:border-emerald-500/30 hover:text-emerald-400 gap-2"
              disabled={generating !== null}
              onClick={async () => {
                setGenerating("newsletter")
                try {
                  const res = await fetch("/api/reports/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ template: "weekly_newsletter" }),
                  })
                  if (res.ok) {
                    const blob = await res.blob()
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = "newsletter-semanal.pdf"
                    a.click()
                    URL.revokeObjectURL(url)
                  }
                } catch {}
                setGenerating(null)
              }}
            >
              <FileText className="w-4 h-4" />
              {generating === "newsletter" ? "Gerando..." : "PDF — Newsletter Semanal"}
            </Button>
          </div>
        </FeatureGate>
        <div className="ml-auto">
          <ExportMenu analyses={filteredReports} />
        </div>
      </div>

      {/* Filters - Glassmorphism */}
      <div className="glass rounded-xl p-4 animate-slide-up stagger-2">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-emerald-500/70" />
          <span className="text-xs text-zinc-400 font-semibold uppercase tracking-widest">
            Filtros
          </span>
        </div>
        <div className="flex flex-col md:flex-row gap-4">
          {/* Decision filter */}
          <div className="flex flex-wrap gap-2">
            {decisionFilters.map((df) => {
              const isActive = decisionFilter === df.value
              return (
                <button
                  key={df.value}
                  onClick={() => setDecisionFilter(df.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all duration-200 font-medium ${
                    isActive
                      ? "bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-sm shadow-emerald-500/10"
                      : "bg-zinc-800/40 border-zinc-700/40 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 hover:bg-zinc-800/60"
                  }`}
                >
                  {isActive && <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse" />}
                  {df.label}
                </button>
              )
            })}
          </div>

          {/* Date range */}
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-xs text-zinc-500">De:</span>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36 h-8 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
            <span className="text-xs text-zinc-500">Ate:</span>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36 h-8 bg-zinc-800/40 border-zinc-700/40 text-zinc-300 text-xs rounded-lg focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredReports.map((analysis, idx) => {
          return (
            <Card
              key={analysis.id}
              className="bg-zinc-900/80 border-zinc-800/80 card-hover animate-slide-up overflow-hidden relative group"
              style={{ animationDelay: `${(idx % 6) * 80}ms` }}
            >
              {/* Top gradient line */}
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent group-hover:via-emerald-500/30 transition-all duration-500" />
              {/* Hover border glow */}
              <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none border border-emerald-500/10" />

              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-zinc-800/80 flex items-center justify-center text-xs font-bold text-zinc-400 flex-shrink-0 border border-zinc-700/50 group-hover:border-emerald-500/20 transition-colors">
                      {(analysis.player?.name ?? "?")
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-100">
                        {analysis.player?.name ?? "---"}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {analysis.player?.position} --- {analysis.player?.club}
                      </p>
                    </div>
                  </div>
                  <DecisionBadge decision={analysis.decision} size="sm" />
                </div>

                <p className="text-xs text-zinc-400 line-clamp-2 mb-4 leading-relaxed">
                  {analysis.reasoning}
                </p>

                <div className="flex items-center gap-3 mb-4 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-800/50">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 uppercase font-medium">Vx</span>
                    <span className="text-xs font-mono text-emerald-400 font-semibold">
                      {analysis.vx.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-zinc-700/50" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 uppercase font-medium">Rx</span>
                    <span className="text-xs font-mono text-red-400 font-semibold">
                      {analysis.rx.toFixed(2)}
                    </span>
                  </div>
                  <div className="w-px h-3 bg-zinc-700/50" />
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-zinc-500 uppercase font-medium">SCN+</span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">
                      {analysis.algorithms.SCN_plus}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <TrendingUp className="w-3 h-3 text-zinc-500" />
                    <span className="text-xs font-mono text-zinc-400">
                      {analysis.confidence}%
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-500">{analysis.date}</span>
                  <Link href={`/reports/${analysis.id}`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 text-xs h-8 gap-1.5 transition-all"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Ver Relatorio
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {filteredReports.length === 0 && (
        <Card className="bg-zinc-900/80 border-zinc-800 animate-fade-in">
          <CardContent className="p-0">
            {analyses.length === 0 ? (
              <EmptyStateCTA
                icon={<FileText className="w-6 h-6" />}
                title="Nenhum relatorio gerado"
                description="Execute analises neurais nos seus jogadores para gerar pareceres completos em PDF."
                primaryAction={{ label: "Nova Analise", href: "/analysis/new" }}
                secondaryAction={{ label: "Explorar Jogadores", href: "/players/explore" }}
              />
            ) : (
              <EmptyState
                icon={Filter}
                title="Nenhum relatorio encontrado"
                description="Ajuste os filtros para ver resultados"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Historico de Geracoes */}
      {generatedReports.length > 0 && (
        <div className="space-y-4 animate-slide-up">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-500/70" />
            <h2 className="text-lg font-semibold text-zinc-100">
              Historico de Geracoes
            </h2>
            <span className="text-xs text-zinc-500 ml-1">
              ({generatedReports.length})
            </span>
          </div>

          <div className="space-y-2">
            {generatedReports.map((report) => {
              const template = REPORT_TEMPLATES[report.type]
              const templateName = template?.name ?? report.type
              const createdDate = new Date(report.createdAt).toLocaleDateString("pt-BR", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <div
                  key={report.id}
                  className="flex items-center gap-4 p-4 bg-zinc-900/80 border border-zinc-800/80 rounded-xl hover:border-zinc-700 transition-colors group"
                >
                  {/* Status icon */}
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
                    <CheckCircle className="w-4 h-4 text-emerald-400" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-200 truncate">
                      {report.title}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-400">
                        {templateName}
                      </span>
                      <span className="text-xs text-zinc-500">{createdDate}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {report.pdfUrl && (
                      <a
                        href={report.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg hover:bg-emerald-500/20 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5" />
                        PDF
                      </a>
                    )}
                    <button
                      onClick={() => {
                        const shareUrl = `${window.location.origin}/reports/${report.id}`
                        navigator.clipboard.writeText(shareUrl)
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-zinc-800 text-zinc-400 border border-zinc-700 rounded-lg hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      Compartilhar
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
