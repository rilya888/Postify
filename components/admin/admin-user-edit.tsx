"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type Props = {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    subscription: {
      plan: string;
      status: string;
      audioMinutesUsedThisPeriod: number;
    } | null;
  };
  isSelf: boolean;
};

export function AdminUserEdit({ user, isSelf }: Props) {
  const router = useRouter();
  const [plan, setPlan] = useState(user.subscription?.plan ?? "free");
  const [status, setStatus] = useState(user.subscription?.status ?? "active");
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          subscriptionStatus: status,
          role: isSelf ? undefined : role,
          resetAudioMinutes: false,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to update");
      }
      toast.success("User updated");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit user</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{user.role}</Badge>
          {user.subscription && (
            <Badge variant="outline">
              {user.subscription.plan} · {user.subscription.status}
            </Badge>
          )}
          {user.subscription?.audioMinutesUsedThisPeriod != null && (
            <span className="text-sm text-muted-foreground">
              Audio used: {user.subscription.audioMinutesUsedThisPeriod} min
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Plan</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">free</SelectItem>
                <SelectItem value="pro">pro</SelectItem>
                <SelectItem value="enterprise">enterprise</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Subscription status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">active</SelectItem>
                <SelectItem value="canceled">canceled</SelectItem>
                <SelectItem value="past_due">past_due</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {!isSelf && (
            <div>
              <Label>Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">user</SelectItem>
                  <SelectItem value="admin">admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? "Saving..." : "Save changes"}
        </Button>
      </CardContent>
    </Card>
  );
}
