"use client";

import { useState, useEffect } from "react";
import { MicIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const PLAN_LABELS: Record<string, string> = {
  free: "Free",
  pro: "Pro",
  enterprise: "Enterprise",
};

type PlanFeatures = {
  plan: string;
  planType: string;
  canUseAudio: boolean;
  audioLimits: { usedMinutes: number; limitMinutes: number } | null;
};

/**
 * Reusable plan badge: shows plan name (Free/Pro/Enterprise) and type (Текст / Текст + Аудио) from /api/subscription/features.
 * Handles loading (skeleton) and error (no badge); aria-label for accessibility.
 */
export function PlanBadge() {
  const [features, setFeatures] = useState<PlanFeatures | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/subscription/features")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load plan");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setFeatures({
            plan: data.plan ?? "free",
            planType: data.planType ?? "text",
            canUseAudio: data.canUseAudio === true,
            audioLimits: data.audioLimits ?? null,
          });
        }
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
      <Skeleton
        className="h-7 w-32 rounded-full"
        aria-hidden
      />
    );
  }

  if (error || !features) {
    return null;
  }

  const planLabel = PLAN_LABELS[features.plan] ?? features.plan;
  const typeLabel =
    features.planType === "text_audio" ? "Текст + Аудио" : "Текст";
  const label = `Подписка: ${planLabel}, тариф: ${typeLabel}`;

  return (
    <span
      className="rounded-full border px-3 py-1 text-sm font-medium bg-muted"
      title={label}
      aria-label={label}
    >
      {planLabel}
      <span className="mx-1.5 text-muted-foreground" aria-hidden>·</span>
      {features.planType === "text_audio" ? (
        <>
          <MicIcon className="inline h-4 w-4 mr-1.5 -mt-0.5" aria-hidden />
          Текст + Аудио
        </>
      ) : (
        "Текст"
      )}
    </span>
  );
}
