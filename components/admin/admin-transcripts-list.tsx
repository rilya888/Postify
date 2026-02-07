"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
  const tAdmin = useTranslations("admin");

  const handleStatusChange = (value: string) => {
    router.push(`/admin/transcripts?${buildQuery(1, value === "all" ? "" : value)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{tAdmin("allTranscripts")}</CardTitle>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <Select value={statusFilter || "all"} onValueChange={handleStatusChange}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={tAdmin("status")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{tAdmin("allStatuses")}</SelectItem>
              <SelectItem value="pending">{tAdmin("statuses.pending")}</SelectItem>
              <SelectItem value="in_progress">{tAdmin("statuses.in_progress")}</SelectItem>
              <SelectItem value="completed">{tAdmin("statuses.completed")}</SelectItem>
              <SelectItem value="failed">{tAdmin("statuses.failed")}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">{tAdmin("project")}</th>
                <th className="text-left py-2 px-2">{tAdmin("user")}</th>
                <th className="text-left py-2 px-2">{tAdmin("status")}</th>
                <th className="text-left py-2 px-2">{tAdmin("duration")}</th>
                <th className="text-left py-2 px-2">{tAdmin("created")}</th>
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
                      {tAdmin(`statuses.${t.status}`)}
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
                      <Link href={`/admin/projects/${t.sourceAsset.project.id}`}>{tAdmin("viewProject")}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {transcripts.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">{tAdmin("noTranscriptsFound")}</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/transcripts?${buildQuery(currentPage - 1, statusFilter)}`}>
                  {tAdmin("previous")}
                </Link>
              </Button>
            )}
            <span className="py-2 text-muted-foreground">
              {tAdmin("pageOf", { current: currentPage, total: totalPages })}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/transcripts?${buildQuery(currentPage + 1, statusFilter)}`}>
                  {tAdmin("next")}
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
