import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return createErrorResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";
  const search = searchParams.get("search")?.trim();

  const validSort = ["createdAt", "email", "name"];
  const orderByField = validSort.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

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
      orderBy: { [orderByField]: order },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        _count: { select: { projects: true } },
        subscription: {
          select: { plan: true, status: true },
        },
      },
    }),
    prisma.user.count({ where }),
  ]);

  return createSuccessResponse({
    users,
    count,
    pagination: { limit, offset, total: count, hasNext: offset + limit < count },
  });
}
