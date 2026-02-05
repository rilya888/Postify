/**
 * Type declaration for word-extractor (no @types/word-extractor package).
 */
declare module "word-extractor" {
  interface Document {
    getBody(options?: { filterUnicode?: boolean }): string;
    getFootnotes(options?: { filterUnicode?: boolean }): string;
    getEndnotes(options?: { filterUnicode?: boolean }): string;
    getHeaders(options?: { filterUnicode?: boolean }): string;
    getFooters(options?: { filterUnicode?: boolean }): string;
  }

  class WordExtractor {
    extract(source: Buffer | string): Promise<Document>;
  }

  export = WordExtractor;
}
