/**
 * Unit tests for AI service (with mocks for prisma, OpenAI, quota, project-history)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockUpsert = vi.fn();
const mockFindUnique = vi.fn();
const mockBrandVoiceFindFirst = vi.fn();
const mockBrandVoiceFindUnique = vi.fn();
const mockGenerateContentWithGracefulDegradation = vi.fn();
const mockCheckProjectQuota = vi.fn();
const mockGetProjectById = vi.fn();
const mockLogProjectChange = vi.fn();
const mockGetOrCreateContentPack = vi.fn();

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    output: { upsert: (...args: unknown[]) => mockUpsert(...args) },
    project: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
    brandVoice: {
      findFirst: (...args: unknown[]) => mockBrandVoiceFindFirst(...args),
      findUnique: (...args: unknown[]) => mockBrandVoiceFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/ai/openai-client", () => ({
  generateContentWithGracefulDegradation: (...args: unknown[]) => mockGenerateContentWithGracefulDegradation(...args),
}));

vi.mock("@/lib/services/content-pack", () => ({
  getOrCreateContentPack: (...args: unknown[]) => mockGetOrCreateContentPack(...args),
  formatContentPackForPrompt: (pack: { summary_short: string }) => pack?.summary_short ?? "",
}));

vi.mock("@/lib/services/quota", () => ({
  checkProjectQuota: (...args: unknown[]) => mockCheckProjectQuota(...args),
}));

vi.mock("@/lib/services/projects", () => ({
  getProjectById: (...args: unknown[]) => mockGetProjectById(...args),
}));

vi.mock("@/lib/services/project-history", () => ({
  logProjectChange: (...args: unknown[]) => mockLogProjectChange(...args),
}));

import { generateForPlatforms } from "@/lib/services/ai";

describe("ai-service", () => {
  const projectId = "proj-1";
  const userId = "user-1";
  const sourceContent = "a".repeat(1500);
  const platforms: ("linkedin" | "twitter")[] = ["linkedin", "twitter"];

  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckProjectQuota.mockResolvedValue({ canCreate: true });
    mockGetProjectById.mockResolvedValue({ id: projectId, userId });
    mockBrandVoiceFindFirst.mockResolvedValue(null);
    mockBrandVoiceFindUnique.mockResolvedValue(null);
    mockGetOrCreateContentPack.mockResolvedValue(null);
    mockGenerateContentWithGracefulDegradation.mockResolvedValue({
      content: "Generated content for platform.",
      source: "api",
    });
  });

  it("generateForPlatforms is a function", () => {
    expect(typeof generateForPlatforms).toBe("function");
  });

  it("throws when quota exceeded", async () => {
    mockCheckProjectQuota.mockResolvedValueOnce({ canCreate: false, current: 3, limit: 3 });

    await expect(
      generateForPlatforms(projectId, userId, sourceContent, ["linkedin"])
    ).rejects.toThrow("Quota exceeded");
    expect(mockGenerateContentWithGracefulDegradation).not.toHaveBeenCalled();
  });

  it("throws when project not found", async () => {
    mockGetProjectById.mockResolvedValueOnce(null);

    await expect(
      generateForPlatforms(projectId, userId, sourceContent, ["linkedin"])
    ).rejects.toThrow("Project not found");
    expect(mockGenerateContentWithGracefulDegradation).not.toHaveBeenCalled();
  });

  it("calls generateContentWithGracefulDegradation and upsert for each platform on success", async () => {
    mockUpsert.mockResolvedValue({ id: "out-1", projectId, platform: "linkedin", content: "x" });

    const result = await generateForPlatforms(projectId, userId, sourceContent, platforms);

    expect(mockGenerateContentWithGracefulDegradation).toHaveBeenCalledTimes(2);
    expect(mockUpsert).toHaveBeenCalledTimes(2);
    expect(mockLogProjectChange).toHaveBeenCalledWith(
      projectId,
      userId,
      "generate",
      expect.objectContaining({ platforms, successful: 2, failed: 0 })
    );
    expect(result.successful).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
    expect(result.totalRequested).toBe(2);
  });
});
