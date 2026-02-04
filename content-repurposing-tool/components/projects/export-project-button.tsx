"use client";

import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { exportProjectToFile } from "@/lib/utils/project-export";
import { ProjectWithOutputs } from "@/types/project";

type ExportProjectButtonProps = {
  project: ProjectWithOutputs;
};

/**
 * Client button that exports project to JSON file
 */
export function ExportProjectButton({ project }: ExportProjectButtonProps) {
  return (
    <Button
      variant="outline"
      onClick={() => exportProjectToFile(project)}
    >
      <Download className="mr-2 h-4 w-4" />
      Export
    </Button>
  );
}
