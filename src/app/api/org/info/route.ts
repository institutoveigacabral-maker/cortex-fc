import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { getOrgById } from "@/db/queries/org";

/**
 * GET /api/org/info
 * Returns basic org info (tier, stripe IDs) for the current user's org.
 */
export async function GET() {
  const { session, error } = await requireAuth();
  if (error) return error;

  try {
    const org = await getOrgById(session!.orgId);
    if (!org) {
      return NextResponse.json(
        { error: "Organizacao nao encontrada" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      tier: org.tier,
      stripeCustomerId: org.stripeCustomerId,
      stripeSubscriptionId: org.stripeSubscriptionId,
      trialEndsAt: org.trialEndsAt,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Erro ao buscar informacoes da organizacao", detail: message },
      { status: 500 }
    );
  }
}
