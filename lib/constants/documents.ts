/**
 * Document parse: allowed file types, MIME types, and size limits.
 * Single source of truth for API and frontend (accept attribute, validation).
 */

export const SOURCE_CONTENT_MAX_LENGTH = 10_000;

/** Max upload size for document parse (bytes). 15 MB */
export const MAX_DOCUMENT_FILE_SIZE_BYTES = 15 * 1024 * 1024;

/** Allowed MIME types for document parse (server validation). */
export const ALLOWED_DOCUMENT_MIMES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/rtf",
  "text/rtf",
  "text/plain",
] as const;

/** Allowed file extensions (lowercase) for client accept and server validation. */
export const ALLOWED_DOCUMENT_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".rtf",
  ".txt",
] as const;

/**
 * Accept attribute value for file input (comma-separated extensions + MIMEs).
 * Use this in project-form and generate page so one constant drives both.
 */
export const DOCUMENT_INPUT_ACCEPT =
  ".txt,text/plain,.pdf,application/pdf,.doc,application/msword,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.rtf,application/rtf,text/rtf";

export type AllowedDocumentMime = (typeof ALLOWED_DOCUMENT_MIMES)[number];
export type AllowedDocumentExtension = (typeof ALLOWED_DOCUMENT_EXTENSIONS)[number];
