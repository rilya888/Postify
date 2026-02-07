import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AdminUserEdit } from "@/components/admin/admin-user-edit";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminMetadata");
  return {
    title: t("userTitle"),
    description: t("userDescription"),
  };
}

export const dynamic = "force-dynamic";

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const t = await getTranslations("admin");
  const session = await auth();
  requireAdmin(session);

  const { id } = await params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { projects: true } },
      subscription: true,
      projects: {
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          createdAt: true,
          _count: { select: { outputs: true } },
        },
      },
    },
  });

  if (!user) notFound();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/admin/users" className="hover:text-foreground">{t("users")}</Link>
        <span>/</span>
        <span className="text-foreground">{user.email}</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{user.email}</h1>
        <p className="text-muted-foreground mt-1">
          {user.name ?? t("noName")} · {t("projectsCount", { count: user._count.projects })}
        </p>
      </div>

      <AdminUserEdit
        user={{
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          subscription: user.subscription
            ? {
                plan: user.subscription.plan,
                status: user.subscription.status,
                audioMinutesUsedThisPeriod: user.subscription.audioMinutesUsedThisPeriod,
                audioMinutesLimit: user.subscription.audioMinutesLimit,
                currentPeriodEnd: user.subscription.currentPeriodEnd,
              }
            : null,
        }}
        isSelf={user.id === session?.user?.id}
      />

      <Card>
        <CardHeader>
          <CardTitle>{t("recentProjects")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {user.projects.length === 0 ? (
              <p className="text-muted-foreground">{t("noProjects")}</p>
            ) : (
              user.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 rounded-md"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {new Date(p.createdAt).toLocaleDateString()} · {t("outputsCount", { count: p._count.outputs })}
                  </span>
                </Link>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
