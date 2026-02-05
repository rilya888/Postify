import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { prisma } from "@/lib/db/prisma";
import { AdminSubscriptionsList } from "@/components/admin/admin-subscriptions-list";

export const metadata: Metadata = {
  title: "Admin Subscriptions",
  description: "Manage subscriptions",
};

export const dynamic = "force-dynamic";

export default async function AdminSubscriptionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; plan?: string; status?: string }>;
}) {
  const session = await auth();
  requireAdmin(session);

  const { page = "1", plan, status } = await searchParams;
  const limit = 20;
  const offset = (parseInt(page, 10) - 1) * limit;

  const where: { plan?: string; status?: string } = {};
  if (plan && ["free", "pro", "enterprise"].includes(plan)) where.plan = plan;
  if (status && ["active", "canceled", "past_due"].includes(status)) where.status = status;

  const [subscriptions, count] = await Promise.all([
    prisma.subscription.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      skip: offset,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: { id: true, email: true, name: true },
        },
      },
    }),
    prisma.subscription.count({ where: Object.keys(where).length > 0 ? where : undefined }),
  ]);

  const totalPages = Math.ceil(count / limit);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Subscriptions</h1>
        <p className="text-muted-foreground mt-1">Total: {count}</p>
      </div>
      <AdminSubscriptionsList
        subscriptions={subscriptions}
        currentPage={parseInt(page, 10)}
        totalPages={totalPages}
        planFilter={plan ?? ""}
        statusFilter={status ?? ""}
      />
    </div>
  );
}
