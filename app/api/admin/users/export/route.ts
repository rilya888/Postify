import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";

const MAX_EXPORT = 10000;

function escapeCsv(value: string | null | undefined): string {
  if (value == null) return "";
  const s = String(value);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search")?.trim();
  const role = searchParams.get("role")?.trim();
  const plan = searchParams.get("plan")?.trim();
  const limit = Math.min(parseInt(searchParams.get("limit") || "5000", 10), MAX_EXPORT);

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

  const users = await prisma.user.findMany({
    where,
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
  });

  const header = "id,email,name,role,plan,status,createdAt,projectsCount";
  const rows = users.map(
    (u) =>
      [
        escapeCsv(u.id),
        escapeCsv(u.email),
        escapeCsv(u.name),
        escapeCsv(u.role),
        escapeCsv(u.subscription?.plan ?? "free"),
        escapeCsv(u.subscription?.status ?? "—"),
        escapeCsv(u.createdAt.toISOString()),
        u._count.projects,
      ].join(",")
  );
  const csv = [header, ...rows].join("\n");

  return new Response(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-export-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
