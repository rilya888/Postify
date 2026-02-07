export const locales = ["en", "ru"] as const;
export type AppLocale = (typeof locales)[number];

export const defaultLocale: AppLocale = "en";

export function isAppLocale(value: string | null | undefined): value is AppLocale {
  return !!value && (locales as readonly string[]).includes(value);
}

export function getLocaleFromPathname(pathname: string): AppLocale | null {
  const firstSegment = pathname.split("/")[1] ?? "";
  return isAppLocale(firstSegment) ? firstSegment : null;
}

export function stripLocaleFromPathname(pathname: string): string {
  const locale = getLocaleFromPathname(pathname);
  if (!locale) return pathname;
  const stripped = pathname.slice(locale.length + 1);
  return stripped.startsWith("/") ? stripped : `/${stripped}`;
}
