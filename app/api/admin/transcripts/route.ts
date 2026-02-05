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
  const status = searchParams.get("status")?.trim();

  const where =
    status && ["pending", "in_progress", "completed", "failed"].includes(status)
      ? { status }
      : undefined;

  const [transcripts, count] = await Promise.all([
    prisma.transcript.findMany({
      where,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        sourceAsset: {
          include: {
            project: { select: { id: true, title: true } },
          },
        },
      },
    }),
    prisma.transcript.count({ where }),
  ]);

  const userIds = [...new Set(transcripts.map((t) => t.sourceAsset.userId))];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true },
  });
  const userMap = new Map(users.map((u) => [u.id, u]));

  const withUser = transcripts.map((t) => ({
    ...t,
    user: userMap.get(t.sourceAsset.userId) ?? { id: t.sourceAsset.userId, email: "—" },
  }));

  return createSuccessResponse({
    transcripts: withUser,
    count,
    pagination: { limit, offset, total: count, hasNext: offset + limit < count },
  });
}
