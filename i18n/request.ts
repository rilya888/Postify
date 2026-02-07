import { getRequestConfig } from "next-intl/server";
import { cookies } from "next/headers";
import { defaultLocale, isAppLocale } from "@/i18n/routing";

/**
 * Request-scoped i18n config for next-intl.
 */
export default getRequestConfig(async () => {
  const localeCookie = (await cookies()).get("NEXT_LOCALE")?.value;
  const locale = isAppLocale(localeCookie) ? localeCookie : defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
