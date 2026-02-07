import { prisma } from "@/lib/db/prisma";
import { Logger } from "@/lib/utils/logger";

export type AuditAction = "delete";

export async function logAuditEvent(
  entityType: string,
  entityId: string,
  userId: string,
  action: AuditAction,
  payload: Record<string, unknown>
) {
  return prisma.auditEvent.create({
    data: {
      entityType,
      entityId,
      userId,
      action,
      payload: payload as import("@prisma/client").Prisma.JsonObject,
    },
  });
}

/**
 * Writes audit event and suppresses failures to avoid breaking primary flow.
 */
export async function logAuditEventSafe(
  entityType: string,
  entityId: string,
  userId: string,
  action: AuditAction,
  payload: Record<string, unknown>
): Promise<boolean> {
  try {
    await logAuditEvent(entityType, entityId, userId, action, payload);
    return true;
  } catch (error) {
    Logger.error("Failed to write audit event", error as Error, {
      entityType,
      entityId,
      userId,
      action,
    });
    return false;
  }
}
