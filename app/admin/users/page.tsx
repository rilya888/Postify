import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { AdminUsersList } from "@/components/admin/admin-users-list";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminMetadata");
  return {
    title: t("usersTitle"),
    description: t("usersDescription"),
  };
}

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; role?: string; plan?: string }>;
}) {
  const t = await getTranslations("admin");
  const session = await auth();
  requireAdmin(session);

  const { page = "1", search, role, plan } = await searchParams;
  const limit = 20;
  const offset = (parseInt(page, 10) - 1) * limit;

  const searchWhere = search
    ? {
        OR: [
          { email: { contains: search, mode: "insensitive" as const } },
          { name: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const roleWhere = role && (role === "user" || role === "admin") ? { role } : undefined;
  const planWhere =
    plan && (plan === "free" || plan === "pro" || plan === "max" || plan === "enterprise")
      ? plan === "free"
        ? { OR: [{ subscription: { is: null } }, { subscription: { plan: "free" } }] }
        : { subscription: { plan } }
      : undefined;

  const conditions: object[] = [];
  if (searchWhere) conditions.push(searchWhere);
  if (roleWhere) conditions.push(roleWhere);
  if (planWhere) conditions.push(planWhere);
  const where = conditions.length > 0 ? { AND: conditions } : undefined;

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
        <h1 className="text-3xl font-bold">{t("users")}</h1>
        <p className="text-muted-foreground mt-1">{t("totalCount", { count })}</p>
      </div>
      <AdminUsersList
        users={users}
        currentPage={parseInt(page, 10)}
        totalPages={totalPages}
        search={search ?? ""}
        roleFilter={role ?? ""}
        planFilter={plan ?? ""}
      />
    </div>
  );
}
