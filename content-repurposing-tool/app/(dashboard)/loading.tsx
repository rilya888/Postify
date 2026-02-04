import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard loading component
 * Displayed while dashboard data is loading
 */
export default function DashboardLoading() {
  return (
    <div className="container space-y-6 py-8">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
    </div>
  );
}
