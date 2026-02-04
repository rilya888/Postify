"use client";

import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History, RotateCcw } from "lucide-react";
import { toast } from "sonner";

export type OutputVersionItem = {
  id: string;
  content: string;
  createdAt: string;
};

type VersionHistoryPanelProps = {
  outputId: string;
  onRestore?: (content: string) => void;
  trigger?: React.ReactNode;
};

/**
 * Version history panel: lists output versions and allows restoring a previous version.
 * Fetches versions from GET /api/outputs/[id]/versions and restores via POST .../versions/[versionId]/restore.
 */
export function VersionHistoryPanel({
  outputId,
  onRestore,
  trigger,
}: VersionHistoryPanelProps) {
  const [open, setOpen] = useState(false);
  const [versions, setVersions] = useState<OutputVersionItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [restoringId, setRestoringId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !outputId) return;
    setIsLoading(true);
    fetch(`/api/outputs/${outputId}/versions`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load versions");
        return res.json();
      })
      .then((data) => setVersions(data.versions ?? []))
      .catch(() => {
        toast.error("Failed to load version history");
        setVersions([]);
      })
      .finally(() => setIsLoading(false));
  }, [open, outputId]);

  const handleRestore = async (versionId: string, content: string) => {
    setRestoringId(versionId);
    try {
      const res = await fetch(
        `/api/outputs/${outputId}/versions/${versionId}/restore`,
        { method: "POST" }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.details ?? data?.error ?? "Failed to restore");
      }
      const updated = await res.json();
      onRestore?.(updated.content ?? content);
      setOpen(false);
      toast.success("Restored to selected version");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to restore");
    } finally {
      setRestoringId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleString(undefined, {
        dateStyle: "short",
        timeStyle: "short",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger ?? (
          <Button type="button" variant="outline" size="default">
            <History className="mr-2 h-4 w-4" />
            History
          </Button>
        )}
      </SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Version history</SheetTitle>
          <SheetDescription>
            Restore a previous version of this content. Current content is saved as a new version before restoring.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6">
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : versions.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No previous versions yet. Versions are created when you save changes.
            </p>
          ) : (
            <ul className="space-y-2">
              {versions.map((v) => (
                <li
                  key={v.id}
                  className="flex flex-col gap-2 rounded-lg border p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm text-muted-foreground">
                      {formatDate(v.createdAt)}
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={restoringId !== null}
                      onClick={() => handleRestore(v.id, v.content)}
                    >
                      {restoringId === v.id ? (
                        "Restoring..."
                      ) : (
                        <>
                          <RotateCcw className="mr-1 h-3 w-3" />
                          Restore
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-sm line-clamp-3 whitespace-pre-wrap break-words">
                    {v.content.slice(0, 200)}
                    {v.content.length > 200 ? "…" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
