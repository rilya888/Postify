"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";

export function SettingsLegal() {
  const t = useTranslations("footer");

  return (
    <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
      <Link href="/privacy" className="hover:text-foreground">
        {t("privacy")}
      </Link>
      <Link href="/terms" className="hover:text-foreground">
        {t("terms")}
      </Link>
    </div>
  );
}
