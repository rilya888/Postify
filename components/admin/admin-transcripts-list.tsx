"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type TranscriptRow = {
  id: string;
  status: string;
  durationSeconds: number | null;
  createdAt: Date;
  sourceAsset: {
    userId: string;
    project: { id: string; title: string };
  };
  user: { id: string; email: string };
};

function buildQuery(page: number, statusFilter: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (statusFilter) params.set("status", statusFilter);
  return params.toString();
}

export function AdminTranscriptsList({
  transcripts,
  currentPage,
  totalPages,
  statusFilter = "",
}: {
  transcripts: TranscriptRow[];
  currentPage: number;
  totalPages: number;
  statusFilter?: string;
}) {
  const router = useRouter();

  const handleStatusChange = (value: string) => {
    router.push(`/admin/transcripts?${buildQuery(1, value === "all" ? "" : value)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All transcripts</CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">pending</SelectItem>
              <SelectItem value="in_progress">in_progress</SelectItem>
              <SelectItem value="completed">completed</SelectItem>
              <SelectItem value="failed">failed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Project</th>
                <th className="text-left py-2 px-2">User</th>
                <th className="text-left py-2 px-2">Status</th>
                <th className="text-left py-2 px-2">Duration</th>
                <th className="text-left py-2 px-2">Created</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {transcripts.map((t) => (
                <tr key={t.id} className="border-b last:border-0">
                  <td className="py-2 px-2">
                    <Link
                      href={`/admin/projects/${t.sourceAsset.project.id}`}
                      className="text-primary hover:underline"
                    >
                      {t.sourceAsset.project.title}
                    </Link>
                  </td>
                  <td className="py-2 px-2">
                    <Link href={`/admin/users/${t.user.id}`} className="text-primary hover:underline">
                      {t.user.email}
                    </Link>
                  </td>
                  <td className="py-2 px-2">
                    <Badge
                      variant={
                        t.status === "failed"
                          ? "destructive"
                          : t.status === "completed"
                            ? "default"
                            : "secondary"
                      }
                    >
                      {t.status}
                    </Badge>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {t.durationSeconds != null ? `${Math.round(t.durationSeconds)}s` : "—"}
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {new Date(t.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/projects/${t.sourceAsset.project.id}`}>View project</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transcripts.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">No transcripts found</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/transcripts?${buildQuery(currentPage - 1, statusFilter)}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="py-2 text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/transcripts?${buildQuery(currentPage + 1, statusFilter)}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
