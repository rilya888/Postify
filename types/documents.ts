/**
 * API response for POST /api/documents/parse.
 * Extensible: optional fields (e.g. wordCount, detectedLanguage) can be added later.
 */
export type ParseDocumentResponse = {
  text: string;
  truncated?: boolean;
};
