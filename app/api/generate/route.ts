import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { auth } from "@/lib/auth/config";
import { generateForPlatforms, regenerateForPlatform, type GenerationSlot } from "@/lib/services/ai";
import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";
import { checkGenerateRateLimit } from "@/lib/utils/rate-limit";
import { detectPII } from "@/lib/utils/pii-check";
import { PLAN_LIMITS, getEffectivePlan } from "@/lib/constants/plans";
import type { Plan } from "@/lib/constants/plans";
import { getAllPlatformIds, type Platform } from "@/lib/constants/platforms";
import { isValidToneId } from "@/lib/constants/post-tones";

type ProjectWithPostsConfig = {
  postsPerPlatform?: number | null;
  postsPerPlatformByPlatform?: Record<string, number> | null;
};

/** Build generation slots from project config and target platforms. */
function buildSlotsFromProject(
  project: ProjectWithPostsConfig,
  targetPlatforms: string[]
): GenerationSlot[] {
  const byPlatform = project.postsPerPlatformByPlatform;
  const useByPlatform =
    byPlatform &&
    typeof byPlatform === "object" &&
    !Array.isArray(byPlatform) &&
    Object.keys(byPlatform).length > 0;
  const fallback = project.postsPerPlatform ?? 1;
  const getCount = (p: string): number => {
    if (useByPlatform && p in byPlatform!) {
      const n = byPlatform![p];
      return n >= 1 && n <= 3 ? n : 1;
    }
    return fallback;
  };
  const slots: GenerationSlot[] = [];
  for (const p of targetPlatforms) {
    const count = getCount(p);
    for (let i = 1; i <= count; i++) {
      slots.push({ platform: p as Platform, seriesIndex: i });
    }
  }
  slots.sort((a, b) => a.seriesIndex - b.seriesIndex || a.platform.localeCompare(b.platform));
  return slots;
}

/** Get post count for a single platform from project (for regeneration). */
function getPostCountForPlatform(project: ProjectWithPostsConfig, platform: string): number {
  const byPlatform = project.postsPerPlatformByPlatform;
  if (byPlatform && typeof byPlatform === "object" && platform in byPlatform) {
    const n = byPlatform[platform];
    return n >= 1 && n <= 3 ? n : 1;
  }
  return project.postsPerPlatform ?? 1;
}

export async function POST(request: NextRequest) {
  const requestId = randomUUID();
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
    const {
      projectId,
      platforms,
      sourceContent,
      options,
      brandVoiceId,
      outputId,
      regenerateSeriesForPlatform,
      regenerateFromIndex,
      postToneOverride,
    } = await request.json();

    const [user, subscription] = await Promise.all([
      prisma.user.findUnique({ where: { id: userId }, select: { createdAt: true } }),
      prisma.subscription.findUnique({ where: { userId } }),
    ]);
    const plan = getEffectivePlan(subscription, user?.createdAt ?? null) as Plan;

    // Regenerate single output by outputId
    if (outputId) {
      const output = await prisma.output.findUnique({
        where: { id: outputId },
        include: { project: true },
      });
      if (!output || output.project.userId !== userId) {
        return new Response(
          JSON.stringify({ error: "Output not found or access denied" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }
      if (!output.project.sourceContent?.trim()) {
        return new Response(
          JSON.stringify({ error: "No source content to regenerate from", details: "Source content cannot be empty" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }
      const effectivePostTone =
        postToneOverride != null && plan === "enterprise" && isValidToneId(postToneOverride)
          ? postToneOverride
          : (output.project as { postTone?: string | null }).postTone ?? null;
      const singleResult = await regenerateForPlatform(
        output.projectId,
        userId,
        output.project.sourceContent,
        output.platform as Parameters<typeof regenerateForPlatform>[3],
        options,
        brandVoiceId,
        plan,
        output.seriesIndex,
        effectivePostTone
      );
      const result = {
        successful: singleResult.success ? [singleResult] : [],
        failed: singleResult.success ? [] : [singleResult],
        totalRequested: 1,
      };
      const pii = detectPII(output.project.sourceContent);
      return new Response(
        JSON.stringify({
          ...result,
          ...(pii.warnings.length > 0 ? { piiWarnings: pii.warnings } : {}),
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    // Validate required fields for bulk generate
    if (!projectId || !Array.isArray(platforms) || sourceContent == null) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: projectId, platforms, sourceContent" }),
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
      include: { outputs: { select: { platform: true, seriesIndex: true } } },
    });

    if (!project || project.userId !== userId) {
      return new Response("Project not found or access denied", { status: 404 });
    }

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

    const targetPlatforms: string[] =
      regenerateSeriesForPlatform != null
        ? [regenerateSeriesForPlatform]
        : regenerateFromIndex?.platform != null
          ? [regenerateFromIndex.platform]
          : platforms;
    const validPlatforms = getAllPlatformIds();
    const invalidPlatforms = targetPlatforms.filter(
      (p: string) => !(validPlatforms as readonly string[]).includes(p)
    );
    if (invalidPlatforms.length > 0) {
      return new Response(
        JSON.stringify({ error: `Invalid platforms: ${invalidPlatforms.join(", ")}` }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    let slotsOverride: GenerationSlot[] | undefined;
    if (
      regenerateFromIndex &&
      typeof regenerateFromIndex.platform === "string" &&
      typeof regenerateFromIndex.seriesIndex === "number"
    ) {
      const startIdx = regenerateFromIndex.seriesIndex;
      const platform = regenerateFromIndex.platform as Platform;
      const countForPlatform = getPostCountForPlatform(project as ProjectWithPostsConfig, platform);
      slotsOverride = Array.from({ length: Math.max(0, countForPlatform - startIdx + 1) }, (_, i) => ({
        platform,
        seriesIndex: startIdx + i,
      }));
    } else {
      slotsOverride = buildSlotsFromProject(project as ProjectWithPostsConfig, targetPlatforms);
    }

    const hasSeries = slotsOverride.length > targetPlatforms.length;
    if (hasSeries && plan !== "enterprise") {
      return new Response(
        JSON.stringify({
          error: "Series (multiple posts per platform) is available on Enterprise plan",
          code: "PLAN_REQUIRED",
        }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const effectivePostTone =
      postToneOverride != null && plan === "enterprise" && isValidToneId(postToneOverride)
        ? postToneOverride
        : (project as { postTone?: string | null }).postTone ?? null;

    const maxOutputs = PLAN_LIMITS[plan]?.maxOutputsPerProject ?? 10;
    const outputsNotInSelected = (project.outputs ?? []).filter(
      (o) => !targetPlatforms.includes(o.platform)
    ).length;
    const totalAfter = outputsNotInSelected + slotsOverride.length;
    if (totalAfter > maxOutputs) {
      return new Response(
        JSON.stringify({
          error: `Total outputs would exceed plan limit (${maxOutputs})`,
          details: `After generation you would have ${totalAfter} outputs. Maximum: ${maxOutputs}.`,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const result = await generateForPlatforms(
      projectId,
      userId,
      sourceContent,
      targetPlatforms as Parameters<typeof generateForPlatforms>[3],
      options,
      brandVoiceId,
      requestId,
      plan,
      1,
      slotsOverride,
      effectivePostTone
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