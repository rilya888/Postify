import { getAdminStats } from "@/lib/admin/stats";
import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export async function AdminStatsCards() {
  const stats = await getAdminStats();
  const t = await getTranslations("admin");

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("users")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersTotal}</div>
            <p className="text-xs text-muted-foreground">
              {t("usersLastPeriods", { d7: stats.usersNewLast7Days, d30: stats.usersNewLast30Days })}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("projects")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsTotal}</div>
            <p className="text-xs text-muted-foreground">{t("projectsLast7Days", { count: stats.projectsLast7Days })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("outputs")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outputsTotal}</div>
            <p className="text-xs text-muted-foreground">{t("versionsCount", { count: stats.outputVersionsTotal })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t("transcripts")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transcriptsTotal}</div>
            {stats.transcriptsFailed > 0 && (
              <p className="text-xs text-destructive">{t("failedCount", { count: stats.transcriptsFailed })}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionsByPlan")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.subscriptionsByPlan).map(([plan, count]) => (
              <Badge key={plan} variant="secondary">
                {t(`plans.${plan}`)}: {count}
              </Badge>
            ))}
            {Object.keys(stats.subscriptionsByPlan).length === 0 && (
              <span className="text-muted-foreground">{t("noSubscriptionsYet")}</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("cache")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <span>{t("totalEntries", { count: stats.cacheStats.total })}</span>
            <span>{t("expiredCount", { count: stats.cacheStats.expired })}</span>
            <span>{t("sizeApprox", { size: formatBytes(stats.cacheStats.sizeEstimate) })}</span>
            <Link href="/admin/cache" className="text-primary hover:underline text-sm">
              {t("manageCache")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
