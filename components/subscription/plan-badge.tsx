"use client";

import { useState, useEffect } from "react";
import { MicIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type PlanFeatures = {
  planType: string;
  canUseAudio: boolean;
  audioLimits: { usedMinutes: number; limitMinutes: number } | null;
};

/**
 * Reusable plan badge: shows "Текст" or "Текст + Аудио" from /api/subscription/features.
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
        className="h-7 w-24 rounded-full"
        aria-hidden
      />
    );
  }

  if (error || !features) {
    return null;
  }

  const label =
    features.planType === "text_audio"
      ? "Тариф: Текст + Аудио"
      : "Тариф: Текст";

  return (
    <span
      className="rounded-full border px-3 py-1 text-sm font-medium bg-muted"
      title={label}
      aria-label={label}
    >
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
