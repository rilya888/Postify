import { registerUser } from "@/lib/auth/register";
import { createErrorResponse, createSuccessResponse } from "@/lib/utils/api-error";

/**
 * POST /api/auth/register
 * Register a new user account
 * 
 * Request body:
 * {
 *   email: string
 *   password: string
 *   name?: string
 * }
 * 
 * Response:
 * 201: { user: { id, email, name } }
 * 400: { error: string, details?: unknown }
 * 409: { error: "User already exists" }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const user = await registerUser(body);

    return createSuccessResponse({ user }, 201);
  } catch (error) {
      // Handle duplicate email error
      if (error instanceof Error && error.message.includes("already exists")) {
        return createErrorResponse(
          new Error("User with this email already exists"),
          409
        );
      }

    return createErrorResponse(error, 400);
  }
}
