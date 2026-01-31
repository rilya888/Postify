import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Edit, RotateCcw } from "lucide-react";
import Link from "next/link";
import { ExportProjectButton } from "@/components/projects/export-project-button";
import { EditableContentCard } from "@/components/projects/editable-content-card";
import { ProjectErrorBoundary } from "@/components/projects/project-error-boundary";
import type { ProjectWithOutputs } from "@/types/project";

export const metadata: Metadata = {
  title: "Project Details | Content Repurposing Tool",
  description: "View project details and outputs",
};

/**
 * Project detail page showing project information and outputs
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      outputs: {
        orderBy: { platform: "asc" },
      },
    },
  });

  if (!project || project.userId !== session.user.id) {
    redirect("/projects");
  }

  return (
    <ProjectErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold">Project Details</h1>
          <div className="flex gap-2">
            <ExportProjectButton project={project as ProjectWithOutputs} />
            <Button variant="outline" asChild>
              <Link href={`/projects/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/projects/${params.id}/generate`}>
                <RotateCcw className="mr-2 h-4 w-4" />
                Regenerate
              </Link>
            </Button>
          </div>
        </div>

        <Card>
        <CardHeader>
          <CardTitle>{project.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            {project.platforms.map((platform) => (
              <Badge key={platform} variant="secondary">
                {platform}
              </Badge>
            ))}
          </div>
          
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-2">Source Content</h3>
            <div className="whitespace-pre-line p-4 bg-muted rounded-md border">
              {project.sourceContent}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-2">Generated Outputs</h3>
            {project.outputs.length > 0 ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {project.outputs.map((output) => (
                  <EditableContentCard
                    key={output.id}
                    projectId={params.id}
                    output={{
                      id: output.id,
                      platform: output.platform,
                      content: output.content,
                      isEdited: output.isEdited,
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No outputs generated yet.</p>
                <Button className="mt-4" asChild>
                  <Link href={`/projects/${params.id}/generate`}>
                    Generate Content
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      </div>
    </ProjectErrorBoundary>
  );
}