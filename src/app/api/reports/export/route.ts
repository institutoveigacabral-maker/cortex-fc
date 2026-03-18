import { NextRequest, NextResponse } from "next/server"
import { requireAuth } from "@/lib/auth-helpers"
import { getAnalyses } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import { analysesToCSV, analysesToJSON, analysesToXLSX } from "@/lib/export"
import { isTierAtLeast, getTierLimits } from "@/lib/feature-gates"

export async function GET(req: NextRequest) {
  const { session, error } = await requireAuth()
  if (error) return error

  if (!isTierAtLeast(session!.tier, "scout_individual")) {
    return NextResponse.json(
      { error: "Exportacao disponivel a partir do plano Scout Individual. Faca upgrade." },
      { status: 403 }
    )
  }

  const { searchParams } = new URL(req.url)
  const format = searchParams.get("format") ?? "csv"

  // Validate format is allowed for the tier
  const tierLimits = getTierLimits(session!.tier)
  if (!tierLimits.exportFormats.includes(format) && format !== "json") {
    return NextResponse.json(
      { error: `Formato "${format}" nao disponivel no seu plano. Formatos permitidos: ${tierLimits.exportFormats.join(", ") || "nenhum"}` },
      { status: 403 }
    )
  }

  const ids = searchParams.get("ids")?.split(",").filter(Boolean)

  const rawAnalyses = await getAnalyses(session!.orgId)
  let analyses = rawAnalyses.map(toAnalysisUI)

  // Filter by IDs if provided
  if (ids && ids.length > 0) {
    analyses = analyses.filter((a) => ids.includes(a.id))
  }

  const timestamp = new Date().toISOString().slice(0, 10)

  switch (format) {
    case "csv": {
      const csv = analysesToCSV(analyses)
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="cortex-analises-${timestamp}.csv"`,
        },
      })
    }
    case "json": {
      const json = analysesToJSON(analyses)
      return new NextResponse(json, {
        headers: {
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="cortex-analises-${timestamp}.json"`,
        },
      })
    }
    case "xlsx": {
      const xlsx = analysesToXLSX(analyses)
      return new NextResponse(xlsx, {
        headers: {
          "Content-Type": "application/vnd.ms-excel",
          "Content-Disposition": `attachment; filename="cortex-analises-${timestamp}.xml"`,
        },
      })
    }
    default:
      return NextResponse.json(
        { error: "format must be csv, json, or xlsx" },
        { status: 400 }
      )
  }
}
