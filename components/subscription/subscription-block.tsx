"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MicIcon } from "lucide-react";

type Features = {
  plan: string;
  planType: string;
  canUseAudio: boolean;
  maxProjects: number;
  maxCharactersPerContent: number;
  audioLimits: { usedMinutes: number; limitMinutes: number } | null;
  maxAudioFileSizeMb: number | null;
  isTrial?: boolean;
  trialEndAt?: string | null;
};

/**
 * Settings subscription block: plan type, limits (projects, chars, audio).
 */
export function SubscriptionBlock() {
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
        if (cancelled) return;
        if (data?.error || typeof data?.maxCharactersPerContent !== "number") {
          setError(true);
          return;
        }
        setFeatures(data);
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
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !features) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{t("loadFailed")}</p>
        </CardContent>
      </Card>
    );
  }

  const planLabel = planLabels[features.plan] ?? features.plan;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{planLabel}</span>
          <span className="rounded-full border px-2 py-0.5 text-sm bg-muted">
            {features.planType === "text_audio" ? (
              <>
                <MicIcon className="inline h-3.5 w-3.5 mr-1 -mt-0.5" aria-hidden />
                {t("planTypeTextAudio")}
              </>
            ) : (
              t("planTypeText")
            )}
          </span>
          {features.isTrial && features.trialEndAt && (
            <span className="text-sm text-muted-foreground">
              {t("trialUntil", { date: new Date(features.trialEndAt).toLocaleDateString() })}
            </span>
          )}
        </div>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>{t("maxProjectsLabel", { count: features.maxProjects ?? "—" })}</li>
          <li>{t("maxCharacters", { count: typeof features.maxCharactersPerContent === "number" ? features.maxCharactersPerContent.toLocaleString() : "—" })}</li>
          {features.audioLimits && (
            <>
              <li>{t("audioUsed", { used: features.audioLimits.usedMinutes, limit: features.audioLimits.limitMinutes })}</li>
              {features.maxAudioFileSizeMb != null && (
                <li>{t("maxAudioFileSize", { mb: features.maxAudioFileSizeMb })}</li>
              )}
            </>
          )}
        </ul>
      </CardContent>
    </Card>
  );
}
