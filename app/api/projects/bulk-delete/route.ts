import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { bulkOperationSchema } from "@/lib/validations/project";
import { Logger } from "@/lib/utils/logger";

/**
 * POST /api/projects/bulk-delete
 * Delete multiple projects at once
 * 
 * Request body:
 * {
 *   projectIds: string[]
 * }
 * 
 * Response:
 * 200: { deletedCount: number, failedIds: string[] }
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

    const body = await request.json();
    const validatedData = bulkOperationSchema.parse(body);

    Logger.info("Bulk deleting projects", { 
      userId: session.user.id, 
      projectCount: validatedData.projectIds.length 
    });

    // Verify all projects belong to user
    const projects = await prisma.project.findMany({
      where: {
        id: { in: validatedData.projectIds },
        userId: session.user.id,
      },
      select: { id: true },
    });

    const projectIdsToDelete = projects.map(p => p.id);
    const failedIds = validatedData.projectIds.filter(id => !projectIdsToDelete.includes(id));

    if (projectIdsToDelete.length === 0) {
      return createErrorResponse(
        { error: "No valid projects to delete", code: "NO_VALID_PROJECTS" },
        400
      );
    }

    // Delete projects
    const result = await prisma.project.deleteMany({
      where: {
        id: { in: projectIdsToDelete },
      },
    });

    Logger.info("Bulk delete completed", { 
      userId: session.user.id, 
      deletedCount: result.count,
      failedCount: failedIds.length
    });

    return createSuccessResponse({
      deletedCount: result.count,
      failedIds,
    });
  } catch (error) {
    Logger.error("Failed bulk delete", error as Error, { userId: session?.user.id });
    return createErrorResponse(error, error instanceof z.ZodError ? 400 : 500);
  }
}