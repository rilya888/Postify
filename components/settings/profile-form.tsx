"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { updateProfileSchema, type UpdateProfileInput } from "@/lib/validations/auth";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

type Profile = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
};

export function ProfileForm() {
  const t = useTranslations("settingsProfile");
  const tCommon = useTranslations("common");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<UpdateProfileInput>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    let cancelled = false;
    fetch("/api/me")
      .then((res) => {
        if (!res.ok) throw new Error("PROFILE_LOAD_FAILED");
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setProfile(data);
          form.reset({ name: data.name ?? "" });
        }
      })
      .catch(() => {
        if (!cancelled) toast.error(t("loadFailed"));
      })
      .finally(() => {
        if (!cancelled) setLoadingProfile(false);
      });
    return () => {
      cancelled = true;
    };
  }, [form, t]);

  async function onSubmit(data: UpdateProfileInput) {
    if (!data.name?.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: data.name.trim() }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast.error(json.error ?? t("updateFailed"));
        return;
      }
      setProfile(json);
      toast.success(t("updated"));
    } catch {
      toast.error(t("updateFailed"));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (loadingProfile) {
    return <div className="h-20 animate-pulse rounded-md bg-muted" aria-hidden />;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("nameLabel")}</FormLabel>
              <FormControl>
                <Input placeholder={t("namePlaceholder")} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div>
          <FormLabel>{t("emailLabel")}</FormLabel>
          <Input value={profile?.email ?? ""} disabled className="bg-muted" aria-readonly />
          <p className="mt-1 text-xs text-muted-foreground">{t("emailReadonly")}</p>
        </div>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            tCommon("save")
          )}
        </Button>
      </form>
    </Form>
  );
}
