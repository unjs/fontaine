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
 * Thrown when a font resource cannot be retrieved from the source.
 */
export class FontaineFetchError extends FontaineError {
  constructor(url: string, cause?: unknown) {
    super(`Failed to fetch font asset from ${url}`, 'FETCH_FAILURE');
    this.name = 'FontaineFetchError';
  }
}

/**
 * Thrown when the retrieved asset does not match expected font MIME types.
 */
export class FontaineInvalidContentTypeError extends FontaineError {
  constructor(contentType: string) {
    super(`Invalid content type: ${contentType}. Expected a font MIME type.`, 'INVALID_CONTENT_TYPE');
    this.name = 'FontaineInvalidContentTypeError';
  }
}

/**
 * Thrown when the font binary fails internal validation (e.g., corrupt header).
 */
export class FontaineValidationError extends FontaineError {
  constructor(reason: string) {
    super(`Font validation failed: ${reason}`, 'VALIDATION_FAILURE');
    this.name = 'FontaineValidationError';
  }
}
