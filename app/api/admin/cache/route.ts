import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/require-admin";
import { getCacheStats, cleanExpiredCache } from "@/lib/services/cache";
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
  const action = (body as { action?: string }).action;

  if (action === "clean-expired") {
    const deleted = await cleanExpiredCache();
    return createSuccessResponse({ deleted, message: "Expired cache entries cleaned" });
  }

  return createErrorResponse(
    { error: "Invalid action", code: "INVALID_ACTION", details: "Use { \"action\": \"clean-expired\" }" },
    400
  );
}
