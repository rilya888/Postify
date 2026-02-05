import { prisma } from "@/lib/db/prisma";
import { getCacheStats } from "@/lib/services/cache";

function subDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - days);
  return d;
}

export type AdminStats = {
  usersTotal: number;
  usersNewLast7Days: number;
  usersNewLast30Days: number;
  projectsTotal: number;
  projectsLast7Days: number;
  outputsTotal: number;
  outputVersionsTotal: number;
  subscriptionsByPlan: Record<string, number>;
  transcriptsTotal: number;
  transcriptsFailed: number;
  cacheStats: { total: number; expired: number; sizeEstimate: number };
};

export async function getAdminStats(): Promise<AdminStats> {
  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  const [
    usersTotal,
    usersNewLast7Days,
    usersNewLast30Days,
    projectsTotal,
    projectsLast7Days,
    outputsTotal,
    outputVersionsTotal,
    subscriptionsByPlan,
    transcriptsTotal,
    transcriptsFailed,
    cacheStats,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.project.count(),
    prisma.project.count({ where: { createdAt: { gte: sevenDaysAgo } } }),
    prisma.output.count(),
    prisma.outputVersion.count(),
    prisma.subscription.groupBy({
      by: ["plan"],
      _count: { id: true },
    }),
    prisma.transcript.count(),
    prisma.transcript.count({ where: { status: "failed" } }),
    getCacheStats(),
  ]);

  const subscriptionsByPlanMap: Record<string, number> = {};
  for (const s of subscriptionsByPlan) {
    subscriptionsByPlanMap[s.plan] = s._count.id;
  }

  return {
    usersTotal,
    usersNewLast7Days,
    usersNewLast30Days,
    projectsTotal,
    projectsLast7Days,
    outputsTotal,
    outputVersionsTotal,
    subscriptionsByPlan: subscriptionsByPlanMap,
    transcriptsTotal,
    transcriptsFailed,
    cacheStats,
  };
}
