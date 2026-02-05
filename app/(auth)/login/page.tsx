import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { LoginForm } from "@/components/auth/login-form";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("auth");
  return {
    title: t("signInTitle"),
    description: t("signInDescription"),
  };
}

/**
 * Login page.
 * Redirect after sign-in is handled client-side in LoginForm.
 */
export default async function LoginPage() {
  const t = await getTranslations("auth");
  const tCommon = await getTranslations("common");
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            {t("welcomeBack")}
          </h1>
          <p className="text-sm text-muted-foreground">
            {t("signInToAccount", { appName: tCommon("appName") })}
          </p>
        </div>
        <LoginForm />
        <p className="px-8 text-center text-sm text-muted-foreground">
          {t("noAccount")}{" "}
          <Link
            href="/signup"
            className="hover:text-primary underline underline-offset-4"
          >
            {t("signUpLink")}
          </Link>
        </p>
      </div>
    </div>
  );
}
