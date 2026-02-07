"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Trash } from "lucide-react";
import { NotificationService } from "@/lib/services/notifications";

type DeleteProjectDialogProps = {
  projectId: string;
  projectName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

/**
 * Dialog component for confirming project deletion
 */
export function DeleteProjectDialog({
  projectId,
  projectName,
  isOpen,
  onClose,
  onSuccess,
}: DeleteProjectDialogProps) {
  const t = useTranslations("projectsDeleteDialog");
  const tCommon = useTranslations("common");
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleDelete() {
    setIsDeleting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || t("deleteFailed"));
      }

      NotificationService.success(
        t("deletedTitle"),
        t("deletedDescription", { name: projectName })
      );

      if (onSuccess) {
        onSuccess();
      } else {
        router.push("/projects");
        router.refresh();
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("unexpectedError"));
    } finally {
      setIsDeleting(false);
      onClose();
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>
            {t("description", { name: projectName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            {tCommon("cancel")}
          </Button>
          <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting && <Trash className="mr-2 h-4 w-4 animate-spin" />}
            {tCommon("delete")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
