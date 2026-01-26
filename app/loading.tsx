import { Loader2 } from "lucide-react";

/**
 * Global loading component
 * Displayed while page is loading (Suspense fallback)
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
}
