import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { ProjectForm } from "@/components/projects/project-form";
import { ProjectErrorBoundary } from "@/components/projects/project-error-boundary";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projectsEditPage");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

/**
 * Project edit page
 */
export default async function EditProjectPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const t = await getTranslations("projectsEditPage");

  if (!session) {
    redirect("/login");
  }

  const project = await prisma.project.findUnique({
    where: { id: params.id },
  });

  if (!project || project.userId !== session.user.id) {
    redirect("/projects");
  }

  const byPlatform = project.postsPerPlatformByPlatform as Record<string, number> | null | undefined;
  const hasByPlatform =
    byPlatform &&
    typeof byPlatform === "object" &&
    !Array.isArray(byPlatform) &&
    Object.keys(byPlatform).length > 0;
  const platformsList = project.platforms as string[];
  const initialData = {
    title: project.title,
    sourceContent: project.sourceContent,
    platforms: project.platforms as (
      | "linkedin"
      | "twitter"
      | "email"
      | "instagram"
      | "facebook"
      | "tiktok"
      | "youtube"
    )[],
    postsPerPlatform: (project.postsPerPlatform ?? 1) as 1 | 2 | 3,
    postTone: project.postTone ?? null,
    postsPerPlatformByPlatform: hasByPlatform
      ? (Object.fromEntries(
          platformsList
            .filter((p) => p in byPlatform!)
            .map((p) => [p, Math.min(3, Math.max(1, byPlatform![p])) as 1 | 2 | 3])
        ) as Partial<Record<string, 1 | 2 | 3>>)
      : platformsList.length > 0
        ? (Object.fromEntries(
            platformsList.map((p) => [p, (project.postsPerPlatform ?? 1) as 1 | 2 | 3])
          ) as Partial<Record<string, 1 | 2 | 3>>)
        : {},
  };

  return (
    <ProjectErrorBoundary>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">{t("description")}</p>
        </div>

        <div className="max-w-3xl">
          <ProjectForm initialData={initialData} projectId={params.id} />
        </div>
      </div>
    </ProjectErrorBoundary>
  );
}
