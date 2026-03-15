import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (class name utility)", () => {
  it("merges class names", () => {
    expect(cn("px-2", "py-3")).toBe("px-2 py-3");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("merges conflicting tailwind classes (last wins)", () => {
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("handles undefined and null", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("handles empty input", () => {
    expect(cn()).toBe("");
  });

  it("merges color variants correctly", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
});
