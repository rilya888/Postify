"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

const CONFIRM_KEY = "DELETE";

export function CacheActions() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [clearAllConfirm, setClearAllConfirm] = useState("");
  const [clearAllOpen, setClearAllOpen] = useState(false);

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

  const handleClearAll = async () => {
    if (clearAllConfirm !== CONFIRM_KEY) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/cache", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear-all", confirmKey: CONFIRM_KEY }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success(`Cleared ${data.deleted ?? 0} cache entries`);
      setClearAllConfirm("");
      setClearAllOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to clear cache");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleCleanExpired} disabled={loading}>
          {loading ? "Cleaning..." : "Clean expired entries"}
        </Button>
        <AlertDialog open={clearAllOpen} onOpenChange={(open) => { setClearAllOpen(open); if (!open) setClearAllConfirm(""); }}>
          <Button variant="destructive" disabled={loading} onClick={() => setClearAllOpen(true)}>
            Clear all cache
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Clear all cache?</AlertDialogTitle>
              <AlertDialogDescription>
                This will delete every cache entry. Generation and content-pack caches will be rebuilt on next use. Type{" "}
                <strong>{CONFIRM_KEY}</strong> below to confirm.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="confirm-cache">Confirmation</Label>
              <Input
                id="confirm-cache"
                value={clearAllConfirm}
                onChange={(e) => setClearAllConfirm(e.target.value)}
                placeholder={CONFIRM_KEY}
                className="mt-1"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={clearAllConfirm !== CONFIRM_KEY || loading}
                onClick={handleClearAll}
              >
                {loading ? "Clearing..." : "Clear all"}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
