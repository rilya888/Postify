import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * 404 Not Found page.
 * Displayed when user navigates to a non-existent route.
 */
export default async function NotFound() {
  const t = await getTranslations("errors");
  const tCommon = await getTranslations("common");
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="container flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            404
          </h1>
          <p className="text-lg text-muted-foreground">
            {t("pageNotFound")}
          </p>
          <p className="text-sm text-muted-foreground">
            {t("pageNotFoundDescription")}
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/">{t("backToApp", { appName: tCommon("appName") })}</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">{t("goToDashboard")}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
