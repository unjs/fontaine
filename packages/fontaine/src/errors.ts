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
 * Thrown when a remote font resource cannot be fetched.
 */
export class FontaineFetchError extends FontaineError {
  constructor(message: string, public readonly statusCode?: number) {
    super(message, 'FETCH_ERROR');
    this.name = 'FontaineFetchError';
  }
}

/**
 * Thrown when the fetched resource does not match expected font MIME types.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(public readonly contentType: string | null) {
    super(`Invalid content type: ${contentType}. Expected a font MIME type.`, 'INVALID_CONTENT_TYPE');
    this.name = 'FontaineInvalidContentTypeError';
  }
}

/**
 * Thrown when font metric extraction fails.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message, 'ANALYSIS_ERROR');
    this.name = 'FontaineAnalysisError';
  }
}
