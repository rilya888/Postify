"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function AdminProjectDetail({ projectId }: { projectId: string }) {
  const router = useRouter();
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
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Cache invalidated (${data.deleted ?? 0} entries)`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to invalidate cache");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cache</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" onClick={handleInvalidateCache} disabled={loading}>
          {loading ? "Invalidating..." : "Invalidate cache for this project"}
        </Button>
      </CardContent>
    </Card>
  );
}
