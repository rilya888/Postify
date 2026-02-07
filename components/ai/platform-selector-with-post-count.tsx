"use client";

import React from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PLATFORMS } from "@/lib/constants/platforms";

export type PostCount = 1 | 2 | 3;

export interface PlatformSelectorWithPostCountProps {
  selectedPlatforms: string[];
  postsPerPlatformByPlatform: Partial<Record<string, PostCount>>;
  onPlatformToggle: (platform: string) => void;
  onPostsPerPlatformChange: (platform: string, count: PostCount) => void;
  canUseSeries: boolean;
  maxPostsPerPlatform: number;
  maxOutputsPerProject?: number;
  disabled?: boolean;
  postsCountLabel?: string;
}

/**
 * Platform selector with optional per-platform post count (1–3) for Enterprise series.
 * When canUseSeries is true, each selected platform shows a dropdown for number of posts.
 * Enforces maxOutputsPerProject limit: disables options and checkboxes when limit is reached.
 */
const PlatformSelectorWithPostCount: React.FC<PlatformSelectorWithPostCountProps> = ({
  selectedPlatforms,
  postsPerPlatformByPlatform,
  onPlatformToggle,
  onPostsPerPlatformChange,
  canUseSeries,
  maxPostsPerPlatform,
  maxOutputsPerProject = 10,
  disabled = false,
  postsCountLabel = "Posts",
}) => {
  const t = useTranslations("generatePage");
  const options = ([1, 2, 3] as const).filter((n) => n <= Math.max(1, maxPostsPerPlatform));

  const totalUsed = selectedPlatforms.reduce(
    (sum, p) => sum + ((postsPerPlatformByPlatform[p] ?? 1) as number),
    0
  );

  const handlePostsPerPlatformChange = (platform: string, newCount: PostCount) => {
    const currentCount = (postsPerPlatformByPlatform[platform] ?? 1) as number;
    const othersTotal = totalUsed - currentCount;
    if (othersTotal + newCount > maxOutputsPerProject) {
      toast.warning(t("postsLimitToast", { limit: maxOutputsPerProject }));
      return;
    }
    onPostsPerPlatformChange(platform, newCount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Platforms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(PLATFORMS).map(([key, platform]) => {
          const isSelected = selectedPlatforms.includes(key);
          const count = (postsPerPlatformByPlatform[key] ?? 1) as PostCount;
          const othersTotal = totalUsed - count;
          const isCheckboxDisabledDueToLimit =
            !isSelected && totalUsed >= maxOutputsPerProject;

          return (
            <div
              key={key}
              className="grid grid-cols-[1fr_120px] gap-4 items-center"
            >
              <div className="flex items-center space-x-3 min-w-0">
                <Checkbox
                  id={`platform-${key}`}
                  checked={isSelected}
                  onCheckedChange={() =>
                    !disabled && !isCheckboxDisabledDueToLimit && onPlatformToggle(key)
                  }
                  disabled={disabled || isCheckboxDisabledDueToLimit}
                  title={
                    isCheckboxDisabledDueToLimit
                      ? t("postsLimitCheckboxTooltip", {
                          limit: maxOutputsPerProject,
                        })
                      : undefined
                  }
                />
                <div className="grid gap-1.5 leading-none min-w-0">
                  <Label
                    htmlFor={`platform-${key}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center"
                  >
                    <span className="mr-2">{platform.icon}</span>
                    {platform.name}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {platform.description} • Max: {platform.maxLength} chars
                  </p>
                </div>
              </div>
              {canUseSeries ? (
                isSelected ? (
                  <div className="flex justify-end items-center gap-2">
                    <Label htmlFor={`posts-${key}`} className="text-xs text-muted-foreground whitespace-nowrap sr-only">
                      {postsCountLabel}
                    </Label>
                    <Select
                      value={String(count)}
                      onValueChange={(v) =>
                        handlePostsPerPlatformChange(key, Number(v) as PostCount)
                      }
                      disabled={disabled}
                    >
                      <SelectTrigger id={`posts-${key}`} className="w-[120px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {options.map((n) => {
                          const isOptionDisabled =
                            othersTotal + n > maxOutputsPerProject;
                          return (
                            <SelectItem
                              key={n}
                              value={String(n)}
                              disabled={isOptionDisabled}
                            >
                              {n === 1 ? "1 post" : `${n} posts (series)`}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                ) : (
                  <div className="min-w-[120px]" aria-hidden />
                )
              ) : null}
            </div>
          );
        })}
        {canUseSeries && selectedPlatforms.length > 0 && (
          <p className="text-xs text-muted-foreground mt-3">
            {t("postsLimitHint", {
              current: totalUsed,
              limit: maxOutputsPerProject,
            })}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PlatformSelectorWithPostCount;
