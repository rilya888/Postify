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
  postTone?: string | null; // Enterprise: tone id from post-tones; null = no tone (only Brand Voice)
  postsPerPlatform?: number | null; // Enterprise: 1..3 posts per platform (series); fallback when postsPerPlatformByPlatform empty
  postsPerPlatformByPlatform?: Record<string, number> | null; // Enterprise: per-platform count e.g. { "tiktok": 3, "linkedin": 2 }
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
  postTone?: string | null;
  postsPerPlatform?: 1 | 2 | 3;
  postsPerPlatformByPlatform?: Partial<Record<Platform, 1 | 2 | 3>>;
};

/**
 * Project update input
 */
export type UpdateProjectInput = Partial<{
  title: string;
  sourceContent: string;
  platforms: Platform[];
  postTone?: string | null;
  postsPerPlatform: 1 | 2 | 3;
  postsPerPlatformByPlatform: Partial<Record<Platform, 1 | 2 | 3>>;
  confirmDeleteExtraPosts?: boolean;
}>;

/**
 * Project with related outputs
 */
export type ProjectWithOutputs = Project & {
  outputs: {
    id: string;
    platform: Platform;
    seriesIndex?: number; // 1-based; treat missing as 1 for backward compatibility
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