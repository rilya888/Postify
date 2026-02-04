"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Plus, Upload } from "lucide-react";
import Link from "next/link";
import { ProjectImportDialog } from "@/components/projects/project-import-dialog";
import { Project } from "@/types/project";

/**
 * Client wrapper for dashboard header actions: New Project and Import with dialog
 */
export function DashboardActions() {
  const router = useRouter();
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);

  return (
    <div className="flex gap-2">
      <Button asChild>
        <Link href="/projects/new">
          <Plus className="mr-2 h-4 w-4" />
          New Project
        </Link>
      </Button>
      <Button
        variant="outline"
        onClick={() => setIsImportDialogOpen(true)}
      >
        <Upload className="mr-2 h-4 w-4" />
        Import
      </Button>
      <ProjectImportDialog
        isOpen={isImportDialogOpen}
        onClose={() => setIsImportDialogOpen(false)}
        onImportSuccess={(_project: Project) => {
          setIsImportDialogOpen(false);
          router.refresh();
        }}
      />
    </div>
  );
}
