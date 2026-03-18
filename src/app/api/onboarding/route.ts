import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-helpers";
import { db } from "@/db/index";
import { organizations, orgInvites, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { sendInviteEmail } from "@/lib/email";

interface InvitePayload {
  email: string;
  role: "analyst" | "scout" | "viewer";
}

export async function POST(request: Request) {
  try {
    const { session, error } = await requireAuth();
    if (error) return error;

    const body = await request.json();
    const {
      orgName,
      orgType,
      country,
      leagueId,
      invites,
      // Legacy support: accept inviteEmails as string[]
      inviteEmails,
    } = body as {
      orgName: string;
      orgType: string;
      country?: string;
      leagueId?: number;
      invites?: InvitePayload[];
      inviteEmails?: string[];
    };

    if (!orgName?.trim()) {
      return NextResponse.json(
        { error: "Nome da organizacao e obrigatorio" },
        { status: 400 }
      );
    }

    // Update org name and mark onboarding complete.
    // Store onboarding metadata (orgType, country, leagueId) in brandAccentColor
    // as JSON until a proper settings JSONB column is added via migration.
    const updateData: Record<string, unknown> = {
      name: orgName.trim(),
      onboardingCompletedAt: new Date(),
      updatedAt: new Date(),
    };

    // Store onboarding metadata (orgType, country, leagueId) in brandAccentColor
    // as a JSON string. This is a temporary solution until a proper settings
    // JSONB column or primaryLeagueId column is added via migration.
    const onboardingMeta: Record<string, unknown> = {};
    if (orgType) onboardingMeta.orgType = orgType;
    if (country) onboardingMeta.country = country;
    if (leagueId) onboardingMeta.leagueId = leagueId;

    if (Object.keys(onboardingMeta).length > 0) {
      updateData.brandAccentColor = JSON.stringify(onboardingMeta);
    }

    await db
      .update(organizations)
      .set(updateData)
      .where(eq(organizations.id, session.orgId));

    // Normalize invites: support both new format (invites[]) and legacy (inviteEmails[])
    const normalizedInvites: InvitePayload[] = [];

    if (invites && invites.length > 0) {
      normalizedInvites.push(...invites);
    } else if (inviteEmails && inviteEmails.length > 0) {
      normalizedInvites.push(
        ...inviteEmails.map((email: string) => ({ email, role: "analyst" as const }))
      );
    }

    if (normalizedInvites.length > 0) {
      const validInvites = normalizedInvites.filter(
        (inv) =>
          inv.email &&
          /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(inv.email.trim().toLowerCase())
      );

      if (validInvites.length > 0) {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const inviteValues = validInvites.map((inv) => ({
          email: inv.email.trim().toLowerCase(),
          orgId: session.orgId,
          role: inv.role || "analyst",
          token: randomUUID(),
          invitedBy: session.userId,
          expiresAt,
        }));

        await db.insert(orgInvites).values(inviteValues);

        // Send invite emails (don't fail onboarding if emails fail)
        const inviter = await db.query.users.findFirst({
          where: eq(users.id, session.userId),
        });
        const inviterName = inviter?.name ?? "Um membro";

        for (const invite of inviteValues) {
          sendInviteEmail(
            invite.email,
            inviterName,
            orgName.trim(),
            invite.role,
            invite.token
          ).catch((err) => {
            console.error(`Failed to send invite email to ${invite.email}:`, err);
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Onboarding failed:", error);
    return NextResponse.json(
      { error: "Falha ao completar onboarding" },
      { status: 500 }
    );
  }
}
