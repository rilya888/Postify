import { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ArrowRight, Sparkles, Zap, Shield, Dna } from "lucide-react";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing");
  return {
    title: t("metadataTitle"),
    description: t("metadataDescription"),
  };
}

/**
 * Landing page
 * Main entry point for new users
 */
export default async function LandingPage() {
  const t = await getTranslations("landing");

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="container space-y-6 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <div className="inline-flex items-center rounded-lg bg-muted px-3 py-1 text-sm font-medium">
              🧬 <span className="ml-2">{t("badge")}</span>
            </div>

            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-6xl lg:leading-[1.1]">
              {t("heroTitleStart")}{" "}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t("heroTitleHighlight")}
              </span>
            </h1>

            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              {t("heroDescription")}
            </p>

            <div className="flex gap-4">
              <Button asChild size="lg">
                <Link href="/signup">
                  {t("getStarted")}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#how-it-works">{t("seeHowItWorks")}</Link>
              </Button>
            </div>

            <p className="text-sm text-muted-foreground">{t("heroFootnote")}</p>
          </div>
        </section>

        <section id="how-it-works" className="container space-y-12 bg-muted/50 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("howItWorksTitle")}</h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">{t("howItWorksSubtitle")}</p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-3">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Dna className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t("steps.step1Title")}</h3>
              <p className="text-muted-foreground">{t("steps.step1Description")}</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary/10">
                <Sparkles className="h-8 w-8 text-secondary" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t("steps.step2Title")}</h3>
              <p className="text-muted-foreground">{t("steps.step2Description")}</p>
            </div>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/10">
                <Zap className="h-8 w-8 text-accent" />
              </div>
              <h3 className="mb-2 text-xl font-semibold">{t("steps.step3Title")}</h3>
              <p className="text-muted-foreground">{t("steps.step3Description")}</p>
            </div>
          </div>
        </section>

        <section id="features" className="container space-y-12 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("featuresTitle")}</h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">{t("featuresSubtitle")}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{t("features.aiTitle")}</h3>
              <p className="text-muted-foreground">{t("features.aiDescription")}</p>
            </div>
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{t("features.fastTitle")}</h3>
              <p className="text-muted-foreground">{t("features.fastDescription")}</p>
            </div>
            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">{t("features.controlTitle")}</h3>
              <p className="text-muted-foreground">{t("features.controlDescription")}</p>
            </div>
          </div>
        </section>

        <section id="pricing" className="container space-y-12 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("pricingTitle")}</h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">{t("pricingSubtitle")}</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <div className="flex flex-col space-y-4 rounded-lg border-2 border-primary p-6">
              <h3 className="text-2xl font-bold">{t("pricing.trialTitle")}</h3>
              <div className="text-3xl font-bold">
                {t("pricing.trialPrice")}
                <span className="text-lg font-normal text-muted-foreground"> {t("pricing.trialPeriod")}</span>
              </div>
              <ul className="flex-1 space-y-2 text-sm">
                <li>{t("pricing.trialFeatures.f1")}</li>
                <li>{t("pricing.trialFeatures.f2")}</li>
                <li>{t("pricing.trialFeatures.f3")}</li>
                <li>{t("pricing.trialFeatures.f4")}</li>
              </ul>
              <Button asChild className="w-full">
                <Link href="/signup">{t("pricing.trialCta")}</Link>
              </Button>
            </div>

            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <h3 className="text-2xl font-bold">{t("pricing.proTitle")}</h3>
              <div className="text-3xl font-bold">
                {t("pricing.proPrice")}
                <span className="text-lg font-normal text-muted-foreground">{t("pricing.proPeriod")}</span>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li>{t("pricing.proFeatures.f1")}</li>
                <li>{t("pricing.proFeatures.f2")}</li>
                <li>{t("pricing.proFeatures.f3")}</li>
                <li>{t("pricing.proFeatures.f4")}</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">{t("pricing.proCta")}</Link>
              </Button>
            </div>

            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <h3 className="text-2xl font-bold">{t("pricing.maxTitle")}</h3>
              <div className="text-3xl font-bold">
                {t("pricing.maxPrice")}
                <span className="text-lg font-normal text-muted-foreground">{t("pricing.maxPeriod")}</span>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li>{t("pricing.maxFeatures.f1")}</li>
                <li>{t("pricing.maxFeatures.f2")}</li>
                <li>{t("pricing.maxFeatures.f3")}</li>
                <li>{t("pricing.maxFeatures.f4")}</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">{t("pricing.maxCta")}</Link>
              </Button>
            </div>

            <div className="flex flex-col space-y-4 rounded-lg border p-6">
              <h3 className="text-2xl font-bold">{t("pricing.enterpriseTitle")}</h3>
              <div className="text-3xl font-bold">
                {t("pricing.enterprisePrice")}
                <span className="text-lg font-normal text-muted-foreground">{t("pricing.enterprisePeriod")}</span>
              </div>
              <ul className="flex-1 space-y-2 text-sm text-muted-foreground">
                <li>{t("pricing.enterpriseFeatures.f1")}</li>
                <li>{t("pricing.enterpriseFeatures.f2")}</li>
                <li>{t("pricing.enterpriseFeatures.f3")}</li>
                <li>{t("pricing.enterpriseFeatures.f4")}</li>
              </ul>
              <Button asChild variant="outline" className="w-full">
                <Link href="/signup">{t("pricing.enterpriseCta")}</Link>
              </Button>
            </div>
          </div>
        </section>

        <section className="container space-y-6 py-20 md:py-32">
          <div className="mx-auto flex max-w-[980px] flex-col items-center gap-4 rounded-lg border bg-muted/50 p-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">{t("ctaTitle")}</h2>
            <p className="max-w-[750px] text-lg text-muted-foreground">{t("ctaSubtitle")}</p>
            <Button asChild size="lg">
              <Link href="/signup">
                {t("ctaButton")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-sm text-muted-foreground">{t("ctaFootnote")}</p>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
