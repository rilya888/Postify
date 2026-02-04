/**
 * Application-wide constants
 */

/**
 * App name used in metadata and UI
 */
export const APP_NAME = "HelixCast";

/**
 * App tagline for marketing
 */
export const APP_TAGLINE = "From one source, infinite reach";

/**
 * App description for SEO and metadata
 */
export const APP_DESCRIPTION =
  "Transform your content DNA into platform-perfect posts with AI. " +
  "One source content automatically repurposed for LinkedIn, Twitter, and Email.";

/**
 * App URL (will be set from environment variable in production)
 */
export const APP_URL = process.env.NEXTAUTH_URL || "https://helixcast.io";

/**
 * SEO Keywords
 */
export const APP_KEYWORDS = [
  "AI content repurposing",
  "content transformation",
  "multi-platform publishing",
  "content DNA",
  "social media automation",
  "HelixCast",
  "LinkedIn content",
  "Twitter content",
  "Email marketing",
];

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
