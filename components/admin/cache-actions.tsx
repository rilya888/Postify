"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

export function CacheActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleCleanExpired = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clean-expired" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Cleaned ${data.deleted ?? 0} expired entries`);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clean cache");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="secondary" onClick={handleCleanExpired} disabled={loading}>
          {loading ? "Cleaning..." : "Clean expired entries"}
        </Button>
      </CardContent>
    </Card>
  );
}
