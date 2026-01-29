import { prisma } from "@/lib/db/prisma";
import { CreateProjectInput, UpdateProjectInput } from "@/types/project";
import { Logger } from "@/lib/utils/logger";

/**
 * Service functions for project operations
 * Provides business logic layer between API routes and database
 */

/**
 * Create a new project
 */
export async function createProject(userId: string, data: CreateProjectInput) {
  Logger.info("Creating project", { userId, title: data.title });
  
  // Check for duplicate title
  const existingProject = await prisma.project.findFirst({
    where: {
      userId,
      title: data.title,
    },
  });

  if (existingProject) {
    throw new Error("A project with this title already exists");
  }

  const project = await prisma.project.create({
    data: {
      userId,
      title: data.title,
      sourceContent: data.sourceContent,
      platforms: data.platforms,
    },
  });

  Logger.info("Project created successfully", { projectId: project.id });
  return project;
}

/**
 * Get all projects for a user
 */
export async function getUserProjects(
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: "createdAt" | "title";
    sortOrder?: "asc" | "desc";
  } = {}
) {
  const { limit = 10, offset = 0, sortBy = "createdAt", sortOrder = "desc" } = options;

  Logger.info("Fetching user projects", { userId, limit, offset });

  const projects = await prisma.project.findMany({
    where: { userId },
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
  });

  Logger.info("Fetched projects", { userId, count: projects.length });
  return projects;
}

/**
 * Get project count for a user
 */
export async function getUserProjectCount(userId: string) {
  const count = await prisma.project.count({
    where: { userId },
  });

  Logger.info("Fetched project count", { userId, count });
  return count;
}

/**
 * Get a specific project by ID
 */
export async function getProjectById(id: string, userId: string) {
  Logger.info("Fetching project by ID", { userId, projectId: id });

  const project = await prisma.project.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      outputs: {
        orderBy: { platform: "asc" },
      },
    },
  });

  if (!project) {
    Logger.warn("Project not found", { userId, projectId: id });
  } else {
    Logger.info("Project found", { userId, projectId: id });
  }

  return project;
}

/**
 * Update a project
 */
export async function updateProject(id: string, userId: string, data: UpdateProjectInput) {
  Logger.info("Updating project", { userId, projectId: id, updates: Object.keys(data) });

  // Check for duplicate title if title is being updated
  if (data.title) {
    const existingProject = await prisma.project.findFirst({
      where: {
        userId,
        title: data.title,
        id: { not: id }, // Exclude current project
      },
    });

    if (existingProject) {
      throw new Error("A project with this title already exists");
    }
  }

  const project = await prisma.project.update({
    where: {
      id,
      userId,
    },
    data,
  });

  Logger.info("Project updated successfully", { projectId: project.id });
  return project;
}

/**
 * Delete a project
 */
export async function deleteProject(id: string, userId: string) {
  Logger.info("Deleting project", { userId, projectId: id });

  const deletedProject = await prisma.project.delete({
    where: {
      id,
      userId,
    },
  });

  Logger.info("Project deleted successfully", { projectId: deletedProject.id });
  return deletedProject;
}

/**
 * Get project with outputs by ID
 */
export async function getProjectWithOutputs(id: string, userId: string) {
  Logger.info("Fetching project with outputs", { userId, projectId: id });

  const project = await prisma.project.findUnique({
    where: {
      id,
      userId,
    },
    include: {
      outputs: true,
    },
  });

  if (!project) {
    Logger.warn("Project with outputs not found", { userId, projectId: id });
  } else {
    Logger.info("Project with outputs found", { userId, projectId: id, outputCount: project.outputs.length });
  }

  return project;
}