import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { importProjectFromFile } from "@/lib/utils/project-export";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { Project } from "@/types/project";

type ProjectImportDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (project: Project) => void;
};

export function ProjectImportDialog({
  isOpen,
  onClose,
  onImportSuccess,
}: ProjectImportDialogProps) {
  const t = useTranslations("projectsImport");
  const tCommon = useTranslations("common");
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error(t("selectFile"));
      return;
    }

    setIsImporting(true);
    try {
      const project = await importProjectFromFile(file);

      if (!project.title || !project.sourceContent || !Array.isArray(project.platforms)) {
        throw new Error(t("invalidStructure"));
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: project.title,
          sourceContent: project.sourceContent,
          platforms: project.platforms as ("linkedin" | "twitter" | "email")[],
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || t("importFailed"));
      }

      onImportSuccess(result.project as Project);
      toast.success(t("imported"));
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("importFailed"));
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            type="file"
            accept=".json"
            onChange={handleFileChange}
            className="cursor-pointer"
            aria-label={t("fileInputAria")}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            {tCommon("cancel")}
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting && <Upload className="mr-2 h-4 w-4 animate-spin" />}
            {isImporting ? t("importing") : t("import")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
