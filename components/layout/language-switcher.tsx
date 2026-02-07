"use client";

import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { defaultLocale, getLocaleFromPathname, locales } from "@/i18n/routing";

function toLocalizedPath(pathname: string, targetLocale: string): string {
  const currentLocale = getLocaleFromPathname(pathname);
  if (currentLocale) {
    if (pathname === `/${currentLocale}`) return `/${targetLocale}`;
    return pathname.replace(`/${currentLocale}`, `/${targetLocale}`);
  }

  if (pathname === "/") return `/${targetLocale}`;
  return `/${targetLocale}${pathname}`;
}

export function LanguageSwitcher() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations("common");

  const currentLocale = useMemo(() => getLocaleFromPathname(pathname) ?? defaultLocale, [pathname]);

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
              const localized = toLocalizedPath(pathname, locale);
              const query = searchParams.toString();
              router.push(query ? `${localized}?${query}` : localized);
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
