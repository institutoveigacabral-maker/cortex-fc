import { getAnalyses } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import { getReports } from "@/db/queries/reports"
import { getAuthSession } from "@/lib/auth-helpers"
import { ReportsClient } from "./ReportsClient"

export default async function ReportsPage() {
  const dbAnalyses = await getAnalyses()
  const analyses = dbAnalyses.map(toAnalysisUI)

  const session = await getAuthSession()
  const generatedReports = session
    ? await getReports(session.orgId, { limit: 50 })
    : []

  return <ReportsClient analyses={analyses} generatedReports={generatedReports} />
}
