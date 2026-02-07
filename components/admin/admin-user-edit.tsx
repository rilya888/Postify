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
import { Input } from "@/components/ui/input";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
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
      audioMinutesLimit?: number | null;
      currentPeriodEnd?: Date | null;
    } | null;
  };
  isSelf: boolean;
};

function toDateInputValue(d: Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

const AUDIO_PLANS = ["pro", "enterprise"];
function hasAudioPlan(sub: Props["user"]["subscription"]) {
  return sub && AUDIO_PLANS.includes(sub.plan);
}

export function AdminUserEdit({ user, isSelf }: Props) {
  const router = useRouter();
  const t = useTranslations("admin");
  const [plan, setPlan] = useState(user.subscription?.plan ?? "free");
  const [status, setStatus] = useState(user.subscription?.status ?? "active");
  const [periodEnd, setPeriodEnd] = useState(toDateInputValue(user.subscription?.currentPeriodEnd));
  const [role, setRole] = useState(user.role);
  const [saving, setSaving] = useState(false);

  const handleSave = async (resetAudioMinutes = false) => {
    setSaving(true);
    try {
      const currentPeriodEnd = periodEnd ? `${periodEnd}T23:59:59.000Z` : null;
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan,
          subscriptionStatus: status,
          currentPeriodEnd,
          role: isSelf ? undefined : role,
          resetAudioMinutes,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? t("failedToUpdate"));
      }
      toast.success(t("userUpdated"));
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("failedToUpdate"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("userAndSubscription")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("changePlanStatusPeriod")}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant={user.role === "admin" ? "default" : "secondary"}>{t(`roles.${user.role}`)}</Badge>
          {user.subscription && (
            <Badge variant="outline">
              {t(`plans.${user.subscription.plan}`)} · {t(`statuses.${user.subscription.status}`)}
            </Badge>
          )}
          {user.subscription?.audioMinutesUsedThisPeriod != null && (
            <span className="text-sm text-muted-foreground">
              {t("audioMinutesUsed", {
                used: user.subscription.audioMinutesUsedThisPeriod,
                limit:
                  user.subscription.audioMinutesLimit != null
                    ? ` / ${user.subscription.audioMinutesLimit}`
                    : "",
              })}
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>{t("plan")}</Label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="free">{t("plans.free")}</SelectItem>
                <SelectItem value="pro">{t("plans.pro")}</SelectItem>
                <SelectItem value="enterprise">{t("plans.enterprise")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>{t("subscriptionStatus")}</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">{t("statuses.active")}</SelectItem>
                <SelectItem value="canceled">{t("statuses.canceled")}</SelectItem>
                <SelectItem value="past_due">{t("statuses.past_due")}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="period-end">{t("periodEndOptional")}</Label>
            <Input
              id="period-end"
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              className="max-w-[200px] mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">{t("periodEndHint")}</p>
          </div>
          {!isSelf && (
            <div>
              <Label>{t("role")}</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">{t("roles.user")}</SelectItem>
                  <SelectItem value="admin">{t("roles.admin")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => handleSave(false)} disabled={saving}>
            {saving ? t("saving") : t("saveChanges")}
          </Button>
          {hasAudioPlan(user.subscription) && (
            <Button
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={async () => {
                setSaving(true);
                try {
                  const res = await fetch(`/api/admin/users/${user.id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ resetAudioMinutes: true }),
                  });
                  if (!res.ok) {
                    const data = await res.json().catch(() => ({}));
                    throw new Error(data.error ?? t("failed"));
                  }
                  toast.success(t("audioMinutesReset"));
                  router.refresh();
                } catch (e) {
                  toast.error(e instanceof Error ? e.message : t("failedToReset"));
                } finally {
                  setSaving(false);
                }
              }}
            >
              {t("resetAudioMinutes")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
