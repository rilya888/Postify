import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { AdminTranscriptsList } from "@/components/admin/admin-transcripts-list";

export const metadata: Metadata = {
  title: "Admin Transcripts",
  description: "View transcripts",
};

export const dynamic = "force-dynamic";

export default async function AdminTranscriptsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const session = await auth();
  requireAdmin(session);

  const { page = "1", status } = await searchParams;
  const limit = 20;
  const offset = (parseInt(page, 10) - 1) * limit;

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

  const rows = transcripts.map((t) => ({
    ...t,
    user: userMap.get(t.sourceAsset.userId) ?? { id: t.sourceAsset.userId, email: "—" },
  }));

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Transcripts</h1>
        <p className="text-muted-foreground mt-1">Total: {count}</p>
      </div>
      <AdminTranscriptsList
        transcripts={rows}
        currentPage={parseInt(page, 10)}
        totalPages={totalPages}
        statusFilter={status ?? ""}
      />
    </div>
  );
}
