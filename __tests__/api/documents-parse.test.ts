/**
 * Tests for POST /api/documents/parse (auth, rate limit, file validation, success for .txt)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockAuth = vi.fn();
const mockCheckDocumentParseRateLimit = vi.fn();

vi.mock("@/lib/auth/config", () => ({
  auth: () => mockAuth(),
}));

vi.mock("@/lib/utils/rate-limit", () => ({
  checkDocumentParseRateLimit: (...args: unknown[]) =>
    mockCheckDocumentParseRateLimit(...args),
}));

// Import route after mocks
import { POST } from "@/app/api/documents/parse/route";

function createRequestWithFile(
  content: string | Blob,
  fileName: string,
  mimeType: string
): NextRequest {
  const blob = typeof content === "string" ? new Blob([content], { type: mimeType }) : content;
  const formData = new FormData();
  formData.set("file", blob, fileName);
  return new NextRequest("http://localhost/api/documents/parse", {
    method: "POST",
    body: formData,
  });
}

describe("POST /api/documents/parse", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ user: { id: "user-1" } });
    mockCheckDocumentParseRateLimit.mockReturnValue({ allowed: true });
  });

  it("returns 401 when not authenticated", async () => {
    mockAuth.mockResolvedValueOnce(null);

    const req = createRequestWithFile("Hello world text content", "test.txt", "text/plain");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.error).toBeDefined();
  });

  it("returns 429 when rate limited", async () => {
    mockCheckDocumentParseRateLimit.mockReturnValueOnce({
      allowed: false,
      retryAfterSeconds: 60,
    });

    const req = createRequestWithFile("Hello world text content", "test.txt", "text/plain");
    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.error).toBeDefined();
  });

  it("returns 400 when no file is sent", async () => {
    const formData = new FormData();
    const req = new NextRequest("http://localhost/api/documents/parse", {
      method: "POST",
      body: formData,
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
  });

  it("returns 200 with text for valid .txt file", async () => {
    const content = "This is sample source content for testing the parse endpoint.";
    const req = createRequestWithFile(content, "sample.txt", "text/plain");

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.text).toBeDefined();
    expect(typeof body.text).toBe("string");
    expect(body.text.trim()).toBe(content.trim());
    expect(body.truncated).toBeUndefined();
  });

  it("returns 400 when text is too short (fewer than 10 characters)", async () => {
    const req = createRequestWithFile("short", "x.txt", "text/plain");

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toBeDefined();
    expect(body.details).toMatch(/10 characters|Insufficient/i);
  });
});
