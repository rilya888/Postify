"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import PlatformBadge from "@/components/ai/platform-badge";
import { PencilIcon } from "lucide-react";

interface GeneratedContentPreviewProps {
  content: string;
  platform: string;
  isEdited?: boolean;
  variant?: "default" | "success";
  className?: string;
  maxHeight?: string;
  /** Optional actions (e.g. Regenerate button) to show in the header */
  actions?: React.ReactNode;
  /** Optional link for editing this output (Stage 4). Placeholder until editor route exists. */
  editHref?: string;
}

/**
 * Displays generated content for a platform with optional edited badge and actions.
 * Used on the generate page and project detail for consistent preview UI.
 */
export function GeneratedContentPreview({
  content,
  platform,
  isEdited = false,
  variant = "default",
  className = "",
  maxHeight = "none",
  actions,
  editHref,
}: GeneratedContentPreviewProps) {
  return (
    <Card className={className}>
      <CardContent className="pt-6">
        <div className="flex justify-between items-start mb-4 gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <PlatformBadge platform={platform} variant={variant === "success" ? "success" : undefined} />
            {isEdited && (
              <Badge variant="secondary">Edited</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            {editHref && (
              <Button variant="outline" size="sm" asChild>
                <Link href={editHref}>
                  <PencilIcon className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            )}
            {actions}
          </div>
        </div>
        <div
          className="bg-muted rounded-lg p-4 whitespace-pre-line overflow-y-auto"
          style={maxHeight !== "none" ? { maxHeight } : undefined}
        >
          {content || (
            <span className="text-muted-foreground italic">No content</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default GeneratedContentPreview;
