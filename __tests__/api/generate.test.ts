/**
 * Integration-style tests for POST /api/generate (with mocks for auth, prisma, rate-limit, ai service)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
const mockGenerateForPlatforms = vi.fn();
const mockCheckGenerateRateLimit = vi.fn();
const mockProjectFindUnique = vi.fn();
const mockUserFindUnique = vi.fn();
const mockSubscriptionFindUnique = vi.fn();

vi.mock("@/lib/auth/config", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/services/ai", () => ({
  generateForPlatforms: (...args: unknown[]) => mockGenerateForPlatforms(...args),
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
    mockProjectFindUnique.mockResolvedValue({ id: "proj-1", userId: "user-1" });
    mockSubscriptionFindUnique.mockResolvedValue(null);
    mockGenerateForPlatforms.mockResolvedValue({
      successful: [{ platform: "linkedin", content: "x", success: true, metadata: {} }],
      failed: [],
      totalRequested: 1,
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
      "trial"
    );
    const json = await res.json();
    expect(json.successful).toHaveLength(1);
    expect(json.totalRequested).toBe(1);
  });
});
