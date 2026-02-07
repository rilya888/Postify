"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";

export function AdminProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [loading, setLoading] = useState(false);

  const handleInvalidateCache = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "invalidate-project", projectId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      toast.success(t("cacheInvalidatedEntries", { count: data.deleted ?? 0 }));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedToInvalidateCache"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("cache")}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" onClick={handleInvalidateCache} disabled={loading}>
          {loading ? t("invalidating") : t("invalidateCacheForProject")}
        </Button>
      </CardContent>
    </Card>
  );
}
