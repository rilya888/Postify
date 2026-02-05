import { Metadata } from "next";
import { getCacheStats } from "@/lib/services/cache";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CacheActions } from "@/components/admin/cache-actions";

export const metadata: Metadata = {
  title: "Admin Cache",
  description: "Cache statistics and management",
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default async function AdminCachePage() {
  const stats = await getCacheStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Cache</h1>
        <p className="text-muted-foreground mt-1">Statistics and cleanup</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Statistics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>Total entries: <strong>{stats.total}</strong></p>
          <p>Expired: <strong>{stats.expired}</strong></p>
          <p>Estimated size: <strong>{formatBytes(stats.sizeEstimate)}</strong></p>
        </CardContent>
      </Card>
      <CacheActions />
    </div>
  );
}
