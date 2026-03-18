/**
 * Role-Based Access Control (RBAC) for CORTEX FC
 *
 * Roles:
 * - admin: full access (CRUD all entities, manage team, billing)
 * - director: strategic access (analyses, agents, scouting, reports, team management)
 * - analyst: create/edit analyses, players, scouting. Cannot manage team or billing.
 * - scout: focused on scouting pipeline, player imports, view-only for analyses
 * - viewer: read-only access to all data. Cannot create or edit.
 */

// --- Legacy types (backward-compatible) ---

type Role = "admin" | "analyst" | "viewer";

type Action =
  | "read"
  | "create_analysis"
  | "edit_analysis"
  | "delete_analysis"
  | "manage_players"
  | "manage_scouting"
  | "manage_reports"
  | "manage_team"
  | "manage_billing"
  | "use_agents"
  | "export_data";

const PERMISSIONS: Record<Role, Set<Action>> = {
  admin: new Set([
    "read",
    "create_analysis",
    "edit_analysis",
    "delete_analysis",
    "manage_players",
    "manage_scouting",
    "manage_reports",
    "manage_team",
    "manage_billing",
    "use_agents",
    "export_data",
  ]),
  analyst: new Set([
    "read",
    "create_analysis",
    "edit_analysis",
    "manage_players",
    "manage_scouting",
    "manage_reports",
    "use_agents",
    "export_data",
  ]),
  viewer: new Set(["read"]),
};

export function hasPermission(role: string, action: Action | Permission): boolean {
  // Check granular permissions first
  if (isGranularPermission(action)) {
    return hasGranularPermission(role, action);
  }
  return PERMISSIONS[role as Role]?.has(action as Action) ?? false;
}

export function requirePermission(role: string, action: Action | Permission): void {
  if (!hasPermission(role, action)) {
    throw new Error(`Forbidden: role '${role}' cannot perform '${action}'`);
  }
}

// --- Granular Permissions (Sprint 7.3) ---

export type Permission =
  | "analysis.create"
  | "analysis.delete"
  | "analysis.view"
  | "agent.run"
  | "agent.view"
  | "scouting.manage"
  | "scouting.view"
  | "report.generate"
  | "report.view"
  | "report.export"
  | "player.import"
  | "player.view"
  | "settings.manage"
  | "team.manage"
  | "billing.manage"
  | "share.create"
  | "simulator.use"
  | "chat.use";

export type GranularRole = "admin" | "director" | "analyst" | "scout" | "viewer";

const ALL_PERMISSIONS: Permission[] = [
  "analysis.create",
  "analysis.delete",
  "analysis.view",
  "agent.run",
  "agent.view",
  "scouting.manage",
  "scouting.view",
  "report.generate",
  "report.view",
  "report.export",
  "player.import",
  "player.view",
  "settings.manage",
  "team.manage",
  "billing.manage",
  "share.create",
  "simulator.use",
  "chat.use",
];

const ROLE_PERMISSIONS: Record<GranularRole, Permission[]> = {
  admin: ALL_PERMISSIONS,
  director: [
    "analysis.create",
    "analysis.delete",
    "analysis.view",
    "agent.run",
    "agent.view",
    "scouting.manage",
    "scouting.view",
    "report.generate",
    "report.view",
    "report.export",
    "player.import",
    "player.view",
    "share.create",
    "simulator.use",
    "chat.use",
    "team.manage",
  ],
  analyst: [
    "analysis.create",
    "analysis.view",
    "agent.run",
    "agent.view",
    "scouting.view",
    "report.generate",
    "report.view",
    "player.view",
    "share.create",
    "simulator.use",
    "chat.use",
  ],
  scout: [
    "analysis.view",
    "agent.view",
    "scouting.manage",
    "scouting.view",
    "report.view",
    "player.import",
    "player.view",
    "simulator.use",
  ],
  viewer: [
    "analysis.view",
    "agent.view",
    "scouting.view",
    "report.view",
    "player.view",
  ],
};

function isGranularPermission(action: string): action is Permission {
  return action.includes(".");
}

function hasGranularPermission(role: string, permission: Permission): boolean {
  if (role === "admin") return true;
  const perms = ROLE_PERMISSIONS[role as GranularRole];
  if (!perms) return false;
  return perms.includes(permission);
}

export function getPermissions(role: string): Permission[] {
  if (role === "admin") return ALL_PERMISSIONS;
  return ROLE_PERMISSIONS[role as GranularRole] || [];
}
