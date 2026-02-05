import { Metadata } from "next";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin statistics and overview",
};

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Service statistics and overview</p>
      </div>
      <AdminStatsCards />
    </div>
  );
}
