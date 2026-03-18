/**
 * Cost alerts — monitors usage vs tier limits and creates
 * notifications when thresholds are crossed (80% warning, 100% reached).
 */

import { getOrgUsageThisMonth } from "@/db/queries";
import { getUsageQuotaLimits, getUsagePercent } from "./feature-gates";
import { createNotification } from "@/db/queries";

export async function checkAndAlertUsage(orgId: string, tier: string, adminUserId: string) {
  const limits = getUsageQuotaLimits(tier);
  const usage = await getOrgUsageThisMonth(orgId);

  const alerts: string[] = [];

  // Check analyses
  if (limits.analysesPerMonth > 0) {
    const pct = getUsagePercent(usage.analyses, limits.analysesPerMonth);
    if (pct >= 100) {
      alerts.push("analysis_limit_reached");
    } else if (pct >= 80) {
      alerts.push("analysis_limit_warning");
    }
  }

  // Check agent runs
  if (limits.agentRunsPerMonth > 0) {
    const pct = getUsagePercent(usage.agentRuns, limits.agentRunsPerMonth);
    if (pct >= 100) {
      alerts.push("agent_limit_reached");
    } else if (pct >= 80) {
      alerts.push("agent_limit_warning");
    }
  }

  // Create notifications for new alerts
  for (const alertType of alerts) {
    await createNotification({
      userId: adminUserId,
      orgId,
      type: "usage_alert",
      title: alertType === "analysis_limit_reached" ? "Limite de analises atingido"
        : alertType === "analysis_limit_warning" ? "80% do limite de analises usado"
        : alertType === "agent_limit_reached" ? "Limite de agentes atingido"
        : "80% do limite de agentes usado",
      body: alertType.includes("reached")
        ? "Faca upgrade do seu plano para continuar."
        : "Considere fazer upgrade para evitar interrupcoes.",
      entityType: "billing",
    });
  }

  return alerts;
}
