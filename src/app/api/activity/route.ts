import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getAuditLogs } from "@/db/queries";

/**
 * GET /api/activity — Returns audit log entries for a specific entity or org-wide
 *
 * Query params:
 *   entityType - filter by entity type (e.g. "player", "analysis")
 *   entityId   - filter by specific entity ID
 *   limit      - max entries to return (default 50, max 200)
 */
export async function GET(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const url = new URL(request.url);
    const entityType = url.searchParams.get("entityType") || undefined;
    const entityId = url.searchParams.get("entityId") || undefined;
    const limit = Math.min(Number(url.searchParams.get("limit") || 50), 200);

    const logs = await getAuditLogs(session!.orgId, {
      entityType,
      entityId,
      limit,
    });

    const entries = logs.map((l) => ({
      id: l.id,
      action: l.action,
      userName: l.userName,
      metadata: l.metadata,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json({ entries });
  } catch (err) {
    console.error("Failed to fetch activity:", err);
    return NextResponse.json(
      { error: "Erro ao buscar atividade" },
      { status: 500 }
    );
  }
}
