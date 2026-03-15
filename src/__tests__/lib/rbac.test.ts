import { describe, it, expect } from "vitest";
import { hasPermission, requirePermission } from "@/lib/rbac";

describe("hasPermission", () => {
  describe("admin role", () => {
    it("has all permissions", () => {
      expect(hasPermission("admin", "read")).toBe(true);
      expect(hasPermission("admin", "create_analysis")).toBe(true);
      expect(hasPermission("admin", "edit_analysis")).toBe(true);
      expect(hasPermission("admin", "delete_analysis")).toBe(true);
      expect(hasPermission("admin", "manage_players")).toBe(true);
      expect(hasPermission("admin", "manage_scouting")).toBe(true);
      expect(hasPermission("admin", "manage_reports")).toBe(true);
      expect(hasPermission("admin", "manage_team")).toBe(true);
      expect(hasPermission("admin", "manage_billing")).toBe(true);
      expect(hasPermission("admin", "use_agents")).toBe(true);
      expect(hasPermission("admin", "export_data")).toBe(true);
    });
  });

  describe("analyst role", () => {
    it("can read and create/edit analyses", () => {
      expect(hasPermission("analyst", "read")).toBe(true);
      expect(hasPermission("analyst", "create_analysis")).toBe(true);
      expect(hasPermission("analyst", "edit_analysis")).toBe(true);
      expect(hasPermission("analyst", "use_agents")).toBe(true);
      expect(hasPermission("analyst", "export_data")).toBe(true);
    });

    it("cannot manage team or billing", () => {
      expect(hasPermission("analyst", "manage_team")).toBe(false);
      expect(hasPermission("analyst", "manage_billing")).toBe(false);
      expect(hasPermission("analyst", "delete_analysis")).toBe(false);
    });
  });

  describe("viewer role", () => {
    it("can only read", () => {
      expect(hasPermission("viewer", "read")).toBe(true);
    });

    it("cannot create, edit, or manage anything", () => {
      expect(hasPermission("viewer", "create_analysis")).toBe(false);
      expect(hasPermission("viewer", "edit_analysis")).toBe(false);
      expect(hasPermission("viewer", "manage_players")).toBe(false);
      expect(hasPermission("viewer", "manage_team")).toBe(false);
      expect(hasPermission("viewer", "use_agents")).toBe(false);
      expect(hasPermission("viewer", "export_data")).toBe(false);
    });
  });

  it("returns false for unknown roles", () => {
    expect(hasPermission("unknown" as any, "read")).toBe(false);
  });
});

describe("requirePermission", () => {
  it("does not throw when permission is granted", () => {
    expect(() => requirePermission("admin", "manage_team")).not.toThrow();
  });

  it("throws error with descriptive message when permission denied", () => {
    expect(() => requirePermission("viewer", "manage_team")).toThrow(
      "Forbidden: role 'viewer' cannot perform 'manage_team'"
    );
  });

  it("throws for unknown roles", () => {
    expect(() => requirePermission("hacker", "read")).toThrow("Forbidden");
  });
});
