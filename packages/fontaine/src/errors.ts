/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

/**
 * Error thrown when a resource cannot be retrieved from the source.
 */
export class FontaineFetchError extends FontaineError {
  constructor(source: string, cause?: unknown) {
    super(`Failed to fetch resource from ${source}`);
    this.cause = cause;
  }
}

/**
 * Error thrown when the retrieved resource does not match expected font MIME types.
 */
export class FontaineInvalidContentTypeError extends FontaineFetchError {
  constructor(source: string, actualMime: string) {
    super(`Invalid content type for ${source}: expected font binary, got ${actualMime}`);
    this.name = 'FontaineInvalidContentTypeError';
  }
}

/**
 * Error thrown when the analysis engine encounters a malformed font binary.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string, cause?: unknown) {
    super(message);
    this.cause = cause;
  }
}
