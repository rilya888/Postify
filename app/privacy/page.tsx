import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");
  return {
    title: t("privacyPolicy"),
    description: t("privacyDescription", { appName: tCommon("appName") }),
  };
}

export default async function PrivacyPage() {
  const t = await getTranslations("legal");
  const tCommon = await getTranslations("common");
  return (
    <main className="container max-w-3xl py-12">
      <h1 className="text-2xl font-bold">{t("privacyPolicy")}</h1>
      <p className="mt-4 text-muted-foreground">
        {t("privacyDescription", { appName: tCommon("appName") })}
      </p>
      <p className="mt-4">
        <Link href="/" className="text-primary underline hover:no-underline">
          {tCommon("backToHome")}
        </Link>
      </p>
    </main>
  );
}
