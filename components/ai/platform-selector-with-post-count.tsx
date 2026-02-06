"use client";

import React from "react";
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
  disabled?: boolean;
  postsCountLabel?: string;
}

/**
 * Platform selector with optional per-platform post count (1–3) for Enterprise series.
 * When canUseSeries is true, each selected platform shows a dropdown for number of posts.
 */
const PlatformSelectorWithPostCount: React.FC<PlatformSelectorWithPostCountProps> = ({
  selectedPlatforms,
  postsPerPlatformByPlatform,
  onPlatformToggle,
  onPostsPerPlatformChange,
  canUseSeries,
  maxPostsPerPlatform,
  disabled = false,
  postsCountLabel = "Posts",
}) => {
  const options = ([1, 2, 3] as const).filter((n) => n <= Math.max(1, maxPostsPerPlatform));

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Select Platforms</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(PLATFORMS).map(([key, platform]) => {
          const isSelected = selectedPlatforms.includes(key);
          const count = (postsPerPlatformByPlatform[key] ?? 1) as PostCount;
          return (
            <div key={key} className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-3 min-w-0">
                <Checkbox
                  id={`platform-${key}`}
                  checked={isSelected}
                  onCheckedChange={() => !disabled && onPlatformToggle(key)}
                  disabled={disabled}
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
              {canUseSeries && isSelected && (
                <div className="flex items-center gap-2 shrink-0">
                  <Label htmlFor={`posts-${key}`} className="text-xs text-muted-foreground whitespace-nowrap">
                    {postsCountLabel}
                  </Label>
                  <Select
                    value={String(count)}
                    onValueChange={(v) => onPostsPerPlatformChange(key, Number(v) as PostCount)}
                    disabled={disabled}
                  >
                    <SelectTrigger id={`posts-${key}`} className="w-[100px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {options.map((n) => (
                        <SelectItem key={n} value={String(n)}>
                          {n === 1 ? "1 post" : `${n} posts (series)`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default PlatformSelectorWithPostCount;
