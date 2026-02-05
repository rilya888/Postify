import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminProjectDetail } from "@/components/admin/admin-project-detail";

export const metadata: Metadata = {
  title: "Admin Project",
  description: "View project",
};

export const dynamic = "force-dynamic";

const SOURCE_PREVIEW_LEN = 500;

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  requireAdmin(session);

  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true } },
      outputs: { orderBy: { platform: "asc" } },
    },
  });

  if (!project) notFound();

  const sourcePreview =
    project.sourceContent.length > SOURCE_PREVIEW_LEN
      ? project.sourceContent.slice(0, SOURCE_PREVIEW_LEN) + "..."
      : project.sourceContent;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/projects" className="hover:text-foreground">
          Projects
        </Link>
        <span>/</span>
        <span className="text-foreground">{project.title}</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{project.title}</h1>
        <p className="text-muted-foreground mt-1">
          by{" "}
          <Link href={`/admin/users/${project.user.id}`} className="text-primary hover:underline">
            {project.user.email}
          </Link>{" "}
          · {new Date(project.createdAt).toLocaleDateString()} · {project.outputs.length} outputs
        </p>
      </div>

      <AdminProjectDetail projectId={project.id} />

      <Card>
        <CardHeader>
          <CardTitle>Source content</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="whitespace-pre-wrap text-sm text-muted-foreground max-h-48 overflow-y-auto rounded bg-muted/50 p-3">
            {sourcePreview}
          </pre>
          {project.sourceContent.length > SOURCE_PREVIEW_LEN && (
            <p className="text-xs text-muted-foreground mt-2">Truncated ({project.sourceContent.length} chars total)</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Outputs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {project.outputs.length === 0 ? (
              <p className="text-muted-foreground">No outputs</p>
            ) : (
              project.outputs.map((o) => (
                <div key={o.id} className="border-b pb-2 last:border-0 last:pb-0">
                  <p className="font-medium text-sm">{o.platform}</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{o.content}</p>
                  <Link
                    href={`/projects/${project.id}/outputs/${o.id}/edit`}
                    className="text-xs text-primary hover:underline"
                  >
                    Edit in app
                  </Link>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
