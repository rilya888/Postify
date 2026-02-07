import { auth } from "@/lib/auth/config";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getTranslations } from "next-intl/server";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const t = await getTranslations("admin");
  requireAdmin(session);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-end border-b bg-background px-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("backToApp")}
          </Link>
        </Button>
      </header>
      <div className="flex flex-1">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
