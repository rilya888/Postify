"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type SubRow = {
  id: string;
  userId: string;
  plan: string;
  status: string;
  currentPeriodEnd: Date | null;
  audioMinutesUsedThisPeriod: number;
  audioMinutesLimit: number | null;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  createdAt: Date;
  user: { id: string; email: string; name: string | null };
};

function buildQuery(page: number, planFilter: string, statusFilter: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (planFilter) params.set("plan", planFilter);
  if (statusFilter) params.set("status", statusFilter);
  return params.toString();
}

export function AdminSubscriptionsList({
  subscriptions,
  currentPage,
  totalPages,
  planFilter = "",
  statusFilter = "",
}: {
  subscriptions: SubRow[];
  currentPage: number;
  totalPages: number;
  planFilter?: string;
  statusFilter?: string;
}) {
  const router = useRouter();

  const handlePlanChange = (value: string) => {
    router.push(`/admin/subscriptions?${buildQuery(1, value === "all" ? "" : value, statusFilter)}`);
  };
  const handleStatusChange = (value: string) => {
    router.push(`/admin/subscriptions?${buildQuery(1, planFilter, value === "all" ? "" : value)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All subscriptions</CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Select value={planFilter || "all"} onValueChange={handlePlanChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="free">free</SelectItem>
              <SelectItem value="pro">pro</SelectItem>
              <SelectItem value="enterprise">enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">active</SelectItem>
              <SelectItem value="canceled">canceled</SelectItem>
              <SelectItem value="past_due">past_due</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Plan</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Period end</th>
                <th className="text-left py-2 px-2">Audio</th>
                <th className="text-left py-2 px-2">Stripe</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {subscriptions.map((s) => (
                <tr key={s.id} className="border-b last:border-0">
                  <td className="py-2 px-2">
                    <Link href={`/admin/users/${s.user.id}`} className="text-primary hover:underline">
                      {s.user.email}
                    </Link>
                  </td>
                  <td className="py-2 px-2">
                    <Badge variant="outline">{s.plan}</Badge>
                  </td>
                  <td className="py-2 px-2">{s.status}</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString() : "—"}
                  </td>
                  <td className="py-2 px-2">
                    {s.audioMinutesLimit != null
                      ? `${s.audioMinutesUsedThisPeriod} / ${s.audioMinutesLimit} min`
                      : "—"}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground text-xs">
                    {s.stripeCustomerId || s.stripeSubscriptionId ? (
                      <span title={`Customer: ${s.stripeCustomerId ?? "—"}\nSub: ${s.stripeSubscriptionId ?? "—"}`}>
                        IDs set
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/users/${s.user.id}`}>View user</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {subscriptions.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">No subscriptions found</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/subscriptions?${buildQuery(currentPage - 1, planFilter, statusFilter)}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="py-2 text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/subscriptions?${buildQuery(currentPage + 1, planFilter, statusFilter)}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
