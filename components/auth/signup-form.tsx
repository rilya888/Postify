"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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

type SignupFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

/**
 * Signup form component
 * Handles user registration and automatic sign in
 */
export function SignupForm() {
  const t = useTranslations("authForm");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const signupSchema = useMemo(
    () =>
      z
        .object({
          name: z
            .string()
            .min(1, tValidation("nameRequired"))
            .max(100, tValidation("nameMaxLength")),
          email: z.string().email(tValidation("invalidEmail")),
          password: z
            .string()
            .min(6, tValidation("passwordMinLength"))
            .max(100, tValidation("passwordMaxLength")),
          confirmPassword: z.string().min(1, tValidation("confirmPasswordRequired")),
        })
        .refine((data) => data.password === data.confirmPassword, {
          message: tValidation("passwordsDoNotMatch"),
          path: ["confirmPassword"],
        }),
    [tValidation]
  );

  const form = useForm<SignupFormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: SignupFormValues) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || t("registrationFailed"));
      }

      const signInResult = await signIn("credentials", {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (signInResult?.error) {
        throw new Error(t("signinAfterSignupFailed"));
      }

      toast.success(t("accountCreated"));
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("unexpectedError"));
    } finally {
      setIsLoading(false);
    }
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
                <Input placeholder={t("namePlaceholder")} disabled={isLoading} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
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
                  placeholder={t("passwordNewPlaceholder")}
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
          name="confirmPassword"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t("confirmPasswordLabel")}</FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder={t("confirmPasswordPlaceholder")}
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
          {tCommon("signUp")}
        </Button>
      </form>
    </Form>
  );
}
