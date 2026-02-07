import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { NewProjectFlow } from "@/components/projects/new-project-flow";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("projectsNewPage");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

/**
 * Project creation page
 */
export default async function NewProjectPage() {
  const session = await auth();
  const t = await getTranslations("projectsNewPage");

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("description")}</p>
      </div>

      <div className="max-w-3xl">
        <NewProjectFlow />
      </div>
    </div>
  );
}
