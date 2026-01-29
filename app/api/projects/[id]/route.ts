import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/config";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";
import { updateProjectSchema } from "@/lib/validations/project";
import { logProjectChange } from "@/lib/services/project-history";
import { Logger } from "@/lib/utils/logger";

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

    const project = await prisma.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      include: {
        outputs: {
          orderBy: { platform: "asc" },
        },
      },
    });

    if (!project) {
      return createErrorResponse(
        { error: "Project not found", code: "PROJECT_NOT_FOUND" },
        404
      );
    }

    Logger.info("Fetched project", { userId: session.user.id, projectId: params.id });

    return createSuccessResponse({ project });
  } catch (error) {
    Logger.error("Failed to fetch project", error as Error, { 
      userId: session?.user.id, 
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

    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // Check if project exists and belongs to user
    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return createErrorResponse(
        { error: "Project not found", code: "PROJECT_NOT_FOUND" },
        404
      );
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

    const project = await prisma.project.update({
      where: {
        id: params.id,
        userId: session.user.id,
      },
      data: {
        title: validatedData.title,
        sourceContent: validatedData.sourceContent,
        platforms: validatedData.platforms,
      },
    });

    // Log the change
    await logProjectChange(project.id, session.user.id, "update", validatedData);

    Logger.info("Updated project", { userId: session.user.id, projectId: params.id });

    return createSuccessResponse({ project });
  } catch (error) {
    Logger.error("Failed to update project", error as Error, { 
      userId: session?.user.id, 
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

    const existingProject = await prisma.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    if (!existingProject) {
      return createErrorResponse(
        { error: "Project not found", code: "PROJECT_NOT_FOUND" },
        404
      );
    }

    await prisma.project.delete({
      where: {
        id: params.id,
        userId: session.user.id,
      },
    });

    // Log the change
    await logProjectChange(params.id, session.user.id, "delete", {});

    Logger.info("Deleted project", { userId: session.user.id, projectId: params.id });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    Logger.error("Failed to delete project", error as Error, { 
      userId: session?.user.id, 
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