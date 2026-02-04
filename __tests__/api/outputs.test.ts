/**
 * Integration-style tests for PATCH/GET /api/outputs/[id] (with mocks)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
const mockUpdateOutputContent = vi.fn();
const mockPrismaOutputFindUnique = vi.fn();
const mockCheckOutputUpdateRateLimit = vi.fn();

vi.mock("@/lib/auth/config", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/services/editor", () => ({
  updateOutputContent: (...args: unknown[]) => mockUpdateOutputContent(...args),
}));

vi.mock("@/lib/db/prisma", () => ({
  prisma: {
    output: {
      findUnique: (...args: unknown[]) => mockPrismaOutputFindUnique(...args),
    },
  },
}));

vi.mock("@/lib/utils/rate-limit", () => ({
  checkOutputUpdateRateLimit: (...args: unknown[]) =>
    mockCheckOutputUpdateRateLimit(...args),
}));

import { PATCH, GET } from "@/app/api/outputs/[id]/route";

function createPatchRequest(body: object): NextRequest {
  return new NextRequest("http://localhost/api/outputs/out-1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function createGetRequest(): NextRequest {
  return new NextRequest("http://localhost/api/outputs/out-1", {
    method: "GET",
  });
}

describe("PATCH /api/outputs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckOutputUpdateRateLimit.mockReturnValue({ allowed: true });
    mockPrismaOutputFindUnique.mockResolvedValue({
      id: "out-1",
      projectId: "proj-1",
      platform: "linkedin",
      content: "Old",
      project: { userId: "user-1" },
    });
    mockUpdateOutputContent.mockResolvedValue({
      id: "out-1",
      content: "Updated",
      isEdited: true,
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await PATCH(createPatchRequest({ content: "x" }), {
      params: { id: "out-1" },
    });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
    expect(mockUpdateOutputContent).not.toHaveBeenCalled();
  });

  it("returns 429 when rate limited", async () => {
    mockCheckOutputUpdateRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfterSeconds: 30,
    });

    const res = await PATCH(createPatchRequest({ content: "x" }), {
      params: { id: "out-1" },
    });

    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBe("30");
    const json = await res.json();
    expect(json.error).toContain("Too many requests");
    expect(mockUpdateOutputContent).not.toHaveBeenCalled();
  });

  it("returns 404 when output not found", async () => {
    mockPrismaOutputFindUnique.mockResolvedValueOnce(null);

    const res = await PATCH(createPatchRequest({ content: "x" }), {
      params: { id: "out-1" },
    });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("not found");
    expect(mockUpdateOutputContent).not.toHaveBeenCalled();
  });

  it("returns 400 when content is not a string", async () => {
    mockPrismaOutputFindUnique.mockResolvedValue({
      id: "out-1",
      projectId: "proj-1",
      platform: "linkedin",
      content: "Old",
      project: { userId: "user-1" },
    });

    const res = await PATCH(createPatchRequest({ content: 123 }), {
      params: { id: "out-1" },
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid content");
    expect(mockUpdateOutputContent).not.toHaveBeenCalled();
  });

  it("returns 200 and updated output when successful", async () => {
    const res = await PATCH(createPatchRequest({ content: "New content" }), {
      params: { id: "out-1" },
    });

    expect(res.status).toBe(200);
    expect(mockUpdateOutputContent).toHaveBeenCalledWith(
      "out-1",
      "user-1",
      expect.any(String)
    );
    const json = await res.json();
    expect(json.content).toBe("Updated");
    expect(json.isEdited).toBe(true);
  });

  it("returns 403 when quota exceeded", async () => {
    mockUpdateOutputContent.mockRejectedValueOnce(
      new Error("Quota exceeded: 10/10")
    );

    const res = await PATCH(createPatchRequest({ content: "x" }), {
      params: { id: "out-1" },
    });

    expect(res.status).toBe(403);
    const json = await res.json();
    expect(json.error).toBe("Quota exceeded");
  });
});

describe("GET /api/outputs/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockPrismaOutputFindUnique.mockResolvedValue({
      id: "out-1",
      projectId: "proj-1",
      platform: "linkedin",
      content: "Content",
      project: { userId: "user-1" },
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const res = await GET(createGetRequest(), { params: { id: "out-1" } });

    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 404 when output not found", async () => {
    mockPrismaOutputFindUnique.mockResolvedValueOnce(null);

    const res = await GET(createGetRequest(), { params: { id: "out-1" } });

    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json.error).toContain("not found");
  });

  it("returns 200 and output when found and owned", async () => {
    const res = await GET(createGetRequest(), { params: { id: "out-1" } });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.id).toBe("out-1");
    expect(json.content).toBe("Content");
  });
});
