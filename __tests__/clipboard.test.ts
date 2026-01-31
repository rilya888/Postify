/**
 * Unit tests for clipboard utilities (success path only; fallback requires DOM)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockWriteText = vi.fn();

beforeEach(() => {
  vi.stubGlobal("navigator", {
    ...global.navigator,
    clipboard: { writeText: mockWriteText },
  });
});

describe("clipboard", () => {
  it("copyToClipboard returns true when clipboard.writeText succeeds", async () => {
    mockWriteText.mockResolvedValueOnce(undefined);
    const { copyToClipboard } = await import("@/lib/utils/clipboard");

    const result = await copyToClipboard("hello");

    expect(result).toBe(true);
    expect(mockWriteText).toHaveBeenCalledWith("hello");
  });

  it("copyToClipboard returns false when clipboard.writeText fails and no DOM", async () => {
    mockWriteText.mockRejectedValueOnce(new Error("Not allowed"));
    const { copyToClipboard } = await import("@/lib/utils/clipboard");

    const result = await copyToClipboard("text");

    expect(result).toBe(false);
  });
});
