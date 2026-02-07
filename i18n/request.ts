import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isAppLocale } from "@/i18n/routing";

/**
 * Request-scoped i18n config for next-intl.
 */
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = isAppLocale(requested) ? requested : defaultLocale;
  const messages = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
