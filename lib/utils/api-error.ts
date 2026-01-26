import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Standard API error response
 */
export type ApiError = {
  error: string;
  details?: unknown;
  code?: string;
};

/**
 * Create standardized error response
 */
export function createErrorResponse(
  error: unknown,
  status: number = 500
): NextResponse<ApiError> {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error: "Validation failed",
        details: error.errors,
        code: "VALIDATION_ERROR",
      },
      { status: 400 }
    );
  }

  // Handle Error instances
  if (error instanceof Error) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.name,
      },
      { status: status }
    );
  }

  // Handle unknown errors
  return NextResponse.json(
    {
      error: "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    },
    { status: 500 }
  );
}

/**
 * Create success response with data
 */
export function createSuccessResponse<T>(
  data: T,
  status: number = 200
): NextResponse<T> {
  return NextResponse.json(data, { status });
}
