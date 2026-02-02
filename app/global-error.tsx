"use client";

import { APP_NAME } from "@/lib/constants/app";

/**
 * Global error boundary for root layout errors
 * Only used if error.tsx fails to catch the error
 */
export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
          <h1 className="text-2xl font-bold">Something went wrong!</h1>
          <p className="mt-2 text-muted-foreground">
            An unexpected error occurred. Please refresh the page.
          </p>
          <div className="mt-4 flex gap-4">
            <button
              onClick={reset}
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
            >
              Try Again
            </button>
            <a
              href="/"
              className="rounded-md border border-input px-4 py-2 hover:bg-accent"
            >
              Return to {APP_NAME}
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
