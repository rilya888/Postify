import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { APP_NAME } from "@/lib/constants/app";

/**
 * Footer component
 * Used in landing page and other public pages
 */
export async function Footer() {
  const t = await getTranslations("footer");
  return (
    <footer className="border-t bg-muted/50">
      <div className="container py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            {t("copyright", { year: new Date().getFullYear(), appName: APP_NAME })}
          </p>
          <nav className="flex gap-4">
            <Link href="/privacy" className="text-sm text-muted-foreground hover:text-foreground">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="text-sm text-muted-foreground hover:text-foreground">
              {t("terms")}
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
