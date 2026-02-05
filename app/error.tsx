"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

/**
 * Error boundary component.
 * Catches errors in the app and displays a user-friendly message.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Alert variant="destructive" className="max-w-md">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{t("somethingWentWrong")}</AlertTitle>
        <AlertDescription className="mt-2">
          {process.env.NODE_ENV === "development" ? (
            <pre className="text-xs">{error.message}</pre>
          ) : (
            t("unexpectedError")
          )}
        </AlertDescription>
      </Alert>
      <div className="mt-4 flex gap-4">
        <Button onClick={reset}>{t("tryAgain")}</Button>
        <Button asChild variant="outline">
          <Link href="/">{t("returnToApp", { appName: tCommon("appName") })}</Link>
        </Button>
      </div>
    </div>
  );
}
