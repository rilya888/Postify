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
  const plan = searchParams.get("plan")?.trim();
  const status = searchParams.get("status")?.trim();
  const sortBy = searchParams.get("sortBy") || "createdAt";
  const sortOrder = searchParams.get("sortOrder") || "desc";

  const validSort = ["createdAt", "currentPeriodEnd", "plan", "status"];
  const orderByField = validSort.includes(sortBy) ? sortBy : "createdAt";
  const order = sortOrder === "asc" ? "asc" : "desc";

  const where: { plan?: string; status?: string } = {};
  if (plan && ["free", "pro", "enterprise"].includes(plan)) where.plan = plan;
  if (status && ["active", "canceled", "past_due"].includes(status)) where.status = status;

  const [subscriptions, count] = await Promise.all([
    prisma.subscription.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      skip: offset,
      take: limit,
      orderBy: { [orderByField]: order },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.subscription.count({ where: Object.keys(where).length > 0 ? where : undefined }),
  ]);

  return createSuccessResponse({
    subscriptions,
    count,
    pagination: { limit, offset, total: count, hasNext: offset + limit < count },
  });
}
