/**
 * Application-wide constants
 */

/**
 * App name used in metadata and UI
 */
export const APP_NAME = "AI Content Repurposing Tool";

/**
 * App description for SEO and metadata
 */
export const APP_DESCRIPTION = "Transform one piece of content into multiple platform formats with AI";

/**
 * App URL (will be set from environment variable in production)
 */
export const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

/**
 * Session configuration
 */
export const SESSION_CONFIG = {
  maxAge: 30 * 24 * 60 * 60, // 30 days in seconds
};

/**
 * Pagination defaults
 */
export const PAGINATION = {
  defaultPageSize: 10,
  maxPageSize: 100,
};
