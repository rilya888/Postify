"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download } from "lucide-react";
import { toast } from "sonner";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  _count: { projects: number };
  subscription: { plan: string; status: string } | null;
};

function buildQuery(page: number, search: string, roleFilter: string, planFilter: string) {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (search) params.set("search", search);
  if (roleFilter) params.set("role", roleFilter);
  if (planFilter) params.set("plan", planFilter);
  return params.toString();
}

export function AdminUsersList({
  users,
  currentPage,
  totalPages,
  search,
  roleFilter = "",
  planFilter = "",
}: {
  users: UserRow[];
  currentPage: number;
  totalPages: number;
  search: string;
  roleFilter?: string;
  planFilter?: string;
}) {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (roleFilter) params.set("role", roleFilter);
      if (planFilter) params.set("plan", planFilter);
      params.set("limit", "5000");
      const res = await fetch(`/api/admin/users/export?${params.toString()}`, { credentials: "same-origin" });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `users-export-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Export failed");
    } finally {
      setExporting(false);
    }
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
    router.push(`/admin/users?${buildQuery(1, q ?? "", roleFilter, planFilter)}`);
  };

  const handleRoleChange = (value: string) => {
    router.push(`/admin/users?${buildQuery(1, search, value, planFilter)}`);
  };
  const handlePlanChange = (value: string) => {
    router.push(`/admin/users?${buildQuery(1, search, roleFilter, value)}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All users</CardTitle>
        <div className="flex flex-wrap items-end gap-2 mt-2">
        <form onSubmit={handleSearch} className="flex flex-wrap items-end gap-2">
          <Input
            name="q"
            placeholder="Search by email or name..."
            defaultValue={search}
            className="max-w-sm"
          />
          <Select value={roleFilter || "all"} onValueChange={(v) => handleRoleChange(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[110px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              <SelectItem value="user">user</SelectItem>
              <SelectItem value="admin">admin</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter || "all"} onValueChange={(v) => handlePlanChange(v === "all" ? "" : v)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Plan" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All plans</SelectItem>
              <SelectItem value="free">free</SelectItem>
              <SelectItem value="pro">pro</SelectItem>
              <SelectItem value="enterprise">enterprise</SelectItem>
            </SelectContent>
          </Select>
          <Button type="submit" size="icon" variant="secondary">
            <Search className="h-4 w-4" />
          </Button>
        </form>
          <Button variant="outline" size="sm" onClick={handleExportCsv} disabled={exporting} className="shrink-0">
            <Download className="h-4 w-4 mr-1.5" />
            {exporting ? "Exporting..." : "Export CSV"}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-left py-2 px-2">Name</th>
                <th className="text-left py-2 px-2">Role</th>
                <th className="text-left py-2 px-2">Plan</th>
                <th className="text-left py-2 px-2">Projects</th>
                <th className="text-left py-2 px-2">Joined</th>
                <th className="text-left py-2 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="py-2 px-2">{u.email}</td>
                  <td className="py-2 px-2">{u.name ?? "—"}</td>
                  <td className="py-2 px-2">
                    <Badge variant={u.role === "admin" ? "default" : "secondary"}>{u.role}</Badge>
                  </td>
                  <td className="py-2 px-2">
                    {u.subscription ? (
                      <Badge variant="outline">{u.subscription.plan}</Badge>
                    ) : (
                      "free"
                    )}
                  </td>
                  <td className="py-2 px-2">{u._count.projects}</td>
                  <td className="py-2 px-2 text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-2 px-2">
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/admin/users/${u.id}`}>View</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {users.length === 0 && (
          <p className="text-muted-foreground py-4 text-center">No users found</p>
        )}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            {currentPage > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/users?${buildQuery(currentPage - 1, search, roleFilter, planFilter)}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="py-2 text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/users?${buildQuery(currentPage + 1, search, roleFilter, planFilter)}`}>
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
