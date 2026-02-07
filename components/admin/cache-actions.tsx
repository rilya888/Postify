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
import { useTranslations } from "next-intl";
import { toast } from "sonner";

const CONFIRM_KEY = "DELETE";

export function CacheActions() {
  const router = useRouter();
  const t = useTranslations("admin");
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
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      toast.success(t("cleanedExpiredEntries", { count: data.deleted ?? 0 }));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedToCleanCache"));
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
      if (!res.ok) throw new Error(data.error ?? t("failed"));
      toast.success(t("clearedCacheEntries", { count: data.deleted ?? 0 }));
      setClearAllConfirm("");
      setClearAllOpen(false);
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedToClearCache"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("actions")}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={handleCleanExpired} disabled={loading}>
          {loading ? t("cleaning") : t("cleanExpiredEntries")}
        </Button>
        <AlertDialog open={clearAllOpen} onOpenChange={(open) => { setClearAllOpen(open); if (!open) setClearAllConfirm(""); }}>
          <Button variant="destructive" disabled={loading} onClick={() => setClearAllOpen(true)}>
            {t("clearAllCache")}
          </Button>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t("clearAllCacheQuestion")}</AlertDialogTitle>
              <AlertDialogDescription>
                {t("clearAllCacheDescription")} <strong>{CONFIRM_KEY}</strong> {t("clearAllCacheTypeToConfirm")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Label htmlFor="confirm-cache">{t("confirmation")}</Label>
              <Input
                id="confirm-cache"
                value={clearAllConfirm}
                onChange={(e) => setClearAllConfirm(e.target.value)}
                placeholder={CONFIRM_KEY}
                className="mt-1"
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>{t("cancel")}</AlertDialogCancel>
              <Button
                variant="destructive"
                disabled={clearAllConfirm !== CONFIRM_KEY || loading}
                onClick={handleClearAll}
              >
                {loading ? t("clearing") : t("clearAll")}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}
