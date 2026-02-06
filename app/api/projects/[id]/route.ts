import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { updateProjectSchema } from "@/lib/validations/project";
import { logProjectChange } from "@/lib/services/project-history";
import { invalidateProjectGenerationCache } from "@/lib/services/cache";
import { checkProjectsRateLimit } from "@/lib/utils/rate-limit";
import { Logger } from "@/lib/utils/logger";
import { getEffectivePlan } from "@/lib/constants/plans";
import { z } from "zod";

function rateLimitResponse(rateLimit: { retryAfterSeconds?: number }) {
  return new Response(
    JSON.stringify({
      error: "Too many requests",
      details: "Rate limit exceeded. Try again later.",
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        ...(rateLimit.retryAfterSeconds != null
          ? { "Retry-After": String(rateLimit.retryAfterSeconds) }
          : {}),
      },
    }
  );
}

/**
 * GET /api/projects/[id]
 * Get a specific project by ID
 * 
 * Response:
 * 200: { project: ProjectWithOutputs }
 * 401: { error: string }
 * 404: { error: string }
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return createErrorResponse(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        401
      );
    }

    const rl = checkProjectsRateLimit(session.user.id);
    if (!rl.allowed) return rateLimitResponse(rl);

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        outputs: {
          orderBy: [{ platform: "asc" }, { seriesIndex: "asc" }],
        },
      },
    });

    if (!project || project.userId !== session.user.id) {
      return createErrorResponse(
        { error: "Project not found", code: "PROJECT_NOT_FOUND" },
        404
      );
    }

    Logger.info("Fetched project", { userId: session.user.id, projectId: params.id });

    return createSuccessResponse({ project });
  } catch (error) {
    Logger.error("Failed to fetch project", error as Error, {
      userId: params.id, // We can't access session here, so just log the project ID
      projectId: params.id
    });
    return createErrorResponse(error);
  }
}

/**
 * PATCH /api/projects/[id]
 * Update a specific project
 * 
 * Request body:
 * {
 *   title?: string,
 *   sourceContent?: string,
 *   platforms?: Platform[]
 * }
 * 
 * Response:
 * 200: { project: Project }
 * 400: { error: string, details?: unknown }
 * 401: { error: string }
 * 404: { error: string }
 */
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return createErrorResponse(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        401
      );
    }

    const rl = checkProjectsRateLimit(session.user.id);
    if (!rl.allowed) return rateLimitResponse(rl);

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    const [existingProject, user, subscription] = await Promise.all([
      prisma.project.findUnique({ where: { id: params.id } }),
      prisma.user.findUnique({ where: { id: session.user.id }, select: { createdAt: true } }),
      prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    ]);

    if (!existingProject || existingProject.userId !== session.user.id) {
      return createErrorResponse(
        { error: "Project not found", code: "PROJECT_NOT_FOUND" },
        404
      );
    }

    const plan = getEffectivePlan(subscription, user?.createdAt ?? null);
    const platformsList = validatedData.platforms ?? existingProject.platforms;
    const existingByPlatform = (existingProject.postsPerPlatformByPlatform ?? null) as Record<string, number> | null;
    const newByPlatformRaw = validatedData.postsPerPlatformByPlatform;
    const newByPlatform =
      newByPlatformRaw !== undefined && newByPlatformRaw !== null && typeof newByPlatformRaw === "object" && !Array.isArray(newByPlatformRaw)
        ? (Object.fromEntries(
            platformsList
              .filter((p) => p in newByPlatformRaw)
              .map((p) => [p, newByPlatformRaw[p as keyof typeof newByPlatformRaw] as number])
          ) as Record<string, number>)
        : undefined;
    const useByPlatform =
      plan === "enterprise" &&
      newByPlatform &&
      Object.keys(newByPlatform).length > 0;
    const effectiveByPlatform = useByPlatform ? newByPlatform : null;
    const newPostsPerPlatformLegacy =
      validatedData.postsPerPlatform != null
        ? plan === "enterprise"
          ? validatedData.postsPerPlatform
          : 1
        : existingProject.postsPerPlatform ?? 1;

    // Resolve new count per platform for extra-posts check (use new map, else existing map, else legacy number)
    const getNewCount = (platform: string): number => {
      if (effectiveByPlatform && platform in effectiveByPlatform) return effectiveByPlatform[platform] as number;
      if (existingByPlatform && platform in existingByPlatform) return existingByPlatform[platform] as number;
      return newPostsPerPlatformLegacy;
    };

    const existingOutputs = await prisma.output.findMany({
      where: { projectId: params.id },
      select: { platform: true, seriesIndex: true },
    });
    let extraCount = 0;
    const toDelete: { platform: string; seriesIndex: number }[] = [];
    for (const o of existingOutputs) {
      const limit = getNewCount(o.platform);
      if ((o.seriesIndex ?? 1) > limit) {
        extraCount++;
        toDelete.push({ platform: o.platform, seriesIndex: o.seriesIndex });
      }
    }

    if (extraCount > 0 && !validatedData.confirmDeleteExtraPosts) {
      const reducingByPlatform = effectiveByPlatform != null;
      return createErrorResponse(
        {
          error: "Extra posts exist",
          code: "EXTRA_POSTS_EXIST",
          message: reducingByPlatform
            ? `Reducing posts for some platforms will delete ${extraCount} existing post(s). Confirm to proceed.`
            : `Reducing to ${newPostsPerPlatformLegacy} posts per platform will delete ${extraCount} existing post(s). Confirm to proceed.`,
          extraPostsCount: extraCount,
        },
        400
      );
    }
    if (validatedData.confirmDeleteExtraPosts && extraCount > 0) {
      for (const { platform, seriesIndex } of toDelete) {
        await prisma.output.deleteMany({
          where: {
            projectId: params.id,
            platform,
            seriesIndex,
          },
        });
      }
    }

    // Check for duplicate title if title is being updated
    if (validatedData.title && validatedData.title !== existingProject.title) {
      const duplicateProject = await prisma.project.findFirst({
        where: {
          userId: session.user.id,
          title: validatedData.title,
        },
      });

      if (duplicateProject) {
        return createErrorResponse(
          { error: "A project with this title already exists", code: "DUPLICATE_TITLE" },
          400
        );
      }
    }

    const updateData: Prisma.ProjectUpdateInput = {
      title: validatedData.title,
      sourceContent: validatedData.sourceContent,
      platforms: validatedData.platforms,
    };
    if (validatedData.postsPerPlatformByPlatform !== undefined) {
      updateData.postsPerPlatformByPlatform =
        effectiveByPlatform && Object.keys(effectiveByPlatform).length > 0
          ? (effectiveByPlatform as Prisma.InputJsonValue)
          : Prisma.JsonNull;
      updateData.postsPerPlatform =
        effectiveByPlatform && Object.keys(effectiveByPlatform).length > 0
          ? Math.max(...Object.values(effectiveByPlatform), 1) === 1
            ? null
            : Math.max(...Object.values(effectiveByPlatform))
          : newPostsPerPlatformLegacy === 1
            ? null
            : newPostsPerPlatformLegacy;
    } else if (validatedData.postsPerPlatform !== undefined) {
      updateData.postsPerPlatform = newPostsPerPlatformLegacy === 1 ? null : newPostsPerPlatformLegacy;
    }

    const project = await prisma.project.update({
      where: { id: params.id },
      data: updateData,
    });

    if (validatedData.sourceContent !== undefined) {
      await invalidateProjectGenerationCache(params.id);
    }

    await logProjectChange(project.id, session.user.id, "update", validatedData);

    Logger.info("Updated project", { userId: session.user.id, projectId: params.id });

    return createSuccessResponse({ project });
  } catch (error) {
    Logger.error("Failed to update project", error as Error, {
      userId: params.id,
      projectId: params.id
    });
    return createErrorResponse(error, error instanceof z.ZodError ? 400 : 500);
  }
}

/**
 * DELETE /api/projects/[id]
 * Delete a specific project
 * 
 * Response:
 * 204: No content
 * 401: { error: string }
 * 404: { error: string }
 */
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();

    if (!session) {
      return createErrorResponse(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        401
      );
    }

    const rl = checkProjectsRateLimit(session.user.id);
    if (!rl.allowed) return rateLimitResponse(rl);

    const existingProject = await prisma.project.findUnique({
      where: { id: params.id },
    });

    if (!existingProject || existingProject.userId !== session.user.id) {
      return createErrorResponse(
        { error: "Project not found", code: "PROJECT_NOT_FOUND" },
        404
      );
    }

    await prisma.project.delete({
      where: { id: params.id },
    });

    // Log the change
    await logProjectChange(params.id, session.user.id, "delete", {});

    Logger.info("Deleted project", { userId: session.user.id, projectId: params.id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    Logger.error("Failed to delete project", error as Error, {
      userId: params.id,
      projectId: params.id
    });

    // Handle case where project has related outputs (foreign key constraint)
    if (error instanceof Error && error.message.includes("foreign key constraint")) {
      return createErrorResponse(
        {
          error: "Cannot delete project with associated outputs",
          code: "PROJECT_HAS_OUTPUTS"
        },
        400
      );
    }

    return createErrorResponse(error);
  }
}