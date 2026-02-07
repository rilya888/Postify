import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { AdminStatsCards } from "@/components/admin/admin-stats-cards";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("adminMetadata");
  return {
    title: t("dashboardTitle"),
    description: t("dashboardDescription"),
  };
}

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const t = await getTranslations("admin");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{t("adminDashboard")}</h1>
        <p className="text-muted-foreground mt-1">{t("serviceStatsOverview")}</p>
      </div>
      <AdminStatsCards />
    </div>
  );
}
