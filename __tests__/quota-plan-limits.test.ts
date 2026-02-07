/**
 * Unit tests for quota / plan limits (trial, free, pro, max, enterprise).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUserFindUnique = vi.fn();
const mockSubscriptionFindUnique = vi.fn();
const mockProjectCount = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
      upsert: vi.fn(),
      update: vi.fn(),
    },
    project: {
      count: (...args: unknown[]) => mockProjectCount(...args),
    },
  },
}));

import { checkProjectQuota, checkAudioQuota } from "@/lib/services/quota";

const now = Date.now();
const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000);
const fiveDaysAgo = new Date(now - 5 * 24 * 60 * 60 * 1000);

describe("quota plan limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockProjectCount.mockResolvedValue(1);
  });

  it("effective plan free: checkAudioQuota returns allowed false", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(false);
    expect(result.planType).toBe("text");
    expect(result.canAddMinutes(10)).toBe(false);
  });

  it("effective plan trial (no subscription, recent user): checkAudioQuota returns allowed true", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: oneDayAgo });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(true);
    expect(result.planType).toBe("text_audio");
    expect(result.usedMinutes).toBe(0);
    expect(result.limitMinutes).toBe(60);
    expect(result.canAddMinutes(50)).toBe(true);
    expect(result.canAddMinutes(61)).toBe(false);
  });

  it("effective plan max: checkAudioQuota returns allowed true", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "max",
      audioMinutesUsedThisPeriod: 5,
      audioMinutesLimit: 300,
      audioMinutesResetAt: new Date(now + 86400000),
    });
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(true);
    expect(result.planType).toBe("text_audio");
    expect(result.usedMinutes).toBe(5);
    expect(result.limitMinutes).toBe(300);
  });

  it("effective plan enterprise: checkAudioQuota returns allowed true", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "enterprise",
      audioMinutesUsedThisPeriod: 5,
      audioMinutesLimit: 600,
      audioMinutesResetAt: new Date(now + 86400000),
    });
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(true);
    expect(result.planType).toBe("text_audio");
    expect(result.usedMinutes).toBe(5);
    expect(result.limitMinutes).toBe(600);
  });

  it("effective plan pro: checkAudioQuota returns allowed false (Pro is text only)", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "pro",
      audioMinutesUsedThisPeriod: 0,
      audioMinutesLimit: null,
    });
    const result = await checkAudioQuota("u1");
    expect(result.allowed).toBe(false);
    expect(result.planType).toBe("text");
  });

  it("checkProjectQuota returns effective plan enterprise, canUseAudio true", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "enterprise",
    });
    const result = await checkProjectQuota("u1");
    expect(result.plan).toBe("enterprise");
    expect(result.planType).toBe("text_audio");
    expect(result.canUseAudio).toBe(true);
    expect(result.limit).toBe(150);
  });

  it("checkProjectQuota returns effective plan max, canUseAudio true", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "max",
    });
    const result = await checkProjectQuota("u1");
    expect(result.plan).toBe("max");
    expect(result.planType).toBe("text_audio");
    expect(result.canUseAudio).toBe(true);
    expect(result.limit).toBe(75);
  });

  it("checkProjectQuota returns effective plan pro, canUseAudio false", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({
      userId: "u1",
      plan: "pro",
    });
    const result = await checkProjectQuota("u1");
    expect(result.plan).toBe("pro");
    expect(result.planType).toBe("text");
    expect(result.canUseAudio).toBe(false);
    expect(result.limit).toBe(50);
  });

  it("effective plan free: canUseAudio is false, maxProjects 0", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: fiveDaysAgo });
    mockSubscriptionFindUnique.mockResolvedValue({ userId: "u1", plan: "free" });
    const result = await checkProjectQuota("u1");
    expect(result.canUseAudio).toBe(false);
    expect(result.plan).toBe("free");
    expect(result.limit).toBe(0);
  });

  it("effective plan trial: no subscription, recent user, 3 projects limit", async () => {
    mockUserFindUnique.mockResolvedValue({ createdAt: oneDayAgo });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    const result = await checkProjectQuota("u1");
    expect(result.plan).toBe("trial");
    expect(result.canUseAudio).toBe(true);
    expect(result.limit).toBe(3);
  });
});
