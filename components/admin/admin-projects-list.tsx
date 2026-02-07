"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type ProjectRow = {
  id: string;
  title: string;
  platforms: string[];
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; email: string };
  _count: { outputs: number };
};

function buildQuery(page: number, search: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  return params.toString();
}

export function AdminProjectsList({
  projects,
  currentPage,
  totalPages,
  search = "",
}: {
  projects: ProjectRow[];
  currentPage: number;
  totalPages: number;
  search: string;
}) {
  const router = useRouter();
  const t = useTranslations("admin");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
    router.push(`/admin/projects?${buildQuery(1, q ?? "")}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("allProjects")}</CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            name="q"
            placeholder={t("searchProjectsPlaceholder")}
            defaultValue={search}
            className="max-w-sm"
          />
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">{t("title")}</th>
                <th className="text-left py-2 px-2">{t("user")}</th>
                <th className="text-left py-2 px-2">{t("platforms")}</th>
                <th className="text-left py-2 px-2">{t("outputs")}</th>
                <th className="text-left py-2 px-2">{t("created")}</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p.id} className="border-b last:border-0">
                  <td className="py-2 px-2 font-medium">{p.title}</td>
                  <td className="py-2 px-2">
                    <Link href={`/admin/users/${p.user.id}`} className="text-primary hover:underline">
                      {p.user.email}
                    </Link>
                  </td>
                  <td className="py-2 px-2 text-muted-foreground">{p.platforms.join(", ") || "—"}</td>
                  <td className="py-2 px-2">{p._count.outputs}</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {new Date(p.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/projects/${p.id}`}>{t("view")}</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {projects.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">{t("noProjectsFound")}</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/projects?${buildQuery(currentPage - 1, search)}`}>
                  {t("previous")}
                </Link>
              </Button>
            )}
            <span className="py-2 text-muted-foreground">
              {t("pageOf", { current: currentPage, total: totalPages })}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/projects?${buildQuery(currentPage + 1, search)}`}>
                  {t("next")}
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
