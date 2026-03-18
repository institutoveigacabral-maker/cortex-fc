import { getAnalyses } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import { getReports } from "@/db/queries/reports"
import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { ReportsClient } from "./ReportsClient"

export default async function ReportsPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const dbAnalyses = await getAnalyses(session.orgId)
  const analyses = dbAnalyses.map(toAnalysisUI)

  const generatedReports = await getReports(session.orgId, { limit: 50 })

  return (
    <ReportsClient
      analyses={analyses}
      generatedReports={generatedReports}
      tier={session.tier}
    />
  )
}
