import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { getCacheStats } from "@/lib/services/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CacheActions } from "@/components/admin/cache-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminMetadata");
  return {
    title: t("cacheTitle"),
    description: t("cacheDescription"),
  };
}

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminCachePage() {
  const t = await getTranslations("admin");
  const stats = await getCacheStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("cache")}</h1>
        <p className="text-muted-foreground mt-1">{t("statisticsAndCleanup")}</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("statistics")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>{t("totalEntriesLabel")} <strong>{stats.total}</strong></p>
          <p>{t("expiredLabel")} <strong>{stats.expired}</strong></p>
          <p>{t("estimatedSizeLabel")} <strong>{formatBytes(stats.sizeEstimate)}</strong></p>
        </CardContent>
      </Card>
      <CacheActions />
    </div>
  );
}
