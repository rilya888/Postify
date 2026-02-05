/**
 * Truncate text to maxLength, preferring the last space before the limit (word boundary).
 * Returns { text, truncated }.
 */
export function truncateAtWordBoundary(
  text: string,
  maxLength: number
): { text: string; truncated: boolean } {
  const trimmed = text.trim();
  if (trimmed.length <= maxLength) {
    return { text: trimmed, truncated: false };
  }
  const slice = trimmed.slice(0, maxLength);
  const lastSpace = slice.lastIndexOf(" ");
  const cut = lastSpace > maxLength * 0.5 ? lastSpace : maxLength;
  return {
    text: trimmed.slice(0, cut).trim(),
    truncated: true,
  };
}
