"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { signOut } from "next-auth/react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export function DangerZone() {
  const t = useTranslations("settingsDanger");
  const tCommon = useTranslations("common");
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    if (!password.trim()) {
      toast.error(t("enterPassword"));
      return;
    }
    setIsDeleting(true);
    try {
      const res = await fetch("/api/me", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? t("deleteFailed"));
        setIsDeleting(false);
        return;
      }
      setOpen(false);
      setPassword("");
      toast.success(t("deleted"));
      await signOut({ callbackUrl: "/" });
      window.location.href = "/";
    } catch {
      toast.error(t("deleteFailed"));
      setIsDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">{t("deleteAccountButton")}</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("dialogTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("dialogDescription")}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="py-2">
          <Label htmlFor="delete-password">{t("passwordLabel")}</Label>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("passwordPlaceholder")}
            className="mt-1"
            autoComplete="current-password"
            disabled={isDeleting}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
          <Button variant="destructive" disabled={isDeleting} onClick={handleDelete}>
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("deleting")}
              </>
            ) : (
              t("deleteAccountButton")
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
