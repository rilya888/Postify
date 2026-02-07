"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";
import {
  POST_TONE_OPTIONS,
  getToneById,
  getTonePlatformWarning,
  type PostToneId,
} from "@/lib/constants/post-tones";
import type { Platform } from "@/lib/constants/platforms";

interface PostToneSelectorProps {
  value: PostToneId | string | null;
  onChange: (value: PostToneId | null) => void;
  disabled?: boolean;
  canUsePostTone?: boolean;
  selectedPlatforms?: Platform[];
}

export function PostToneSelector({
  value,
  onChange,
  disabled,
  canUsePostTone,
  selectedPlatforms = [],
}: PostToneSelectorProps) {
  const t = useTranslations("postTone");
  const tPlatforms = useTranslations("platforms");

  if (!canUsePostTone) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>{t("availableOnEnterprise")}</AlertDescription>
      </Alert>
    );
  }

  const selectedTone = value ? getToneById(value) : null;
  const warnings =
    value && selectedPlatforms.length > 0
      ? selectedPlatforms
          .map((platform) => {
            const warning = getTonePlatformWarning(value, platform);
            return warning ? { platform, warning } : null;
          })
          .filter(Boolean) as { platform: string; warning: string }[]
      : [];

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor="post-tone-select">
          {t("label")}
        </label>
      </div>
      <Select
        value={value ?? "neutral"}
        onValueChange={(val) => onChange(val === "neutral" ? null : (val as PostToneId))}
        disabled={disabled}
      >
        <SelectTrigger id="post-tone-select" aria-label={t("label")}>
          <SelectValue>
            {selectedTone ? (
              <span className="flex items-center gap-2">
                <span>{selectedTone.icon}</span>
                <span>{t(selectedTone.labelKey)}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <span>😐</span>
                <span>{t("neutral")}</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="neutral">
            <span className="flex items-center gap-2">
              <span>😐</span>
              <span>{t("neutral")}</span>
            </span>
          </SelectItem>
          {POST_TONE_OPTIONS.map((tone) => (
            <SelectItem key={tone.id} value={tone.id}>
              <span className="flex items-center gap-2">
                <span>{tone.icon}</span>
                <span>{t(tone.labelKey)}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{t("hint")}</p>
      {selectedTone && "warning" in selectedTone && (selectedTone as { warning?: string }).warning && (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">{(selectedTone as { warning: string }).warning}</AlertDescription>
        </Alert>
      )}
      {warnings.length > 0 && (
        <Alert variant="destructive">
          <Info className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium mb-1">{t("platformCompatibility")}</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              {warnings.map(({ platform, warning }) => (
                <li key={platform}>
                  <strong>{tPlatforms(`${platform}.name`)}:</strong> {warning}
                </li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
