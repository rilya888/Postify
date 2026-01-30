import { useState } from "react";
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
import { createProject } from "@/lib/services/projects";
import { auth } from "@/lib/auth/config";

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
  // Using imported toast function directly
  const [file, setFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);
    try {
      const project = await importProjectFromFile(file);
      
      // Validate the imported project structure
      if (!project.title || !project.sourceContent || !Array.isArray(project.platforms)) {
        throw new Error("Invalid project structure in file");
      }
      
      // Create the project in the database
      const session = await auth();
      if (!session) {
        throw new Error("Not authenticated");
      }
      
      const createdProject = await createProject(session.user.id, {
        title: project.title,
        sourceContent: project.sourceContent,
        platforms: project.platforms as ("linkedin" | "twitter" | "email")[],
      });

      onImportSuccess(createdProject as Project);
      toast.success("Project has been imported and saved successfully");
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import project");
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import Project</DialogTitle>
          <DialogDescription>
            Select a JSON file to import your project data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input 
            type="file" 
            accept=".json" 
            onChange={handleFileChange}
            className="cursor-pointer"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isImporting}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isImporting}>
            {isImporting && <Upload className="mr-2 h-4 w-4 animate-spin" />}
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}