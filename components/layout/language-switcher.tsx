"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { locales } from "@/i18n/routing";

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("common");
  const currentLocale = useMemo(() => locale ?? "en", [locale]);

  return (
    <div className="flex items-center gap-1" aria-label={t("languageSwitcher")}> 
      {locales.map((locale) => {
        const isActive = locale === currentLocale;
        return (
          <Button
            key={locale}
            size="sm"
            variant={isActive ? "secondary" : "ghost"}
            className="h-8 px-2"
            onClick={() => {
              document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; samesite=lax`;
              const query = searchParams.toString();
              const currentUrl = query ? `${pathname}?${query}` : pathname;
              router.replace(currentUrl);
              router.refresh();
            }}
            aria-label={t("switchLanguageTo", { locale: locale.toUpperCase() })}
          >
            {locale.toUpperCase()}
          </Button>
        );
      })}
    </div>
  );
}
