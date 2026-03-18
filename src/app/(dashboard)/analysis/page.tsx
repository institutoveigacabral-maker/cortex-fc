import { getAnalyses } from "@/db/queries"
import { toAnalysisUI } from "@/lib/db-transforms"
import { getAuthSession } from "@/lib/auth-helpers"
import { redirect } from "next/navigation"
import { AnalysisClient } from "./AnalysisClient"

export default async function AnalysisPage() {
  const session = await getAuthSession()
  if (!session) redirect("/login")

  const dbAnalyses = await getAnalyses(session.orgId)
  const analyses = dbAnalyses.map(toAnalysisUI)

  return <AnalysisClient analyses={analyses} />
}
