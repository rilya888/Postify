import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/require-admin";
import { getCacheStats, cleanExpiredCache, cleanAllCache, invalidateProjectGenerationCache } from "@/lib/services/cache";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return createErrorResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const stats = await getCacheStats();
  return createSuccessResponse(stats);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!isAdmin(session)) {
    return createErrorResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const { action, confirmKey, projectId } = body as { action?: string; confirmKey?: string; projectId?: string };

  if (action === "invalidate-project" && typeof projectId === "string" && projectId) {
    const deleted = await invalidateProjectGenerationCache(projectId);
    return createSuccessResponse({ deleted, message: `Project cache invalidated (${deleted} entries)` });
  }

  if (action === "clean-expired") {
    const deleted = await cleanExpiredCache();
    return createSuccessResponse({ deleted, message: "Expired cache entries cleaned" });
  }

  if (action === "clear-all") {
    if (confirmKey !== "DELETE") {
      return createErrorResponse(
        { error: "Confirmation required", code: "CONFIRM_REQUIRED", details: "Send confirmKey: \"DELETE\" to clear all cache" },
        400
      );
    }
    const deleted = await cleanAllCache();
    return createSuccessResponse({ deleted, message: "All cache entries cleared" });
  }

  return createErrorResponse(
    { error: "Invalid action", code: "INVALID_ACTION", details: "Use \"clean-expired\", \"clear-all\" (with confirmKey), or \"invalidate-project\" (with projectId)" },
    400
  );
}
