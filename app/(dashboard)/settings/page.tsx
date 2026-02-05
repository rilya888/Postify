import { Metadata } from "next";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { SubscriptionBlock } from "@/components/subscription/subscription-block";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { BrandVoiceSettings } from "@/components/settings/brand-voice-settings";
import { DangerZone } from "@/components/settings/danger-zone";
import { SettingsLegal } from "@/components/settings/settings-legal";
import { ThemeSwitcher } from "@/components/settings/theme-switcher";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Settings",
  description: "Application settings",
};

/**
 * Settings page: profile, subscription, brand voice, security, danger zone, appearance, legal.
 */
export default async function SettingsPage() {
  const session = await auth();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
        <PlanBadge />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <p className="text-sm text-muted-foreground">
            Your name and email. Email cannot be changed here.
          </p>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
          <p className="text-sm text-muted-foreground">
            Plan, limits, and usage.
          </p>
        </CardHeader>
        <CardContent>
          <SubscriptionBlock />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Brand voice</CardTitle>
          <p className="text-sm text-muted-foreground">
            Manage brand voice profiles used for content generation.
          </p>
        </CardHeader>
        <CardContent>
          <BrandVoiceSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
          <p className="text-sm text-muted-foreground">
            Change your password.
          </p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <p className="text-sm text-muted-foreground">
            Choose light, dark, or system theme.
          </p>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">Danger zone</CardTitle>
          <p className="text-sm text-muted-foreground">
            Permanently delete your account and all data. This cannot be undone.
          </p>
        </CardHeader>
        <CardContent>
          <DangerZone />
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <SettingsLegal />
      </div>
    </div>
  );
}
