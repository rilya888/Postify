import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectErrorBoundary } from "@/components/projects/project-error-boundary";
import { PlanBadge } from "@/components/subscription/plan-badge";

export const metadata: Metadata = {
  title: "Edit Project",
  description: "Edit your content repurposing project",
};

/**
 * Project edit page
 */
export default async function EditProjectPage({
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
  });

  if (!project || project.userId !== session.user.id) {
    redirect("/projects");
  }

  const initialData = {
    title: project.title,
    sourceContent: project.sourceContent,
    platforms: project.platforms as ("linkedin" | "twitter" | "email")[],
  };

  return (
    <ProjectErrorBoundary>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Edit Project</h1>
              <p className="text-muted-foreground">
                Update your project details and selected platforms
              </p>
            </div>
            <PlanBadge />
          </div>
          <Button asChild>
            <Link href={`/projects/${params.id}/generate`}>
              <Play className="mr-2 h-4 w-4" />
              Generate Content
            </Link>
          </Button>
        </div>

        <div className="max-w-3xl">
          <ProjectForm 
            initialData={initialData} 
            projectId={params.id} 
          />
        </div>
      </div>
    </ProjectErrorBoundary>
  );
}