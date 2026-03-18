import { NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/auth-helpers";
import { hasPermission } from "@/lib/rbac";
import { createSharedView } from "@/db/queries";

/**
 * POST /api/share — Create a shared view link
 *
 * Body: { viewType, viewConfig, title?, expiresInDays? }
 * Returns: { token, url }
 */
export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    if (!hasPermission(session!.role, "share.create")) {
      return NextResponse.json({ error: "Sem permissao" }, { status: 403 });
    }

    const body = await request.json();
    const { viewType, viewConfig, title, expiresInDays } = body;

    if (!viewType || !viewConfig) {
      return NextResponse.json(
        { error: "viewType e viewConfig sao obrigatorios" },
        { status: 400 }
      );
    }

    const validTypes = ["dashboard", "player", "analysis", "scouting"];
    if (!validTypes.includes(viewType)) {
      return NextResponse.json(
        { error: `viewType invalido. Use: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    const token = crypto.randomBytes(24).toString("base64url");

    let expiresAt: Date | null = null;
    if (expiresInDays && expiresInDays > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + expiresInDays);
    }

    const view = await createSharedView({
      orgId: session!.orgId,
      userId: session!.userId,
      token,
      viewType,
      viewConfig,
      title: title || null,
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "";
    const url = `${baseUrl}/shared/${view.token}`;

    return NextResponse.json({ token: view.token, url });
  } catch (err) {
    console.error("Failed to create shared view:", err);
    return NextResponse.json(
      { error: "Erro ao criar link compartilhado" },
      { status: 500 }
    );
  }
}
