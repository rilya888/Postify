import { Metadata } from "next";
import dynamic from "next/dynamic";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth/config";
import { redirect } from "next/navigation";
import { PlanBadge } from "@/components/subscription/plan-badge";
import { SubscriptionBlock } from "@/components/subscription/subscription-block";
import { ProfileForm } from "@/components/settings/profile-form";
import { ChangePasswordForm } from "@/components/settings/change-password-form";
import { BrandVoiceSettings } from "@/components/settings/brand-voice-settings";
import { DangerZone } from "@/components/settings/danger-zone";
import { SettingsLegal } from "@/components/settings/settings-legal";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const ThemeSwitcher = dynamic(
  () =>
    import("@/components/settings/theme-switcher").then((m) => ({ default: m.ThemeSwitcher })),
  { ssr: false }
);

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("settingsPage");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

/**
 * Settings page: profile, subscription, brand voice, security, danger zone, appearance, legal.
 */
export default async function SettingsPage() {
  const session = await auth();
  const t = await getTranslations("settingsPage");

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <PlanBadge />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("profileTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("profileDescription")}</p>
        </CardHeader>
        <CardContent>
          <ProfileForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("subscriptionTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("subscriptionDescription")}</p>
        </CardHeader>
        <CardContent>
          <SubscriptionBlock />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("brandVoiceTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("brandVoiceDescription")}</p>
        </CardHeader>
        <CardContent>
          <BrandVoiceSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("securityTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("securityDescription")}</p>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("appearanceTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("appearanceDescription")}</p>
        </CardHeader>
        <CardContent>
          <ThemeSwitcher />
        </CardContent>
      </Card>

      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-destructive">{t("dangerZoneTitle")}</CardTitle>
          <p className="text-sm text-muted-foreground">{t("dangerZoneDescription")}</p>
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
