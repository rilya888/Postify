import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { notFound } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AdminUserEdit } from "@/components/admin/admin-user-edit";

export const metadata: Metadata = {
  title: "Admin User",
  description: "View and edit user",
};

export default async function AdminUserPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
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
        <Link href="/admin/users" className="hover:text-foreground">Users</Link>
        <span>/</span>
        <span className="text-foreground">{user.email}</span>
      </div>
      <div>
        <h1 className="text-3xl font-bold">{user.email}</h1>
        <p className="text-muted-foreground mt-1">
          {user.name ?? "No name"} · {user._count.projects} projects
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
              }
            : null,
        }}
        isSelf={user.id === session?.user?.id}
      />

      <Card>
        <CardHeader>
          <CardTitle>Recent projects</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {user.projects.length === 0 ? (
              <p className="text-muted-foreground">No projects</p>
            ) : (
              user.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0 hover:bg-muted/50 -mx-2 px-2 rounded-md"
                >
                  <span className="font-medium">{p.title}</span>
                  <span className="text-muted-foreground text-sm">
                    {new Date(p.createdAt).toLocaleDateString()} · {p._count.outputs} outputs
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
