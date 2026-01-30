"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Download } from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DeleteProjectDialog } from "@/components/projects/delete-project-dialog";
import { BulkActions } from "@/components/projects/bulk-actions";
import { exportProjectToFile } from "@/lib/utils/project-export";
import { ProjectWithOutputs } from "@/types/project";

type ProjectItem = {
  id: string;
  title: string;
  sourceContent: string;
  platforms: string[];
  createdAt: Date;
  outputs: { platform: string }[];
};

type ProjectsListClientProps = {
  projects: ProjectItem[];
};

/**
 * Client list of project cards with selection, delete, bulk actions, and export
 */
export function ProjectsListClient({ projects }: ProjectsListClientProps) {
  const router = useRouter();
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<{ id: string; title: string } | null>(null);

  const handleCardClick = (e: React.MouseEvent, projectId: string) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      setSelectedProjectIds((prev) =>
        prev.includes(projectId)
          ? prev.filter((id) => id !== projectId)
          : [...prev, projectId]
      );
    }
  };

  const handleDeleteClick = (id: string, title: string) => {
    setProjectToDelete({ id, title });
    setDeleteDialogOpen(true);
  };

  const handleExportSelected = () => {
    const toExport = projects.filter((p) => selectedProjectIds.includes(p.id));
    if (toExport.length === 0) return;
    toExport.forEach((p) => {
      const projectWithOutputs: ProjectWithOutputs = {
        ...p,
        userId: "",
        updatedAt: new Date(),
        platforms: p.platforms as ("linkedin" | "twitter" | "email")[],
        outputs: p.outputs.map((o) => ({
          id: "",
          platform: o.platform as "linkedin" | "twitter" | "email",
          content: "",
          isEdited: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })),
      };
      exportProjectToFile(projectWithOutputs);
    });
    setSelectedProjectIds([]);
  };

  const handleDeleteSuccess = () => {
    setDeleteDialogOpen(false);
    setProjectToDelete(null);
    router.refresh();
  };

  const handleBulkActionComplete = () => {
    router.refresh();
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-end">
        {selectedProjectIds.length > 0 && (
          <Button variant="outline" onClick={handleExportSelected}>
            <Download className="mr-2 h-4 w-4" />
            Export Selected
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {projects.length > 0 ? (
          projects.map((project) => (
            <Card
              key={project.id}
              className={`group relative cursor-pointer ${
                selectedProjectIds.includes(project.id) ? "ring-2 ring-primary" : ""
              }`}
              onClick={(e) => handleCardClick(e, project.id)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-1">{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {project.outputs.map((output) => (
                    <Badge key={output.platform} variant="secondary">
                      {output.platform}
                    </Badge>
                  ))}
                </div>
                <p className="mt-4 text-sm text-muted-foreground line-clamp-3">
                  {project.sourceContent.substring(0, 100)}...
                </p>
                <div className="mt-4 text-xs text-muted-foreground">
                  {new Date(project.createdAt).toLocaleDateString()}
                </div>
              </CardContent>

              <div
                className="absolute right-3 top-3 opacity-0 transition-opacity group-hover:opacity-100"
                onClick={(e) => e.stopPropagation()}
              >
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}/edit`}>Edit</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}`}>View</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/projects/${project.id}/generate`}>Generate</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleDeleteClick(project.id, project.title)}
                      className="text-destructive focus:text-destructive"
                    >
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <h3 className="text-lg font-medium mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              Get started by creating your first content repurposing project
            </p>
            <Button asChild>
              <Link href="/projects/new">Create Project</Link>
            </Button>
          </div>
        )}
      </div>

      {projectToDelete && (
        <DeleteProjectDialog
          projectId={projectToDelete.id}
          projectName={projectToDelete.title}
          isOpen={deleteDialogOpen}
          onClose={() => {
            setDeleteDialogOpen(false);
            setProjectToDelete(null);
          }}
          onSuccess={handleDeleteSuccess}
        />
      )}

      <BulkActions
        selectedProjectIds={selectedProjectIds}
        onSelectionChange={setSelectedProjectIds}
        onActionComplete={handleBulkActionComplete}
      />
    </>
  );
}
