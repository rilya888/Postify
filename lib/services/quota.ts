import { prisma } from "@/lib/db/prisma";
import { PLAN_LIMITS } from "@/lib/constants/plans";
import { Logger } from "@/lib/utils/logger";

/**
 * Quota service for checking user limits
 */
export async function checkProjectQuota(userId: string) {
  Logger.info("Checking project quota", { userId });
  
  // Get user's subscription plan
  const subscription = await prisma.subscription.findUnique({
    where: { userId },
  });

  const plan = subscription?.plan || "free";
  const limit = PLAN_LIMITS[plan as keyof typeof PLAN_LIMITS].maxProjects;

  // Count user's projects
  const projectCount = await prisma.project.count({
    where: { userId },
  });

  const result = {
    canCreate: projectCount < limit,
    current: projectCount,
    limit,
    plan,
  };

  Logger.info("Quota check result", { userId, ...result });
  return result;
}