import { Metadata } from "next";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/projects/project-form";

export const metadata: Metadata = {
  title: "New Project | Content Repurposing Tool",
  description: "Create a new content repurposing project",
};

/**
 * Project creation page
 */
export default async function NewProjectPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Project</h1>
        <p className="text-muted-foreground">
          Enter your source content and select platforms to repurpose it
        </p>
      </div>

      <div className="max-w-3xl">
        <ProjectForm />
      </div>
    </div>
  );
}