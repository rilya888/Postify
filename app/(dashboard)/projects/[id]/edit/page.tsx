import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectErrorBoundary } from "@/components/projects/project-error-boundary";

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
    postsPerPlatform: (project.postsPerPlatform ?? 1) as 1 | 2 | 3,
  };

  return (
    <ProjectErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Edit Project</h1>
          <p className="text-muted-foreground">
            Update your project details and selected platforms
          </p>
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