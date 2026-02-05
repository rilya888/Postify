import { auth } from "@/lib/auth/config";
import { isAdmin } from "@/lib/auth/require-admin";
import { getAdminStats } from "@/lib/admin/stats";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";

export async function GET() {
  const session = await auth();
  if (!isAdmin(session)) {
    return createErrorResponse({ error: "Forbidden", code: "FORBIDDEN" }, 403);
  }

  const stats = await getAdminStats();
  return createSuccessResponse(stats);
}
