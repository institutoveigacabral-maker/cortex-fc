/**
 * Feature gating by subscription tier.
 *
 * Each tier defines limits for key features.
 * Check with `canUseFeature()` or `getLimit()` in API routes.
 */

import { getOrgUsageThisMonth } from "@/db/queries";

type Tier = "free" | "scout_individual" | "club_professional" | "holding_multiclub";

interface TierLimits {
  analysesPerMonth: number;
  usersPerOrg: number;
  agents: string[];          // which AI agents are available
  algorithms: string[];      // which algorithm scores are visible
  scoutingTargets: number;
  reportsPerMonth: number;
  apiAccess: boolean;
  whiteLabel: boolean;
  sso: boolean;
  exportFormats: string[];
}

const TIER_LIMITS: Record<Tier, TierLimits> = {
  free: {
    analysesPerMonth: 5,
    usersPerOrg: 1,
    agents: ["ORACLE"],
    algorithms: ["SCN_plus", "AST", "CLF"],
    scoutingTargets: 5,
    reportsPerMonth: 1,
    apiAccess: false,
    whiteLabel: false,
    sso: false,
    exportFormats: [],
  },
  scout_individual: {
    analysesPerMonth: 50,
    usersPerOrg: 1,
    agents: ["ORACLE", "SCOUT"],
    algorithms: ["SCN_plus", "AST", "CLF"],
    scoutingTargets: 25,
    reportsPerMonth: 10,
    apiAccess: false,
    whiteLabel: false,
    sso: false,
    exportFormats: ["csv"],
  },
  club_professional: {
    analysesPerMonth: -1, // unlimited
    usersPerOrg: 10,
    agents: ["ORACLE", "ANALISTA", "SCOUT", "BOARD_ADVISOR", "CFO_MODELER", "COACHING_ASSIST"],
    algorithms: ["SCN_plus", "AST", "CLF", "GNE", "WSE", "RBL", "SACE"],
    scoutingTargets: -1,
    reportsPerMonth: -1,
    apiAccess: true,
    whiteLabel: false,
    sso: false,
    exportFormats: ["csv", "pdf"],
  },
  holding_multiclub: {
    analysesPerMonth: -1,
    usersPerOrg: -1,
    agents: ["ORACLE", "ANALISTA", "SCOUT", "BOARD_ADVISOR", "CFO_MODELER", "COACHING_ASSIST"],
    algorithms: ["SCN_plus", "AST", "CLF", "GNE", "WSE", "RBL", "SACE"],
    scoutingTargets: -1,
    reportsPerMonth: -1,
    apiAccess: true,
    whiteLabel: true,
    sso: true,
    exportFormats: ["csv", "pdf", "xlsx"],
  },
};

// ============================================
// USAGE QUOTA LIMITS (extended tier config)
// ============================================

export interface UsageQuotaLimits {
  analysesPerMonth: number;
  agentRunsPerMonth: number;
  tokensPerMonth: number;
  maxPlayers: number;
  maxTeamMembers: number;
  canUseChat: boolean;
  canExportPDF: boolean;
  canUseSimulator: boolean;
  canAccessHolding: boolean;
  canAccessAPI: boolean;
}

export const USAGE_QUOTA_LIMITS: Record<string, UsageQuotaLimits> = {
  free: {
    analysesPerMonth: 10,
    agentRunsPerMonth: 0,
    tokensPerMonth: 0,
    maxPlayers: 50,
    maxTeamMembers: 1,
    canUseChat: false,
    canExportPDF: false,
    canUseSimulator: true,
    canAccessHolding: false,
    canAccessAPI: false,
  },
  scout_individual: {
    analysesPerMonth: 50,
    agentRunsPerMonth: 20,
    tokensPerMonth: 100000,
    maxPlayers: 200,
    maxTeamMembers: 3,
    canUseChat: true,
    canExportPDF: true,
    canUseSimulator: true,
    canAccessHolding: false,
    canAccessAPI: false,
  },
  club_professional: {
    analysesPerMonth: -1, // unlimited
    agentRunsPerMonth: -1,
    tokensPerMonth: -1,
    maxPlayers: -1,
    maxTeamMembers: 20,
    canUseChat: true,
    canExportPDF: true,
    canUseSimulator: true,
    canAccessHolding: false,
    canAccessAPI: true,
  },
  holding_multiclub: {
    analysesPerMonth: -1,
    agentRunsPerMonth: -1,
    tokensPerMonth: -1,
    maxPlayers: -1,
    maxTeamMembers: -1, // unlimited
    canUseChat: true,
    canExportPDF: true,
    canUseSimulator: true,
    canAccessHolding: true,
    canAccessAPI: true,
  },
};

export function getUsageQuotaLimits(tier: string): UsageQuotaLimits {
  return USAGE_QUOTA_LIMITS[tier] || USAGE_QUOTA_LIMITS.free;
}

// Check if a specific usage is within limits (-1 means unlimited)
export function isWithinLimit(current: number, limit: number): boolean {
  if (limit === -1) return true;
  return current < limit;
}

// Get usage percentage (0-100, capped at 100)
export function getUsagePercent(current: number, limit: number): number {
  if (limit === -1) return 0;
  if (limit === 0) return current > 0 ? 100 : 0;
  return Math.min(Math.round((current / limit) * 100), 100);
}

// ============================================
// QUOTA CHECK HELPERS (async, hit DB)
// ============================================

export async function checkAnalysisQuota(orgId: string, tier: string): Promise<{ allowed: boolean; usage: number; limit: number }> {
  const limits = getUsageQuotaLimits(tier);
  if (limits.analysesPerMonth === -1) return { allowed: true, usage: 0, limit: -1 };

  const usage = await getOrgUsageThisMonth(orgId);
  return {
    allowed: isWithinLimit(usage.analyses, limits.analysesPerMonth),
    usage: usage.analyses,
    limit: limits.analysesPerMonth,
  };
}

export async function checkAgentQuota(orgId: string, tier: string): Promise<{ allowed: boolean; usage: number; limit: number }> {
  const limits = getUsageQuotaLimits(tier);
  if (limits.agentRunsPerMonth === -1) return { allowed: true, usage: 0, limit: -1 };

  const usage = await getOrgUsageThisMonth(orgId);
  return {
    allowed: isWithinLimit(usage.agentRuns, limits.agentRunsPerMonth),
    usage: usage.agentRuns,
    limit: limits.agentRunsPerMonth,
  };
}

// ============================================
// ORIGINAL FEATURE GATE FUNCTIONS
// ============================================

/**
 * Get limits for a tier
 */
export function getTierLimits(tier: string): TierLimits {
  const validTier = tier in TIER_LIMITS ? (tier as Tier) : "free";
  return TIER_LIMITS[validTier];
}

/**
 * Check if a specific feature is available for a tier
 */
export function canUseFeature(
  tier: string,
  feature: keyof TierLimits
): boolean {
  const limits = getTierLimits(tier);
  const value = limits[feature];
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (Array.isArray(value)) return value.length > 0;
  return false;
}

/**
 * Check if a specific agent is available for a tier
 */
export function canUseAgent(tier: string, agentType: string): boolean {
  const limits = getTierLimits(tier);
  return limits.agents.includes(agentType);
}

/**
 * Check if usage count is within the tier limit.
 * Returns { allowed, remaining, limit }.
 */
export function checkUsageLimit(
  tier: string,
  feature: "analysesPerMonth" | "scoutingTargets" | "reportsPerMonth",
  currentUsage: number
): { allowed: boolean; remaining: number; limit: number } {
  const limits = getTierLimits(tier);
  const limit = limits[feature];

  if (limit === -1) {
    return { allowed: true, remaining: Infinity, limit: -1 };
  }

  return {
    allowed: currentUsage < limit,
    remaining: Math.max(0, limit - currentUsage),
    limit,
  };
}

/**
 * Get the minimum tier required for a feature
 */
export function requiredTierFor(feature: string): Tier {
  const tierOrder: Tier[] = ["free", "scout_individual", "club_professional", "holding_multiclub"];

  for (const tier of tierOrder) {
    const limits = TIER_LIMITS[tier];
    if (feature === "apiAccess" && limits.apiAccess) return tier;
    if (feature === "whiteLabel" && limits.whiteLabel) return tier;
    if (feature === "allAgents" && limits.agents.length === 6) return tier;
    if (feature === "allAlgorithms" && limits.algorithms.length === 7) return tier;
    if (feature === "pdfExport" && limits.exportFormats.includes("pdf")) return tier;
  }

  return "holding_multiclub";
}

/**
 * Tier display names
 */
export const TIER_NAMES: Record<Tier, string> = {
  free: "Free",
  scout_individual: "Scout Individual",
  club_professional: "Club Professional",
  holding_multiclub: "Holding Multi-Club",
};

/**
 * Check if tier A is higher or equal to tier B
 */
export function isTierAtLeast(currentTier: string, requiredTier: string): boolean {
  const order: Record<string, number> = {
    free: 0,
    scout_individual: 1,
    club_professional: 2,
    holding_multiclub: 3,
  };
  return (order[currentTier] ?? 0) >= (order[requiredTier] ?? 0);
}
