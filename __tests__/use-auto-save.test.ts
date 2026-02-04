/**
 * Unit tests for useAutoSave hook (export and behavior via module)
 */
import { describe, it, expect } from "vitest";
import { useAutoSave } from "@/hooks/use-auto-save";

describe("useAutoSave", () => {
  it("exports a function", () => {
    expect(typeof useAutoSave).toBe("function");
  });

  it("accepts value, onSave, and optional delay", () => {
    expect(useAutoSave.length).toBeGreaterThanOrEqual(2);
  });
});
