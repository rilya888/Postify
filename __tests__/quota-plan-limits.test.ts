/**
 * Unit tests for quota / plan limits (text vs text_audio).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSubscriptionFindUnique = vi.fn();
const mockProjectCount = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    },
    project: {
      count: (...args: unknown[]) => mockProjectCount(...args),
    },
  },
}));

import { checkProjectQuota, checkAudioQuota } from "@/lib/services/quota";

describe("quota plan limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectCount.mockResolvedValue(1);
  });

  it("text plan: checkAudioQuota returns allowed false", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "free",
      audioMinutesUsedThisPeriod: 0,
      audioMinutesLimit: null,
    });
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(false);
    expect(result.planType).toBe("text");
    expect(result.canAddMinutes(10)).toBe(false);
  });

  it("text_audio plan: checkAudioQuota returns allowed true and canAddMinutes", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "pro",
      audioMinutesUsedThisPeriod: 5,
      audioMinutesLimit: 60,
    });
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(true);
    expect(result.planType).toBe("text_audio");
    expect(result.usedMinutes).toBe(5);
    expect(result.limitMinutes).toBe(60);
    expect(result.canAddMinutes(50)).toBe(true);
    expect(result.canAddMinutes(60)).toBe(false);
  });

  it("checkProjectQuota returns planType and canUseAudio", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "pro",
    });
    const result = await checkProjectQuota("u1");
    expect(result.planType).toBe("text_audio");
    expect(result.canUseAudio).toBe(true);
  });

  it("free plan: canUseAudio is false", async () => {
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "free",
    });
    const result = await checkProjectQuota("u1");
    expect(result.canUseAudio).toBe(false);
  });
});
