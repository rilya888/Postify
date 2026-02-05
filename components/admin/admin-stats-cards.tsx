import { getAdminStats } from "@/lib/admin/stats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

export async function AdminStatsCards() {
  const stats = await getAdminStats();

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
            <CardTitle className="text-sm font-medium">Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.usersTotal}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.usersNewLast7Days} last 7 days, +{stats.usersNewLast30Days} last 30 days
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.projectsTotal}</div>
            <p className="text-xs text-muted-foreground">+{stats.projectsLast7Days} last 7 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Outputs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.outputsTotal}</div>
            <p className="text-xs text-muted-foreground">{stats.outputVersionsTotal} versions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Transcripts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.transcriptsTotal}</div>
            {stats.transcriptsFailed > 0 && (
              <p className="text-xs text-destructive">{stats.transcriptsFailed} failed</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subscriptions by plan</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {Object.entries(stats.subscriptionsByPlan).map(([plan, count]) => (
              <Badge key={plan} variant="secondary">
                {plan}: {count}
              </Badge>
            ))}
            {Object.keys(stats.subscriptionsByPlan).length === 0 && (
              <span className="text-muted-foreground">No subscriptions yet</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cache</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-4">
            <span>Total entries: {stats.cacheStats.total}</span>
            <span>Expired: {stats.cacheStats.expired}</span>
            <span>Size: ~{formatBytes(stats.cacheStats.sizeEstimate)}</span>
            <Link href="/admin/cache" className="text-primary hover:underline text-sm">
              Manage cache →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
