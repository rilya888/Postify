import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { createProjectSchema } from "@/lib/validations/project";
import { checkProjectQuota } from "@/lib/services/quota";
import { logProjectChange } from "@/lib/services/project-history";
import { Logger } from "@/lib/utils/logger";
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

    const project = await prisma.project.create({
      data: {
        userId: session.user.id,
        title: validatedData.title,
        sourceContent: validatedData.sourceContent,
        platforms: validatedData.platforms,
      },
    });

    // Log the change
    await logProjectChange(project.id, session.user.id, "create", {
      title: validatedData.title,
      platforms: validatedData.platforms,
    });

    Logger.info("Created project", { userId: session.user.id, projectId: project.id });

    return createSuccessResponse({ project }, 201);
  } catch (error) {
    Logger.error("Failed to create project", error as Error, { userId: 'unknown' });
    return createErrorResponse(error, error instanceof z.ZodError ? 400 : 500);
  }
}