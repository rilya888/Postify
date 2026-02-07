import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages, getTranslations } from "next-intl/server";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { APP_NAME, APP_URL, APP_KEYWORDS } from "@/lib/constants/app";

const inter = Inter({ subsets: ["latin"] });

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tLanding = await getTranslations("landing");
  const tCommon = await getTranslations("common");
  const localizedTitle = tLanding("metadataTitle");
  const localizedDescription = tLanding("metadataDescription");
  const ogLocale = locale === "ru" ? "ru_RU" : "en_US";

  return {
    title: {
      default: localizedTitle,
      template: `%s | ${APP_NAME}`,
    },
    description: localizedDescription,
    keywords: APP_KEYWORDS,
    authors: [{ name: "HelixCast Team" }],
    creator: "HelixCast Team",
    metadataBase: new URL(APP_URL),
    openGraph: {
      type: "website",
      locale: ogLocale,
      url: APP_URL,
      title: localizedTitle,
      description: localizedDescription,
      siteName: APP_NAME,
      images: [
        {
          url: `${APP_URL}/og-image.png`,
          width: 1200,
          height: 630,
          alt: tCommon("ogImageAlt", { appName: APP_NAME }),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: localizedTitle,
      description: localizedDescription,
      creator: "@helixcast",
      images: [`${APP_URL}/twitter-image.png`],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    icons: {
      icon: "/favicon.ico",
      apple: "/apple-touch-icon.png",
    },
  };
}

/**
 * Root layout for the entire application.
 * Provides session context, i18n (next-intl), and global styles.
 */
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <SessionProvider>
              {children}
              <Toaster />
            </SessionProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
