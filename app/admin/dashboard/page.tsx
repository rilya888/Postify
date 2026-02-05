import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";

export const metadata: Metadata = {
  title: "Admin Dashboard",
  description: "Admin statistics and overview",
};

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
