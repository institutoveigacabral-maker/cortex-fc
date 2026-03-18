import { NextResponse } from "next/server";
import { getStripe, priceIdToTier } from "@/lib/stripe";
import { db } from "@/db/index";
import { organizations, auditLogs, notifications, orgMembers } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import type Stripe from "stripe";

/**
 * Find org by Stripe customer ID
 */
async function getOrgByStripeCustomerId(customerId: string) {
  const [org] = await db
    .select()
    .from(organizations)
    .where(eq(organizations.stripeCustomerId, customerId))
    .limit(1);
  return org || null;
}

/**
 * Update org subscription tier
 */
async function updateOrgTier(
  orgId: string,
  tier: "free" | "scout_individual" | "club_professional" | "holding_multiclub",
  subscriptionId?: string | null
) {
  await db
    .update(organizations)
    .set({
      tier,
      ...(subscriptionId !== undefined ? { stripeSubscriptionId: subscriptionId } : {}),
      updatedAt: new Date(),
    })
    .where(eq(organizations.id, orgId));
}

/**
 * Create audit log entry for billing events
 */
async function logBillingEvent(
  orgId: string,
  action: string,
  metadata: Record<string, unknown>
) {
  await db.insert(auditLogs).values({
    orgId,
    action,
    entityType: "subscription",
    metadata,
  });
}

/**
 * Get admin user IDs for an org (for notifications)
 */
async function getOrgAdminIds(orgId: string): Promise<string[]> {
  const admins = await db
    .select({ userId: orgMembers.userId })
    .from(orgMembers)
    .where(and(eq(orgMembers.orgId, orgId), eq(orgMembers.role, "admin")));
  return admins.map((a) => a.userId);
}

/**
 * Notify org admins about a billing event
 */
async function notifyOrgAdmins(
  orgId: string,
  type: string,
  title: string,
  body: string
) {
  const adminIds = await getOrgAdminIds(orgId);
  if (adminIds.length === 0) return;

  await db.insert(notifications).values(
    adminIds.map((userId) => ({
      orgId,
      userId,
      type,
      title,
      body,
    }))
  );
}

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { error: "Missing signature or webhook secret" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    switch (event.type) {
      // ── Checkout completed ─────────────────────────────
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orgId = session.metadata?.orgId;
        const tier = session.metadata?.tier;

        if (orgId && tier) {
          await updateOrgTier(
            orgId,
            tier as "scout_individual" | "club_professional" | "holding_multiclub",
            session.subscription as string
          );

          await logBillingEvent(orgId, "billing.checkout_completed", {
            tier,
            subscriptionId: session.subscription,
            amountTotal: session.amount_total,
            currency: session.currency,
          });
        }
        break;
      }

      // ── Subscription updated (plan change) ─────────────
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        const priceId = subscription.items.data[0]?.price?.id;
        const newTier = priceId ? priceIdToTier(priceId) : null;

        if (newTier) {
          const previousTier = org.tier;
          await updateOrgTier(org.id, newTier);

          await logBillingEvent(org.id, "billing.subscription_updated", {
            previousTier,
            newTier,
            priceId,
            subscriptionId: subscription.id,
            status: subscription.status,
          });
        }
        break;
      }

      // ── Subscription deleted (cancel) ──────────────────
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId =
          typeof subscription.customer === "string"
            ? subscription.customer
            : subscription.customer.id;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        const previousTier = org.tier;
        await updateOrgTier(org.id, "free", null);

        await logBillingEvent(org.id, "billing.subscription_deleted", {
          previousTier,
          subscriptionId: subscription.id,
          canceledAt: subscription.canceled_at,
        });

        await notifyOrgAdmins(
          org.id,
          "billing_canceled",
          "Assinatura cancelada",
          `Sua assinatura foi cancelada. O plano foi revertido para Free.`
        );
        break;
      }

      // ── Invoice paid (successful payment) ──────────────
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        await logBillingEvent(org.id, "billing.invoice_paid", {
          invoiceId: invoice.id,
          amountPaid: invoice.amount_paid,
          currency: invoice.currency,
          invoiceUrl: invoice.hosted_invoice_url,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        });
        break;
      }

      // ── Invoice payment failed ─────────────────────────
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerId) break;

        const org = await getOrgByStripeCustomerId(customerId);
        if (!org) break;

        await logBillingEvent(org.id, "billing.payment_failed", {
          invoiceId: invoice.id,
          amountDue: invoice.amount_due,
          currency: invoice.currency,
          attemptCount: invoice.attempt_count,
          nextPaymentAttempt: invoice.next_payment_attempt,
        });

        await notifyOrgAdmins(
          org.id,
          "payment_failed",
          "Falha no pagamento",
          `O pagamento da sua assinatura falhou. Verifique seu metodo de pagamento para evitar a suspensao do servico.`
        );
        break;
      }

      default:
        // Unhandled event type — acknowledge without processing
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { error: "Webhook processing failed", detail: message },
      { status: 500 }
    );
  }
}
