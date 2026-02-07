import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projectsDetailPage");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

/**
 * Project detail page showing project information and outputs
 */
export default async function ProjectDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await auth();
  const t = await getTranslations("projectsDetailPage");

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
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <div className="flex gap-2">
            <ExportProjectButton project={project as ProjectWithOutputs} />
            <Button variant="outline" asChild>
              <Link href={`/projects/${params.id}/edit`}>
                <Edit className="mr-2 h-4 w-4" />
                {t("edit")}
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href={`/projects/${params.id}/generate`}>
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("regenerate")}
              </Link>
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{project.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-2">
              {project.platforms.map((platform) => (
                <Badge key={platform} variant="secondary">
                  {platform}
                </Badge>
              ))}
            </div>

            <div className="mb-6">
              <h3 className="mb-2 text-lg font-medium">{t("sourceContent")}</h3>
              <div className="whitespace-pre-line rounded-md border bg-muted p-4">{project.sourceContent}</div>
            </div>

            <div>
              <h3 className="mb-2 text-lg font-medium">{t("generatedOutputs")}</h3>
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
                <div className="py-8 text-center text-muted-foreground">
                  <p>{t("noOutputs")}</p>
                  <Button className="mt-4" asChild>
                    <Link href={`/projects/${params.id}/generate`}>{t("generateContent")}</Link>
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
