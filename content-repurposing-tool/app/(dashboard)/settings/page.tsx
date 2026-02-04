import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { SubscriptionBlock } from "@/components/subscription/subscription-block";

export const metadata: Metadata = {
  title: "Settings",
  description: "Application settings",
};

/**
 * Settings page: subscription (plan + limits), coming soon for rest.
 */
export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="text-3xl font-bold">Settings</h1>
        <PlanBadge />
      </div>
      <SubscriptionBlock />
    </div>
  );
}
