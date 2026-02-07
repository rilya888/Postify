/**
 * Integration-style tests for POST /api/generate (with mocks for auth, prisma, rate-limit, ai service).
 * Covers bulk generate, series (postsPerPlatform), and regeneration by outputId.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
const mockGenerateForPlatforms = vi.fn();
const mockRegenerateForPlatform = vi.fn();
const mockCheckGenerateRateLimit = vi.fn();
const mockProjectFindUnique = vi.fn();
const mockOutputFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockSubscriptionFindUnique = vi.fn();

vi.mock("@/lib/auth/config", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/services/ai", () => ({
  generateForPlatforms: (...args: unknown[]) => mockGenerateForPlatforms(...args),
  regenerateForPlatform: (...args: unknown[]) => mockRegenerateForPlatform(...args),
}));

vi.mock("@/lib/utils/rate-limit", () => ({
  checkGenerateRateLimit: (...args: unknown[]) => mockCheckGenerateRateLimit(...args),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    project: {
      findUnique: (...args: unknown[]) => mockProjectFindUnique(...args),
    },
    output: {
      findUnique: (...args: unknown[]) => mockOutputFindUnique(...args),
    },
    subscription: {
      findUnique: (...args: unknown[]) => mockSubscriptionFindUnique(...args),
    },
  },
}));

// Import route after mocks
import { POST } from "@/app/api/generate/route";

function createRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/generate", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckGenerateRateLimit.mockReturnValue({ allowed: true });
    mockUserFindUnique.mockResolvedValue({ createdAt: new Date(Date.now() - 86400000) });
    mockProjectFindUnique.mockResolvedValue({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: null,
      postsPerPlatformByPlatform: null,
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    mockOutputFindUnique.mockResolvedValue(null);
    mockGenerateForPlatforms.mockResolvedValue({
      successful: [{ platform: "linkedin", content: "x", success: true, metadata: {} }],
      failed: [],
      totalRequested: 1,
    });
    mockRegenerateForPlatform.mockResolvedValue({
      platform: "linkedin",
      content: "regenerated",
      success: true,
      metadata: {},
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockCheckGenerateRateLimit.mockReturnValueOnce({ allowed: false, retryAfterSeconds: 60 });

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("60");
    const json = await res.json();
    expect(json.error).toContain("Too many requests");
    expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
  });

  it("returns 400 when missing required fields", async () => {
    const req = createRequest({ projectId: "proj-1" });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Missing required fields");
    expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
  });

  it("returns 400 when sourceContent is empty", async () => {
    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "   ",
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("cannot be empty");
    expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
  });

  it("returns 404 when project not found", async () => {
    mockProjectFindUnique.mockResolvedValueOnce(null);

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(404);
    const text = await res.text();
    expect(text).toContain("not found");
    expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
  });

  it("returns 200 and result when successful", async () => {
    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateForPlatforms).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "Hello world",
      ["linkedin"],
      undefined,
      undefined,
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
      "trial",
      1,
      [{ platform: "linkedin", seriesIndex: 1 }],
      null,
      false
    );
    const json = await res.json();
    expect(json.successful).toHaveLength(1);
    expect(json.totalRequested).toBe(1);
    expect(mockRegenerateForPlatform).not.toHaveBeenCalled();
  });

  it("calls generateForPlatforms with slotsOverride when project has series (enterprise)", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: 2,
      postsPerPlatformByPlatform: null,
      postTone: null,
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateForPlatforms).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "Hello world",
      ["linkedin"],
      undefined,
      undefined,
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
      "enterprise",
      1,
      [
        { platform: "linkedin", seriesIndex: 1 },
        { platform: "linkedin", seriesIndex: 2 },
      ],
      null,
      true
    );
    const json = await res.json();
    expect(json.successful).toBeDefined();
  });

  it("calls generateForPlatforms with per-platform slots when project has postsPerPlatformByPlatform", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: null,
      postsPerPlatformByPlatform: { linkedin: 2, tiktok: 3 },
      postTone: null,
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin", "tiktok"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateForPlatforms).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "Hello world",
      ["linkedin", "tiktok"],
      undefined,
      undefined,
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
      "enterprise",
      1,
      [
        { platform: "linkedin", seriesIndex: 1 },
        { platform: "tiktok", seriesIndex: 1 },
        { platform: "linkedin", seriesIndex: 2 },
        { platform: "tiktok", seriesIndex: 2 },
        { platform: "tiktok", seriesIndex: 3 },
      ],
      null,
      true
    );
  });

  it("passes project postTone to generateForPlatforms when enterprise", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: null,
      postsPerPlatformByPlatform: null,
      postTone: "sassy",
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateForPlatforms).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "Hello world",
      ["linkedin"],
      undefined,
      undefined,
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
      "enterprise",
      1,
      [{ platform: "linkedin", seriesIndex: 1 }],
      "sassy",
      true
    );
  });

  it("passes postToneOverride to generateForPlatforms when enterprise bulk generate", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: null,
      postsPerPlatformByPlatform: null,
      postTone: "professional",
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
      postToneOverride: "witty",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateForPlatforms).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "Hello world",
      ["linkedin"],
      undefined,
      undefined,
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
      "enterprise",
      1,
      [{ platform: "linkedin", seriesIndex: 1 }],
      "witty",
      true
    );
  });

  it("returns 403 when postsPerPlatform > 1 and plan does not include series", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: 2,
      postsPerPlatformByPlatform: null,
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValueOnce(null);

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.code).toBe("PLAN_REQUIRED");
    expect(json.error).toContain("not available");
    expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
  });

  it("builds slots from postsPerPlatformByPlatform when regenerateSeriesForPlatform is used", async () => {
    mockProjectFindUnique.mockResolvedValueOnce({
      id: "proj-1",
      userId: "user-1",
      sourceContent: "Hello world",
      postsPerPlatform: null,
      postsPerPlatformByPlatform: { linkedin: 3 },
      postTone: null,
      outputs: [],
    });
    mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

    const req = createRequest({
      projectId: "proj-1",
      platforms: ["linkedin"],
      sourceContent: "Hello world",
      regenerateSeriesForPlatform: "linkedin",
    });
    const res = await POST(req);

    expect(res.status).toBe(200);
    expect(mockGenerateForPlatforms).toHaveBeenCalledWith(
      "proj-1",
      "user-1",
      "Hello world",
      ["linkedin"],
      undefined,
      undefined,
      expect.stringMatching(/^[0-9a-f-]{36}$/i),
      "enterprise",
      1,
      [
        { platform: "linkedin", seriesIndex: 1 },
        { platform: "linkedin", seriesIndex: 2 },
        { platform: "linkedin", seriesIndex: 3 },
      ],
      null,
      true
    );
  });

  describe("regeneration by outputId", () => {
    it("returns 200 and calls regenerateForPlatform when outputId is provided", async () => {
      mockOutputFindUnique.mockResolvedValueOnce({
        id: "out-1",
        projectId: "proj-1",
        platform: "linkedin",
        seriesIndex: 1,
        project: {
          userId: "user-1",
          sourceContent: "Source for regenerate",
        },
      });

      const req = createRequest({
        projectId: "proj-1",
        outputId: "out-1",
        sourceContent: "Source for regenerate",
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockRegenerateForPlatform).toHaveBeenCalledWith(
        "proj-1",
        "user-1",
        "Source for regenerate",
        "linkedin",
        undefined,
        undefined,
        "trial",
        1,
        null,
        false
      );
      expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
      const json = await res.json();
      expect(json.successful).toHaveLength(1);
      expect(json.totalRequested).toBe(1);
    });

    it("returns 404 when outputId is provided but output not found", async () => {
      mockOutputFindUnique.mockResolvedValueOnce(null);

      const req = createRequest({
        projectId: "proj-1",
        outputId: "out-missing",
        sourceContent: "Hello",
      });
      const res = await POST(req);

      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain("not found");
      expect(mockRegenerateForPlatform).not.toHaveBeenCalled();
      expect(mockGenerateForPlatforms).not.toHaveBeenCalled();
    });

    it("returns 400 when outputId is provided but project sourceContent is empty", async () => {
      mockOutputFindUnique.mockResolvedValueOnce({
        id: "out-1",
        projectId: "proj-1",
        platform: "linkedin",
        seriesIndex: 1,
        project: {
          userId: "user-1",
          sourceContent: "   ",
        },
      });

      const req = createRequest({
        projectId: "proj-1",
        outputId: "out-1",
        sourceContent: "   ",
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("source content");
      expect(mockRegenerateForPlatform).not.toHaveBeenCalled();
    });

    it("passes postToneOverride to regenerateForPlatform when enterprise and valid tone", async () => {
      mockOutputFindUnique.mockResolvedValueOnce({
        id: "out-1",
        projectId: "proj-1",
        platform: "linkedin",
        seriesIndex: 1,
        project: {
          userId: "user-1",
          sourceContent: "Source for regenerate",
          postTone: "professional",
        },
      });
      mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

      const req = createRequest({
        projectId: "proj-1",
        outputId: "out-1",
        sourceContent: "Source for regenerate",
        postToneOverride: "sassy",
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockRegenerateForPlatform).toHaveBeenCalledWith(
        "proj-1",
        "user-1",
        "Source for regenerate",
        "linkedin",
        undefined,
        undefined,
        "enterprise",
        1,
        "sassy",
        true
      );
    });

    it("passes project postTone when no override and enterprise", async () => {
      mockOutputFindUnique.mockResolvedValueOnce({
        id: "out-1",
        projectId: "proj-1",
        platform: "linkedin",
        seriesIndex: 1,
        project: {
          userId: "user-1",
          sourceContent: "Source for regenerate",
          postTone: "professional",
        },
      });
      mockSubscriptionFindUnique.mockResolvedValueOnce({ plan: "enterprise" });

      const req = createRequest({
        projectId: "proj-1",
        outputId: "out-1",
        sourceContent: "Source for regenerate",
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(mockRegenerateForPlatform).toHaveBeenCalledWith(
        "proj-1",
        "user-1",
        "Source for regenerate",
        "linkedin",
        undefined,
        undefined,
        "enterprise",
        1,
        "professional",
        true
      );
    });
  });
});
