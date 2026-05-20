/**
 * Base error for all Fontaine operations.
 */
export class FontaineError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineError';
  }
}

/**
 * Error thrown when resource resolution fails.
 */
export class FontaineFetchError extends FontaineError {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'FontaineFetchError';
  }
}

/**
 * Error thrown when font binary analysis fails.
 */
export class FontaineAnalysisError extends FontaineError {
  constructor(message: string) {
    super(message);
    this.name = 'FontaineAnalysisError';
  }
}

/**
 * Error thrown when the resource content-type is not a valid font.
 */
export class FontaineInvalidContentTypeError extends FontaineFetchError {
  constructor(contentType: string) {
    super(`Invalid Content-Type: ${contentType}. Expected font binary.`);
    this.name = 'FontaineInvalidContentTypeError';
  }
}
