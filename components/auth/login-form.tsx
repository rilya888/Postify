"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginInput } from "@/lib/validations/auth";
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

/**
 * Login form component
 * Handles user authentication with email/password
 */
export function LoginForm() {
  const t = useTranslations("authForm");
  const tCommon = useTranslations("common");
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") ?? "/dashboard";

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(data: LoginInput) {
    setIsLoading(true);

    try {
      const result = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        toast.error(
          result.error === "CredentialsSignin" ? t("invalidCredentials") : String(result.error)
        );
        setIsLoading(false);
        return;
      }

      const targetUrl = result?.url ?? callbackUrl;
      const path = targetUrl.startsWith("http")
        ? new URL(targetUrl).pathname
        : targetUrl.startsWith("/")
          ? targetUrl
          : `/${targetUrl}`;
      setTimeout(() => window.location.replace(path), 100);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("unexpectedError"));
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("emailLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder={t("emailPlaceholder")}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("passwordLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("passwordPlaceholder")}
                  disabled={isLoading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {tCommon("signIn")}
        </Button>
      </form>
    </Form>
  );
}
