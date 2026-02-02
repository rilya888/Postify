import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";

/**
 * Service for managing project history/audit trail
 */
export async function logProjectChange(
  projectId: string,
  userId: string,
  action: "create" | "update" | "delete" | "generate" | "edit_output" | "revert_output" | "revert_to_version",
  changes: Record<string, unknown>
) {
  Logger.info("Logging project change", { projectId, userId, action });

  const historyEntry = await prisma.projectHistory.create({
    data: {
      projectId,
      userId,
      action,
      changes: changes as import("@prisma/client").Prisma.JsonObject,
    },
  });
  
  Logger.info("Project change logged successfully", { historyId: historyEntry.id });
  return historyEntry;
}

export async function getProjectHistory(projectId: string) {
  Logger.info("Fetching project history", { projectId });
  
  const history = await prisma.projectHistory.findMany({
    where: { projectId },
    orderBy: { timestamp: "desc" },
    take: 50, // Limit to last 50 changes
  });
  
  Logger.info("Project history fetched", { projectId, count: history.length });
  return history;
}