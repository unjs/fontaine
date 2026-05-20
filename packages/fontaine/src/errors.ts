/**
 * Base error class for all Fontaine-related failures.
 */
export class FontaineError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when a font asset cannot be retrieved from a local path or remote URL.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to fetch font asset at ${url}: ${String(cause)}`, 'FETCH_FAILED');
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when the retrieved asset does not match expected font content types.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(contentType: string) {
    super(`Invalid Content-Type: ${contentType}. Expected a font MIME type.`, 'INVALID_CONTENT_TYPE');
    this.name = 'FontaineInvalidContentTypeError';
  }
}

/**
 * Error thrown when the font buffer cannot be parsed or analyzed.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(reason: string) {
    super(`Font analysis failed: ${reason}`, 'ANALYSIS_FAILED');
    this.name = 'FontaineAnalysisError';
  }
}
