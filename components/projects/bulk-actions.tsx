"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import { NotificationService } from "@/lib/services/notifications";

type BulkActionsProps = {
  selectedProjectIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onActionComplete?: () => void;
};

export function BulkActions({
  selectedProjectIds,
  onSelectionChange,
  onActionComplete,
}: BulkActionsProps) {
  const t = useTranslations("projectsBulk");
  const tCommon = useTranslations("common");
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch("/api/projects/bulk-delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectIds: selectedProjectIds }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("deleteFailed"));
      }

      NotificationService.success(
        t("deletedTitle"),
        t("deletedDescription", { count: result.deletedCount })
      );

      onSelectionChange([]);

      if (onActionComplete) {
        onActionComplete();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("deleteFailed"));
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };

  if (selectedProjectIds.length === 0) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 flex -translate-x-1/2 transform gap-2 rounded-lg border bg-background p-4 shadow-lg">
        <span className="self-center">{t("selectedCount", { count: selectedProjectIds.length })}</span>
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setIsDeleteDialogOpen(true)}
          disabled={isDeleting}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t("deleteSelected")}
        </Button>
        <Button variant="outline" size="sm" onClick={() => onSelectionChange([])}>
          {t("clear")}
        </Button>
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDescription", { count: selectedProjectIds.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>{tCommon("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isDeleting ? t("deleting") : tCommon("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
