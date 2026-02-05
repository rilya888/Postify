"use client";

import { NextIntlClientProvider } from "next-intl";
import { useTranslations } from "next-intl";
import enMessages from "../messages/en.json";

/**
 * Inner content for global error so we can use useTranslations.
 * Renders outside app layout, so we provide messages via NextIntlClientProvider.
 */
function GlobalErrorContent({
  reset,
}: {
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <h1 className="text-2xl font-bold">{t("somethingWentWrong")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("unexpectedErrorRefresh")}
      </p>
      <div className="mt-4 flex gap-4">
        <button
          onClick={reset}
          className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
        >
          {t("tryAgain")}
        </button>
        <a
          href="/"
          className="rounded-md border border-input px-4 py-2 hover:bg-accent"
        >
          {t("returnToApp", { appName: tCommon("appName") })}
        </a>
      </div>
    </div>
  );
}

/**
 * Global error boundary for root layout errors.
 * Only used when error.tsx does not catch the error.
 * Uses static en messages because this tree is outside NextIntlClientProvider.
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <NextIntlClientProvider locale="en" messages={enMessages}>
          <GlobalErrorContent reset={reset} />
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
