import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import { generateContentVariations } from "@/lib/services/ai";
import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";
import { checkGenerateRateLimit } from "@/lib/utils/rate-limit";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { getAllPlatformIds } from "@/lib/constants/platforms";

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session || !session.user?.id) {
      return new Response("Unauthorized", { status: 401 });
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

    // Parse request body
    const { projectId, platform, sourceContent, variationCount, options, brandVoiceId } = await request.json();

    // Validate required fields
    if (!projectId || !platform || sourceContent == null) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: projectId, platform, sourceContent" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    if (typeof sourceContent !== "string" || !sourceContent.trim()) {
      return new Response(
        JSON.stringify({ error: "Source content cannot be empty", details: "Source content cannot be empty" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project || project.userId !== userId) {
      return new Response("Project not found or access denied", { status: 404 });
    }

    // Validate platform
    const validPlatforms = getAllPlatformIds();
    if (!validPlatforms.includes(platform)) {
      return new Response(
        JSON.stringify({ error: `Invalid platform: ${platform}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
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

    // Validate variation count
    const maxVariations = PLAN_LIMITS[plan]?.maxVariationsPerGeneration ?? PLAN_LIMITS.free.maxVariationsPerGeneration ?? 3;
    const count = variationCount ? Math.min(variationCount, maxVariations) : 3;

    // Perform generation of variations
    const result = await generateContentVariations(
      projectId,
      userId,
      sourceContent,
      platform,
      count,
      options,
      brandVoiceId
    );

    // Return results
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    Logger.error("Error in generate variations API route", error as Error, {
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: "Internal server error during content variations generation",
        details: error instanceof Error ? error.message : String(error)
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}