import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth/config";
import { generateForPlatforms } from "@/lib/services/ai";
import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";
import { checkGenerateRateLimit } from "@/lib/utils/rate-limit";
import { detectPII } from "@/lib/utils/pii-check";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { generateBodySchema } from "@/lib/validations/generate";
import { createErrorResponse } from "@/lib/utils/api-error";

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const userId = session.user.id;

    const rateLimit = checkGenerateRateLimit(userId);
    if (!rateLimit.allowed) {
      const retryAfter = rateLimit.retryAfterSeconds ?? 60;
      return new Response(
        JSON.stringify({ error: "Too many requests", details: "Rate limit exceeded. Try again later." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
          },
        }
      );
    }

    // Parse and validate request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const parsed = generateBodySchema.safeParse(body);
    if (!parsed.success) {
      return createErrorResponse(parsed.error, 400);
    }

    const { projectId, platforms, sourceContent, options, brandVoiceId } = parsed.data;

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return new Response(
        JSON.stringify({ error: "Project not found or access denied" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    const subscription = await prisma.subscription.findUnique({
      where: { userId },
    });
    const plan = (subscription?.plan ?? "free") as keyof typeof PLAN_LIMITS;
    const maxChars = PLAN_LIMITS[plan]?.maxCharactersPerContent ?? PLAN_LIMITS.free.maxCharactersPerContent;
    if (sourceContent.length > maxChars) {
      return new Response(
        JSON.stringify({
          error: "Source content exceeds plan limit",
          details: `Maximum ${maxChars} characters allowed for your plan. Current: ${sourceContent.length}.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await generateForPlatforms(
      projectId,
      userId,
      sourceContent,
      platforms,
      options,
      brandVoiceId,
      requestId,
      plan
    );

    const pii = detectPII(sourceContent);

    return new Response(
      JSON.stringify({
        ...result,
        ...(pii.warnings.length > 0 ? { piiWarnings: pii.warnings } : {}),
      }),
      {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    Logger.error("Error in generate API route", error as Error, {
      requestId,
      stack: process.env.NODE_ENV === "development" ? (error instanceof Error ? error.stack : undefined) : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error during content generation",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}