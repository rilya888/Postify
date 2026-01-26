import { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Header } from "@/components/layout/header";

export const metadata: Metadata = {
  title: "Dashboard | Content Repurposing Tool",
  description: "Your content repurposing projects",
};

/**
 * Dashboard page
 * Main page for authenticated users
 */
export default async function DashboardPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 container py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {session.user.name || session.user.email}!
            </p>
          </div>
          <div className="rounded-lg border p-8 text-center">
            <p className="text-muted-foreground">
              Your projects will appear here. Create your first project to get started!
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
