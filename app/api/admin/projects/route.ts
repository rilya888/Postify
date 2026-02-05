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
  const search = searchParams.get("search")?.trim();
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const validSort = ["createdAt", "title", "updatedAt"];
  const orderByField = validSort.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

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
      orderBy: { [orderByField]: order },
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

  return createSuccessResponse({
    projects,
    count,
    pagination: { limit, offset, total: count, hasNext: offset + limit < count },
  });
}
