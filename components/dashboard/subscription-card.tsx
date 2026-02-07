"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MicIcon } from "lucide-react";
import Link from "next/link";

type Features = {
  plan: string;
  planType: string;
  canUseAudio: boolean;
  maxProjects: number;
  maxCharactersPerContent: number;
  audioLimits: { usedMinutes: number; limitMinutes: number } | null;
  maxAudioFileSizeMb: number | null;
};

/**
 * Compact subscription card for dashboard: plan name, type, and key limits.
 */
export function SubscriptionCard() {
  const t = useTranslations("subscription");
  const [features, setFeatures] = useState<Features | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/features")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) setFeatures(data);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const planLabels: Record<string, string> = {
    trial: t("planTrial"),
    free: t("planFree"),
    pro: t("planPro"),
    max: t("planMax"),
    enterprise: t("planEnterprise"),
  };

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !features) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {t("loadFailed")}
          </p>
        </CardContent>
      </Card>
    );
  }

  const planLabel = planLabels[features.plan] ?? features.plan;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{planLabel}</span>
          <span className="rounded-full border px-2 py-0.5 text-xs bg-muted">
            {features.planType === "text_audio" ? (
              <>
                <MicIcon className="inline h-3 w-3 mr-1 -mt-0.5" aria-hidden />
                {t("planTypeTextAudio")}
              </>
            ) : (
              t("planTypeText")
            )}
          </span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          <li>{t("maxProjectsLabel", { count: features.maxProjects })}</li>
          {features.audioLimits && (
            <li>
              {t("audioUsed", {
                used: features.audioLimits.usedMinutes,
                limit: features.audioLimits.limitMinutes,
              })}
            </li>
          )}
        </ul>
        <Link
          href="/settings"
          className="text-xs text-primary hover:underline"
        >
          {t("settingsLink")}
        </Link>
      </CardContent>
    </Card>
  );
}
