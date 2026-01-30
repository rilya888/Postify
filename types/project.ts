import { Platform } from "@/lib/constants/platforms";

/**
 * Project type representing a content repurposing project
 */
export type Project = {
  id: string;
  userId: string;
  title: string;
  sourceContent: string;
  platforms: Platform[];
  createdAt: Date;
  updatedAt: Date;
};

/**
 * Project creation input
 */
export type CreateProjectInput = {
  title: string;
  sourceContent: string;
  platforms: Platform[];
};

/**
 * Project update input
 */
export type UpdateProjectInput = Partial<{
  title: string;
  sourceContent: string;
  platforms: Platform[];
}>;

/**
 * Project with related outputs
 */
export type ProjectWithOutputs = Project & {
  outputs: {
    id: string;
    platform: Platform;
    content: string;
    isEdited: boolean;
    createdAt: Date;
    updatedAt: Date;
  }[];
};

/**
 * Project history entry
 */
export type ProjectHistory = {
  id: string;
  projectId: string;
  userId: string;
  action: "create" | "update" | "delete" | "generate";
  changes: Record<string, any>;
  timestamp: Date;
};