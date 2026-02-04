import type { Metadata } from "next";
import Link from "next/link";
import { APP_NAME } from "@/lib/constants/app";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `Terms of service for ${APP_NAME}.`,
};

export default function TermsPage() {
  return (
    <main className="container max-w-3xl py-12">
      <h1 className="text-2xl font-bold">Terms of Service</h1>
      <p className="mt-4 text-muted-foreground">
        This page will contain the terms of service for {APP_NAME}. Please check back later or contact support for details.
      </p>
      <p className="mt-4">
        <Link href="/" className="text-primary underline hover:no-underline">
          Back to home
        </Link>
      </p>
    </main>
  );
}
