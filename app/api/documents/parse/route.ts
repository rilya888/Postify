import { NextRequest } from "next/server";
import { auth } from "@/lib/auth/config";
import {
  ALLOWED_DOCUMENT_MIMES,
  MAX_DOCUMENT_FILE_SIZE_BYTES,
  SOURCE_CONTENT_MAX_LENGTH,
} from "@/lib/constants/documents";
import { truncateAtWordBoundary } from "@/lib/utils/truncate-text";
import { checkDocumentParseRateLimit } from "@/lib/utils/rate-limit";
import { Logger } from "@/lib/utils/logger";
import type { ParseDocumentResponse } from "@/types/documents";

const PARSE_TIMEOUT_MS = 30_000;

/** Detect format from MIME and optional magic bytes (first few bytes of buffer). */
function detectFormat(
  mime: string,
  fileName: string,
  buffer: Buffer
): "pdf" | "docx" | "doc" | "rtf" | "txt" | null {
  const ext = fileName.includes(".")
    ? fileName.slice(fileName.lastIndexOf(".")).toLowerCase()
    : "";
  const mimeLower = mime.toLowerCase();

  // PDF: %PDF
  if (buffer.length >= 5 && buffer.toString("ascii", 0, 4) === "%PDF") {
    return "pdf";
  }
  if (mimeLower === "application/pdf" || ext === ".pdf") return "pdf";

  // DOCX: ZIP (PK)
  if (buffer.length >= 4 && buffer.readUInt16BE(0) === 0x504b) {
    return "docx";
  }
  if (
    mimeLower ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    ext === ".docx"
  ) {
    return "docx";
  }

  // DOC: OLE (0xD0CF)
  if (buffer.length >= 2 && buffer.readUInt16BE(0) === 0xd0cf) {
    return "doc";
  }
  if (mimeLower === "application/msword" || ext === ".doc") return "doc";

  // RTF: {\rtf
  if (buffer.length >= 6 && buffer.toString("ascii", 0, 5) === "{\\rtf") {
    return "rtf";
  }
  if (
    mimeLower === "application/rtf" ||
    mimeLower === "text/rtf" ||
    ext === ".rtf"
  ) {
    return "rtf";
  }

  // TXT
  if (mimeLower === "text/plain" || ext === ".txt") return "txt";

  return null;
}

export async function POST(request: NextRequest): Promise<Response> {
  const startTime = Date.now();
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return Response.json(
        { error: "Unauthorized", details: "Sign in to parse documents." },
        { status: 401 }
      );
    }
    const userId = session.user.id;

    const rl = checkDocumentParseRateLimit(userId);
    if (!rl.allowed) {
      return Response.json(
        {
          error: "Too many requests",
          details: "Document parse rate limit exceeded. Try again later.",
        },
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            ...(rl.retryAfterSeconds != null
              ? { "Retry-After": String(rl.retryAfterSeconds) }
              : {}),
          },
        }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      return Response.json(
        { error: "Missing or invalid file", details: "Send a single file as 'file'." },
        { status: 400 }
      );
    }

    if (file.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
      return Response.json(
        {
          error: "File too large",
          details: `Max ${MAX_DOCUMENT_FILE_SIZE_BYTES / 1024 / 1024} MB.`,
        },
        { status: 413 }
      );
    }

    const mime = (file.type ?? "").toLowerCase();
    const allowedMime = ALLOWED_DOCUMENT_MIMES.some((m) => m === mime);
    if (!allowedMime && mime !== "") {
      return Response.json(
        {
          error: "Invalid file type",
          details: "Use .txt, .pdf, .doc, .docx, or .rtf.",
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const format = detectFormat(mime, file.name ?? "", buffer);
    if (!format) {
      return Response.json(
        { error: "Unsupported file type", details: "Could not detect document format." },
        { status: 400 }
      );
    }

    let rawText: string;

    if (format === "txt") {
      rawText = buffer.toString("utf8").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    } else {
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Parse timeout")), PARSE_TIMEOUT_MS)
      );

      const parsePromise = (async () => {
        if (format === "pdf") {
          const { PDFParse } = await import("pdf-parse");
          const parser = new PDFParse({ data: new Uint8Array(buffer) });
          const result = await parser.getText();
          return result.text ?? "";
        }
        if (format === "docx") {
          const mammoth = await import("mammoth");
          const result = await mammoth.extractRawText({ buffer });
          return typeof result.value === "string" ? result.value : String(result.value ?? "");
        }
        if (format === "doc") {
          const WordExtractor = (await import("word-extractor")).default;
          const doc = await new WordExtractor().extract(buffer);
          return doc.getBody() ?? "";
        }
        if (format === "rtf") {
          const { deEncapsulateSync } = await import("rtf-stream-parser");
          const result = deEncapsulateSync(buffer, { mode: "text" });
          const text = result.text;
          return Buffer.isBuffer(text) ? text.toString("utf8") : String(text);
        }
        return "";
      })();

      rawText = await Promise.race([parsePromise, timeoutPromise]);
    }

    const normalized = rawText.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
    const { text, truncated } = truncateAtWordBoundary(
      normalized,
      SOURCE_CONTENT_MAX_LENGTH
    );

    if (text.length < 10) {
      return Response.json(
        {
          error: "Insufficient text",
          details: "Document produced fewer than 10 characters. Check the file.",
        },
        { status: 400 }
      );
    }

    const durationMs = Date.now() - startTime;
    Logger.info("Document parsed", {
      userId,
      format,
      fileSize: file.size,
      textLength: text.length,
      truncated,
      durationMs,
    });

    const body: ParseDocumentResponse = { text, ...(truncated && { truncated: true }) };
    return Response.json(body);
  } catch (error) {
    Logger.error("Document parse failed", error as Error, {});
    const message = error instanceof Error ? error.message : "Parse failed";
    return Response.json(
      { error: "Parse failed", details: message },
      { status: 500 }
    );
  }
}
