import { getRequestConfig } from "next-intl/server";

/**
 * Request-scoped i18n config for next-intl.
 * Single locale (en) for now; no [locale] segment in URL.
 */
export default getRequestConfig(async () => {
  const locale = "en";
  const messages = (await import(`../messages/${locale}.json`)).default;
  return {
    locale,
    messages,
    timeZone: "UTC",
  };
});
