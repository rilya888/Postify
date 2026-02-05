import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { AdminUsersList } from "@/components/admin/admin-users-list";

export const metadata: Metadata = {
  title: "Admin Users",
  description: "Manage users",
};

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
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
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const [users, count] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        _count: { select: { projects: true } },
        subscription: { select: { plan: true, status: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Users</h1>
        <p className="text-muted-foreground mt-1">Total: {count}</p>
      </div>
      <AdminUsersList
        users={users}
        currentPage={parseInt(page, 10)}
        totalPages={totalPages}
        search={search ?? ""}
      />
    </div>
  );
}
