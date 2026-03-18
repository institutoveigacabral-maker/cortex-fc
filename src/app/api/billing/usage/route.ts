import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getOrgUsageThisMonth } from "@/db/queries";

/**
 * GET /api/billing/usage
 * Returns usage stats for the current org this month.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const usage = await getOrgUsageThisMonth(session!.orgId);
    return NextResponse.json(usage);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Erro ao buscar uso", detail: message },
      { status: 500 }
    );
  }
}
