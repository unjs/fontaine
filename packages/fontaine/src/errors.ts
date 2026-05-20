/**
 * Base error class for all fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Thrown when a remote font source cannot be fetched.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to fetch font from ${url}`);
    this.cause = cause;
  }
}

/**
 * Thrown when the source content-type does not match expected font MIME types.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(contentType: string) {
    super(`Invalid Content-Type: ${contentType}. Expected a font binary.`);
  }
}

/**
 * Thrown when the font binary is corrupted or cannot be analyzed.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(details: string) {
    super(`Font analysis failed: ${details}`);
  }
}
