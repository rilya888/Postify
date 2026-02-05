"use client";

import { useState, useEffect } from "react";
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

const PLAN_LABELS: Record<string, string> = {
  trial: "Пробный",
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

/**
 * Compact subscription card for dashboard: plan name, type, and key limits.
 */
export function SubscriptionCard() {
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

  if (loading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">Подписка</CardTitle>
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
          <CardTitle className="text-sm font-medium">Подписка</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Не удалось загрузить данные подписки.
          </p>
        </CardContent>
      </Card>
    );
  }

  const planLabel = PLAN_LABELS[features.plan] ?? features.plan;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium">Подписка</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold">{planLabel}</span>
          <span className="rounded-full border px-2 py-0.5 text-xs bg-muted">
            {features.planType === "text_audio" ? (
              <>
                <MicIcon className="inline h-3 w-3 mr-1 -mt-0.5" aria-hidden />
                Текст + Аудио
              </>
            ) : (
              "Текст"
            )}
          </span>
        </div>
        <ul className="text-xs text-muted-foreground space-y-0.5">
          <li>Макс. проектов: {features.maxProjects}</li>
          {features.audioLimits && (
            <li>
              Аудио: {features.audioLimits.usedMinutes} /{" "}
              {features.audioLimits.limitMinutes} мин
            </li>
          )}
        </ul>
        <Link
          href="/settings"
          className="text-xs text-primary hover:underline"
        >
          Настройки подписки →
        </Link>
      </CardContent>
    </Card>
  );
}
