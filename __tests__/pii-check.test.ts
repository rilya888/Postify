import { describe, it, expect } from "vitest";
import { detectPII } from "@/lib/utils/pii-check";

describe("pii-check", () => {
  it("returns no warnings for plain text", () => {
    const result = detectPII("Just some content for the post.");
    expect(result.hasPII).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });

  it("detects email and adds warning", () => {
    const result = detectPII("Contact me at user@example.com for more.");
    expect(result.hasPII).toBe(true);
    expect(result.warnings.some((w) => w.includes("email"))).toBe(true);
  });

  it("detects phone-like numbers", () => {
    const result = detectPII("Call 555-123-4567 or +1 555 999 8888.");
    expect(result.hasPII).toBe(true);
    expect(result.warnings.some((w) => w.includes("phone"))).toBe(true);
  });

  it("returns empty for empty string", () => {
    const result = detectPII("");
    expect(result.hasPII).toBe(false);
    expect(result.warnings).toHaveLength(0);
  });
});
