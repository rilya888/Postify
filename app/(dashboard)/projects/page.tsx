import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import type { Prisma } from "@prisma/client";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ProjectsPageClient } from "@/components/projects/projects-page-client";
import { ProjectsListClient } from "@/components/projects/projects-list-client";
import { ProjectErrorBoundary } from "@/components/projects/project-error-boundary";

export const metadata: Metadata = {
  title: "Projects",
  description: "Manage your content repurposing projects",
};

/**
 * Projects list page showing all user projects
 */
export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  const searchTerm = (searchParams.term ?? "") as string;
  const platformParam = searchParams.platforms;
  const platformFilters = Array.isArray(platformParam)
    ? platformParam.filter(Boolean)
    : typeof platformParam === "string"
      ? platformParam.split(",").filter(Boolean)
      : [];

  const andConditions: Prisma.ProjectWhereInput[] = [];

  if (typeof searchTerm === "string" && searchTerm.trim()) {
    andConditions.push({
      OR: [
        { title: { contains: searchTerm.trim(), mode: "insensitive" } },
        { sourceContent: { contains: searchTerm.trim(), mode: "insensitive" } },
      ],
    });
  }

  if (platformFilters.length > 0) {
    andConditions.push({ platforms: { hasSome: platformFilters } });
  }

  const where: Prisma.ProjectWhereInput = {
    userId: session.user.id,
    ...(andConditions.length > 0 ? { AND: andConditions } : {}),
  };

  const projects = await prisma.project.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      outputs: {
        select: {
          platform: true,
        },
      },
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h1 className="text-3xl font-bold">Projects</h1>
        <div className="flex gap-2">
          <Button asChild>
            <Link href="/projects/new">
              <Plus className="mr-2 h-4 w-4" />
              New Project
            </Link>
          </Button>
        </div>
      </div>

      <ProjectErrorBoundary>
        <ProjectsPageClient />
        <ProjectsListClient projects={projects} />
      </ProjectErrorBoundary>
    </div>
  );
}