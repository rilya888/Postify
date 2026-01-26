import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * 404 Not Found page
 * Displayed when user navigates to non-existent route
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col items-center justify-center">
        <div className="container flex flex-col items-center gap-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
            404
          </h1>
          <p className="text-lg text-muted-foreground">
            Page not found
          </p>
          <p className="text-sm text-muted-foreground">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
          <div className="flex gap-4">
            <Button asChild>
              <Link href="/">Go Home</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
