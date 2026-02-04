/**
 * Optional PII detection in text/transcript (email, phone, address).
 * Returns warnings for UI; does not block generation.
 */

const EMAIL_RE = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;
const PHONE_RE = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{2,4}[-.\s]?\d{2,4}(?:[-.\s]?\d{2,4})?\b/g;
const ADDRESS_LIKE_RE = /\b\d{1,5}\s+[\w\s]{5,50}(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr)\b/gi;

export type PiiCheckResult = {
  hasPII: boolean;
  warnings: string[];
};

/**
 * Detect possible PII in text. Returns warnings only; does not block.
 */
export function detectPII(text: string): PiiCheckResult {
  if (!text || typeof text !== "string") return { hasPII: false, warnings: [] };
  const warnings: string[] = [];
  const trimmed = text.trim();
  if (!trimmed.length) return { hasPII: false, warnings: [] };

  const emails = trimmed.match(EMAIL_RE);
  if (emails?.length) {
    warnings.push(`Possible email(s) detected (${emails.length}). Consider removing for privacy.`);
  }

  const phones = trimmed.match(PHONE_RE);
  if (phones?.length) {
    warnings.push(`Possible phone number(s) detected (${phones.length}). Consider removing for privacy.`);
  }

  const addressLike = trimmed.match(ADDRESS_LIKE_RE);
  if (addressLike?.length) {
    warnings.push(`Possible address(es) detected (${addressLike.length}). Consider removing for privacy.`);
  }

  return {
    hasPII: warnings.length > 0,
    warnings,
  };
}
