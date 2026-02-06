"use client";

import React from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PlatformBadge from "@/components/ai/platform-badge";
import { PencilIcon, RotateCcwIcon, Loader2Icon, ChevronDownIcon } from "lucide-react";

export interface SeriesOutput {
  id: string;
  platform: string;
  content: string;
  isEdited?: boolean;
  seriesIndex?: number;
}

function getSeriesRoleLabel(seriesIndex: number, seriesTotal: number): "teaser" | "context" | "conclusion" {
  if (seriesTotal <= 1) return "teaser";
  if (seriesTotal === 2) return seriesIndex === 1 ? "teaser" : "conclusion";
  return seriesIndex === 1 ? "teaser" : seriesIndex === 2 ? "context" : "conclusion";
}

export interface SeriesPostsViewProps {
  platform: string;
  posts: SeriesOutput[];
  seriesTotal: number;
  projectId: string;
  regeneratingOutputId: string | null;
  regeneratingSeries: boolean;
  onRegeneratePost: (outputId: string) => void;
  onRegenerateSeries: (platform: string) => void;
  onRegenerateFrom: (platform: string, seriesIndex: number) => void;
}

/**
 * Displays a series of posts for one platform: Post 1 (Teaser), 2 (Context), 3 (Conclusion)
 * with per-post Edit/Regenerate and platform-level "Regenerate series" / "Regenerate from Post N".
 */
export function SeriesPostsView({
  platform,
  posts,
  seriesTotal,
  projectId,
  regeneratingOutputId,
  regeneratingSeries,
  onRegeneratePost,
  onRegenerateSeries,
  onRegenerateFrom,
}: SeriesPostsViewProps) {
  const t = useTranslations("generatePage");
  const sortedPosts = [...posts].sort((a, b) => (a.seriesIndex ?? 1) - (b.seriesIndex ?? 1));

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={platform} />
            {seriesTotal > 1 && (
              <Badge variant="secondary">{t("seriesPostCount", { count: seriesTotal })}</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" disabled={regeneratingSeries}>
                  {regeneratingSeries ? (
                    <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <ChevronDownIcon className="h-4 w-4 mr-2" />
                  )}
                  {t("regenerateFrom")}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {sortedPosts.map((post) => (
                  <DropdownMenuItem
                    key={post.id}
                    onClick={() => onRegenerateFrom(platform, post.seriesIndex ?? 1)}
                  >
                    {t("postNofM", { n: post.seriesIndex ?? 1, m: seriesTotal })}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              variant="outline"
              size="sm"
              disabled={regeneratingSeries}
              onClick={() => onRegenerateSeries(platform)}
            >
              {regeneratingSeries ? (
                <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcwIcon className="h-4 w-4 mr-2" />
              )}
              {t("regenerateSeries")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedPosts.map((post) => {
          const role = getSeriesRoleLabel(post.seriesIndex ?? 1, seriesTotal);
          const roleKey = role === "teaser" ? "seriesTeaser" : role === "context" ? "seriesContext" : "seriesConclusion";
          const isRegenerating = regeneratingOutputId === post.id;

          return (
            <div key={post.id} className="rounded-lg border bg-muted/30 p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {t("postNofM", { n: post.seriesIndex ?? 1, m: seriesTotal })}
                  </Badge>
                  <span className="text-sm text-muted-foreground">{t(roleKey)}</span>
                  {post.isEdited && <Badge variant="secondary">Edited</Badge>}
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/projects/${projectId}/outputs/${post.id}/edit`}>
                      <PencilIcon className="h-4 w-4 mr-2" />
                      Edit
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={isRegenerating}
                    onClick={() => onRegeneratePost(post.id)}
                  >
                    {isRegenerating ? (
                      <Loader2Icon className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RotateCcwIcon className="h-4 w-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                </div>
              </div>
              <div className="text-sm whitespace-pre-line line-clamp-4">{post.content}</div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
