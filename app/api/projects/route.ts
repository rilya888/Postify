import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { createProjectSchema } from "@/lib/validations/project";
import { checkProjectQuota } from "@/lib/services/quota";
import { logProjectChange } from "@/lib/services/project-history";
import { checkProjectsRateLimit } from "@/lib/utils/rate-limit";
import { Logger } from "@/lib/utils/logger";
import { getEffectivePlan } from "@/lib/constants/plans";
import { validatePostToneForPlan } from "@/lib/validations/project";
import { z } from "zod";

/**
 * GET /api/projects
 * Get all projects for the authenticated user
 * 
 * Query params:
 * - limit: number (default: 10, max: 100)
 * - offset: number (default: 0)
 * - sortBy: "createdAt" | "title" (default: "createdAt")
 * - sortOrder: "asc" | "desc" (default: "desc")
 * 
 * Response:
 * 200: { projects: Project[], count: number }
 * 401: { error: string }
 */
export async function GET(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return createErrorResponse(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        401
      );
    }

    const rateLimit = checkProjectsRateLimit(session.user.id);
    if (!rateLimit.allowed) {
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

    const { searchParams } = new URL(request.url);
    
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 100);
    const offset = parseInt(searchParams.get("offset") || "0");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";

    const validSortFields = ["createdAt", "title"];
    if (!validSortFields.includes(sortBy)) {
      return createErrorResponse(
        { error: "Invalid sort field", code: "INVALID_SORT_FIELD" },
        400
      );
    }

    if (!["asc", "desc"].includes(sortOrder)) {
      return createErrorResponse(
        { error: "Invalid sort order", code: "INVALID_SORT_ORDER" },
        400
      );
    }

    const [projects, count] = await Promise.all([
      prisma.project.findMany({
        where: { userId: session.user.id },
        skip: offset,
        take: limit,
        orderBy: {
          [sortBy]: sortOrder,
        },
        include: {
          outputs: {
            select: {
              platform: true,
            },
          },
        },
      }),
      prisma.project.count({
        where: { userId: session.user.id },
      }),
    ]);

    Logger.info("Fetched projects", { userId: session.user.id, count: projects.length });

    return createSuccessResponse({
      projects,
      count,
      pagination: {
        limit,
        offset,
        total: count,
        hasNext: offset + limit < count,
      },
    });
  } catch (error) {
    Logger.error("Failed to fetch projects", error as Error, { userId: 'unknown' });
    return createErrorResponse(error);
  }
}

/**
 * POST /api/projects
 * Create a new project
 * 
 * Request body:
 * {
 *   title: string,
 *   sourceContent: string,
 *   platforms: Platform[]
 * }
 * 
 * Response:
 * 201: { project: Project }
 * 400: { error: string, details?: unknown }
 * 401: { error: string }
 */
export async function POST(request: Request) {
  try {
    const session = await auth();

    if (!session) {
      return createErrorResponse(
        { error: "Unauthorized", code: "UNAUTHORIZED" },
        401
      );
    }

    const rateLimit = checkProjectsRateLimit(session.user.id);
    if (!rateLimit.allowed) {
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

    // Check quota before creating
    const quota = await checkProjectQuota(session.user.id);
    if (!quota.canCreate) {
      return createErrorResponse(
        { 
          error: "Project limit exceeded", 
          code: "QUOTA_EXCEEDED",
          details: {
            current: quota.current,
            limit: quota.limit,
            plan: quota.plan,
          }
        },
        400
      );
    }

    const body = await request.json();
    const validatedData = createProjectSchema.parse(body);

    const [user, subscription] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id }, select: { createdAt: true } }),
      prisma.subscription.findUnique({ where: { userId: session.user.id } }),
    ]);
    const plan = getEffectivePlan(subscription, user?.createdAt ?? null);

    // Prefer postsPerPlatformByPlatform when present and non-empty; otherwise legacy postsPerPlatform
    const byPlatform = validatedData.postsPerPlatformByPlatform;
    const useByPlatform =
      plan === "enterprise" &&
      byPlatform &&
      typeof byPlatform === "object" &&
      !Array.isArray(byPlatform) &&
      Object.keys(byPlatform).length > 0;
    const platformsList = validatedData.platforms;
    const filteredByPlatform =
      useByPlatform && byPlatform
        ? (Object.fromEntries(
            platformsList.filter((p) => p in byPlatform).map((p) => [p, byPlatform[p as keyof typeof byPlatform] as number])
          ) as Record<string, number>)
        : undefined;
    const hasFilteredByPlatform = filteredByPlatform && Object.keys(filteredByPlatform).length > 0;
    const legacyPostsPerPlatform = !hasFilteredByPlatform
      ? plan === "enterprise" && validatedData.postsPerPlatform != null
        ? validatedData.postsPerPlatform
        : 1
      : Math.max(...Object.values(filteredByPlatform!), 1);

    // Check for duplicate title
    const existingProject = await prisma.project.findFirst({
      where: {
        userId: session.user.id,
        title: validatedData.title,
      },
    });

    if (existingProject) {
      return createErrorResponse(
        { error: "A project with this title already exists", code: "DUPLICATE_TITLE" },
        400
      );
    }

    const finalPostTone = validatePostToneForPlan(validatedData.postTone ?? null, plan);

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        sourceContent: validatedData.sourceContent ?? "",
        platforms: validatedData.platforms,
        postsPerPlatform: legacyPostsPerPlatform === 1 ? null : legacyPostsPerPlatform,
        postsPerPlatformByPlatform: hasFilteredByPlatform ? filteredByPlatform : undefined,
        postTone: finalPostTone,
      },
    });

    // Log the change
    await logProjectChange(project.id, session.user.id, "create", {
      title: validatedData.title,
      platforms: validatedData.platforms,
      postsPerPlatform: project.postsPerPlatform ?? undefined,
      postsPerPlatformByPlatform: project.postsPerPlatformByPlatform ?? undefined,
    });

    Logger.info("Created project", { userId: session.user.id, projectId: project.id });

    return createSuccessResponse({ project }, 201);
  } catch (error) {
    Logger.error("Failed to create project", error as Error, { userId: 'unknown' });
    return createErrorResponse(error, error instanceof z.ZodError ? 400 : 500);
  }
}