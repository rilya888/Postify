import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { AdminProjectsList } from "@/components/admin/admin-projects-list";

export const metadata: Metadata = {
  title: "Admin Projects",
  description: "View all projects",
};

export const dynamic = "force-dynamic";

export default async function AdminProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const session = await auth();
  requireAdmin(session);

  const { page = "1", search } = await searchParams;
  const limit = 20;
  const offset = (parseInt(page, 10) - 1) * limit;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { user: { email: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : undefined;

  const [projects, count] = await Promise.all([
    prisma.project.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        platforms: true,
        createdAt: true,
        updatedAt: true,
        user: { select: { id: true, email: true } },
        _count: { select: { outputs: true } },
      },
    }),
    prisma.project.count({ where }),
  ]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Projects</h1>
        <p className="text-muted-foreground mt-1">Total: {count}</p>
      </div>
      <AdminProjectsList
        projects={projects}
        currentPage={parseInt(page, 10)}
        totalPages={totalPages}
        search={search ?? ""}
      />
    </div>
  );
}
