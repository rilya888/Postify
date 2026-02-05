"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  createdAt: Date;
  _count: { projects: number };
  subscription: { plan: string; status: string } | null;
};

export function AdminUsersList({
  users,
  currentPage,
  totalPages,
  search,
}: {
  users: UserRow[];
  currentPage: number;
  totalPages: number;
  search: string;
}) {
  const router = useRouter();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const q = (form.elements.namedItem("q") as HTMLInputElement)?.value?.trim();
    const params = new URLSearchParams();
    if (q) params.set("search", q);
    params.set("page", "1");
    router.push(`/admin/users?${params.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All users</CardTitle>
        <form onSubmit={handleSearch} className="flex gap-2 mt-2">
          <Input
            name="q"
            placeholder="Search by email or name..."
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
                <Link href={`/admin/users?page=${currentPage - 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            <span className="py-2 text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            {currentPage < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/users?page=${currentPage + 1}${search ? `&search=${encodeURIComponent(search)}` : ""}`}>
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
